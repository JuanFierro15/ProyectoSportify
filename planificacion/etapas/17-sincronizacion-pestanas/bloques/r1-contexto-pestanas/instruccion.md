[MODO EJECUTOR]

# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `AGENTS.md` (raíz, versionado): léela
  antes de empezar y respétala. La parte del plan que te toca va copiada en tu
  tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.


---

# Bloque r1-contexto-pestanas (etapa 17 — issues #40, #41 y parte contexto de #42)

Lee `AGENTS.md` y `docs/agentes/reservas.md` antes de empezar.

## Rutas permitidas

- `src/context/ReservasContext.jsx`
- `src/context/ReservasContext.test.jsx`

Prohibido tocar cualquier otro archivo (no edites `src/components/`, `api/`, `docs/` ni `planificacion/`). No hagas `git commit`, `git push`, `git checkout` ni cambies de rama. Si `npm test` altera `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por finales de línea, NO lo edites manualmente (el coordinador lo restaura).

## Objetivo

Resolver en `src/context/ReservasContext.jsx` y probar en `src/context/ReservasContext.test.jsx` las tres causas raíz de las issues #40, #41 y #42:

1. **Issue #40**: Llevar en refs el estado despachado en memoria (`estadoRef`) y el último JSON sincronizado con éxito con `localStorage` (`ultimoRawStorageRef` y `ocupadosCrudosRef`), de modo que `reservar`, `reservarEvento` y `cancelar` solo sincronicen desde `localStorage` cuando otra pestaña realmente escribió un valor distinto (`rawActual !== null && rawActual !== ultimoRawStorageRef.current`), sin pisar reservas hechas en el mismo closure/render ni cuando `setItem` falla por cuota.
2. **Issue #41**: Al escribir en `localStorage`, conservar las fechas de `ocupados` que caen fuera de la ventana propia de 7 días en vez de descartarlas; y en `RENOVAR_VENTANA`, releer `localStorage` con la ventana nueva antes de fusionar con la semilla.
3. **Issue #42**: Hacer que `disponibilidad` lea `estadoRef.current ?? state` para que, inmediatamente después de que `reservar` sincroniza y rechaza por un choque con otra pestaña, cualquier consulta inmediata en el mismo tick (como `useAccionesReserva.js`) obtenga las horas libres frescas sin esperar al re-render. El valor de retorno de `reservar` NO cambia (`{ ok: true, codigo }` / `{ ok: false, error: 'Ese horario ya está reservado. Elige otro.' }`).

## Diseño exacto en `src/context/ReservasContext.jsx`

1. **Lectura cruda y parseo de `localStorage`**:
   - Helper `leerRawStorage()`:
     ```js
     function leerRawStorage() {
       try {
         return window.localStorage.getItem(STORAGE_KEY);
       } catch (e) {
         return null;
       }
     }
     ```
   - Helper `parsearDatosGuardados(raw)`:
     ```js
     function parsearDatosGuardados(raw) {
       try {
         const guardado = raw !== undefined ? raw : leerRawStorage();
         if (guardado) {
           const data = JSON.parse(guardado);
           if (
             data &&
             data.ocupados &&
             typeof data.ocupados === 'object' &&
             Array.isArray(data.reservas)
           ) {
             const reservas = data.reservas.map((r) => ({
               tipo: r.tipo || (Array.isArray(r.canchaIds) ? 'evento' : 'individual'),
               ...r,
             }));
             return { ocupadosCrudos: data.ocupados, reservas };
           }
         }
       } catch (e) {
         // Sin almacenamiento local o dato corrupto -> sin datos guardados.
       }
       return null;
     }
     ```
   - `leerGuardado(canchas, dias, semillaOcup, raw)` reutiliza `parsearDatosGuardados(raw)` y `fusionarConSemilla(canchas, dias, datos.ocupadosCrudos, semillaOcup)`.

2. **Conservación de fechas fuera de la ventana propia al escribir (`#41`)**:
   - Helper `combinarOcupadosPorCancha(a, b)` para combinar por cancha los mapas de fechas de `ocupadosCrudosRef.current` y los recién leídos de `localStorage`:
     ```js
     function combinarOcupadosPorCancha(a, b) {
       if (!a && !b) return null;
       const resultado = {};
       const ids = new Set([
         ...(a ? Object.keys(a) : []),
         ...(b ? Object.keys(b) : []),
       ]);
       ids.forEach((cid) => {
         resultado[cid] = {
           ...(a && a[cid] ? a[cid] : {}),
           ...(b && b[cid] ? b[cid] : {}),
         };
       });
       return resultado;
     }
     ```
   - Función pura `armarOcupadosParaGuardar(ocupadosActuales, diasActuales, ocupadosPrevios)`:
     ```js
     function armarOcupadosParaGuardar(ocupadosActuales, diasActuales, ocupadosPrevios) {
       if (!ocupadosPrevios || typeof ocupadosPrevios !== 'object') {
         return ocupadosActuales;
       }
       const conjuntoDias = new Set(diasActuales);
       const resultado = {};
       Object.keys(ocupadosActuales).forEach((canchaId) => {
         const previosCancha = ocupadosPrevios[canchaId];
         const extras = {};
         if (previosCancha && typeof previosCancha === 'object') {
           Object.keys(previosCancha).forEach((fecha) => {
             if (!conjuntoDias.has(fecha) && Array.isArray(previosCancha[fecha])) {
               extras[fecha] = [...previosCancha[fecha]];
             }
           });
         }
         resultado[canchaId] = {
           ...extras,
           ...ocupadosActuales[canchaId],
         };
       });
       return resultado;
     }
     ```

3. **Reducer determinista y `RENOVAR_VENTANA` que relee `localStorage` (`#40`, `#41`)**:
   - En `case 'RESERVAR'` y `case 'RESERVAR_EVENTO'`, usar `const marcaTiempo = action.payload.ahora ?? Date.now();` para armar `id` (`...__${marcaTiempo}`) y `creadaEn: new Date(marcaTiempo).toISOString()`. Así, `reducer(estadoRef.current, action)` y el `dispatch(action)` posterior de React producen exactamente el mismo `id` y `creadaEn`.
   - En `case 'RENOVAR_VENTANA'`:
     ```js
     case 'RENOVAR_VENTANA': {
       const dias = ventanaDias();
       if (state.dias[0] === dias[0]) {
         return state;
       }
       const semillaOcup = ocupadosSemilla(dias);
       const datosStorage =
         action.payload && 'datosStorage' in action.payload
           ? action.payload.datosStorage
           : parsearDatosGuardados();
       const conservarMemoriaEnVentanaPrevia = Boolean(
         action.payload && action.payload.conservarMemoriaEnVentanaPrevia
       );
       const conjuntoDiasPrevios = new Set(state.dias);
       const ocupadosCombinados = {};
       state.canchas.forEach((c) => {
         const enMemoria = (state.ocupados && state.ocupados[c.id]) || {};
         const enStorage =
           (datosStorage &&
             datosStorage.ocupadosCrudos &&
             datosStorage.ocupadosCrudos[c.id]) ||
           {};
         if (conservarMemoriaEnVentanaPrevia) {
           const porCancha = { ...enStorage };
           Object.keys(enMemoria).forEach((fecha) => {
             if (conjuntoDiasPrevios.has(fecha)) {
               porCancha[fecha] = enMemoria[fecha];
             }
           });
           ocupadosCombinados[c.id] = porCancha;
         } else {
           ocupadosCombinados[c.id] = {
             ...enMemoria,
             ...enStorage,
           };
         }
       });
       const ocupados = fusionarConSemilla(
         state.canchas,
         dias,
         ocupadosCombinados,
         semillaOcup
       );
       const reservas =
         !conservarMemoriaEnVentanaPrevia &&
         datosStorage &&
         Array.isArray(datosStorage.reservas)
           ? datosStorage.reservas
           : state.reservas;
       return {
         ...state,
         dias,
         ocupados,
         reservas,
       };
     }
     ```

4. **Refs y efectos en `ReservasProvider`**:
   - Mantener:
     - `const estadoRef = useRef(state); estadoRef.current = state;`
     - `const despachar = useCallback((action) => { estadoRef.current = reducer(estadoRef.current, action); dispatch(action); }, []);`
     - `ultimoRawStorageRef`: inicializado una sola vez al montar (`useRef(undefined)`, y si es `undefined` inicializarlo con `leerRawStorage()`).
     - `ocupadosCrudosRef`: inicializado una sola vez al montar (`useRef(undefined)`, y si es `undefined` inicializarlo con `parsearDatosGuardados(ultimoRawStorageRef.current)?.ocupadosCrudos || null`).
     *(No re-ejecutar `leerRawStorage()` / `JSON.parse` en cada render: usar inicialización perezosa una sola vez).*
   - En el `useEffect` espejo a `localStorage`:
     - Mantener el guard `syncDesdeStorageRef` exactamente igual para no reescribir en `localStorage` cuando el render viene de `alCambiarStorage`.
     - Si sí toca escribir:
       ```js
       const desdeStorage = parsearDatosGuardados()?.ocupadosCrudos || null;
       const ocupadosPrevios = combinarOcupadosPorCancha(
         ocupadosCrudosRef.current,
         desdeStorage
       );
       const ocupadosParaGuardar = armarOcupadosParaGuardar(
         state.ocupados,
         state.dias,
         ocupadosPrevios
       );
       const serializado = JSON.stringify({
         ocupados: ocupadosParaGuardar,
         reservas: state.reservas,
       });
       window.localStorage.setItem(STORAGE_KEY, serializado);
       ultimoRawStorageRef.current = serializado;
       ocupadosCrudosRef.current = ocupadosParaGuardar;
       ```
       (Importante: actualizar `ultimoRawStorageRef.current` y `ocupadosCrudosRef.current` **solo si `setItem` no lanza**. Además, incluir `state.dias` en el array de dependencias del efecto espejo `[state.ocupados, state.reservas, state.dias]` para que ESLint `react-hooks/exhaustive-deps` dé 0 warnings).
   - En `renovarSiCambioElDia`:
     - Primero comprobar si el día realmente cambió:
       ```js
       if (estadoRef.current.dias[0] === ventanaDias()[0]) {
         return;
       }
       ```
       (Así, si `focus` o `visibilitychange` ocurren el mismo día, no se altera `ultimoRawStorageRef.current` ni se pierde una escritura externa aún no sincronizada).
     - Luego:
       ```js
       const rawActual = leerRawStorage();
       const cambioExterno =
         rawActual !== null && rawActual !== ultimoRawStorageRef.current;
       if (cambioExterno) {
         ultimoRawStorageRef.current = rawActual;
       }
       const desdeStorage = parsearDatosGuardados(
         rawActual !== null ? rawActual : undefined
       );
       if (desdeStorage) {
         ocupadosCrudosRef.current = desdeStorage.ocupadosCrudos;
       }
       const datosStorage =
         desdeStorage ||
         (ocupadosCrudosRef.current
           ? {
               ocupadosCrudos: ocupadosCrudosRef.current,
               reservas: estadoRef.current.reservas,
             }
           : null);
       despachar({
         type: 'RENOVAR_VENTANA',
         payload: {
           datosStorage,
           conservarMemoriaEnVentanaPrevia: !cambioExterno,
         },
       });
       ```
   - En `alCambiarStorage`:
     - Leer `const actual = estadoRef.current;` y `const semillaOcup = ocupadosSemilla(actual.dias);`.
     - Si `const datos = parsearDatosGuardados(raw)` es válido:
       ```js
       ultimoRawStorageRef.current = leerRawStorage();
       ocupadosCrudosRef.current = datos.ocupadosCrudos;
       const guardado = {
         ocupados: fusionarConSemilla(
           actual.canchas,
           actual.dias,
           datos.ocupadosCrudos,
           semillaOcup
         ),
         reservas: datos.reservas,
       };
       syncDesdeStorageRef.current = guardado;
       despachar({ type: 'SINCRONIZAR', payload: guardado });
       return;
       ```
     - Si `(e.key === null || e.newValue === null)` y `window.localStorage.getItem(STORAGE_KEY) === null`:
       ```js
       ultimoRawStorageRef.current = null;
       ocupadosCrudosRef.current = null;
       const payload = { ocupados: semillaOcup, reservas: [] };
       syncDesdeStorageRef.current = payload;
       despachar({ type: 'SINCRONIZAR', payload });
       ```
   - En `leerEstadoFresco`:
     ```js
     const leerEstadoFresco = useCallback(() => {
       const actual = estadoRef.current;
       const rawActual = leerRawStorage();
       if (rawActual !== null && rawActual !== ultimoRawStorageRef.current) {
         const datos = parsearDatosGuardados(rawActual);
         if (datos) {
           ultimoRawStorageRef.current = rawActual;
           ocupadosCrudosRef.current = datos.ocupadosCrudos;
           const guardado = {
             ocupados: fusionarConSemilla(
               actual.canchas,
               actual.dias,
               datos.ocupadosCrudos,
               ocupadosSemilla(actual.dias)
             ),
             reservas: datos.reservas,
           };
           return {
             guardado,
             estado: { ...actual, ...guardado },
           };
         }
       }
       return {
         guardado: null,
         estado: actual,
       };
     }, []);
     ```
   - En `reservar`, `reservarEvento` y `cancelar`:
     - Usar `despachar` en lugar de `dispatch`.
     - En `reservar` y `reservarEvento`, pasar `ahora: Date.now()` en `payload` junto con `codigo`.
   - En `disponibilidad`:
     ```js
     const disponibilidad = useCallback(
       (canchaId, fecha) =>
         calcularDisponibilidad(estadoRef.current ?? state, canchaId, fecha),
       [state]
     );
     ```
     (Usar `estadoRef.current ?? state` satisface a `react-hooks/exhaustive-deps` sin comentarios `eslint-disable` y lee siempre `estadoRef.current`).

## Pruebas nuevas en `src/context/ReservasContext.test.jsx`

Agrega pruebas claras y exactas (cumpliendo las reglas de calidad: sin `toThrow()` genéricos, comprobando mensajes exactos y límites exactos):

1. **#40 (dos llamadas seguidas en el mismo closure antes del efecto espejo)**:
   - Dos `reservar()` seguidos en horas distintas dentro del mismo `act()` sin re-render intermedio: ambos devuelven `{ ok: true, codigo }`, quedan ambas reservas en `result.current.reservas` y en `localStorage`, y ambas horas quedan con `disponible: false`.
   - Dos `reservar()` seguidos para la **misma** cancha, fecha y hora dentro del mismo `act()`: el primero devuelve `{ ok: true, ... }`, el segundo se rechaza con `{ ok: false, error: 'Ese horario ya está reservado. Elige otro.' }` y solo queda la primera reserva.
   - Combinación en el mismo `act()` (ej. `reservar()` seguido de `reservarEvento()`, o `reservar()` seguido de `cancelar()` del mismo id o de otra reserva): ambas operaciones reflejan el estado acumulado sin pisarse.

2. **#40 (escritura que falla por cuota mientras `getItem` devuelve el dato viejo)**:
   - Tras montar `ReservasProvider` (con el estado inicial persistido en `localStorage`), simular que `Storage.prototype.setItem` lanza `new DOMException('QuotaExceededError', 'QuotaExceededError')` mientras `getItem` sigue devolviendo el JSON inicial viejo.
   - Hacer una reserva (`16:00`) en un `act()` y luego una segunda reserva (`17:00`) en otro `act()`. Verificar que la segunda reserva **no** borra de memoria la primera: ambas quedan en `result.current.reservas` y tanto `16:00` como `17:00` figuran con `disponible: false`.

3. **#41 (pestaña abierta desde ayer + pestaña de hoy reservando en el día `+6`)**:
   - Usar `vi.useFakeTimers()` (y restaurar en `afterEach`): montar `tabVieja` en el día 1 (por ejemplo `new Date(2026, 10, 16, 10, 0, 0)`), avanzar al día 2 (`new Date(2026, 10, 17, 10, 0, 0)`) y montar `tabNueva`.
   - En `tabNueva`, reservar una hora del último día de la ventana nueva (`2026-11-23`, día `+6`, ausente en `tabVieja.dias`).
   - **Caso A — reservar desde `tabVieja` sin enfocarla antes**: en `tabVieja`, reservar una hora de un día compartido (`2026-11-18`). Comprobar que `localStorage` conserva la hora ocupada del `2026-11-23` además de la nueva reserva en `2026-11-18`; al disparar `focus` después en `tabVieja`, la hora del `2026-11-23` sigue con `disponible: false` en ambas pestañas.
   - **Caso B — `RENOVAR_VENTANA` en `tabVieja` sin perder el día `+6`**: con `tabVieja` aún en el día 1 (sin haber recibido `storage` de `tabNueva`, y también en otra prueba o subcaso habiendo recibido el evento `storage` de `tabNueva` antes de `focus`), disparar `focus` al pasar al día 2. Comprobar que la hora reservada por `tabNueva` en `2026-11-23` queda con `disponible: false` en `tabVieja` y en `localStorage` (no se sobreescribe con la semilla). Probar también `reducer(estadoDia1, { type: 'RENOVAR_VENTANA' })` leyendo de `localStorage` la ocupación de `2026-11-23`.

4. **#42 (disponibilidad fresca inmediatamente tras rechazo de `reservar`)**:
   - Otra pestaña escribe en `localStorage` ocupando `16:00` (sin disparar evento `storage`). En el mismo `act()` síncrono donde se llama a `reservar({ ..., horas: ['16:00'] })` (que devuelve `{ ok: false, error: 'Ese horario ya está reservado. Elige otro.' }`), consultar inmediatamente `disponibilidad(canchaId, dia3)` antes del siguiente render: comprobar que `16:00` ya aparece con `disponible: false`.

## Verificación

Ejecutar al terminar:
- `npx vitest run src/context/ReservasContext.test.jsx`
- `npx eslint src/context/ReservasContext.jsx src/context/ReservasContext.test.jsx`

En tu respuesta final reporta: archivos cambiados, comando ejecutado con su resultado exacto y cualquier observación pendiente.

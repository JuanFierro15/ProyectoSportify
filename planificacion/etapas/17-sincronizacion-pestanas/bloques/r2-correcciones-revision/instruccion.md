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

# Bloque r2-correcciones-revision (etapa 17: correcciones de la revisión del PR #48)

Lee `AGENTS.md`, `docs/agentes/reservas.md` y `planificacion/etapas/17-sincronizacion-pestanas/PLAN.md` antes de empezar.

## Rutas permitidas

- `src/context/ReservasContext.jsx`
- `src/context/ReservasContext.test.jsx`
- `docs/agentes/reservas.md`

No toques ningún otro archivo. No hagas `git commit`, `git push`, `git checkout`, `git stash` ni cambies de rama. Si `npm test` cambia `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por finales de línea, no lo edites (el coordinador lo restaura). La carpeta `src/__verificacion__/` es del verificador: no la crees ni la toques.

## Contexto

El revisor del PR #48 encontró una regresión: doble reserva entre pestañas. En el listener `storage` de `ReservasProvider` (`src/context/ReservasContext.jsx`, cerca de la línea 844), `ultimoRawStorageRef.current` recibe lo que hay **en ese momento** en `localStorage` (`leerRawStorage()`), no el `e.newValue` que se acaba de parsear. Si otra pestaña escribe dos veces seguidas (`v1` y luego `v2`) y aquí solo se procesó el evento de `v1`, el estado queda con `v1` y la ref con `v2`. Entonces `leerEstadoFresco` cree que no hubo cambios, `reservar` acepta una hora que `v2` ya tenía ocupada y el efecto espejo borra de `localStorage` la reserva de la otra pestaña. En `main` esto no pasa.

## Cambios

### 1. Arreglo del bloqueante (listener `storage`)

```js
ultimoRawStorageRef.current = raw !== undefined ? raw : leerRawStorage();
```

Cuando `raw` es `undefined` (`e.newValue` no es string), `parsearDatosGuardados(undefined)` lee el `localStorage` actual, así que `leerRawStorage()` es el valor correcto en esa rama. No toques la inicialización de la ref (cerca de la línea 740).

### 2. Pruebas de regresión en `ReservasContext.test.jsx`

Agrega, dentro del `describe` de `#40, #41, #42`, la prueba del revisor. Endurece la aserción del rechazo para que compare el resultado completo:

```jsx
it('rechaza reservar una hora que otra pestaña ya guardó en una segunda escritura', () => {
  const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
  const { result } = renderHook(() => useReservas(), { wrapper });
  const dia = result.current.dias[3];

  const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  const conHoras = (horas, nombres) => {
    const d = JSON.parse(JSON.stringify(base));
    d.ocupados['padel-1'][dia] = [...(d.ocupados['padel-1'][dia] || []), ...horas];
    d.reservas = nombres.map((n, i) => ({
      id: `padel-1__${dia}__${horas[i]}__${i}`,
      tipo: 'individual', canchaId: 'padel-1', fecha: dia, horas: [horas[i]], nombre: n,
    }));
    return JSON.stringify(d);
  };
  const v1 = conHoras(['10:00'], ['Otra Uno']);
  const v2 = conHoras(['10:00', '11:00'], ['Otra Uno', 'Otra Dos']);

  // La otra pestaña escribe v1 y enseguida v2; aquí solo se procesó el evento de v1.
  window.localStorage.setItem(STORAGE_KEY, v2);
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: v1 }));
  });

  let res;
  act(() => {
    res = result.current.reservar({ canchaId: 'padel-1', fecha: dia, horas: ['11:00'], nombre: 'Esta Pestana' });
  });

  const guardado = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  expect(res).toEqual({ ok: false, error: 'Ese horario ya está reservado. Elige otro.' });
  expect(guardado.reservas.map((r) => r.nombre)).toEqual(
    expect.arrayContaining(['Otra Uno', 'Otra Dos'])
  );
});
```

En la semilla, el día 3 de `padel-1` ya ocupa las 12:00 y 13:00, y tiene libres las 10:00, 11:00 y 14:00: usa 14:00 como hora libre de C2. Agrega también las pruebas de los criterios C2 (hora libre en las dos versiones), C3 (evento con `newValue: null` y la clave presente) y C10 (`getItem` lanzando durante un evento de borrado). Antes de aplicar el arreglo 1, corre la prueba de arriba y confirma que falla; después, que pasa. Anota los dos resultados en tu resumen.

### 3. `RENOVAR_VENTANA` sin leer `localStorage` en el `reducer`

Hoy, si el payload no trae `datosStorage`, el `reducer` llama a `parsearDatosGuardados()` y lee `localStorage` (impuro). El provider siempre le pasa `datosStorage`; solo las pruebas usan el otro camino. Cambia el `reducer` para que, sin `datosStorage` en el payload, use `null` (solo memoria). Ajusta el subcaso 3 de la prueba `#41 Caso B` (cerca de la línea 1739 de la prueba) para que pase `{ datosStorage: { ocupadosCrudos, reservas } }` con los mismos datos que hoy escribe en `localStorage`, y conserva sus aserciones. La prueba `S5` (cerca de la línea 1049) solo comprueba que avanzan los días: debe seguir pasando sin cambios. Agrega la prueba de C5.

### 4. Reutilizar `combinarOcupadosPorCancha`

En la rama `else` de `RENOVAR_VENTANA` (`{ ...enMemoria, ...enStorage }` por cancha), usa `combinarOcupadosPorCancha(state.ocupados, ocupadosDeStorage)` y toma de ahí cada cancha (`|| {}` si falta). El resultado debe ser idéntico al de hoy.

### 5. Comentarios donde la revisión vio código muerto

- `disponibilidad` (`calcularDisponibilidad(estadoRef.current ?? state, ...)`, deps `[state]`): **no lo cambies**. El `?? state` nunca se evalúa, pero es lo que mantiene `state` como dependencia válida para `exhaustive-deps`, y `disponibilidad` tiene que cambiar de identidad en cada estado nuevo porque `useReserva.js`, `VistaCanchas.jsx` y `useAccionesReserva.js` la usan en `useMemo`/`useCallback`. Agrega un comentario corto que lo explique.
- Rama de borrado del listener (`window.localStorage.getItem(STORAGE_KEY) === null`, cerca de la línea 861): **no lo cambies a `leerRawStorage()`**. Ese helper devuelve `null` también cuando `getItem` lanza, y eso dejaría la pestaña con `reservas: []`. Agrega un comentario corto que lo explique.

### 6. `docs/agentes/reservas.md`

Actualiza la línea 9 (y lo que dependa de ella) según el criterio C11: inferencia de `tipo` en `parsearDatosGuardados`; el listener guarda en `ultimoRawStorageRef` el texto que parseó; `RENOVAR_VENTANA` recibe `datosStorage` del provider y el `reducer` no lee `localStorage`; y en la limitación conocida, la pérdida de reservas que solo estaban en memoria cuando otra pestaña sí guarda. Mantén el estilo del archivo: párrafo técnico en español, con tildes y tuteo.

## Prueba

```
npm test
npx eslint src/context --max-warnings=0
```

## Criterios de aceptación (te los va a exigir un verificador independiente)

- C1: En `src/context/ReservasContext.test.jsx` existe la prueba `rechaza reservar una hora que otra pestaña ya guardó en una segunda escritura` (la de la revisión del PR #48): con `localStorage` en `v2` (`Otra Uno` 10:00 y `Otra Dos` 11:00) y un evento `storage` con `newValue: v1` (solo `Otra Uno`), `reservar` a las 11:00 devuelve exactamente `{ ok: false, error: 'Ese horario ya está reservado. Elige otro.' }` (`toEqual`, no solo `res.ok`), y después `localStorage` sigue con `Otra Uno` y `Otra Dos`.
  Cómo comprobarlo: correr la prueba y leer sus aserciones. Debe fallar si en el listener `storage` se vuelve a asignar `ultimoRawStorageRef.current = leerRawStorage()` sin condición.
- C2: Mismo escenario que C1 (`localStorage` en `v2`, evento con `newValue: v1`), pero reservando una hora libre en las dos versiones (14:00; la semilla del día 3 ya ocupa las 12:00 y 13:00): `reservar` devuelve `ok: true` con un `codigo` `SPF-XXXXXX`, y al final `localStorage` tiene las tres reservas (`Otra Uno`, `Otra Dos` y la nueva) y las horas 10:00, 11:00 y 14:00 ocupadas en ese día de `padel-1`.
- C3: Con `localStorage` en `v2` y un evento `storage` de `STORAGE_KEY` con `newValue: null` (la clave sigue existiendo), el estado se sincroniza con `v2` (`result.current.reservas` incluye a `Otra Dos`) y `reservar` a las 11:00 devuelve exactamente el error de C1. Cubre la rama `leerRawStorage()` del arreglo.
- C4: En el listener `storage` de `ReservasContext.jsx`, `ultimoRawStorageRef.current` recibe el mismo texto que se parseó (`raw`) cuando `e.newValue` es un string, y `leerRawStorage()` solo cuando no lo es.
  Cómo comprobarlo: leer el código.
- C5: El caso `RENOVAR_VENTANA` del `reducer` no lee `localStorage`: sin `datosStorage` en el payload (sin payload, o con payload sin esa clave) no llama a `Storage.prototype.getItem` (espía con `not.toHaveBeenCalled()`), avanza `dias` al nuevo hoy y conserva `reservas` de memoria aunque `localStorage` tenga otras reservas guardadas.
- C6: Con `datosStorage` en el payload, `RENOVAR_VENTANA` en el `reducer` conserva ocupada la hora del día `+6` que trae `datosStorage` (subcaso 3 de la prueba `#41 Caso B`, ahora con el payload explícito), y los subcasos por `focus` de esa misma prueba siguen pasando sin cambiar sus aserciones.
- C7: La rama `conservarMemoriaEnVentanaPrevia === false` de `RENOVAR_VENTANA` usa `combinarOcupadosPorCancha` en lugar de repetir `{ ...enMemoria, ...enStorage }`, y el comportamiento no cambia: todas las pruebas existentes de `ReservasContext.test.jsx`, `Torneo.test.jsx` y `useChatbot.test.jsx` pasan.
- C8: Ninguna aserción existente de `ReservasContext.test.jsx` se borró ni se aflojó. El diff de ese archivo solo agrega pruebas y, en el subcaso 3 de `#41 Caso B`, cambia la llamada al `reducer` (y su comentario) para pasar `datosStorage`.
  Cómo comprobarlo: `git diff src/context/ReservasContext.test.jsx`.
- C9: `disponibilidad` conserva `calcularDisponibilidad(estadoRef.current ?? state, ...)` con dependencias `[state]` y un comentario breve que explica por qué (`state` mantiene la identidad nueva en cada estado para los `useMemo` de `useReserva`, `VistaCanchas` y el chat; quitarlo deja cálculos viejos o un aviso de `exhaustive-deps`). El `window.localStorage.getItem(STORAGE_KEY)` directo de la rama de borrado del listener se conserva, con un comentario que explica que no usa `leerRawStorage()` porque este devuelve `null` también cuando `getItem` lanza, y eso borraría las reservas en memoria.
  Cómo comprobarlo: leer el código.
- C10: Existe una prueba que, con una reserva hecha en memoria y `Storage.prototype.getItem` lanzando un error, despacha un evento `storage` con `key: null` y `newValue: null`, y comprueba que `result.current.reservas` conserva esa reserva (misma longitud y mismo `codigo`).
- C11: `docs/agentes/reservas.md` (línea 9 y donde aplique) dice: (a) que la inferencia de `tipo` la hace `parsearDatosGuardados`, no `fusionarConSemilla`; (b) que el listener `storage` guarda en `ultimoRawStorageRef` el mismo texto que parseó (`e.newValue`); (c) que el provider relee `localStorage` y le pasa `datosStorage` a `RENOVAR_VENTANA`, y que el `reducer` no lee `localStorage` (sin `datosStorage` usa solo lo que hay en memoria); (d) en la limitación conocida, además de que el acceso no es atómico, que si una pestaña no pudo guardar (cuota llena o modo privado) y otra sí, `SINCRONIZAR` y `RENOVAR_VENTANA` reemplazan `reservas` por lo guardado y se pierden las que solo estaban en memoria. Español con tildes y tuteo, sin mencionar IA ni modelos.
- C12: Solo cambiaron `src/context/ReservasContext.jsx`, `src/context/ReservasContext.test.jsx` y `docs/agentes/reservas.md`. Los contratos de `reservar`, `reservarEvento` y `cancelar` (`{ ok, codigo }` / `{ ok: false, error }`) y el esquema guardado en `STORAGE_KEY` no cambian.
  Cómo comprobarlo: `git status` y `git diff --stat`.
- C13: `npm test` pasa completo y `npx eslint src/context --max-warnings=0` termina sin errores ni avisos.

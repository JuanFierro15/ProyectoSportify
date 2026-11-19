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

# Tarea del bloque e2: una pestaña que no pudo guardar no debe perder sus reservas (issue #50)

## Objetivo

En `src/context/ReservasContext.jsx`, si una pestaña A no pudo guardar en
`localStorage` (el `setItem` del efecto espejo lanza: cuota llena o modo
privado) y otra pestaña sí guarda, A pierde las reservas que solo tenía en
memoria por dos caminos:

1. El listener `storage` y `leerEstadoFresco` (que usan `reservar`,
   `reservarEvento` y `cancelar`) despachan `SINCRONIZAR`, que reemplaza
   `reservas` y `ocupados` por lo guardado por la otra pestaña.
2. `renovarSiCambioElDia` detecta la escritura externa y despacha
   `RENOVAR_VENTANA` con `conservarMemoriaEnVentanaPrevia: false`; el
   `reducer` toma `reservas` de `datosStorage`.

La reserva que no se guardó desaparece de "Mis reservas" y su hora vuelve a
verse libre. Corrígelo.

Ya existe una versión de estado (`reducerVersionado`, `version`) que agregó el
bloque anterior para la issue #51: no la cambies y úsala igual que hoy
(`despachar`).

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx`,
  `src/context/ReservasContext.test.jsx` y `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador), ni ningún otro archivo.
  No modifiques `src/lib/cancelacion.js`: solo puedes importar de ahí.
- No hagas commits, ni push, ni cambies de rama.

## Diseño (parte del plan aprobado)

1. **Registro de pendientes.** Un ref `idsSinGuardarRef` con un `Set` de ids:
   - en el `catch` del `setItem` del efecto espejo, agrega los ids de
     `state.reservas` que no están en lo último guardado con éxito (las
     reservas de `ultimoRawStorageRef.current`, parseadas con
     `parsearDatosGuardados`; si no hay nada guardado, todas);
   - si el `setItem` funciona, vacía el `Set`;
   - si una reserva pendiente se cancela en A (ya no está en `state.reservas`),
     su id sale del `Set` (por ejemplo, filtrando el `Set` contra
     `state.reservas` en el efecto espejo).
2. **Función pura exportada**
   `conservarReservasSinGuardar(guardado, reservasMemoria, idsSinGuardar)`:
   - `guardado` es `{ ocupados, reservas }` ya fusionado con la semilla;
   - devuelve `{ ocupados, reservas }`: las reservas de `guardado` más las de
     `reservasMemoria` cuyo id esté en `idsSinGuardar` y **no** esté ya en
     `guardado.reservas` (sin duplicar por `id`);
   - agrega a `ocupados` las horas de esas reservas agregadas: individual con
     `canchaId`, `fecha` y `horasDeReserva(reserva)` (importa de
     `src/lib/cancelacion.js`); evento (torneo o cumpleaños) con cada uno de
     sus bloques (revisa cómo `RESERVAR_EVENTO` del `reducer` arma sus celdas
     y usa los mismos campos). Solo en fechas que existan en `ocupados` de
     `guardado` para esa cancha (la ventana), sin horas repetidas y en orden;
   - si `idsSinGuardar` está vacío, devuelve `guardado` tal cual (mismo
     objeto);
   - no muta ninguno de sus argumentos.
3. **Dónde se aplica** (los tres caminos de la issue):
   - listener `storage`, cuando hay datos: el `guardado` que se despacha en
     `SINCRONIZAR` pasa por la función;
   - `leerEstadoFresco`: el `guardado` que devuelve pasa por la función (y
     `estado` se arma con el resultado);
   - `renovarSiCambioElDia` cuando `cambioExterno` es verdadero: a
     `datosStorage` se le agregan las reservas pendientes y sus horas antes de
     despachar `RENOVAR_VENTANA` (ojo: ahí `datosStorage` trae
     `ocupadosCrudos`, sin fusionar con la semilla; agrégalas sin perder las
     fechas que ya trae).
4. **Reintento de guardado.** En el listener `storage`, si después de fusionar
   quedaron reservas pendientes, no marques `syncDesdeStorageRef`, para que el
   efecto espejo vuelva a intentar guardar el estado fusionado. Si no quedaron,
   el comportamiento es el de hoy.
5. **Fuera de alcance:** si otra pestaña borra la clave (`removeItem` o
   `clear`), se sigue reiniciando a la semilla y a `reservas: []`, como hoy.
   Tampoco se cubren cancelaciones que no se pudieron guardar.

## Pruebas (escríbelas primero)

En `src/context/ReservasContext.test.jsx`, escribe las pruebas de los
criterios C1 a C10 antes de cambiar el código y comprueba que las de C1 a C4
fallan con el código actual (RED). Para simular la pestaña A sin guardado, haz
que `Storage.prototype.setItem` lance (con `vi.spyOn`) mientras A reserva, y
escribe el estado de "la otra pestaña" con el `setItem` original (o
restaurando el espía) antes de despachar el evento `storage`. Usa los datos y
ayudantes que ya tiene ese archivo. Restaura los espías en `afterEach`.

## Documentación

En `docs/agentes/reservas.md`, en el párrafo "Sincronización entre pestañas":
describe el registro de pendientes (`idsSinGuardarRef`) y la fusión por `id`
con `conservarReservasSinGuardar`, y cambia la "Limitación conocida": quita
la pérdida de reservas sin guardar (issue #50) y deja la falta de bloqueo
atómico entre pestañas y lo que sigue fuera de alcance (clave borrada por otra
pestaña y cancelaciones que no se pudieron guardar).

## Criterios de aceptación (te los va a exigir el verificador)

En todos, la pestaña A tiene un `setItem` que lanza y la otra pestaña se
simula escribiendo `localStorage` directo.

- C1: A reserva la hora H (cancha X, día D). Otra pestaña escribe un estado con una reserva R2 en otra hora y se despacha el evento `storage`. `result.current.reservas` tiene las dos (ids exactos) y `disponibilidad` marca ocupadas H y la hora de R2.
- C2: Igual que C1 pero sin evento: A reserva otra hora después de la escritura externa (camino `leerEstadoFresco`). Quedan tres reservas (la pendiente, R2 y la nueva) y `reservar(H)` se rechaza.
- C3: Cambio de día con escritura externa (relojes falsos y `focus`): una reserva pendiente para mañana sigue en `reservas` y su hora sigue ocupada en el nuevo día 0.
- C4: Un torneo o cumpleaños pendiente (`reservarEvento` con varias canchas o bloques) sobrevive a la situación de C1 con todas sus celdas ocupadas.
- C5: Si lo que escribió la otra pestaña ya trae una reserva con el mismo `id`, no se duplica (queda exactamente una).
- C6: Si después el `setItem` de A vuelve a funcionar, la siguiente escritura guarda la pendiente en `localStorage` y el registro se vacía: una escritura externa posterior sin esa reserva la reemplaza, como hoy.
- C7: Si A cancela una reserva pendiente, no vuelve a aparecer tras un evento `storage` ni tras un cambio de día.
- C8: Con `setItem` funcionando siempre, el comportamiento es el de hoy: una reserva cancelada en otra pestaña desaparece de A tras el evento `storage`.
- C9: Si otra pestaña borra la clave (`removeItem` o `clear`), A vuelve a la semilla con `reservas: []`, como hoy.
- C10: `conservarReservasSinGuardar` no muta sus argumentos (prueba con `Object.freeze` profundo o comparando copias) y con el registro vacío devuelve el mismo objeto `guardado`.
- C11: Las pruebas previas de `src/context/ReservasContext.test.jsx` (incluidas las de la issue #51) y de `src/components/reservas/` pasan sin cambiar sus aserciones; `npm run lint` termina sin errores ni avisos.
- C12: `docs/agentes/reservas.md` describe el registro de pendientes y la fusión por `id`, y la limitación conocida ya no nombra la pérdida de reservas sin guardar; nombra la falta de bloqueo atómico y lo que queda fuera de alcance.

## Comandos

```bash
npm test -- src/context src/components/reservas
npm run lint
```

Al terminar, responde con: archivos cambiados, las pruebas nuevas (nombres),
la salida resumida del RED y del GREEN, y el resultado de los dos comandos.

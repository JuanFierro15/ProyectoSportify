[MODO EJECUTOR]

## Retoma (lee esto primero)

Un intento anterior de este mismo bloque ya implementó casi todo y quedó en el
árbol de trabajo (sin commit): cambios en `src/context/ReservasContext.jsx`,
pruebas nuevas en `src/context/ReservasContext.test.jsx` (sonda S13 y los
casos de la tarea) y `docs/agentes/reservas.md`. El ciclo se cortó solo
porque correr la suite reescribió con otro fin de línea el snapshot
`api/_lib/__snapshots__/instrucciones.test.js.snap` (ya se restauró y ahora
se ignora).

No empieces de cero: revisa lo que hay contra la tarea y los criterios de
abajo, completa o corrige lo que falte, y corre los comandos. No toques
archivos fuera de los permitidos.

---

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

# Tarea del bloque b7: el choque al sincronizar también mira las reservas guardadas (issue #62)

## Objetivo

`conciliarReservasSinGuardar` (`src/context/ReservasContext.jsx`) decide si
una reserva sin guardar choca con lo guardado mirando **solo**
`ocupados[canchaId][fecha]`. Si a lo leído le falta la clave de esa fecha,
`choca` da `false`: la pendiente se acepta y quedan **dos reservas en la misma
cancha, fecha y hora**, sin aviso. Además, al aceptarla, sus horas no se
agregan a `ocupados` porque la fecha no existe. Lee `gh issue view 62`,
`docs/agentes/reservas.md` y la sonda S13 de
`planificacion/etapas/20-revision-prs-57-60/revision/v2-sondas.test.jsx.txt`
(la variante sin la clave de la fecha falla hoy).

El camino que llega ahí es `renovarSiCambioElDia` (cambio de día por `focus`
o `visibilitychange`): usa `desdeStorage.ocupadosCrudos` como base sin
fusionar con la semilla, a diferencia del listener `storage` y de
`leerEstadoFresco`, que pasan la base por `fusionarConSemilla`.

Es código de alto riesgo (datos guardados y orden entre pestañas): cambia lo
mínimo y no toques el comportamiento de los otros caminos.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx`,
  `src/context/ReservasContext.test.jsx` y `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
  No cambies `src/lib/cancelacion.js`.
- No hagas commits, ni push, ni cambies de rama.

## Diseño

1. **Choque contra las reservas guardadas.** En `conciliarReservasSinGuardar`,
   una candidata choca si alguna de sus celdas (`celdasDeReserva`, ya
   importada de `src/lib/cancelacion.js`) comparte cancha, fecha y hora con
   `ocupados` (como hoy) **o** con alguna celda de `guardado.reservas` (o de
   una candidata ya aceptada antes en el mismo recorrido). Usa
   `celdasDeReserva`, **no** `horasUsadasEnCelda`: otro bloque le va a quitar
   el `export` a esa función.
2. **Base completa en el cambio de día.** En `renovarSiCambioElDia`, cuando
   hay cambio externo, arma la base de `conciliarLecturaExterna` con los
   `ocupados` de lo leído completados con la semilla de la ventana nueva
   (`ventanaDias()` y `ocupadosSemilla`), igual que el listener `storage`,
   **sin perder** las fechas de lo leído que quedan fuera de esa ventana (las
   pruebas de #41 sobre el día `+6` y las fechas futuras deben seguir
   pasando). Así, si se acepta una pendiente, sus horas quedan en `ocupados`.
3. **Pruebas primero (RED).** Antes de cambiar el código, agrega a
   `ReservasContext.test.jsx` la sonda S13 completa (los dos subcasos) y
   comprueba que el subcaso sin la clave falla. Agrega también:
   - un evento con `bloques` (torneo o cumpleaños) pendiente cuya celda del
     **último** bloque coincide con una reserva guardada que no está en
     `ocupados`: se descarta entero, con un aviso con su código;
   - una pendiente que **no** choca, con la fecha ausente de `ocupados` en lo
     leído: se acepta y su hora queda ocupada en `disponibilidad` después del
     cambio de día, y las demás horas de ese día conservan la semilla;
   - repetir el `focus` no duplica reservas ni avisos.
4. Actualiza `docs/agentes/reservas.md` (la frase sobre cómo se detecta el
   choque y la base de `renovarSiCambioElDia`).

## Comandos

- `npm test -- src/context src/components src/lib`
- `npm run lint` (0 errores y 0 avisos)

La carpeta `src/verificacion/b7/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: La sonda S13 completa está en `ReservasContext.test.jsx` y pasa. En el subcaso sin la clave de la fecha en `ocupados['padel-1']`: `reservas` queda exactamente con `['SPF-S13B02']`, `16:00` no está disponible y hay exactamente un aviso, con el código de la reserva descartada.
  Cómo comprobarlo: correr la prueba. Comprobar también que falla con el `src/context/ReservasContext.jsx` de `main` (por ejemplo con `git stash` en una copia o leyendo el diff y razonándolo: anotar cuál).
- C2: `conciliarReservasSinGuardar`, llamada directo con un `guardado` cuyo `ocupados` no tiene la fecha y cuyas `reservas` tienen una reserva en esa celda, devuelve la candidata en `conflictos` y no la agrega a `guardado.reservas`. Lo mismo si la celda coincide con una candidata aceptada antes en la misma llamada (dos pendientes en la misma celda: la segunda choca).
- C3: Un evento con `bloques` pendiente cuya celda del último bloque coincide con una reserva guardada ausente de `ocupados` se descarta entero, con un aviso con su código; las horas de sus otros bloques no quedan ocupadas por él.
- C4: Una pendiente que no choca, con su fecha ausente de `ocupados` en lo leído, se acepta tras el cambio de día: su hora queda ocupada en `disponibilidad` y las demás horas de ese día tienen el valor de la semilla.
- C5: Después del cambio de día se conservan las fechas de lo leído que quedan fuera de la ventana nueva (por ejemplo una fecha futura de otra pestaña). Las pruebas de #41 (día `+6` y fechas futuras) pasan sin cambiar sus aserciones.
- C6: Repetir `focus` (y `visibilitychange`) después del cambio de día no duplica reservas ni avisos.
- C7: El listener `storage` y `leerEstadoFresco` no cambian de comportamiento: las pruebas existentes de `ReservasContext.test.jsx`, `AvisoConflictoReserva.test.jsx` y `cancelacion.test.js` pasan sin cambiar sus aserciones (el diff de pruebas solo agrega casos).
- C8: No se usa `horasUsadasEnCelda` en `ReservasContext.jsx` y `src/lib/cancelacion.js` no cambió.
- C9: `docs/agentes/reservas.md` describe el choque contra `ocupados` y contra las celdas de las reservas guardadas, y la base del cambio de día.
- C10: `npm test` completo y `npm run lint` terminan con código 0 (lint sin avisos).

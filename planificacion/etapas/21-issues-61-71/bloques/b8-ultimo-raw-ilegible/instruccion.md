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

# Tarea del bloque b8: con lo último guardado ilegible no reviven reservas canceladas (issue #63)

## Objetivo

Una reserva cuenta como "pendiente de guardar" si está en memoria y no en
`ultimoRawStorageRef`, y como "cancelación pendiente" si está ahí y no en
memoria. Si `ultimoRawStorageRef` es un texto que no se puede leer,
`idsDeRawStorage` devuelve un conjunto vacío: **toda** reserva en memoria pasa
por pendiente y se apaga la detección de cancelaciones pendientes. Una reserva
que otra pestaña canceló puede reaparecer y volver a guardarse. Lee
`gh issue view 63` y `docs/agentes/reservas.md`.

Hoy el único camino que deja un texto ilegible en `ultimoRawStorageRef` es
`renovarSiCambioElDia`: con cambio externo hace
`ultimoRawStorageRef.current = rawActual` aunque `rawActual` no se pueda
parsear. (El listener `storage` y `leerEstadoFresco` solo lo asignan cuando
`parsearDatosGuardados` acepta el texto.) También puede quedar ilegible desde
el montaje, si la clave ya tenía un JSON roto y `setItem` falla.

Es código de alto riesgo (datos guardados y orden entre pestañas): cambia lo
mínimo.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx`,
  `src/context/ReservasContext.test.jsx` y `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Diseño

1. **Prueba primero (RED).** Escribe en `ReservasContext.test.jsx` la prueba
   con los pasos de la issue y comprueba que falla con el código actual:
   1. A tiene una reserva guardada `R1`.
   2. Se escribe `'{no es json'` en la clave **sin** evento, se hace fallar
      `setItem` en A, se avanza un día y se despacha `focus`.
   3. Otra pestaña escribe un estado válido **sin** `R1` (la canceló) y llega
      su evento `storage`.
   4. `R1` no debe volver a `result.current.reservas`.
   Si con estos pasos exactos no falla, busca la variante mínima que sí falle
   (por ejemplo con el JSON roto desde el montaje) y explícalo en tu resumen.
2. En `renovarSiCambioElDia`, no reemplaces `ultimoRawStorageRef` con un texto
   que `parsearDatosGuardados` rechace.
3. Distingue dos casos en `obtenerIdsPendientesSinGuardar`:
   - `ultimoRaw` es `null` (no hay nada guardado): se queda como hoy, todo lo
     que está en memoria y no está guardado es pendiente (no rompas las
     pruebas de #56 con `startTransition` ni la sonda S11);
   - `ultimoRaw` es un texto que no se puede leer: solo cuentan como
     pendientes los ids que ya están en `idsSinGuardarRef`.
   Revisa que `obtenerIdsCanceladosSinGuardar` y el `catch` del efecto espejo
   sean coherentes con esa regla.
4. Pruebas adicionales: con `ultimoRaw` ilegible y una reserva nueva hecha
   después (con `setItem` fallando), la nueva sí se conserva al llegar
   `storage`; con `ultimoRaw` `null` y una reserva hecha dentro de
   `startTransition`, también se conserva.
5. Actualiza `docs/agentes/reservas.md` con la regla.

## Comandos

- `npm test -- src/context src/components src/lib`
- `npm run lint` (0 errores y 0 avisos)

La carpeta `src/verificacion/b8/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: La prueba con los pasos de la issue (o la variante mínima que el implementador justifique) está en `ReservasContext.test.jsx`, pasa, y con el `ReservasContext.jsx` de antes del bloque fallaría: `R1`, cancelada por otra pestaña, no vuelve a `reservas` y su hora queda libre en `disponibilidad`.
  Cómo comprobarlo: correr la prueba y leer el diff para confirmar que el caso depende del cambio (anotar el razonamiento o la corrida contra la versión anterior).
- C2: Después de un cambio de día con un texto ilegible en la clave, `ultimoRawStorageRef` no queda con ese texto: un `storage` posterior con un estado válido se concilia contra lo último legible.
- C3: Con `ultimoRaw` ilegible, una reserva nueva hecha después con `setItem` fallando se conserva al llegar un `storage` válido de otra pestaña (es pendiente porque está en `idsSinGuardarRef`), y se guarda una sola vez cuando `setItem` vuelve a funcionar.
- C4: Con `ultimoRaw` en `null` (no había nada guardado), una reserva hecha dentro de `startTransition` se conserva al llegar `storage` en el mismo `act`. Las pruebas de #56 y de la sonda S11, si está en la suite, pasan sin cambiar sus aserciones.
- C5: Repetir el `focus` y repetir el mismo `storage` no duplica reservas ni avisos.
- C6: Las pruebas existentes de `src/context`, `src/components` y `src/lib` pasan sin cambiar sus aserciones (el diff de pruebas solo agrega casos).
- C7: `docs/agentes/reservas.md` explica qué pasa cuando lo último guardado es ilegible y cuando es `null`.
- C8: `npm test` completo y `npm run lint` terminan con código 0 (lint sin avisos).

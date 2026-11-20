# Criterios de aceptación del bloque b8 (issue #63)

- C1: La prueba con los pasos de la issue (o la variante mínima que el implementador justifique) está en `ReservasContext.test.jsx`, pasa, y con el `ReservasContext.jsx` de antes del bloque fallaría: `R1`, cancelada por otra pestaña, no vuelve a `reservas` y su hora queda libre en `disponibilidad`.
  Cómo comprobarlo: correr la prueba y leer el diff para confirmar que el caso depende del cambio (anotar el razonamiento o la corrida contra la versión anterior).
- C2: Después de un cambio de día con un texto ilegible en la clave, `ultimoRawStorageRef` no queda con ese texto: un `storage` posterior con un estado válido se concilia contra lo último legible.
- C3: Con `ultimoRaw` ilegible, una reserva nueva hecha después con `setItem` fallando se conserva al llegar un `storage` válido de otra pestaña (es pendiente porque está en `idsSinGuardarRef`), y se guarda una sola vez cuando `setItem` vuelve a funcionar.
- C4: Con `ultimoRaw` en `null` (no había nada guardado), una reserva hecha dentro de `startTransition` se conserva al llegar `storage` en el mismo `act`. Las pruebas de #56 y de la sonda S11, si está en la suite, pasan sin cambiar sus aserciones.
- C5: Repetir el `focus` y repetir el mismo `storage` no duplica reservas ni avisos.
- C6: Las pruebas existentes de `src/context`, `src/components` y `src/lib` pasan sin cambiar sus aserciones (el diff de pruebas solo agrega casos).
- C7: `docs/agentes/reservas.md` explica qué pasa cuando lo último guardado es ilegible y cuando es `null`.
- C8: `npm test` completo y `npm run lint` terminan con código 0 (lint sin avisos).

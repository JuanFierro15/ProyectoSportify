# Criterios de aceptación del bloque e1 (issue #51)

- C1: Con una secuencia que fuerza un render del provider sin una reserva hecha dentro de `startTransition` (por ejemplo, `flushSync` sobre el estado de un padre) y luego reserva la misma hora otra vez, la segunda reserva devuelve `ok: false` con el error `Ese horario ya está reservado. Elige otro.` y `result.current.reservas` queda con una sola reserva de esa hora.
  Cómo comprobarlo: prueba propia en `src/verificacion/e1/` además de la del implementador; comprueba que la secuencia de verdad produce un render intermedio sin la transición (por ejemplo, contando renders o leyendo el estado del render).
- C2: En esa misma situación, con tres llamadas (horas H, H+1 y H), la tercera se rechaza y quedan exactamente dos reservas.
- C3: Sin transiciones, dos `reservar` de la misma hora en el mismo `act`: la segunda se rechaza.
- C4: Tras un evento `storage` de otra pestaña que ocupa la hora H, `reservar(H)` devuelve `ok: false` y `disponibilidad` marca H ocupada en el mismo tick.
- C5: Una acción que no cambia nada (por ejemplo, `CANCELAR` de un id que no existe, o reservar una hora ya ocupada) deja el mismo objeto de estado y la misma `version`.
- C6: El `reducer` exportado no cambia de comportamiento: las pruebas que lo llaman directo pasan sin tocar sus aserciones, y llamarlo directo no agrega `version`.
- C7: Las pruebas previas de `src/context/ReservasContext.test.jsx` y de `src/components/reservas/` pasan sin cambiar sus aserciones (revisa el diff de las pruebas: solo se agregan casos); `npm run lint` termina sin errores ni avisos.
- C8: `docs/agentes/reservas.md` explica la versión (`reducerVersionado`) y por qué el render no pisa a `despachar`, sin tocar la limitación conocida de la issue #50.

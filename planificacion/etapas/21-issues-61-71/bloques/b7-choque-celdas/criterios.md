# Criterios de aceptación del bloque b7 (issue #62)

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

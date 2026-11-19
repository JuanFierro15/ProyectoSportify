# Criterios de aceptación del bloque e2 (issue #50)

En todos, la pestaña A tiene un `setItem` que lanza y la otra pestaña se simula escribiendo `localStorage` directo.

- C1: A reserva la hora H (cancha X, día D). Otra pestaña escribe un estado con una reserva R2 en otra hora y se despacha el evento `storage`. `result.current.reservas` tiene las dos (ids exactos) y `disponibilidad` marca ocupadas H y la hora de R2.
- C2: Igual que C1 pero sin evento: A reserva otra hora después de la escritura externa (camino `leerEstadoFresco`). Quedan tres reservas (la pendiente, R2 y la nueva) y `reservar(H)` se rechaza.
- C3: Cambio de día con escritura externa (relojes falsos y `focus`): una reserva pendiente para mañana sigue en `reservas` y su hora sigue ocupada en el nuevo día 0.
- C4: Un torneo o cumpleaños pendiente (`reservarEvento` con varias canchas o bloques) sobrevive a la situación de C1 con todas sus celdas ocupadas.
- C5: Si lo que escribió la otra pestaña ya trae una reserva con el mismo `id`, no se duplica (queda exactamente una).
- C6: Si después el `setItem` de A vuelve a funcionar, la siguiente escritura guarda la pendiente en `localStorage` y el registro se vacía: una escritura externa posterior sin esa reserva la reemplaza, como hoy.
- C7: Si A cancela una reserva pendiente, no vuelve a aparecer tras un evento `storage` ni tras un cambio de día.
- C8: Con `setItem` funcionando siempre, el comportamiento es el de hoy: una reserva cancelada en otra pestaña desaparece de A tras el evento `storage`.
- C9: Si otra pestaña borra la clave (`removeItem` o `clear`), A vuelve a la semilla con `reservas: []`, como hoy.
- C10: `conservarReservasSinGuardar` no muta sus argumentos y con el registro vacío devuelve el mismo objeto `guardado`.
- C11: Las pruebas previas de `src/context/ReservasContext.test.jsx` (incluidas las de la issue #51) y de `src/components/reservas/` pasan sin cambiar sus aserciones (revisa el diff de las pruebas: solo se agregan casos); `npm run lint` termina sin errores ni avisos.
- C12: `docs/agentes/reservas.md` describe el registro de pendientes y la fusión por `id`, y la limitación conocida ya no nombra la pérdida de reservas sin guardar; nombra la falta de bloqueo atómico y lo que queda fuera de alcance (clave borrada por otra pestaña, cancelaciones sin guardar).

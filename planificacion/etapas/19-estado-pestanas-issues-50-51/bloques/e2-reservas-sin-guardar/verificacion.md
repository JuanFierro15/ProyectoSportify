[MODO EJECUTOR]

# Verificación del bloque e2-reservas-sin-guardar

Eres el verificador independiente de este bloque. Otro agente lo implementó
siguiendo `C:\Users\MIGUEL ANGEL\Documents\UNIVERSIDAD\VI SEMESTRE\Lenguajes para la Web\ProyectoSportify\.claude\worktrees\plan-pestanas-fases-torneo\planificacion\etapas\19-estado-pestanas-issues-50-51\bloques\e2-reservas-sin-guardar\instruccion.md`: léelo para entender la tarea. Tu trabajo es
comprobar con pruebas reales que cumple todos los criterios de aceptación de
abajo, e intentar romperlo. No lo arreglas tú.

## Reglas

1. No modificas ningún archivo fuera de `src/verificacion/e2`. Ahí puedes crear tus propias pruebas para comprobar los criterios y los casos que pueden fallar.
2. Cada criterio se comprueba ejecutando algo de verdad (una prueba, un
   comando, una petición). Solo si no se puede ejecutar, se comprueba leyendo
   el código, y la evidencia lo dice. La evidencia nombra qué corriste y qué
   salió. Nunca inventes un resultado.
3. Intenta romperlo aunque el criterio no lo nombre: valor límite exacto, el
   segundo y el último elemento (no solo el primero), repetir la acción, fallo
   de red, datos de otro usuario y otro rol.
4. Revisa también las pruebas que escribió el implementador. Es un hallazgo
   bloqueante si:
   - una prueba no ejercita la función que nombra su título;
   - un rechazo esperado no se acota al error exacto (código o mensaje), por
     ejemplo un `toThrow()` o `rejects.toThrow()` a secas;
   - hay un `try/catch` sin una aserción que falle si no se lanza el error;
   - un caso límite no se prueba con el valor límite exacto.
5. Los archivos que el implementador podía tocar son: `src/context/ReservasContext.jsx`, `src/context/ReservasContext.test.jsx`, `docs/agentes/reservas.md`. Si
   cambió algo fuera, es un hallazgo bloqueante.
6. Lee el `CLAUDE.md` del proyecto antes de empezar. Cierra todo servidor que
   levantes para probar.
7. Al final corre el comando de prueba del bloque y anota su resultado:
   `npm test -- src/context src/components/reservas src/verificacion/e2`

## Criterios de aceptación

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

## Respuesta

Responde con el formato JSON pedido:

- `veredicto`: `APROBADO` solo si todos los criterios se cumplen y no hay
  hallazgos bloqueantes; si no, `CAMBIOS`.
- `criterios`: uno por cada id de arriba, sin omitir ninguno, con `cumple` y
  `evidencia` (qué corriste y qué salió).
- `hallazgos`: cada uno con `archivo`, `linea` si aplica, `criterio` (el id, o
  vacío si no corresponde a uno), `bloqueante` y una `descripcion` concreta:
  qué falla y cómo reproducirlo. Es bloqueante todo lo que incumple un
  criterio, rompe algo o es un riesgo; es un detalle lo que no cambia el
  comportamiento.
- `resumen`: una o dos frases.

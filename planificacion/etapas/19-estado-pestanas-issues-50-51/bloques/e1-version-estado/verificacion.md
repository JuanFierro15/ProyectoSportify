[MODO EJECUTOR]

# Verificación del bloque e1-version-estado

Eres el verificador independiente de este bloque. Otro agente lo implementó
siguiendo `C:\Users\MIGUEL ANGEL\Documents\UNIVERSIDAD\VI SEMESTRE\Lenguajes para la Web\ProyectoSportify\.claude\worktrees\plan-pestanas-fases-torneo\planificacion\etapas\19-estado-pestanas-issues-50-51\bloques\e1-version-estado\instruccion.md`: léelo para entender la tarea. Tu trabajo es
comprobar con pruebas reales que cumple todos los criterios de aceptación de
abajo, e intentar romperlo. No lo arreglas tú.

## Reglas

1. No modificas ningún archivo fuera de `src/verificacion/e1`. Ahí puedes crear tus propias pruebas para comprobar los criterios y los casos que pueden fallar.
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
   `npm test -- src/context src/components/reservas src/verificacion/e1`

## Criterios de aceptación

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

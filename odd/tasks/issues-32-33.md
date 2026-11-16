# Issues #32 (reservas entre pestañas) y #33 (nombre y teléfono)

Objetivo: cerrar las issues #32 y #33 (encontradas al revisar el PR #31; ya estaban en `main`). Rama: `fix/issues-32-33` desde `origin/main` (84e4758). Entrega: un PR con un commit por issue. Tests: Vitest (`npm test`) + `npm run lint` + `npm run build`.

## Specs

Las citas entre comillas son textuales de las issues. Las decisiones marcadas "(plan)" son las del plan aprobado por Miguel el 16-11-2026.

### #32 Dos pestañas pueden reservar la misma hora

- **S1** Problema: "Con dos pestañas abiertas en la misma cancha, día y hora, las dos pueden confirmar la reserva. La segunda confirmación sobrescribe en `localStorage` el estado de la primera, así que la reserva de la primera pestaña se pierde sin aviso." Causa: "`src/context/ReservasContext.jsx` lee `localStorage` solo al montar y escribe su estado completo en cada cambio. No escucha el evento `storage`".
- **S2** "Escuchar `storage` en `ReservasContext` y reconciliar el estado con lo que escribió la otra pestaña." (plan) La lectura de `localStorage` de `crearEstadoInicial` se extrae a una función pura `leerGuardado(canchas, dias, semillaOcup)` (reutiliza `fusionarConSemilla` y la inferencia de `tipo`) y se agrega la acción `SINCRONIZAR` al reducer, que reemplaza `ocupados` y `reservas` por los leídos. El listener solo reacciona a `e.key === STORAGE_KEY` (o `e.key === null`, que es `localStorage.clear()`); se quita en el cleanup.
- **S3** "Antes de escribir, volver a leer `localStorage` y validar contra lo leído, de modo que la segunda confirmación se rechace con el mensaje de hora ocupada." (plan) `reservar`, `reservarEvento` y `cancelar` arman el estado fresco (estado actual con `ocupados`/`reservas` de `leerGuardado`; si no hay nada guardado o falla la lectura, el estado actual) y validan contra él. Si hay choque, despachan `SINCRONIZAR` y devuelven el error de siempre (`'Ese horario ya está reservado. Elige otro.'` en individual; el de `validarReservaEvento` en eventos). Si no, despachan `SINCRONIZAR` y después la acción. El contrato `{ ok, codigo }` / `{ ok: false, error }` no cambia. La doble validación dentro del reducer se mantiene.
- **S4** Reproducción del issue que debe quedar cubierta por test: "1. Abrir la página de reserva de una cancha en dos pestañas. 2. Elegir el mismo día y la misma hora en las dos. 3. Confirmar en la primera y después en la segunda. 4. Abrir "Mis reservas": solo queda la de la segunda pestaña." Resultado esperado: la segunda confirmación se rechaza con el mensaje de hora ocupada y la reserva de la primera sigue en `localStorage` y en el estado de las dos.
- **S5** (plan) Una sola pestaña se comporta igual que antes (reservar, eventos, cancelar, `RENOVAR_VENTANA`). Sin `localStorage` disponible (lanza al leer o escribir) todo sigue en memoria como hoy.
- **S6** (plan) `docs/agentes/reservas.md` describe la sincronización entre pestañas (listener `storage`, `SINCRONIZAR` y la relectura antes de confirmar).

### #33 Nombre y teléfono

- **S7** "**Nombre:** `limpiarNombre` (`src/lib/validacion.js`) elimina los dígitos mientras se escribe, sin avisar. Al escribir "Ana 123" queda "Ana " y el usuario no sabe por qué." Solución: "mostrar un mensaje corto (por ejemplo "Solo letras y espacios") cuando se descarta algún carácter, en vez de borrarlo en silencio." (plan) Función pura nueva en `validacion.js` que dice si el valor trae caracteres que no son letras ni espacios. El aviso "Solo letras y espacios" aparece en el formulario de reserva (`torneo/PasoDatos.jsx`, vía `useReserva.cambiarNombre`) y en `layout/MisReservas.jsx` (que también usa `limpiarNombre`), en un elemento con `aria-live="polite"`, y desaparece en la siguiente edición que no descarta nada. Colapsar dobles espacios no cuenta como descarte. El valor se sigue limpiando igual.
- **S8** "**Teléfono en el torneo:** el campo de `src/components/reservas/torneo/PasoDatos.jsx` tiene `maxLength={10}`, y el navegador corta la entrada antes de que `limpiarTelefono` quite los espacios. Al pegar "300 123 4567" quedan 8 dígitos ("30012345")." Solución: "quitar el `maxLength={10}` del input, o subirlo, y dejar que `limpiarTelefono` recorte a 10 dígitos después de limpiar." (plan) Se quita. Al pegar "300 123 4567" queda "3001234567".

## Tasks

| ID | Specs | Ruta | Estado | Commit |
|---|---|---|---|---|
| T1 | S1-S6 | agy hydrogen-medium (código) + hydrogen-high (pruebas) | hecho | a203289 |
| T2 | S7-S8 | agy hydrogen-medium (código) + hydrogen-high (pruebas) | hecho | 30df65e |

Riesgo: T1 toca estado persistido y concurrencia entre pestañas (alto: verificación independiente en navegador con dos pestañas reales). T2 bajo.

## Log

- **L1** (16-11-2026, Miguel): "Vale primero quiero que trabajemos las 2 issues que la #32, establece un plan para trabajar en ellas con el fin de completar esa issue. Luego trabajaremos en pro de las issues asignadas a mí". Interpretado como #32 y #33; plan aprobado ("Apruebo").
- **L2** (16-11-2026) T1: RED de 6 tests antes del arreglo. En la revisión del diff apareció un bloqueante: con pestañas en ventanas de días distintas, el `SINCRONIZAR` del evento se volvía a escribir y las pestañas entraban en ping-pong. Se corrigió con `omitirProximoEspejoRef` (RED de 2 tests). 409/409. Revisión gentle-ai del commit: Miguel eligió "Omitir esta vez".
- **L3** (16-11-2026) T2: RED de 3 tests; 412/412 y lint limpio.
- **L4** (16-11-2026) Verificación independiente (agy hydrogen-high, Chromium con dos pestañas reales en un mismo contexto): A-I PASS y S1-S8 PASS. La segunda pestaña ve la hora ocupada sin recargar y no puede confirmarla. Las reservas en horas distintas conviven. Una cancelación hecha en otra pestaña libera la hora. 0 escrituras en 5 s de inactividad. Aviso del nombre en los dos formularios; pegar el teléfono da "3001234567". 0 errores en consola. Vitest reescribe `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por finales de línea; se restaura antes de cada commit.

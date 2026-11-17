# Etapa 17: cierre de issues #40, #41 y #42 (sincronización entre pestañas)

Estado: **Aprobado** (plan de ejecución, 17-11-2026).
Rama: `fix/issues-40-41-42` (desde `main`, `5d8064b`).
Responsable: Juan Fierro (revisor del PR: Miguel Ángel Medina, `MiguelMD06`).

## Qué se pidió y qué hay hoy

Cerrar las tres issues abiertas (#40, #41 y #42), originadas en las limitaciones `(a)`, `(b)` y `(c)` registradas en `docs/agentes/reservas.md` tras la revisión del PR #37:

1. **#40 (`fix: la relectura antes de reservar puede pisar una reserva aún no guardada`)**: `reservar`, `reservarEvento` y `cancelar` en `src/context/ReservasContext.jsx` releen `localStorage` y despachan `SINCRONIZAR` con lo leído. Si se hacen dos llamadas seguidas antes de que corra el efecto espejo, o si `setItem` falla por cuota mientras `getItem` devuelve datos viejos, la relectura pisa una reserva aún no guardada.
2. **#41 (`fix: una pestaña con la ventana de ayer borra las horas ocupadas del día nuevo`)**: `leerGuardado` / `fusionarConSemilla` descartan fechas fuera de la ventana propia de 7 días. Si una pestaña abierta desde ayer reserva o renueva su ventana (`RENOVAR_VENTANA`), borra los `ocupados` del día nuevo (`+6`) creados por una pestaña de hoy.
3. **#42 (`fix: el chat lista como libre una hora que otra pestaña acaba de tomar`)**: en `src/components/chatbot/useAccionesReserva.js` (líneas 62-72), cuando `reservar` rechaza por un choque detectado en la relectura, `disponibilidad(canchaId, fecha)` sigue leyendo el `state` del closure previo al render, por lo que `mensajeChoque` lista como libre la hora recién ocupada.

## Decisiones y organización

- **#40 y #41 comparten `src/context/ReservasContext.jsx` y `src/context/ReservasContext.test.jsx`**, y cambian la misma lógica de persistencia/sincronización, por lo que van juntos en el bloque `r1-contexto-pestanas` (`gemini-4-hydrogen-xhigh`, alto riesgo por datos persistidos y concurrencia).
- **#42** requiere únicamente que `disponibilidad` lea `estadoRef.current` en `ReservasContext.jsx` (incluido en `r1`) y su prueba de integración en `src/components/chatbot/useChatbot.test.jsx` (archivo disjunto, paralelo en la Ola 1 como bloque `c1-prueba-chat-choque` con `gemini-4-hydrogen-high`).
- **Ola 2**: verificación independiente de solo lectura (`v1-verificacion`, `gemini-4-argon-high`, `--mode plan`).

## Bloques y olas

| Ola | Bloque | Agente | Rutas permitidas |
| --- | --- | --- | --- |
| 1 | `r1-contexto-pestanas` | `agy`, Hydrogen `xhigh` (`--mode accept-edits`) | `src/context/ReservasContext.jsx`, `src/context/ReservasContext.test.jsx` |
| 1 | `c1-prueba-chat-choque` | `agy`, Hydrogen `high` (`--mode accept-edits`) | `src/components/chatbot/useChatbot.test.jsx` |
| 2 | `v1-verificacion` | `agy`, Argon `high` (`--mode plan`) | Solo lectura (sin editar el repo) |

## Verificación

- `npm test`, `npm run lint` (0 warnings) y `npm run build`.
- #40: dos `reservar()` en el mismo `act()` sin re-render intermedio (horas distintas → quedan ambas; misma hora → primera pasa y segunda rechaza; combinaciones con `reservarEvento` y `cancelar`), y fallo de `setItem` por cuota con `getItem` devolviendo el estado viejo (la segunda reserva conserva la primera en memoria).
- #41: pestaña vieja (día 1) + pestaña nueva (día 2) con reserva en el día `+6`: (a) reservar en la pestaña vieja sin enfocarla conserva en `localStorage` las horas ocupadas del día `+6`; (b) `RENOVAR_VENTANA` (por `focus` y directo en `reducer`) relee `localStorage` y conserva ocupada la hora del día `+6`.
- #42: tras rechazo de `reservar` por choque en `localStorage`, `disponibilidad` inmediata marca esa hora como `disponible: false`, y en `useChatbot.test.jsx` el mensaje de choque no lista `'4:00 p. m.'` como libre y sí incluye las demás horas libres.

## Commits previstos

1. `fix: evita que la relectura antes de reservar pise reservas en memoria` (`Closes #40`)
2. `fix: conserva las horas ocupadas fuera de la ventana y relee al renovarla` (`Closes #41`)
3. `fix: actualiza las horas libres del mensaje de choque en el chat` (`Closes #42`)
4. `docs: actualiza la guía de reservas y registra la etapa 17`

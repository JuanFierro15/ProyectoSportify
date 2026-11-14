# Torneos por fases y asistente móvil

Detalle de los torneos por fases, sus reglas puras en `torneo.js` y `pasosTorneo.js`, los componentes de `src/components/reservas/torneo/` y el asistente del torneo en móvil. Lee este archivo antes de tocar la lógica o la interfaz de torneos.

## Torneos por fases en el estado de reservas

Para el flujo general de `RESERVAR_EVENTO` y `validarReservaEvento`, ver `docs/agentes/reservas.md`.

- Torneos por fases: no tienen acción propia. Usan `RESERVAR_EVENTO` / `reservarEvento` con `bloques` (uno por fase: `fecha`, `canchaIds`, `horas`), también todo-o-nada, y el precio sale de `calcularPrecioJornadas(bloques, canchas)`. El plan lo arma `useReserva` con las funciones de `src/lib/torneo.js`.
- Torneo: si una hora de una fase deja de estar libre (cambian canchas, equipos, día o disponibilidad), se limpia la franja entera de esa fase con aviso, nunca solo esa hora (dejaría un hueco), y solo en modo torneo.

## Reglas puras (`torneo.js` y `pasosTorneo.js`)

- `torneo.js`: reglas de torneos, JS puro sin imports (lo importa `api/`) — `OPCIONES_EQUIPOS` (4, 8, 16), `OPCIONES_DURACION` (15, 20, 30 min), `MAX_CANCHAS_TORNEO` (3, de un solo deporte), `maxCanchasTorneo(equipos)` (el tope real: los partidos de la fase más grande, hasta 3; 4 equipos → 2 canchas; decisión de Juan del 07-11-2026), `DESEMPATES` por deporte (penales en fútbol, tie-break en voley playa, super tie-break en pádel), `fasesDelTorneo`, `validarJornadas` (orden cronológico entre fases), `validarCanchasTorneo`, `sortearEquipos`, `validarCrucesManuales`, `programarTorneo` y `armarTorneo`.
- `pasosTorneo.js`: pasos del torneo (`PASOS_TORNEO`: `canchas`, `formato`, `fechas`, `llaves`, `datos`, `resumen`), `estadoPasosTorneo(reserva)` (completitud y motivo de cada paso) y `pasosAlcanzables(estados)` (los completos y el primero incompleto), JS puro y con tests.

## Componentes de `torneo/` y asistente móvil

- `torneo/`: `CalendarioTorneo` (muestra las fases en pestañas: una fase visible a la vez con todas montadas mediante `hidden`, resumen de horario y aviso visible en la pestaña; `.calendario-torneo__pestanas` usa `contain: inline-size` para hacer scroll interno en móvil sin ensanchar `.asistente-torneo`; día y horario por fase, con bloqueo de lo anterior a la fase previa), `Bracket` (llaves; también en la confirmación), `SeccionLlaves` (llaves a ancho completo), `IndicadorPasos` (5 pasos en escritorio, 6 clicables en móvil), `AsignacionManual` (cruces manuales con intercambio), `AlertaTiempo` (tiempo insuficiente, con acción para bajar a 15 min por partido), `AsistenteTorneo` y `useAsistenteTorneo` (asistente por pasos en móvil) y los bloques `PasoFormato`, `PasoFechas`, `PasoCapacidad`, `PasoLlaves`, `PasoDatos` y `PasoGuardados` (`Paso*.jsx`).
- **Asistente del torneo en móvil** (desde el 07-11-2026; spec en `odd/tasks/asistente-torneo-movil.md`): bajo `large` (`(max-width: 63.9375em)`) el modo torneo muestra un paso a la vez; en escritorio y en los otros modos, el layout de siempre.
  - Pasos (`src/lib/pasosTorneo.js`, puro y con tests): `canchas`, `formato`, `fechas`, `llaves`, `datos` y `resumen`. `estadoPasosTorneo(reserva)` da la completitud y el motivo de cada uno; `pasosAlcanzables` decide a qué paso se puede saltar (los completos y el primero incompleto). `IndicadorPasos` usa la misma regla y en escritorio sigue mostrando 5 pasos.
  - `torneo/useAsistenteTorneo.js` (`esMovil` con `matchMedia`, paso actual, `siguiente`/`anterior`/`irA`, scroll y foco al título del paso) y `torneo/AsistenteTorneo.jsx` (cabecera, indicador clicable y barra inferior fija con "Paso N de 6"). Todo lo elegido sigue en `useReserva`: cambiar de paso o de tamaño no pierde nada.
  - El scroll, el foco y el regreso a un paso alcanzable solo corren en móvil y en modo torneo; "Siguiente" exige que el paso de destino sea alcanzable (si no, `motivoAvance` dice qué paso falta).
  - La barra publica `--alto-barra-inferior` en `<html>` y `Chatbot.css` sube el botón y el panel esa distancia (sin asistente vale 0).
  - `FormularioReserva` acepta `seccion` (`'formato' | 'fechas' | 'llaves' | 'datos' | 'guardados'`): con un valor válido en modo torneo solo renderiza ese bloque (`torneo/Paso*.jsx`); sin él, todo como antes. El `Bracket` del paso `llaves` lo pone `SeccionLlaves`.
  - El bracket tiene ancho fijo (616-646 px): bajo `large`, `contain: inline-size` en `.bracket-torneo__movil` y `.bracket-torneo__canvas-scroll` evita que ensanche la página y lo deja desplazarse dentro de su caja. No quitarlo.

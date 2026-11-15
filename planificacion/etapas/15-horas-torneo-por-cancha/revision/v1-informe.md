# Informe de verificación — Etapa 15 (`v1-verificacion`)

**Veredicto:** `APROBADO`

---

## 1. Resumen de pruebas y compilación

| Comando | Resultado |
|---|---|
| `npm test` (`vitest run`) | **34 suites en verde, 334 tests pasando** (0 fallos) |
| `npm run lint` (`eslint .`) | **0 errores, 0 warnings** |
| `npm run build` (`vite build`) | **OK** (`dist/` generado en 1.84 s; único aviso esperado de lightningcss sobre `foundation.min.css`) |

---

## 2. Hallazgos (`archivo:línea`)

### Bloqueantes

Ninguno (`0`).

### Detalles (no bloqueantes, < 20 líneas)

1. **`src/components/reservas/useReserva.js:1149` — Guardia síncrona en `ejecutarConfirmacion` ante doble disparo en el mismo tick JS:**
   `ejecutarConfirmacion` valida `if (!puedeConfirmar || confirmado) return;` leyendo el estado `confirmado` de React. En interacción normal de navegador (un clic o dos clics separados por frame/render) funciona y no duplica, y además el reducer (`src/context/ReservasContext.jsx:391`) rechaza cualquier segunda acción `RESERVAR_EVENTO` sobre las mismas celdas manteniendo `state.reservas` con una sola reserva. Sin embargo, si se invoca `btn.click(); btn.click()` dos veces de forma síncrona dentro del mismo tick de JS antes de que React procese el re-render, la segunda llamada ejecuta `generarCodigo()` y `setConfirmado` con un segundo código cuyo `dispatch` el reducer descarta, desfasando el código visible en `ConfirmacionReserva` respecto al guardado en `localStorage`. Agregar un `useRef` (`confirmandoRef.current`) en `ejecutarConfirmacion` lo blinda en ~6 líneas.
2. **`src/components/reservas/torneo/formatoJornadas.js:46-48` y `89` — Formato de una hora única por cancha (`19:00 a 20:00` vs `19:00`):**
   `rangoHorasSeguidas(['19:00'])` devuelve `'19:00 a 20:00'` porque `sonHorasSeguidas` retorna `true` para un arreglo de 1 elemento. Por ello `VoucherReserva`, `ConfirmacionReserva`, `PasoGuardados` y `MisReservas` muestran `Pádel 2: 19:00 a 20:00`, mientras que el encabezado de `CalendarioTorneo.jsx:282` muestra `Cancha 2: 19:00`. Está alineado con los asserts actuales (`Torneo.test.jsx:1735`, `PasoGuardados.test.jsx:246`, `MisReservas.test.jsx:464`); si se prefiere hora puntual cuando `ordenadas.length === 1`, basta usar `if (ordenadas.length > 1 && sonHorasSeguidas(ordenadas))` en `formatoJornadas.js:46`.
3. **`src/components/reservas/torneo/formatoJornadas.js:193` — Reconstrucción de `horasPorCancha` desde `bloques` sin `torneo.jornadas`:**
   En `extraerJornadasDeReserva`, la rama `else if (bloques.length > 1)` reconstruye `horasPorCancha` solo cuando la ronda tiene más de un bloque. Si una reserva viniera sin `torneo.jornadas` y una fase tuviera un único bloque de una sola cancha (`bloques.length === 1 && bloques[0].canchaIds.length === 1`), usaría el formato de `horasDirectas`. En producción `armarTorneo` siempre persiste `torneo.jornadas[ronda].horasPorCancha`, por lo que no afecta al flujo real.

---

## 3. Revisión de código y pruebas por bloque

- **`l1-logica-torneo` (`src/lib/torneo.js`, `src/lib/pasosTorneo.js`, `src/lib/codigoReserva.js`, `src/lib/precios.js`):**
  - `turnosDeCancha` separa las horas de cada cancha en tramos contiguos de 60 min y calcula `Math.floor((tramo.length * 60) / durTurno)` sin que ningún partido cruce un hueco (`src/lib/torneo.js:149-168`).
  - `turnosDeFase` ordena por hora de inicio y desempata por `ordenCanchas` (`src/lib/torneo.js:171-199`).
  - `fasesDelTorneo` expone todas las canchas del torneo en `canchaIds` de cada fase y mantiene `canchasEfectivas = Math.min(ids.length, partidos)` (`src/lib/torneo.js:230-264`).
  - `validarJornadas` evalúa la ventana real desde la primera hora marcada en cualquier cancha hasta `sumarMinutos(ultimaHora, 60)` de cualquier cancha, priorizando el error de orden cronológico sobre el de capacidad (`src/lib/torneo.js:274-339`).
  - `horasSinPartido` y `mensajeHorasSinPartido` detectan exactamente qué bloques de 60 min no son tocados por el intervalo `[inicio, inicio + minutosTurno)` de ningún partido ubicado en esa cancha (`src/lib/torneo.js:368-451`).
  - `calcularPrecioJornadas` agrupa por `(ronda, canchaId)`, aplica el descuento de $5.000/h y pack de agua desde 2 horas marcadas en esa cancha y fase aunque sean salteadas, y no cobra canchas con 0 horas (`src/lib/precios.js:79-173`).
- **`c1-validacion-reserva` (`src/context/ReservasContext.jsx`):**
  - `validarReservaEvento` agrupa `bloques` por `b.ronda`, rechaza bloques de la misma ronda con distinta fecha (`ERROR_EVENTO_FECHA_FASE`), delega el orden cronológico entre fases a `validarJornadas`, verifica `horaLibre` y celdas duplicadas entre bloques (`todo-o-nada`), deduplica `canchaIds` y `canchaNombres`, y conserva la exigencia de horas seguidas (`ERROR_EVENTO_HORAS_NO_SEGUIDAS`) para cumpleaños (`src/context/ReservasContext.jsx:218-323`).
- **`u1-interfaz-torneo` (`src/components/reservas/useReserva.js`, `CalendarioTorneo.jsx`, `DialogoHorasSinPartido.jsx`, `VoucherReserva.jsx`, `ConfirmacionReserva.jsx`, `PasoGuardados.jsx`, `MisReservas.jsx`):**
  - Selección individual por cancha con un toque/clic (`elegirHoraFase`), cascada automática si una fase anterior se extiende sobre el horario de la siguiente en el mismo día, callout `role="status"` no bloqueante por fase con horas sin partido, y `<dialog>` modal nativo con foco inicial en `"Revisar horas"`, trampa de foco (`Tab` y `Shift+Tab`), cierre con `Escape` devolviendo el foco a `"Confirmar reserva"`, y navegación a la primera fase con horas de más al pulsar `"Revisar horas"`.
  - Ninguna prueba usa `toThrow()` a secas ni `try/catch` mudos; los rechazos y casos borde comprueban el mensaje o código exacto.

---

## 4. Resultados de las mutaciones temporales (aplicadas y revertidas)

Se aplicaron 5 mutaciones temporales sobre el código de producción, se ejecutó Vitest y se revirtió cada cambio inmediatamente:

| # | Archivo y línea mutada | Mutación aplicada | Resultado al correr Vitest | Estado final |
|---|---|---|---|---|
| 1 | `src/lib/torneo.js:315` | Cambiar `>=` por `>` en el chequeo de orden cronológico entre fases del mismo día (`aMinutos(horaInicio) > aMinutos(finPrevio.horaFin)`) | **Fallaron 3 tests** en 2 suites: `src/lib/torneo.test.js` (`AC-010`, `AC-011`) y `src/context/ReservasContext.test.jsx` (`rechaza semifinal antes del cierre de la última hora de cuartos en la segunda cancha y acepta justo en el cierre`) | Revertida |
| 2 | `src/lib/torneo.js:149-167` | Quitar la partición en tramos contiguos y cambiar `Math.floor` por `Math.ceil` en `turnosDeCancha` | **Fallaron 7 tests** en `src/lib/torneo.test.js` (`turnosDeCancha corta por tramos seguidos...`, `turnosDeFase y capacidadFase...`, `AC-010`, `detecta déficit...`, `sugerenciasTiempoFase`, y los 2 tests de `programarTorneo`) | Revertida |
| 3 | `src/components/reservas/useReserva.js:1311` | Hacer que `confirmar` llame directo a `ejecutarConfirmacion()` sin abrir `avisoHorasDeMas` | **Falló 1 test** en `src/components/reservas/Torneo.test.jsx` (`19. Final con 5 horas: aviso visible, diálogo, Escape devuelve foco, Revisar horas enfoca la Final y Reservar igual reserva una sola vez sin duplicar`) | Revertida |
| 4 | `src/context/ReservasContext.jsx:242` | Agrupar bloques por índice (`idx + 1`) en lugar de `b.ronda` en `validarReservaEvento` | **Fallaron 3 tests** en `src/context/ReservasContext.test.jsx` (`acepta dos canchas con horas solapadas dentro de la misma ronda...`, `rechaza bloques de la misma ronda con fechas distintas (ERROR_EVENTO_FECHA_FASE)`, `rechaza celda ocupada en el último bloque...`) | Revertida |
| 5 | `src/lib/precios.js:115` | Agrupar en `calcularPrecioJornadas` por `c.id` global en lugar de por `(ronda, canchaId)` | **Fallaron 4 tests** en `src/lib/precios.test.js` (`8 equipos con 3 canchas...`, `2 horas salteadas en una cancha y fase aplica descuento...`, `dos bloques de la misma ronda y cancha...`, `reserva vieja de un bloque con dos canchas...`) | Revertida |

---

## 5. Verificación en la aplicación real (Chrome headless vía CDP)

Se compiló la aplicación (`npm run build`), se sirvió con `vite preview` en `http://localhost:4173` y se ejecutó `planificacion/etapas/15-horas-torneo-por-cancha/revision/v1-prueba.mjs` tanto en `/reservar/padel?modo=torneo` como en `/reservar/futbol?modo=torneo`, en `390x844` (móvil) y `1440x900` (escritorio):

1. **Selección por cancha y horas no contiguas:**
   -Con 3 canchas seleccionadas, la matriz de cada fase muestra las 3 filas de cancha independientemente de `canchasEfectivas`.
   - En pádel se marcaron `16:00` y `18:00` en `padel-1` y `19:00` en `padel-2` (y en fútbol `15:00` y `18:00` en `futbol-1` y `19:00` en `futbol-2`, comprobando que `16:00` ocupada en `futbol-1` no bloquea `futbol-2`).
2. **Orden cronológico entre fases y cascada:**
   - Al marcar `19:00` en la cancha 2 en Cuartos (cierre `20:00`), la Semifinal en el mismo día limpió en cascada su hora `19:00` previa y deshabilitó todas las horas `< 20:00` (`h18Disabled: true`, `h19Disabled: true`, `h20Disabled: false`).
3. **Final con 5 horas, aviso `role="status"` y diálogo accesible:**
   - Al marcar 5 horas (`08:00` a `12:00`) en la Final, apareció el callout con `role="status"` (`"La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido."`) y los chips de las 4 horas sobrantes (`09:00`, `10:00`, `11:00`, `12:00`), sin deshabilitar `"Confirmar reserva"`.
   - Al pulsar `"Confirmar reserva"`, se abrió el `<dialog>` modal con foco inicial en `"Revisar horas"`.
   - `Tab` y `Shift+Tab` mantuvieron el foco atrapado entre `"Revisar horas"` y `"Reservar igual"`.
   - `Escape` cerró el diálogo sin crear reserva (`reservasCount: 0`) y devolvió el foco a `"Confirmar reserva"`.
   - `"Revisar horas"` cerró el diálogo sin reservar y llevó el foco al panel de la primera fase con horas de más.
   - `"Reservar igual"` creó una única reserva (`reservasCount: 1`) y mostró `ConfirmacionReserva` con el desglose por fase y cancha.
4. **"Mis reservas" e interacción por teclado:**
   - Al buscar el código generado en `"Mis reservas"`, se listaron las 3 fases con sus fechas y horarios por cancha.
   - Con teclado, `Tab` alcanzó los botones de hora del calendario y `Space` alternó `aria-pressed` de `"false"` a `"true"` y de vuelta a `"false"`.
5. **Sin desborde horizontal y sin errores:**
   - `document.documentElement.scrollWidth === window.innerWidth` (`390 === 390` y `1440 === 1440`) en todas las vistas probadas (paso de canchas, calendario con 3 canchas, paso resumen, confirmación y modal `"Mis reservas"`).
   - `erroresConsola: []` y `excepciones: []`. No se abrió ni invocó `/api/chat`.
   - Al finalizar se cerró `vite preview` y se verificó que ningún proceso quedara escuchando en el puerto `4173`.

### Capturas generadas en `planificacion/etapas/15-horas-torneo-por-cancha/revision/`

- `v1-padel-390-cuartos-3canchas.png`, `v1-padel-390-final-aviso.png`, `v1-padel-390-dialogo.png`, `v1-padel-390-confirmacion.png`, `v1-padel-390-mis-reservas.png`
- `v1-padel-1440-cuartos-3canchas.png`, `v1-padel-1440-final-aviso.png`, `v1-padel-1440-dialogo.png`, `v1-padel-1440-confirmacion.png`, `v1-padel-1440-mis-reservas.png`
- `v1-futbol-390-cuartos-3canchas.png`, `v1-futbol-390-final-aviso.png`, `v1-futbol-390-dialogo.png`, `v1-futbol-390-confirmacion.png`, `v1-futbol-390-mis-reservas.png`
- `v1-futbol-1440-cuartos-3canchas.png`, `v1-futbol-1440-final-aviso.png`, `v1-futbol-1440-dialogo.png`, `v1-futbol-1440-confirmacion.png`, `v1-futbol-1440-mis-reservas.png`

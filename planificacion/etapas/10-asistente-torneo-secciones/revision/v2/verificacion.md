# Verificación final v2 — Frente B del asistente de torneo (`71fb582` + `2eafffa`)

Verificación independiente en modo solo lectura sobre `http://localhost:4173` (`npm run build` + `npm run preview`).
- Suite de pruebas y linter: `npm test` (**20 archivos, 227 tests pasan**) y `npm run lint` (**0 errores, 0 warnings**).
- Carpeta temporal externa: `sportify-v2-678952` (en la carpeta temporal del sistema).

---

## Veredicto por spec

| Spec | Veredicto | Evidencia resumida |
|---|---|---|
| **S2 — Alcance (`max-width: 63.9375em`, escritorio y otros modos sin cambios)** | **PASA** | Todas las reglas nuevas de `FormularioReserva.css`, `Bracket.css` y `SeccionLlaves.css` están acotadas a `@media screen and (max-width: 63.9375em)`, y `FormularioReserva` sin `seccion` devuelve el mismo árbol DOM. En `1440×900`, las capturas donde el carrusel ya salió del viewport (`1440-torneo-1400` y `1440-torneo-2100`, que contienen todo `FormularioReserva`, `CalendarioTorneo` y `VoucherReserva`) tienen **`0` píxeles distintos (`0,0000 %`)** respecto a `v1`. En las 6 capturas con `y = 0` e `y = 700`, la única variación proviene de la animación continua Ken Burns (`@keyframes cancha-kenburns`) de las fotos del `DepthCarousel` y su cuantización WebP con pérdida. |
| **S7 — Contrato `seccion` en `FormularioReserva`** | **PASA** | Verificado en el DOM real de cada paso del asistente y en `src/components/reservas/FormularioReserva.test.jsx` (7 tests nuevos): `formato` muestra solo "Formato del torneo" (equipos, duración y desempate); `fechas` muestra solo "Programación por fases" y "Capacidad y tiempo estimado"; `llaves` muestra solo "Emparejamiento" (más `SeccionLlaves`); `datos` muestra solo "Tus datos"; `guardados` (en `resumen`) muestra solo "Torneos reservados" cuando existen. |
| **S8 — Contenido legible en 390 px (y corte intermedio 960×800)** | **PASA en 390×844** / **FALLA en el corte intermedio 960×800** | **En `390×844` (S8 literal): PASA.** Los dos desbordes de `v1` (`llaves` con `706 px` y `resumen-guardados` con `709 px`) quedaron corregidos: `doc.scrollWidth = 390`, `body.scrollWidth = 390` y `.vista-canchas__marco.scrollWidth` vale `390` en todos los pasos del formulario y `392` en `resumen` (por los `2 px` aceptados de las muescas del voucher). `.bracket-torneo__movil` queda con `clientWidth = 320` y `scrollWidth = 646` en `llaves` (`299` / `616` en `resumen-guardados`), desplaza horizontalmente dentro de su caja hasta mostrar la ronda `Final` entera (`390-llaves-final.webp`), y el `font-size` mínimo de las tarjetas de partido se mantiene en `12 px`.<br>**En `960×800` (punto 2 de la verificación, entre `900 px` y `63.9375em`): FALLA.** Entre `900 px` y `1023 px`, `Bracket.jsx` (`useEsMovil(900)`) renderiza `.bracket-torneo__canvas-scroll` en vez de `.bracket-torneo__movil`, pero `2eafffa` solo aplicó `contain: inline-size` a `.bracket-torneo__movil`. Por eso en `960×800` `.vista-canchas__marco.scrollWidth` sube a `1167 px` en `llaves` y a `1150 px` en `resumen-guardados`. |

---

## 1. Móvil 390×844 (S8 y S7)

Configuración: `width: 390`, `height: 844`, `deviceScaleFactor: 2`, `mobile: true`, `touch: true`.
`window.matchMedia('(max-width: 63.9375em)').matches === true`.

### 1.1 Tabla de anchos y desbordes por paso (390×844)

| Paso / variante | `doc.scrollWidth` | `body.scrollWidth` | `marco.scrollWidth` | `innerWidth` | Elementos desbordados (con recorte de `marco`) | Elementos fuera de `[-0.5, 390.5]` antes del recorte de `marco` | `.bracket-torneo__movil` (`clientWidth` / `scrollWidth`) | `Final` entera con `scrollLeft = scrollWidth` | `font-size` mín. partido | Estado |
|---|---:|---:|---:|---:|---:|---|---:|---|---:|---|
| 1. `canchas` | 390 | 390 | 476* | 390 | 0 | 15 (solo tarjetas laterales inactivas del `DepthCarousel`, recortadas por diseño; `.asistente-torneo` mide `370 px`, `left: 10`, `right: 380`) | — | — | — | **PASA** |
| 2a. `formato` (8 equipos) | 390 | 390 | 390 | 390 | 0 | 0 | — | — | — | **PASA** |
| 2b. `formato` (16 equipos) | 390 | 390 | 390 | 390 | 0 | 0 | — | — | — | **PASA** |
| 3. `fechas` | 390 | 390 | 390 | 390 | 0 | 0 | — | — | — | **PASA** |
| 4a. `llaves` (Aleatorio) | 390 | 390 | **390** (en v1: 706) | 390 | 0 | 0 | **`320` / `646`** (`maxScrollLeft: 326`) | **Sí** (`final`: `[165, 355]` dentro de caja `[35, 355]`) | `12px` | **PASA** |
| 4b. `llaves` (Manual) | 390 | 390 | **390** (en v1: 706) | 390 | 0 | 0 | **`320` / `646`** (`maxScrollLeft: 326`) | **Sí** (`final`: `[165, 355]` dentro de caja `[35, 355]`) | `12px` | **PASA** |
| 5. `datos` | 390 | 390 | 390 | 390 | 0 | 0 | — | — | — | **PASA** |
| 6a. `resumen` (sin confirmar) | 390 | 390 | 392 | 390 | 0 | 2 (muescas del voucher: `left: -2` y `right: 392`, `2 px` aceptados) | — | — | — | **PASA** |
| Confirmación (`ConfirmacionReserva`) | 390 | 390 | 390 | 390 | 0 | 0 | **`283` / `616`** (`maxScrollLeft: 333`) | **Sí** (`final`: `[156.6, 336.6]` dentro de caja `[53.6, 336.4]`) | `12px` | **PASA** |
| 6b. `resumen` con "Torneos reservados" abierto | 390 | 390 | **392** (en v1: 709) | 390 | 0 | 2 (solo las muescas del voucher: `left: -2` y `right: 392`) | **`299` / `616`** (`maxScrollLeft: 317`) | **Sí** (`final`: `[164.6, 344.6]` dentro de caja `[45.6, 344.4]`) | `12px` | **PASA** |

*\*Nota sobre `canchas`: `.vista-canchas__marco` (`overflow-x: clip`) recorta por diseño las tarjetas laterales del `DepthCarousel` (`left: -151.6` y `right: 429.6`, documentado en `AGENTS.md`). El asistente y su contenido caben íntegros en `370 px`.*

### 1.2 Detalle de elementos fuera de `[-0.5, 390.5]` antes del recorte de `.vista-canchas__marco`

- **Pasos `formato` (8 y 16), `fechas`, `llaves` (Aleatorio y Manual), `datos` y `confirmacion`:** `0` elementos fuera de `[0, 390]`. En `llaves` Manual, `div.asignacion-manual__grid` ahora arma **1 sola columna** de `320 px` de ancho (en v1 armaba 2 columnas porque el contenedor se estiraba a `646 px`).
- **Pasos `resumen` y `resumen-guardados`:** únicamente las 2 muescas decorativas del voucher (`2 px` a cada lado):

| # | Selector | `left` | `right` | `width` | Texto |
|---:|---|---:|---:|---:|---|
| 1 | `span.voucher-reserva__muesca.voucher-reserva__muesca--izq` | -2.0 | 22.0 | 24.0 | `` |
| 2 | `span.voucher-reserva__muesca.voucher-reserva__muesca--der` | 368.0 | 392.0 | 24.0 | `` |

### 1.3 Verificación de bloques por paso (S7)

| Paso | Encabezados / leyendas encontrados en `.asistente-torneo__paso-contenido` | `Cantidad de equipos` | `Emparejamiento de 1.ª ronda` | `Capacidad y tiempo estimado` | `Programación por fases` | `Tus datos` | `Torneos reservados` | Cumple S7 |
|---|---|---|---|---|---|---|---|---|
| 1. `canchas` | `"Cancha 1"`, `"Cancha 2"`, `"Cancha 3"`, `"Canchas seleccionadas"` | No | No | No | No | No | No | **Sí** |
| 2. `formato` (8 y 16) | `"Formato del torneo"`, `"Cantidad de equipos (Eliminación directa)"`, `"Duración por partido"` (+ nota de turno y callout `"Desempate (Penales)..."`) | **Sí** | **No** | **No** | **No** | **No** | **No** | **Sí** |
| 3. `fechas` | `"Programación por fases (días y horarios)"`, `"Fase 1: Cuartos de final"`, `"Fase 2: Semifinal"`, `"Fase 3: Final"`, `"Capacidad y tiempo estimado"` | **No** | **No** | **Sí** | **Sí** | **No** | **No** | **Sí** |
| 4. `llaves` (Aleatorio y Manual) | `"Emparejamiento"`, `"Emparejamiento de 1.ª ronda"`, `"Llaves y cronograma del torneo"`, `"Cuartos de final"`, `"Semifinal"`, `"Final"` | **No** | **Sí** | **No** | **No** | **No** | **No** | **Sí** |
| 5. `datos` | `"Tus datos"`, `"Nombre"`, `"Teléfono (opcional)"` | **No** | **No** | **No** | **No** | **Sí** | **No** | **Sí** |
| 6. `resumen` (con torneo guardado) | `"Tu reserva"`, `"Torneos reservados (1)"`, `"Cuartos de final"`, `"Semifinal"`, `"Final"` | **No** | **No** | **No** | **No** | **No** | **Sí** | **Sí** |

---

## 2. Tableta 960×800 (corte intermedio entre 900 px y 64em)

Configuración: `width: 960`, `height: 800`, `deviceScaleFactor: 1`, `mobile: true`, `touch: true`.
- `window.matchMedia('(max-width: 63.9375em)').matches === true` (el asistente por pasos sigue activo porque `960 <= 1023`).
- `window.innerWidth < 900 === false` (`useEsMovil(900)` en `Bracket.jsx`), por lo que el bracket renderiza `.bracket-torneo__canvas-scroll` con `layoutSimetrico` (`5` columnas: `1102 px` normal, `1052 px` compacto) en lugar de `.bracket-torneo__movil`.

### 2.1 Tabla de mediciones en 960×800

| Paso / variante | `doc.scrollWidth` | `body.scrollWidth` | `marco.scrollWidth` | `innerWidth` | `.bracket-torneo__canvas-scroll` (`clientWidth` / `scrollWidth`) | `font-size` mín. partido | ¿Cumple S7? | Estado |
|---|---:|---:|---:|---:|---:|---:|---|---|
| 4a. `llaves` (Aleatorio) | 960 (recortado) | 960 (recortado) | **1167** (+207 px) | 960 | **`1102` / `1102`** (`maxScrollLeft: 0`, sin scroll propio) | `12px` | Sí (solo `Emparejamiento` + `SeccionLlaves`) | **FALLA** |
| 4b. `llaves` (Manual) | 960 (recortado) | 960 (recortado) | **1167** (+207 px) | 960 | **`1102` / `1102`** (`maxScrollLeft: 0`, sin scroll propio) | `12px` | Sí (solo `Emparejamiento` + `SeccionLlaves`) | **FALLA** |
| 6b. `resumen` con "Torneos reservados" abierto | 960 (recortado) | 960 (recortado) | **1150** (+190 px) | 960 | **`1052` / `1052`** (`maxScrollLeft: 0`, sin scroll propio) | `12px` | Sí (`Tu reserva` + `Torneos reservados (1)`) | **FALLA** |

### 2.2 Elementos desbordados en 960×800 (antes del recorte de `.vista-canchas__marco`)

#### En `960-llaves-aleatorio` (y análogo en `960-llaves-manual`):

| # | Selector | `left` | `right` | `width` | Texto (máx. 60 car.) |
|---:|---|---:|---:|---:|---|
| 1 | `div.asistente-torneo` | 15.0 | 1167.0 | 1152.0 | `LlavesPaso 4 de 6CanchasFormatoFechas por faseLlavesTus dato` |
| 2 | `div.asistente-torneo__cabecera` | 15.0 | 1167.0 | 1152.0 | `LlavesPaso 4 de 6` |
| 3 | `span.asistente-torneo__badge-paso` | 1076.6 | 1167.0 | 90.4 | `Paso 4 de 6` |
| 4 | `ol.indicador-pasos` | 15.0 | 1167.0 | 1152.0 | `CanchasFormatoFechas por faseLlavesTus datosResumen` |
| 5 | `div.asistente-torneo__paso-contenido` | 15.0 | 1167.0 | 1152.0 | `EmparejamientoEmparejamiento de 1.ª rondaAleatorioManualVolv` |
| 6 | `div` | 15.0 | 1167.0 | 1152.0 | `EmparejamientoEmparejamiento de 1.ª rondaAleatorioManualVolv` |
| 7 | `div.formulario-reserva` | 15.0 | 1167.0 | 1152.0 | `EmparejamientoEmparejamiento de 1.ª rondaAleatorioManualVolv` |
| 8 | `fieldset.formulario-reserva__campo` | 15.0 | 1167.0 | 1152.0 | `EmparejamientoEmparejamiento de 1.ª rondaAleatorioManualVolv` |
| 9 | `legend` | 40.0 | 1142.0 | 1102.0 | `Emparejamiento` |
| 10 | `div.formulario-reserva__seccion-torneo` | 40.0 | 1142.0 | 1102.0 | `Emparejamiento de 1.ª rondaAleatorioManualVolver a sortear l` |
| 11 | `span.formulario-reserva__subtitulo` | 40.0 | 1142.0 | 1102.0 | `Emparejamiento de 1.ª ronda` |
| 12 | `div.formulario-reserva__emparejamiento-controles` | 40.0 | 1142.0 | 1102.0 | `AleatorioManualVolver a sortear llaves` |
| 13 | `section.seccion-llaves` | 15.0 | 1167.0 | 1152.0 | `Llaves y cronograma del torneoCuartos de finalmié 11 nov, 10` |
| 14 | `div.seccion-llaves__cabecera` | 40.0 | 1142.0 | 1102.0 | `Llaves y cronograma del torneo` |
| 15 | `h2.seccion-llaves__titulo` | 40.0 | 1142.0 | 1102.0 | `Llaves y cronograma del torneo` |

#### En `960-resumen-guardados`:

| # | Selector | `left` | `right` | `width` | Texto (máx. 60 car.) |
|---:|---|---:|---:|---:|---|
| 1 | `div.asistente-torneo` | 15.0 | 1138.2 | 1123.2 | `ResumenPaso 6 de 6CanchasFormatoFechas por faseLlavesTus dat` |
| 2 | `div.asistente-torneo__cabecera` | 15.0 | 1138.2 | 1123.2 | `ResumenPaso 6 de 6` |
| 3 | `span.asistente-torneo__badge-paso` | 1048.0 | 1138.2 | 90.2 | `Paso 6 de 6` |
| 4 | `ol.indicador-pasos` | 15.0 | 1138.2 | 1123.2 | `CanchasFormatoFechas por faseLlavesTus datosResumen` |
| 5 | `div.asistente-torneo__paso-contenido` | 15.0 | 1138.2 | 1123.2 | `Tu reservaTorneoCuartos de final: mié 11 nov · 10:00 a 12:00` |
| 6 | `div` | 15.0 | 1138.2 | 1123.2 | `Tu reservaTorneoCuartos de final: mié 11 nov · 10:00 a 12:00` |
| 7 | `aside.voucher-reserva` | 15.0 | 1138.2 | 1123.2 | `Tu reservaTorneoCuartos de final: mié 11 nov · 10:00 a 12:00` |
| 8 | `div.voucher-reserva__superior` | 16.0 | 1137.2 | 1121.2 | `Tu reservaTorneoCuartos de final: mié 11 nov · 10:00 a 12:00` |
| 9 | `div.voucher-reserva__cabecera` | 40.0 | 1113.2 | 1073.2 | `Tu reservaTorneo` |
| 10 | `span.voucher-reserva__tipo` | 1052.0 | 1113.2 | 61.2 | `Torneo` |
| 11 | `div.voucher-reserva__meta` | 40.0 | 1113.2 | 1073.2 | `Cuartos de final: mié 11 nov · 10:00 a 12:00 (2 canchas)Semi` |
| 12 | `div.voucher-reserva__jornadas` | 40.0 | 1113.2 | 1073.2 | `Cuartos de final: mié 11 nov · 10:00 a 12:00 (2 canchas)Semi` |
| 13 | `div.voucher-reserva__fila.voucher-reserva__fila--fase` | 40.0 | 1113.2 | 1073.2 | `Cuartos de final: mié 11 nov · 10:00 a 12:00 (2 canchas)` |
| 14 | `div.voucher-reserva__fila.voucher-reserva__fila--fase` | 40.0 | 1113.2 | 1073.2 | `Semifinal: mié 11 nov · 12:00 a 13:00 (2 canchas)` |
| 15 | `div.voucher-reserva__fila.voucher-reserva__fila--fase` | 40.0 | 1113.2 | 1073.2 | `Final: mié 11 nov · 14:00 a 15:00 (1 cancha)` |

### 2.3 Diagnóstico del desborde en 960×800

- **Elemento causante:** `div.bracket-torneo__canvas-scroll` (que envuelve a `div.bracket-torneo__simetrico` con `style="width: 1102px"` en `llaves` y `style="width: 1052px"` en `resumen-guardados`).
- **Por qué ocurre:** En `Bracket.jsx` (`useEsMovil(900)`), el bracket cambia de `.bracket-torneo__movil` a `.bracket-torneo__canvas-scroll` a los `900 px`, mientras que el asistente móvil (`useAsistenteTorneo.js`) permanece activo hasta `63.9375em` (`1023 px`). En el commit `2eafffa` (`src/components/reservas/torneo/Bracket.css:372-381`), bajo `@media screen and (max-width: 63.9375em)` se agregó `contain: inline-size;` a `.bracket-torneo__movil`, pero **no** a `.bracket-torneo__canvas-scroll`. Como resultado, entre `900 px` y `1023 px`, `.bracket-torneo__canvas-scroll` propaga el `min-content` de su hijo (`1102 px` / `1052 px`) hacia arriba hasta `.asistente-torneo` (que está dentro de `.vista-canchas__reserva` con `grid-template-columns: 1fr` sin `min-width: 0`), ensanchando `.asistente-torneo` a `1152 px` en `llaves` (`marco.scrollWidth = 1167 px`) y a `1123.2 px` en `resumen-guardados` (`marco.scrollWidth = 1150 px`).
- **Solución puntual en `Bracket.css`:** aplicar `contain: inline-size;` tanto a `.bracket-torneo__movil` como a `.bracket-torneo__canvas-scroll` dentro del bloque `@media screen and (max-width: 63.9375em)`.

---

## 3. Escritorio 1440×900 (S2, comparación píxel por píxel con v1)

Se repitieron las 8 capturas de viewport (`1440×900`, `mobile: false`, `DPR: 1`, `1.296.000` píxeles por captura) con el mismo estado y pasos de `v1`, y se decodificaron ambos WebP en un `<canvas>` de Chrome para compararlos píxel por píxel:

| Par comparado | Total píxeles | Píxeles con `ΔRGB > 0` | `%` píxeles distintos (`Δ > 0`) | Píxeles con `ΔRGB > 4` | `%` con `Δ > 4` | Imagen de diferencias en `revision/v2/` | Explicación de la región cambiada |
|---|---:|---:|---:|---:|---:|---|---|
| `1440-torneo-0` | 1.296.000 | 166.383 | **12,8382 %** | 27.511 | 2,1228 % | `diff-1440-torneo-0.webp` | **Animación del carrusel (`DepthCarousel`):** la foto activa (`Cancha 2`) ejecuta la animación CSS continua `@keyframes cancha-kenburns` (`scale`/`translate`), lo que varía los píxeles dentro del carrusel (`2,12 %` con `Δ > 4`) y desplaza en `±1..3` niveles de gris la tabla de cuantización global del WebP con pérdida (`quality: 82`) en los bordes de alto contraste del resto del viewport. |
| `1440-torneo-700` | 1.296.000 | 238.162 | **18,3767 %** | 50.167 | 3,8709 % | `diff-1440-torneo-700.webp` | **Animación del carrusel (`DepthCarousel`):** en `y = 700` la tarjeta activa del carrusel ocupa la mitad superior del viewport; su animación `@keyframes cancha-kenburns` (`3,87 %` con `Δ > 4`) y la cuantización WebP explican toda la diferencia. |
| `1440-torneo-1400` | 1.296.000 | **0** | **0,0000 %** | **0** | **0,0000 %** | *(no aplica: 0 %)* | **Idéntica bit a bit (`0` píxeles distintos).** En `y = 1400` el carrusel ya salió del viewport y se ven completos `FormularioReserva` (sin `seccion`), `CalendarioTorneo` y `VoucherReserva`. |
| `1440-torneo-2100` | 1.296.000 | **0** | **0,0000 %** | **0** | **0,0000 %** | *(no aplica: 0 %)* | **Idéntica bit a bit (`0` píxeles distintos).** En `y = 2100` se ven las fases de `CalendarioTorneo` y `VoucherReserva` sin ninguna variación. |
| `1440-cancha-0` | 1.296.000 | 146.811 | **11,3280 %** | 13.864 | 1,0698 % | `diff-1440-cancha-0.webp` | **Animación del carrusel (`DepthCarousel`):** únicamente la imagen animada con Ken Burns dentro de la tarjeta activa del carrusel (`1,07 %` con `Δ > 4`) y artefactos de compresión WebP (`Δ <= 4`). |
| `1440-cancha-700` | 1.296.000 | 225.978 | **17,4366 %** | 45.166 | 3,4850 % | `diff-1440-cancha-700.webp` | **Animación del carrusel (`DepthCarousel`):** tarjeta activa del carrusel en la mitad superior (`3,49 %` con `Δ > 4`) y cuantización WebP global (`Δ <= 4`). |
| `1440-cumpleanos-0` | 1.296.000 | 525.976 | **40,5846 %** | 102.980 | 7,9460 % | `diff-1440-cumpleanos-0.webp` | **Animación del carrusel (`DepthCarousel`):** la foto de arena/mar de `Voley Playa 1` en Ken Burns (`7,95 %` con `Δ > 4`) más la cuantización WebP sobre la foto de encabezado. |
| `1440-cumpleanos-700` | 1.296.000 | 305.774 | **23,5937 %** | 78.747 | 6,0762 % | `diff-1440-cumpleanos-700.webp` | **Animación del carrusel (`DepthCarousel`):** mitad inferior de la tarjeta activa de `Voley Playa 1` en Ken Burns (`6,08 %` con `Δ > 4`) y cuantización WebP global (`Δ <= 4`). |

---

## Lista de fallas encontradas

1. **Desborde horizontal en el corte intermedio de tableta (`960×800`, entre `900 px` y `63.9375em = 1023 px`):**
   - **Pasos afectados:** `llaves` (Aleatorio y Manual: `.vista-canchas__marco.scrollWidth = 1167 px` frente a `innerWidth = 960 px`) y `resumen` con "Torneos reservados" desplegado (`.vista-canchas__marco.scrollWidth = 1150 px` frente a `innerWidth = 960 px`).
   - **Causa:** `Bracket.jsx` usa `.bracket-torneo__canvas-scroll` cuando `window.innerWidth >= 900`, pero `Bracket.css` (`2eafffa`) solo aplicó `contain: inline-size;` a `.bracket-torneo__movil` bajo `@media screen and (max-width: 63.9375em)`.
   - **Corrección requerida:** cambiar el selector en `src/components/reservas/torneo/Bracket.css:378` de `.bracket-torneo__movil` a `.bracket-torneo__movil, .bracket-torneo__canvas-scroll` dentro de `@media screen and (max-width: 63.9375em)`.

---

## Recomprobación v3

Recomprobación sobre la corrección en `src/components/reservas/torneo/Bracket.css` (que agrega `.bracket-torneo__canvas-scroll` a `contain: inline-size` bajo `@media screen and (max-width: 63.9375em)`), con el mismo estado de `v2` (dos canchas de fútbol, mañana, horas por fase y `"Ana Gómez"` / `"3001234567"`).
- Carpeta temporal externa: `sportify-v3-894bea` (en la carpeta temporal del sistema).

### 1. Tabla de valores en `960×800` (`mobile: true`, DPR 1) y `390×844` (`mobile: true`, DPR 2)

| Viewport | Paso / variante | `doc.scrollWidth` | `body.scrollWidth` | `marco.scrollWidth` | `innerWidth` | Contenedor scroll del bracket | `clientWidth` / `scrollWidth` | Última columna entera con `scrollLeft = scrollWidth` | Estado |
|---|---|---:|---:|---:|---:|---|---:|---|---|
| **960×800** | 4a. `llaves` (Aleatorio) | 960 | 960 | **960** (en v2: 1167) | 960 | `.bracket-torneo__canvas-scroll` | **`880` / `1102`** (`maxScrollLeft: 222`) | **Sí** (`[730, 920]` dentro de caja `[40, 920]`) | **PASA** |
| **960×800** | 4b. `llaves` (Manual) | 960 | 960 | **960** (en v2: 1167) | 960 | `.bracket-torneo__canvas-scroll` | **`880` / `1102`** (`maxScrollLeft: 222`) | **Sí** (`[730, 920]` dentro de caja `[40, 920]`) | **PASA** |
| **960×800** | 6b. `resumen` con "Torneos reservados" abierto | 960 | 960 | **960** (en v2: 1150) | 960 | `.bracket-torneo__canvas-scroll` | **`859` / `1052`** (`maxScrollLeft: 193`) | **Sí** (`[729.6, 909.6]` dentro de caja `[50.6, 909.4]`) | **PASA** |
| **390×844** | 4a. `llaves` (Aleatorio) | 390 | 390 | **390** | 390 | `.bracket-torneo__movil` | **`320` / `646`** (`maxScrollLeft: 326`) | **Sí** (`[165, 355]` dentro de caja `[35, 355]`) | **PASA** |

### 2. Comparación píxel por píxel en `1440×900` contra `revision/v1/`

| Par comparado | Total píxeles | Píxeles distintos (`ΔRGB > 0`) | `%` diferencia | Estado |
|---|---:|---:|---:|---|
| `1440-torneo-1400` | 1.296.000 | **0** | **0,0000 %** | **PASA** |
| `1440-torneo-2100` | 1.296.000 | **0** | **0,0000 %** | **PASA** |

### Veredicto final de S8

- **Veredicto final de S8:** **PASA** (tanto en móvil `390×844` como en el corte intermedio de tableta `960×800`, y con `0 %` de diferencia en escritorio `1440×900`).

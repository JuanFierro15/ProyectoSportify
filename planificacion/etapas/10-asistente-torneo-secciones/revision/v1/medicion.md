# Medición v1 — Asistente de torneo en móvil (390×844) y base de escritorio (1440×900)

Verificación en modo solo lectura del estado **previo a B2** sobre `http://localhost:4173`.
- Emulación móvil: `390×844`, `deviceScaleFactor: 2`, `mobile: true`, `touch: true`.
- Comprobación de media query: `window.matchMedia('(max-width: 63.9375em)').matches === true`.

> **Nota clave sobre `scrollWidth` a nivel de documento:** `.vista-canchas__marco` (`VistaCanchas.css:167-174`) tiene `overflow-x: clip` con ancho de `390 px`. Por eso `document.documentElement.scrollWidth` y `document.body.scrollWidth` valen `390` en todos los pasos aunque el contenido interno del asistente se desborde y quede recortado a la derecha sin barra de scroll. En cada tabla se reportan tanto los valores de `documentElement`/`body` como `.vista-canchas__marco.scrollWidth` y los elementos que superan `innerWidth + 0.5` (`390.5 px`) o `left < -0.5` antes del recorte de `.vista-canchas__marco`.

---

## Resumen general por paso

| Paso / variante | Captura | `doc.scrollWidth` | `body.scrollWidth` | `innerWidth` | `.vista-canchas__marco.scrollWidth` | ¿Falla en `doc`/`body`? | ¿Desborde recortado por `.vista-canchas__marco`? | Estado real a 390 px |
|---|---|---:|---:|---:|---:|---|---|---|
| 1. `canchas` | `390-canchas.webp` | 390 | 390 | 390 | 476 | No | Solo laterales del carrusel (esperado) | **OK** |
| 2. `formato` (8 equipos) | `390-formato-8.webp` | 390 | 390 | 390 | 390 | No | No (0 elementos) | **OK** |
| 2. `formato` (16 equipos) | `390-formato-16.webp` | 390 | 390 | 390 | 390 | No | No (0 elementos) | **OK** |
| 3. `fechas` | `390-fechas.webp` | 390 | 390 | 390 | 390 | No | No (0 elementos) | **OK** |
| 4. `llaves` (Aleatorio) | `390-llaves-aleatorio.webp` | 390 | 390 | 390 | **706** | No (oculto por `clip`) | **Sí (`right: 706 px`)** | **FALLA** |
| 4. `llaves` (Manual) | `390-llaves-manual.webp` | 390 | 390 | 390 | **706** | No (oculto por `clip`) | **Sí (`right: 706 px`)** | **FALLA** |
| 5. `datos` | `390-datos.webp` | 390 | 390 | 390 | 390 | No | No (0 elementos) | **OK** |
| 6. `resumen` (sin confirmar) | `390-resumen.webp` | 390 | 390 | 390 | **392** | No (oculto por `clip`) | Muescas decorativas del voucher (`left: -2`, `right: 392`) | **Leve (2 px en muescas)** |
| Confirmación (`ConfirmacionReserva`) | `390-confirmacion.webp` | 390 | 390 | 390 | 390 | No | No (0 elementos) | **OK** |
| 6. `resumen` con "Torneos reservados" | `390-resumen-guardados.webp` | 390 | 390 | 390 | **709** | No (oculto por `clip`) | **Sí (`right: 697.2 px`)** | **FALLA** |

---

## Detalle por paso

### 1. Paso `canchas` (`390-canchas.webp`)

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` |
| `document.body.scrollWidth` | `390` |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | `476` (laterales del `DepthCarousel`, recortadas por diseño) |
| Elementos desbordados (con ancestro `.vista-canchas__marco`) | `0` |

Elementos fuera de `[-0.5, 390.5]` ignorando el `overflow-x: clip` de `.vista-canchas__marco` (todos pertenecen a las tarjetas laterales inactivas del `DepthCarousel`, cuyo recorte por `.vista-canchas__marco` es el comportamiento documentado en `AGENTS.md`):

| # | Selector | `left` | `right` | `width` | Texto (máx. 60 car.) |
|---:|---|---:|---:|---:|---|
| 1 | `div.depth-carousel__card` | -151.6 | 209.4 | 361.0 | `FútbolCancha 1` |
| 2 | `img.depth-carousel__img` | -151.6 | 209.4 | 361.0 | `` |
| 3 | `span.depth-carousel__tint` | -151.6 | 209.4 | 361.0 | `` |
| 4 | `div.depth-carousel__overlay` | -151.6 | 209.4 | 361.0 | `FútbolCancha 1` |
| 5 | `div.tarjeta-cancha.tarjeta-cancha--marcada` | -151.6 | 209.4 | 361.0 | `FútbolCancha 1` |
| 6 | `div.tarjeta-cancha__cabecera` | -129.8 | 187.6 | 317.4 | `Fútbol` |
| 7 | `span.tarjeta-cancha__deporte` | -129.8 | -52.6 | 77.2 | `Fútbol` |
| 8 | `div.tarjeta-cancha__cuerpo` | -151.6 | 209.4 | 361.0 | `Cancha 1` |
| 9 | `h3.tarjeta-cancha__nombre` | -129.8 | 187.6 | 317.4 | `Cancha 1` |
| 10 | `div.depth-carousel__card` | 194.1 | 429.6 | 235.6 | `FútbolCancha 3` |
| 11 | `img.depth-carousel__img` | 194.1 | 429.6 | 235.6 | `` |
| 12 | `span.depth-carousel__tint` | 194.1 | 429.6 | 235.6 | `` |
| 13 | `div.depth-carousel__overlay` | 194.1 | 429.6 | 235.6 | `FútbolCancha 3` |
| 14 | `div.tarjeta-cancha` | 194.1 | 429.6 | 235.6 | `FútbolCancha 3` |
| 15 | `div.tarjeta-cancha__cabecera` | 209.3 | 416.3 | 207.0 | `Fútbol` |

---

### 2a. Paso `formato` — 8 equipos (`390-formato-8.webp`)

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` |
| `document.body.scrollWidth` | `390` |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | `390` |
| Elementos desbordados | `0` |

---

### 2b. Paso `formato` — 16 equipos (`390-formato-16.webp`)

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` |
| `document.body.scrollWidth` | `390` |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | `390` |
| Elementos desbordados | `0` |

---

### 3. Paso `fechas` (`390-fechas.webp`)

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` |
| `document.body.scrollWidth` | `390` |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | `390` |
| Elementos desbordados | `0` |

---

### 4a. Paso `llaves` — Aleatorio (`390-llaves-aleatorio.webp`) — **FALLA**

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` (recortado por `.vista-canchas__marco`) |
| `document.body.scrollWidth` | `390` (recortado por `.vista-canchas__marco`) |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | **`706`** (desborda `316 px`) |
| Contenedor externo del bracket (`div.bracket-torneo`) | `clientWidth: 646`, `scrollWidth: 646`, `overflow-x: visible` |
| Contenedor scroll del bracket (`div.bracket-torneo__movil`) | `clientWidth: 646`, `scrollWidth: 646`, `overflow-x: auto` (no hace scroll porque se estiró a `646 px`) |
| `font-size` más chico en tarjeta de partido | `12px` (`span.bracket-torneo__partido-meta.bracket-torneo__partido-meta--izq`) |

Elementos desbordados dentro de `.vista-canchas__marco` (máx. 15):

| # | Selector | `left` | `right` | `width` | Texto (máx. 60 car.) |
|---:|---|---:|---:|---:|---|
| 1 | `div.asistente-torneo` | 10.0 | 706.0 | 696.0 | `LlavesPaso 4 de 6CanchasFormatoFechas por faseLlaves5Tus dat` |
| 2 | `div.asistente-torneo__cabecera` | 10.0 | 706.0 | 696.0 | `LlavesPaso 4 de 6` |
| 3 | `span.asistente-torneo__badge-paso` | 615.6 | 706.0 | 90.4 | `Paso 4 de 6` |
| 4 | `ol.indicador-pasos` | 10.0 | 706.0 | 696.0 | `CanchasFormatoFechas por faseLlaves5Tus datos6Resumen` |
| 5 | `li.indicador-pasos__paso.indicador-pasos__paso--completo.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 264.6 | 428.8 | 164.2 | `Fechas por fase` |
| 6 | `button.indicador-pasos__boton` | 265.6 | 427.8 | 162.2 | `Fechas por fase` |
| 7 | `span.indicador-pasos__etiqueta` | 314.8 | 412.7 | 97.8 | `Fechas por fase` |
| 8 | `li.indicador-pasos__paso.indicador-pasos__paso--completo.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 436.8 | 541.5 | 104.7 | `Llaves` |
| 9 | `button.indicador-pasos__boton` | 437.8 | 540.5 | 102.7 | `Llaves` |
| 10 | `span.indicador-pasos__icono` | 453.0 | 477.0 | 24.0 | `` |
| 11 | `svg.lucide.lucide-check` | 458.0 | 472.0 | 14.0 | `` |
| 12 | `path` | 460.4 | 469.7 | 9.3 | `` |
| 13 | `span.indicador-pasos__etiqueta` | 487.0 | 525.3 | 38.3 | `Llaves` |
| 14 | `li.indicador-pasos__paso.indicador-pasos__paso--incompleto.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 549.5 | 675.7 | 126.2 | `5Tus datos` |
| 15 | `button.indicador-pasos__boton` | 550.5 | 674.7 | 124.2 | `5Tus datos` |

---

### 4b. Paso `llaves` — Manual con `AsignacionManual` abierto (`390-llaves-manual.webp`) — **FALLA**

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` (recortado por `.vista-canchas__marco`) |
| `document.body.scrollWidth` | `390` (recortado por `.vista-canchas__marco`) |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | **`706`** (desborda `316 px`) |
| Contenedor externo del bracket (`div.bracket-torneo`) | `clientWidth: 646`, `scrollWidth: 646`, `overflow-x: visible` |
| Contenedor scroll del bracket (`div.bracket-torneo__movil`) | `clientWidth: 646`, `scrollWidth: 646`, `overflow-x: auto` (no hace scroll porque se estiró a `646 px`) |
| `font-size` más chico en tarjeta de partido | `12px` (`span.bracket-torneo__partido-meta.bracket-torneo__partido-meta--izq`) |

Elementos desbordados dentro de `.vista-canchas__marco` (máx. 15; además de la cabecera e indicador, `fieldset.formulario-reserva__campo`, `div.asignacion-manual__grid` —que arma 2 columnas al tener `646 px` de ancho— y `section.seccion-llaves` llegan hasta `right: 706.0`):

| # | Selector | `left` | `right` | `width` | Texto (máx. 60 car.) |
|---:|---|---:|---:|---:|---|
| 1 | `div.asistente-torneo` | 10.0 | 706.0 | 696.0 | `LlavesPaso 4 de 6CanchasFormatoFechas por faseLlaves5Tus dat` |
| 2 | `div.asistente-torneo__cabecera` | 10.0 | 706.0 | 696.0 | `LlavesPaso 4 de 6` |
| 3 | `span.asistente-torneo__badge-paso` | 615.6 | 706.0 | 90.4 | `Paso 4 de 6` |
| 4 | `ol.indicador-pasos` | 10.0 | 706.0 | 696.0 | `CanchasFormatoFechas por faseLlaves5Tus datos6Resumen` |
| 5 | `li.indicador-pasos__paso.indicador-pasos__paso--completo.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 264.6 | 428.8 | 164.2 | `Fechas por fase` |
| 6 | `button.indicador-pasos__boton` | 265.6 | 427.8 | 162.2 | `Fechas por fase` |
| 7 | `span.indicador-pasos__etiqueta` | 314.8 | 412.7 | 97.8 | `Fechas por fase` |
| 8 | `li.indicador-pasos__paso.indicador-pasos__paso--completo.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 436.8 | 541.5 | 104.7 | `Llaves` |
| 9 | `button.indicador-pasos__boton` | 437.8 | 540.5 | 102.7 | `Llaves` |
| 10 | `span.indicador-pasos__icono` | 453.0 | 477.0 | 24.0 | `` |
| 11 | `svg.lucide.lucide-check` | 458.0 | 472.0 | 14.0 | `` |
| 12 | `path` | 460.4 | 469.7 | 9.3 | `` |
| 13 | `span.indicador-pasos__etiqueta` | 487.0 | 525.3 | 38.3 | `Llaves` |
| 14 | `li.indicador-pasos__paso.indicador-pasos__paso--incompleto.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 549.5 | 675.7 | 126.2 | `5Tus datos` |
| 15 | `button.indicador-pasos__boton` | 550.5 | 674.7 | 124.2 | `5Tus datos` |

---

### 5. Paso `datos` (`390-datos.webp`)

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` |
| `document.body.scrollWidth` | `390` |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | `390` |
| Elementos desbordados | `0` |

---

### 6a. Paso `resumen` — sin confirmar (`390-resumen.webp`)

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` |
| `document.body.scrollWidth` | `390` |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | `392` (`2 px` por las muescas laterales del voucher) |
| Elementos desbordados (con ancestro `.vista-canchas__marco`) | `0` |

Elementos fuera de `[-0.5, 390.5]` dentro de `.vista-canchas__marco`:

| # | Selector | `left` | `right` | `width` | Texto (máx. 60 car.) |
|---:|---|---:|---:|---:|---|
| 1 | `span.voucher-reserva__muesca.voucher-reserva__muesca--izq` | -2.0 | 22.0 | 24.0 | `` |
| 2 | `span.voucher-reserva__muesca.voucher-reserva__muesca--der` | 368.0 | 392.0 | 24.0 | `` |

---

### Confirmación de reserva (`390-confirmacion.webp`)

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` |
| `document.body.scrollWidth` | `390` |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | `390` |
| Contenedor externo del bracket (`div.bracket-torneo.bracket-torneo--compacto`) | `clientWidth: 283`, `scrollWidth: 283`, `overflow-x: visible` |
| Contenedor scroll del bracket (`div.bracket-torneo__movil`) | `clientWidth: 283`, `scrollWidth: 616`, `overflow-x: auto` (desplaza horizontalmente dentro de su caja de `283 px`) |
| `font-size` más chico en tarjeta de partido | `12px` (`span.bracket-torneo__partido-meta.bracket-torneo__partido-meta--izq`) |
| Elementos desbordados | `0` |

---

### 6b. Paso `resumen` — con "Torneos reservados" desplegado (`390-resumen-guardados.webp`) — **FALLA**

| Métrica | Valor |
|---|---|
| `document.documentElement.scrollWidth` | `390` (recortado por `.vista-canchas__marco`) |
| `document.body.scrollWidth` | `390` (recortado por `.vista-canchas__marco`) |
| `window.innerWidth` | `390` |
| `.vista-canchas__marco.scrollWidth` | **`709`** (desborda `319 px`) |
| Contenedor externo del bracket (`div.bracket-torneo.bracket-torneo--compacto`) | `clientWidth: 616`, `scrollWidth: 616`, `overflow-x: visible` |
| Contenedor scroll del bracket (`div.bracket-torneo__movil`) | `clientWidth: 616`, `scrollWidth: 616`, `overflow-x: auto` (no hace scroll porque se estiró a `616 px`) |
| `font-size` más chico en tarjeta de partido | `12px` (`span.bracket-torneo__partido-meta.bracket-torneo__partido-meta--izq`) |

Elementos desbordados dentro de `.vista-canchas__marco` (máx. 15; `aside.voucher-reserva` y `details.formulario-reserva__torneos-guardados` también se estiran hasta `right: 697.2`):

| # | Selector | `left` | `right` | `width` | Texto (máx. 60 car.) |
|---:|---|---:|---:|---:|---|
| 1 | `div.asistente-torneo` | 10.0 | 697.2 | 687.2 | `ResumenPaso 6 de 6CanchasFormatoFechas por faseLlavesTus dat` |
| 2 | `div.asistente-torneo__cabecera` | 10.0 | 697.2 | 687.2 | `ResumenPaso 6 de 6` |
| 3 | `span.asistente-torneo__badge-paso` | 607.0 | 697.2 | 90.2 | `Paso 6 de 6` |
| 4 | `ol.indicador-pasos` | 10.0 | 697.2 | 687.2 | `CanchasFormatoFechas por faseLlavesTus datosResumen` |
| 5 | `li.indicador-pasos__paso.indicador-pasos__paso--completo.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 264.6 | 428.8 | 164.2 | `Fechas por fase` |
| 6 | `button.indicador-pasos__boton` | 265.6 | 427.8 | 162.2 | `Fechas por fase` |
| 7 | `span.indicador-pasos__etiqueta` | 314.8 | 412.7 | 97.8 | `Fechas por fase` |
| 8 | `li.indicador-pasos__paso.indicador-pasos__paso--completo.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 436.8 | 541.5 | 104.7 | `Llaves` |
| 9 | `button.indicador-pasos__boton` | 437.8 | 540.5 | 102.7 | `Llaves` |
| 10 | `span.indicador-pasos__icono` | 453.0 | 477.0 | 24.0 | `` |
| 11 | `svg.lucide.lucide-check` | 458.0 | 472.0 | 14.0 | `` |
| 12 | `path` | 460.4 | 469.7 | 9.3 | `` |
| 13 | `span.indicador-pasos__etiqueta` | 487.0 | 525.3 | 38.3 | `Llaves` |
| 14 | `li.indicador-pasos__paso.indicador-pasos__paso--completo.indicador-pasos__paso--interactivo.indicador-pasos__paso--alcanzable` | 549.5 | 675.7 | 126.2 | `Tus datos` |
| 15 | `button.indicador-pasos__boton` | 550.5 | 674.7 | 124.2 | `Tus datos` |

---

## Diagnóstico: qué pasos fallan y por qué elemento

1. **Paso 4 (`llaves`, tanto en Aleatorio como en Manual) — FALLA (`marco.scrollWidth = 706 px` vs `390 px`):**
   - **Elemento causante:** `div.bracket-torneo__simetrico` (`style="width: 646px"`) dentro de `div.bracket-torneo__movil` → `div.bracket-torneo` → `section.seccion-llaves` → `div[data-testid="paso-llaves"]` → `div.asistente-torneo`.
   - **Por qué ocurre:** `.vista-canchas__reserva` (`VistaCanchas.css:478-480`) es un CSS Grid con `grid-template-columns: 1fr` (cuyo mínimo automático es `min-content`) y `.vista-canchas__reserva .asistente-torneo` no tiene `min-width: 0`. Aunque `.bracket-torneo__movil` tiene `overflow-x: auto`, en CSS un contenedor con `overflow-x: auto` sigue propagando el `min-content` de su hijo (`646 px`) hacia arriba salvo que tenga `contain: inline-size` (o `width: 0; min-width: 100%`). Eso hace que `div.asistente-torneo` se ensanche a `696 px` (`646 px` + `48 px` de padding de `.seccion-llaves` + `2 px` de borde), que `div.bracket-torneo__movil` quede con `clientWidth = 646` (sin scroll propio), que en modo Manual `div.asignacion-manual__grid` renderice 2 columnas de `280 px` en vez de 1, y que `.vista-canchas__marco` (`overflow-x: clip`) recorte todo a partir de `390 px`.
   - **Por qué en `ConfirmacionReserva` sí funcionó (`clientWidth: 283`, `scrollWidth: 616`):** porque `.vista-canchas__confirmacion` (`VistaCanchas.css:545`) sí tiene `min-width: 0` y no está dentro de `.asistente-torneo`.
2. **Paso 6 (`resumen` cuando existe y se abre `details.formulario-reserva__torneos-guardados`) — FALLA (`marco.scrollWidth = 709 px` vs `390 px`):**
   - **Elemento causante:** `div.bracket-torneo__simetrico` (`style="width: 616px"`) del `<Bracket compacto />` dentro de `.formulario-reserva__torneo-guardado` → `details.formulario-reserva__torneos-guardados`.
   - **Por qué ocurre:** por el mismo mecanismo anterior, el `min-content` de `616 px` del bracket compacto empuja el ancho de `details.formulario-reserva__torneos-guardados`, `aside.voucher-reserva` y `div.asistente-torneo` hasta `687.2 px` (`right: 697.2 px`), quedando cortado a la derecha por `.vista-canchas__marco`.
   - **Cómo resolver ambos en B2 tocando únicamente los CSS permitidos del frente B (`Bracket.css` / `SeccionLlaves.css` / `FormularioReserva.css`):** aplicar `contain: inline-size;` (o `width: 0; min-width: 100%;`) en `.bracket-torneo` / `.bracket-torneo__movil` bajo `(max-width: 63.9375em)`, y `min-width: 0; max-width: 100%;` en `.seccion-llaves`, `.formulario-reserva` y `.formulario-reserva__torneos-guardados`. Así el `min-content` propagado al grid padre pasa a `0`, `.asistente-torneo` se mantiene en `370 px` (`left: 10`, `right: 380`) y `.bracket-torneo__movil` hace scroll horizontal propio dentro de su contenedor.

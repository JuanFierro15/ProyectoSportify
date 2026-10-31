# Etapa 7 — Auditoría de usabilidad y mejoras del sitio web (`usability-improve`)

> **Estado**: Informe completo de la auditoría de usabilidad (`impeccable`) listo para ejecutarse sobre la rama `usability-improve` una vez se haga merge del PR #2 (`torneo-immplementation`).
> **Rama destino**: `usability-improve`
> **Carpeta en `planificacion/`**: `planificacion/etapas/7-auditoria-usabilidad/`
> **Auditoría realizada con**: `impeccable` (`audit.md` + `critique.md` + `impeccable detect --json src`) + `modern-web-guidance` (`forms`)

---

## 1. Resumen Ejecutivo de la Auditoría (`impeccable`)

### 1.1 Audit Health Score (Técnico — `impeccable/reference/audit.md`)

| # | Dimensión | Puntaje | Hallazgo Clave |
|---|-----------|---------|----------------|
| 1 | **Accessibility (A11y)** | **2.0 / 4** | Contraste insuficiente con colores de acento claros (`#5bd67d`, `#3fa9f5`, `#f6a94b`) sobre fondos claros (`1.6:1–2.4:1` vs `4.5:1` WCAG AA); `:focus { outline: none }` sin `:focus-visible`; `role="tablist"` en dots sin `tabpanel`; kill global `0.001ms !important` en `prefers-reduced-motion`. |
| 2 | **Performance** | **3.0 / 4** | Uso permanente de `will-change` en reposo (`.ag-panel`, `.depth-carousel__card`) y falta de `poster` en los 3 `<video>` de `DeporteHero`. |
| 3 | **Theming** | **2.5 / 4** | Sistema `--accent` dinámico por deporte bien planteado, pero persisten colores hardcodeados (`#1779ba`, `#f59e0b`) en inputs enfocados, links de acción y alertas. |
| 4 | **Responsive Design** | **2.0 / 4** | Múltiples touch targets `< 44×44px` (dots `7×7px`, quitar chip `18×18px`, cerrar visor `38×38px`, cabecera chatbot `36×36px`); `DepthCarousel` intercepta `wheel` vertical en desktop impidiendo scrollear hacia el formulario; tiras horizontales sin `scroll-snap`. |
| 5 | **Implementation Integrity** | **3.0 / 4** | `impeccable detect --json src` reporta 1 antipatrón (`side-tab`: `border-left: 4px solid #f59e0b` en `Bracket.css:12`). Además, inconsistencia de capacidades entre deportes (`detalleEnTarjeta` solo en fútbol) y entre flujo web vs. chatbot (consulta/cancelación de reservas solo accesible por chat). |
| **Total** | | **12.5 / 20** | **Acceptable (Requiere mejoras en A11y, Touch Targets y Prevención de Errores)** |

### 1.2 Design Health Score (Heurísticas de Nielsen — `impeccable/reference/critique.md`)

| # | Heurística de Nielsen | Puntaje | Problema Principal Detectado |
|---|-----------------------|---------|------------------------------|
| 1 | **Visibilidad del estado del sistema** | **2.5 / 4** | En `DeporteHero` (3 videos con scroll-pin) no hay pista visual de progreso/scroll; en Vóley y Pádel se ocultan características en el carrusel; falta badge de resumen de horas seleccionadas en vivo junto a la leyenda de horario. |
| 2 | **Relación entre el sistema y el mundo real** | **3.0 / 4** | Los botones de hora muestran solo la hora de inicio (`08:00`, `09:00`) sin aclarar que elegir `08:00` y `09:00` cubre de `08:00 a 10:00 (2 h)`. |
| 3 | **Control y libertad del usuario** | **2.0 / 4** | El botón **"Cancelar"** en `VoucherReserva` expulsa al usuario al inicio perdiendo todo su progreso; falta botón **"Limpiar selección"**; no hay vista/modal en la web para consultar o cancelar una reserva sin usar el Chatbot. |
| 4 | **Consistencia y estándares** | **2.5 / 4** | El teléfono es **opcional** en `FormularioReserva`, pero `buscarReservasCancelables` (`cancelacion.js:187`) exige teléfono obligatorio (`if (!r.telefono) continue`), haciendo imposible cancelar reservas hechas sin teléfono. Además, `Navbar` y `Footer` dicen `Reservas Deportivas` mientras que el título, QR y Chatbot dicen `Sportify`. |
| 5 | **Prevención de errores** | **1.5 / 4** | Múltiples flujos permiten cometer errores y muestran `callout alert` después: (a) En Torneo permite elegir >3 canchas o mezclar deportes; (b) En `AsignacionManual` permite elegir un equipo `" (en uso)"`; (c) En `SelectorDia` permite clicar días `"completo"` (0 libres) cuando ya hay cancha seleccionada; (d) En Cumpleaños `invitados` no tiene tope máximo. |
| 6 | **Reconocimiento antes que recuerdo** | **2.5 / 4** | En `ConfirmacionReserva` no hay botón para **copiar el código** (`SPF-XXXXXX`) al portapapeles ni se muestran las políticas de abono (50% en 2h) y cancelación (6h antes) de `negocio.json`. |
| 7 | **Flexibilidad y eficiencia de uso** | **2.0 / 4** | En `CalendarioTorneo`, cuando una fase requiere `>= 2 h` mínimas, tocar una hora solo selecciona 1 h y dispara la alerta de déficit en vez de facilitar o sugerir la selección del bloque requerido. |
| 8 | **Diseño estético y minimalista** | **3.5 / 4** | Buena jerarquía general; solo el antipatrón `side-tab` en `.alerta-tiempo` (`Bracket.css:12`) desentona con el lenguaje visual de tarjetas. |
| 9 | **Reconocer, diagnosticar y recuperarse de errores** | **2.5 / 4** | En `AlertaTiempo`, las sugerencias para resolver el déficit de tiempo son texto estático (`<li>`) en vez de incluir acciones rápidas de corrección con 1 clic. |
| 10 | **Ayuda y documentación** | **2.5 / 4** | Las reglas de negocio críticas (`negocio.json`: abono del 50%, plazo de 2h, cancelación con 6h de anticipación) solo existen en el prompt del Chatbot y no se informan en la confirmación web. |
| **Total** | | **24.5 / 40** | **Acceptable (61% — Base sólida, requiere endurecer prevención de errores, accesibilidad y flujos móviles)** |

---

## 2. Catálogo Completo de Hallazgos de la Auditoría (`P0` → `P3`)

### 🔴 Severidad P0 — Bloqueantes y Prevención Crítica de Errores

#### `[P0-01]` Inconsistencia de Teléfono Opcional vs. Cancelación Imposible y falta de acceso web a "Mis Reservas"
- **Archivos**: `src/components/reservas/FormularioReserva.jsx`, `src/lib/cancelacion.js`, `src/components/layout/Navbar.jsx`.
- **Problema**: El formulario marca `"Teléfono (opcional)"`, pero `buscarReservasCancelables()` descarta cualquier reserva sin teléfono (`if (!r.telefono) continue;`). Además, fuera del Chatbot no existe ninguna opción en la UI para consultar una reserva por su código `SPF-XXXXXX` o teléfono, volver a ver su QR o cancelarla.
- **Solución**:
  1. Permitir buscar y cancelar reservas también por **código de reserva (`SPF-XXXXXX`)** en `src/lib/cancelacion.js` y advertir claramente su uso para cancelaciones.
  2. Añadir un modal/panel **"Mis reservas"** accesible desde `Navbar.jsx` que permita consultar reservas guardadas en `ReservasContext` (por código `SPF-XXXXXX` o nombre + teléfono), ver su QR/detalles y cancelarlas si faltan más de 6 horas.

#### `[P0-02]` `DepthCarousel` bloquea el scroll vertical de la página en escritorio
- **Archivos**: `src/components/reactbits/DepthCarousel.jsx`.
- **Problema**: El listener `wheel` con `{ passive: false }` hace `e.preventDefault()` siempre que el cursor está sobre el carrusel (que ocupa hasta `78vh`), impidiendo bajar con la rueda del ratón hacia `FormularioReserva`.
- **Solución**: En `DepthCarousel.jsx`, solo interceptar `wheel` cuando el desplazamiento sea horizontal (`Math.abs(e.deltaX) > Math.abs(e.deltaY)`) o cuando se pulse `e.shiftKey`, dejando libre el scroll vertical nativo de la página.

#### `[P0-03]` Falta de prevención proactiva al elegir canchas en modo Torneo (>3 canchas o distintos deportes)
- **Archivos**: `src/components/canchas/VistaCanchas.jsx`, `src/components/reservas/useReserva.js`, `src/components/reservas/TarjetaCanchaCarrusel.jsx`.
- **Problema**: Permite mezclar canchas de distintos deportes al cambiar de pestaña en modo Torneo o superar el tope de `MAX_CANCHAS_TORNEO` (3), mostrando un `callout alert` recién abajo.
- **Solución**: En modo Torneo, cuando `canchaIds.length >= MAX_CANCHAS_TORNEO`, deshabilitar el botón de agregar nuevas canchas no seleccionadas indicando `"Máx. 3 canchas"`.

#### `[P0-04]` Falta de prevención proactiva de equipos duplicados en `AsignacionManual`
- **Archivos**: `src/components/reservas/torneo/AsignacionManual.jsx`, `src/components/reservas/useReserva.js`.
- **Problema**: Permite seleccionar un equipo marcado como `" (en uso)"` y genera el error `"Hay equipos repetidos en los cruces"`.
- **Solución**: En `cambiarCruceManual` (`useReserva.js`), si el usuario elige un equipo `num` que ya estaba en otra posición `idxPrevio` (y la posición actual ya tenía un equipo válido), realizar un **intercambio automático (*swap*)** entre ambas posiciones para evitar caer en estados de equipos duplicados.

---

### 🟠 Severidad P1 — Accesibilidad (WCAG AA), Touch Targets y Recuperación de Errores

#### `[P1-01]` Contraste insuficiente (WCAG 1.4.3 AA) de `--accent` sobre fondos blancos/claros
- **Archivos**: `src/lib/canchas.js`, `src/components/canchas/VistaCanchas.css`, `src/components/reservas/torneo/Bracket.css`, `src/components/reservas/FormularioReserva.css`.
- **Problema**: Los colores `#f6a94b` (Vóley), `#3fa9f5` (Pádel) y `#5bd67d` (Fútbol) sobre `--accent-soft` o `#ffffff` dan ratios de `1.6:1` a `2.4:1` (mínimo exigido: `4.5:1`).
- **Solución**: Definir `--accent-text: color-mix(in srgb, ${color} 50%, #0f172a)` en `estiloAcento()` (`src/lib/canchas.js`) y aplicarlo al texto de `.vista-canchas__badge`, `.bracket-torneo__badge`, `.bracket-torneo__ronda-fecha`, `.calendario-torneo__badge` y botones `.hollow`.

#### `[P1-02]` Touch targets menores a 44×44px en controles móviles
- **Archivos**: `src/components/reactbits/DepthCarousel.css`, `src/components/reservas/CanchasElegidas.css`, `src/components/canchas/VistaCanchas.css`, `src/components/chatbot/Chatbot.css`.
- **Problema**: Dots de `7×7px`, botón quitar cancha de `18×18px`, cerrar visor de `38×38px` y cerrar chatbot de `36×36px`.
- **Solución**: Ampliar el área clicable de los dots con `min-width: 28px; min-height: 28px` (usando `::after` para el punto visual de `8px`), subir `.canchas-elegidas__quitar` a `28×28px` dentro de chips de `min-height: 38px`, y subir `.vista-canchas__visor-cerrar`, `.depth-carousel__arrow` y `.chatbot__cabecera-boton` a `44×44px`.

#### `[P1-03]` Eliminación de `outline` sin `:focus-visible`
- **Archivos**: `src/components/reservas/FormularioReserva.css`, `src/components/shared/SelectorDia.css`, `src/components/reservas/SelectorModo.css`, `src/components/reactbits/DepthCarousel.css`.
- **Solución**: Añadir `:focus-visible { outline: 2px solid var(--accent, #1779ba); outline-offset: 2px; }` en todos los controles interactivos.

#### `[P1-04]` Días `"completo"` (0 libres) clicables en `SelectorDia`
- **Archivos**: `src/components/shared/SelectorDia.jsx`.
- **Solución**: Deshabilitar en `CalendarioTorneo` y `SelectorDia` los días con `0 libres` cuando ya hay canchas seleccionadas (`lleno && !sel`) y añadir `aria-label` descriptivo en `SelectorDia`.

#### `[P1-05]` Regla agresiva `0.001ms !important` en `prefers-reduced-motion` de `VistaCanchas.css`
- **Archivos**: `src/components/canchas/VistaCanchas.css`.
- **Solución**: Reemplazar el reset universal `.vista-canchas * { transition-duration: 0.001ms !important }` por la desactivación exclusiva de transformaciones espaciales (`transform: none !important`), conservando el feedback de color/opacidad como exige `impeccable/reference/audit.md`.

#### `[P1-06]` y `[P1-07]` Claridad de selección de rango horario y acciones rápidas en `AlertaTiempo`
- **Archivos**: `src/components/reservas/torneo/CalendarioTorneo.jsx`, `src/components/reservas/torneo/AlertaTiempo.jsx`, `src/components/reservas/FormularioReserva.jsx`.
- **Solución**:
  1. Mostrar junto a la etiqueta de horario el resumen en vivo de la franja seleccionada (ej. `14:00 a 16:00 (2 h)`).
  2. Añadir texto de ayuda breve en `CalendarioTorneo` para explicar cómo elegir más de 1 hora (tocar hora de inicio y luego hora de fin).
  3. Añadir botones de acción rápida opcionales en `AlertaTiempo` (como `"Cambiar a 15 min por partido"` cuando `duracionPartido > 15`).

#### `[P1-08]` Semántica ARIA en `DepthCarousel` y pestañas de `VistaCanchas`
- **Archivos**: `src/components/reactbits/DepthCarousel.jsx`, `src/components/canchas/VistaCanchas.jsx`.
- **Solución**: Cambiar `role="tablist"` / `role="tab"` en los dots de `DepthCarousel` por `role="group"` con `aria-pressed={active === i}`, y soportar flechas `ArrowLeft`/`ArrowRight` en las pestañas de deporte de `VistaCanchas`.

---

### 🟡 Severidad P2 y P3 — Consistencia, Copy, Detector Impeccable y Rendimiento

#### `[P2-01]` Visibilidad de características de canchas en Vóley Playa y Pádel
- **Archivos**: `src/components/reservas/TarjetaCanchaCarrusel.jsx`, `src/data/deportes.js`.
- **Solución**: Mostrar los chips de `cancha.caracteristicas.slice(0, 3)` en las tarjetas del carrusel para los tres deportes.

#### `[P2-02]` Botón `"Cancelar"` destructivo en `VoucherReserva`
- **Archivos**: `src/components/reservas/VoucherReserva.jsx`, `src/components/canchas/VistaCanchas.jsx`.
- **Solución**: En `VistaCanchas.jsx`, conectar el botón secundario de `VoucherReserva` a `reserva.reiniciar` con la etiqueta **"Limpiar selección"** (manteniendo `"Volver al inicio"` en la barra superior sin destruir accidentalmente el formulario desde el voucher).

#### `[P2-03]` Botón `"Copiar código"` y políticas de abono/cancelación en `ConfirmacionReserva`
- **Archivos**: `src/components/reservas/ConfirmacionReserva.jsx`, `src/components/reservas/ConfirmacionReserva.css`.
- **Solución**: Añadir botón para copiar el código `SPF-XXXXXX` al portapapeles con confirmación visual `"¡Copiado!"` y mostrar las reglas de abono (50% en 2h) y cancelación (mín. 6h antes) de `negocio.json`.

#### `[P2-04]` y `[P2-05]` `scroll-snap` en tiras horizontales y límite/resumen de `Invitados` en Cumpleaños
- **Archivos**: `src/components/shared/SelectorDia.css`, `src/components/reservas/torneo/Bracket.css`, `src/components/reservas/FormularioReserva.jsx`, `src/components/reservas/VoucherReserva.jsx`.
- **Solución**: Añadir `scroll-snap-type: x proximity` en `.selector-dia` y `.bracket-torneo__rondas`; limitar `invitados` (`max="100"`, `placeholder="Ej. 20"`) y mostrar el número de invitados en `VoucherReserva` y `ConfirmacionReserva`.

#### `[P2-06]` Antipatrón `side-tab` en `impeccable detect` (`Bracket.css:12`) y tokens de foco en inputs
- **Archivos**: `src/components/reservas/torneo/Bracket.css`, `src/components/reservas/FormularioReserva.css`.
- **Solución**: Sustituir `border-left: 4px solid #f59e0b` en `.alerta-tiempo` por `border: 1px solid rgba(245, 158, 11, 0.45)` para que `impeccable detect --json src` devuelva `0` alertas (exit code `0`), y usar `var(--accent, #1779ba)` en el `:focus` de `.formulario-reserva__input`.

#### `[P2-07]` y `[P3-01]` Unificación de marca `Sportify`, `poster` en videos Hero y limpieza de `will-change`
- **Archivos**: `src/components/layout/Navbar.jsx`, `src/components/layout/Footer.jsx`, `src/components/hero/DeporteHero.jsx`, `src/components/reactbits/AccordionGallery.css`, `src/components/reactbits/DepthCarousel.css`.
- **Solución**: Mostrar **Sportify** en `Navbar` y `Footer`, pasar `poster` a `<video>` en `DeporteHero` y eliminar propiedades costosas (`flex-grow`, `filter`) de `will-change` en reposo.

---

## 3. Bloques, Olas, Verificación y Commits (`planificacion-por-etapas`)

### Tabla de bloques de la Etapa 7 (`planificacion/etapas/7-auditoria-usabilidad/`)

| ID | Bloque | Hallazgos Cubiertos | Rutas permitidas | Ola |
|---|---|---|---|---|
| `u1` | `u1-prevencion-errores-reservas` | `P0-03`, `P0-04`, `P1-04`, `P1-06`, `P1-07`, `P2-05` | `src/components/reservas/useReserva.js`, `src/components/reservas/torneo/{AsignacionManual,AlertaTiempo,CalendarioTorneo}.jsx`, `src/components/reservas/{FormularioReserva,TarjetaCanchaCarrusel}.jsx`, `src/components/shared/SelectorDia.jsx` | Ola 1 |
| `u2` | `u2-contacto-mis-reservas-y-voucher` | `P0-01`, `P2-02`, `P2-03`, `P2-07` | `src/lib/{validacion,cancelacion}.js`, `src/components/layout/{Navbar,Footer}.{jsx,css}`, `src/components/reservas/{VoucherReserva,ConfirmacionReserva}.{jsx,css}`, `src/components/canchas/VistaCanchas.jsx` | Ola 2 |
| `u3` | `u3-accesibilidad-contraste-y-tokens` | `P1-01`, `P1-03`, `P1-05`, `P1-08`, `P2-06` | `src/lib/canchas.js`, `src/components/reservas/torneo/Bracket.css`, `src/components/reservas/{FormularioReserva,CanchasElegidas,SelectorModo}.css`, `src/components/canchas/VistaCanchas.css`, `src/components/shared/SelectorDia.css` | Ola 3 |
| `u4` | `u4-carrusel-touch-targets-y-perf` | `P0-02`, `P1-02`, `P2-01`, `P2-04`, `P3-01` | `src/components/reactbits/{DepthCarousel,AccordionGallery}.{jsx,css}`, `src/components/chatbot/Chatbot.css`, `src/components/hero/DeporteHero.jsx`, `src/pages/PaginaInicio.jsx`, `src/data/deportes.js` | Ola 4 |

### Verificación en `usability-improve`
1. `npx vitest run` (todas las suites unitarias y de integración en verde)
2. `npm run lint` (`0 errors`, `0 warnings`)
3. `& "C:\Users\MIGUEL ANGEL\.gemini\antigravity-cli\skills\impeccable\scripts\impeccable.cmd" detect --json src` (`[]`, exit code `0`)
4. `npm run build` (build de producción limpio)

### Commits previstos en `usability-improve` (`commits-atomicos`)
1. `feat: previene errores de selección de canchas, cruces y horarios en reservas`
2. `feat: añade consulta de reservas, copia de código y mejoras de confirmación`
3. `fix: mejora contraste WCAG AA, foco visible y tokens de tema por deporte`
4. `fix: corrige scroll vertical del carrusel, objetivos táctiles y rendimiento`
5. `docs: registra etapa 7 de auditoría de usabilidad en planificación`

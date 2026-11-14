# Etapa 13: correcciones de la rúbrica (GSAP, Chatbot, API, Navegabilidad y Diseño)

Estado: **Implementado** (14-11-2026 — ver `REPORTE.md`).
Rama: `fix/correcciones-rubrica` (desde `main`, `0a09394`).
Responsable: Juan Fierro (coordinación y revisión).

## Qué se pidió y qué hay hoy

Tras la evaluación integral del proyecto sobre cinco criterios (API `9.5/10`, GSAP `9.5/10`, Diseño `9.3/10`, Navegabilidad `9.1/10` y Chatbot `8.6/10`; promedio `9.2/10`), esta etapa planifica la corrección de todos los hallazgos detectados sin alterar reglas de negocio ni restricciones del stack.

Estado actual verificado en código:

1. **Chatbot — Contraste crítico en comprobante (Severidad Alta)**
   - `src/components/chatbot/Chatbot.css:503-511`: `.chatbot__comprobante` define `background: #ffffff`, pero monta `<ConfirmacionReserva />` (`src/components/chatbot/Chatbot.jsx:267-272`).
   - `src/components/reservas/ConfirmacionReserva.css:25,39,56,74,130,148,165,260,294,348`: consume `--reserva-texto` (`#f2f2f2` en `src/App.css:28`), `--reserva-texto-2` (`#c4c4c4`) y `--reserva-texto-tenue` (`#a8a8a8`). Al renderizarse sobre `#ffffff`, el título, el código de reserva y el botón de descarga quedan casi invisibles (~1.1:1).
2. **GSAP — Fuga de listeners de `matchMedia` y limpieza de video (Severidad Media / Baja)**
   - `src/components/reservas/torneo/Bracket.jsx:125-140` y `src/components/reservas/torneo/CalendarioTorneo.jsx:70-88`: ambos crean `const mm = gsap.matchMedia()` dentro de `gsap.context(...)` pero el cleanup solo ejecuta `ctx.revert()`, sin llamar `mm.revert()`. Al cambiar de ronda, modo móvil o tamaño del torneo quedan listeners huérfanos en `window`.
   - `src/components/hero/DeporteHero.jsx:136-139`: el cleanup no llama `video?.pause()` al desmontar la página de inicio.
   - `src/components/reactbits/DepthCarousel.jsx:93,325`: `reducedRef` evalúa `prefers-reduced-motion` solo al montar, sin suscribirse a cambios dinámicos.
3. **Navegabilidad y Accesibilidad — Landmark `<main>`, skip link y scroll suave (Severidad Media / Baja)**
   - `src/components/layout/PaginaInicio.jsx:100-124`: renderiza un fragmento `<>...</>`, dejando `/` sin elemento `<main>` (a diferencia de `src/components/canchas/VistaCanchas.jsx:534`).
   - `src/App.jsx:35-45` y `src/components/layout/Navbar.jsx:103-178`: no existe enlace "Saltar al contenido principal" (skip link) antes del `<header>`.
   - `src/components/layout/Navbar.jsx:86-100` y `src/components/layout/Footer.jsx:24-29`: `manejarSeccion` restringe `irASeccion` con `if (deporteAbierto && esClicNormal(e))`, por lo que estando en inicio (`!deporteAbierto`) los clics a `#eventos` o `#ubicacion` hacen salto brusco nativo en vez de usar `irASeccion` (que ya aplica `scrollIntoView` respetando `prefers-reduced-motion`).
4. **Diseño y Touch Targets (Severidad Media / Baja)**
   - `src/components/reactbits/DepthCarousel.css:180-192`: `.depth-carousel__dot` mide `28x28 px`.
   - `src/components/reservas/CanchasElegidas.css:50-56`: `.canchas-elegidas__quitar` mide `24x24 px`.
   - `src/components/chatbot/Chatbot.css:391-435`: `.chatbot__boton-primario`, `.chatbot__boton-secundario` y `.chatbot__boton-peligro` tienen ~36 px de alto sin `min-height: 44px`.
   - `src/components/eventos/EventoCTA.css:184-188`: el bloque `@media (prefers-reduced-motion: reduce)` apaga `.evento-cta__stat`, pero no neutraliza el `transform: translateY(-3px) scale(1.03)` de `.evento-cta__boton.button.large:hover/:focus`.
   - `src/components/reactbits/DepthCarousel.css:125,171`: usa `z-index: 3000` sin token o comentario que aclare su contexto de apilamiento local.
5. **Cobertura de pruebas faltante (Severidad Media / Baja)**
   - `src/components/chatbot/`: cuenta con `useChatbot.test.jsx` y `src/lib/chat.test.js`, pero no tiene pruebas de interfaz para `Chatbot.jsx` (portal, Escape, tarjetas, comprobante).
   - `api/`: cuenta con `api/_lib/*.test.js` y `src/lib/modelosChat.test.js`, pero no tiene un test unitario con mocks para el handler completo `api/chat.js`.

## Decisiones y su porqué

1. **Comprobante del chat en tema oscuro (`var(--reserva-seccion, #161616)`)** en lugar de sobrescribir todos los selectores de `ConfirmacionReserva` con colores claros:
   - `ConfirmacionReserva` fue diseñado sobre `--reserva-*` en la etapa 9 y ya enmarca el canvas del QR sobre fondo blanco (`.confirmacion-reserva__qr` en `ConfirmacionReserva.css:112-120`). Mantener el tema oscuro en `.chatbot__comprobante` da paridad visual 1:1 con la página de reserva y evita duplicar decenas de reglas CSS.
2. **Patrón único `gsap.matchMedia()` con `rootRef` en `Bracket.jsx` y `CalendarioTorneo.jsx`**:
   - Reemplazar el envoltorio `gsap.context(() => { const mm = gsap.matchMedia(); ... })` por `const mm = gsap.matchMedia(); mm.add(..., () => { ... }, rootRef); return () => mm.revert();` (equivalente a `VistaCanchas.jsx:328-351`). Garantiza que tanto los tweens como el listener de media query se liberen en cada cambio de dependencia o desmontaje.
3. **Skip link en `App.jsx` + `<main id="contenido-principal">` en `PaginaInicio.jsx` y `VistaCanchas.jsx`**:
   - Colocar `<a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>` al inicio de `AppContenido` cubre ambas vistas antes del `<header>`. `PaginaInicio` envuelve los heros, `EventoCTA` y `Ubicacion` en `<main id="contenido-principal" tabIndex={-1}>`; `VistaCanchas` añade `id="contenido-principal"` y `tabIndex={-1}` a su `<main>` existente.
4. **Touch targets `>= 44 px` sin distorsión visual**:
   - En `.depth-carousel__dot`, subir `min-width` y `min-height` a `44px` manteniendo el indicador visual `::after` en `8x8 px` y reduciendo el `gap` de `.depth-carousel__dots` a `2px` (`padding: 4px 8px`).
   - En `.canchas-elegidas__quitar`, conservar el círculo visual `24x24 px` y expandir su área táctil con un pseudo-elemento `::after` (`position: absolute; inset: -10px;`) sobre `position: relative` en el botón, manteniendo limpia la estética del chip.
   - En los botones de tarjeta de `Chatbot.css`, fijar `min-height: 44px; display: inline-flex; align-items: center; justify-content: center;`.
5. **Scroll suave consistente en `Navbar` y `Footer`**:
   - En `manejarSeccion` de ambos componentes, invocar `irASeccion(id)` siempre que `esClicNormal(e)` sea verdadero (esté abierta la página de inicio o la de reserva). En `irAInicio` de `Navbar.jsx`, aplicar lo mismo cuando `!deporteAbierto` para ir al tope suavemente (respetando `prefers-reduced-motion`).
6. **Fuera de alcance (decisiones explícitas)**:
   - *Code splitting del chunk principal (`508.82 kB`)*: se pospone; dividir sin router agrega estados de suspensión por apenas ~9 kB sobre el aviso informativo de Vite.
   - *Historial de navegador para modales (`MisReservas` / `VisorCancha`)*: se pospone para no introducir carreras con `popstate` de `VistaCanchasContext`.
   - *`aria-modal="true"` y focus trap en el panel de escritorio del chat*: el chat en escritorio funciona como asistente no modal que convive con el formulario de reserva; `Escape` y el retorno de foco ya cubren el cierre accesible.

## Bloques, rutas y olas

Cada bloque tiene archivos disjuntos para evitar conflictos. Según la disponibilidad de RAM (8 GB), la **Ola 1** corre dos bloques en paralelo (o secuencial si se prefiere 1 a la vez) y la **Ola 2** corre el tercero tras revisar la Ola 1.

| Ola | Bloque | Agente | Objetivo | Rutas permitidas | Rutas prohibidas |
|---|---|---|---|---|---|
| 1 | `c1-chatbot-contraste-y-tests` | `agy` (`gemini-3.8-flash-high`) | Fondo oscuro en `.chatbot__comprobante`, `min-height: 44px` en botones de tarjeta y suite `Chatbot.test.jsx`. | `src/components/chatbot/Chatbot.css`, `src/components/chatbot/Chatbot.test.jsx` (nuevo) | `ConfirmacionReserva.css`, `api/`, `ReservasContext.jsx` |
| 1 | `g1-gsap-y-pulido-diseno` | `agy` (`gemini-3.8-flash-high`) | `mm.revert()` en `Bracket` y `CalendarioTorneo`, `video?.pause()` en `DeporteHero`, listener dinámico de `reduced-motion` en `DepthCarousel`, touch targets `44px` en dots y chips, `reduced-motion` en `EventoCTA` y token/comentario de `z-index` en `DepthCarousel.css`. | `src/components/reservas/torneo/Bracket.jsx`, `src/components/reservas/torneo/CalendarioTorneo.jsx`, `src/components/hero/DeporteHero.jsx`, `src/components/reactbits/DepthCarousel.jsx`, `src/components/reactbits/DepthCarousel.css`, `src/components/reservas/CanchasElegidas.css`, `src/components/eventos/EventoCTA.css`, `src/components/reservas/torneo/CalendarioTorneo.test.jsx` (solo si requiere ajuste) | `Bracket.css`, `useReserva.js`, `Chatbot.css` |
| 2 | `n1-navegabilidad-y-api-tests` | `agy` (`gemini-3.8-flash-high`) | Landmark `<main>` en `PaginaInicio`, skip link en `App`, scroll suave en `Navbar`/`Footer`, tests de `App`/`Navbar` y suite unitaria con mocks `api/chat.test.js`. | `src/App.jsx`, `src/App.css`, `src/App.test.jsx`, `src/components/layout/PaginaInicio.jsx`, `src/components/layout/Navbar.jsx`, `src/components/layout/Navbar.test.jsx`, `src/components/layout/Footer.jsx`, `src/components/canchas/VistaCanchas.jsx`, `api/chat.test.js` (nuevo) | `api/chat.js`, `src/lib/rutas.js`, `VistaCanchasContext.jsx` |

## Verificación (caso feliz y casos límite para intentar romper el código)

### Comandos automáticos
- `npm test` (todos los archivos en verde, incluidos `Chatbot.test.jsx` y `api/chat.test.js`).
- `npm run lint` (0 errores, 0 warnings).
- `npm run build` (sin errores).
- *Nota de cuota*: no se corre `scripts/probar-chat.mjs` contra Gemini real para no gastar la cuota gratuita diaria; `api/chat.test.js` cubre el handler mediante mocks de `@google/genai`.

### Casos de prueba (RED → GREEN) y revisión en navegador (`1440×900` y `390×844` sobre `npm run preview`)
1. **Comprobante del chatbot (`c1`)**:
   - Confirmar una reserva desde el chat, abrir "Ver comprobante", cerrar con el botón "Listo", hacer una segunda reserva (o reabrir) y cerrar con `Escape`: validar que `.chatbot__comprobante` aplica fondo oscuro (`--reserva-seccion`), que título/código/botón descargar mantienen contraste legible y que el foco regresa al botón o input sin perder la conversación.
   - En `390×844`, comprobar que los botones de `TarjetaReserva` y `TarjetaCancelacion` miden `>= 44px` de alto y no desbordan el panel.
2. **GSAP y diseño (`g1`)**:
   - En `/reservar/futbol?modo=torneo`, alternar `4 -> 8 -> 16 -> 4` equipos y recorrer las 4 pestañas de fase (`Octavos` -> `Cuartos` -> `Semifinal` -> `Final`) varias veces seguidas; comprobar que no quedan tweens ni listeners huérfanos ni errores en consola.
   - Simular `prefers-reduced-motion: reduce` en caliente mientras `DepthCarousel` está montado: verificar que el autoplay se detiene de inmediato; verificar en `390×844` que los dots `44x44px` caben centrados sin tapar el botón de la tarjeta ni generar scroll horizontal, y que el botón quitar de `CanchasElegidas` responde al toque en su área expandida `44x44px` sin romper el chip.
   - En `/` con `prefers-reduced-motion: reduce`, enfocar/hover sobre `.evento-cta__boton`: sin escalado ni traslación.
   - Navegar `/` -> `/reservar/padel` y verificar que los `<video>` del inicio quedan pausados al desmontar.
3. **Navegabilidad y API (`n1`)**:
   - En `/` y `/reservar/padel`: verificar exactamente un `<main id="contenido-principal">` en el DOM; presionar `Tab` al cargar la página y confirmar que el primer elemento enfocado es "Saltar al contenido principal", y al activar Enter el foco pasa al `<main>`.
   - En `/`, clic normal en "Eventos especiales" y "Ubicación" (Navbar y Footer) desplaza suavemente (o `auto` con `reduced-motion`); Ctrl+clic conserva comportamiento nativo de enlace.
   - `api/chat.test.js` (mock `@google/genai`): `GET` -> 405; sin `GEMINI_API_KEY` -> 500; payload > 48 KB o `fechaHoy: '2026-02-30'` -> 400; llamada válida -> 200 con `accion`; fallo 503 del modelo principal -> reintenta con el segundo y responde 200; error 400 del SDK -> corta sin llamar al respaldo; todos con 429 -> 429; timeout agotado -> 504.

## Commits propuestos (en español, sin menciones a IA)

1. `fix(chatbot): corrige contraste del comprobante y amplía área táctil de botones`
2. `test(chatbot): agrega pruebas de interfaz para el panel y comprobante`
3. `fix(gsap): limpia matchMedia en torneo, pausa videos al desmontar y actualiza reduced-motion en carrusel`
4. `fix(ui): amplía área táctil en carrusel y chips y respeta reduced-motion en EventoCTA`
5. `feat(a11y): agrega landmark main en inicio, skip link y scroll suave en secciones`
6. `test(api): cubre el handler /api/chat con mocks y respaldo de modelos`
7. `docs: registra reporte y cierre de la etapa 13`

## Por aprobar

1. Confirmación del plan, la rama `fix/correcciones-rubrica` y la división en 3 bloques (`c1`, `g1`, `n1`).
2. Confirmación del diseño oscuro (`var(--reserva-seccion, #161616)`) para `.chatbot__comprobante` dentro del chat.
3. Confirmación de los puntos dejados **fuera de alcance** (code splitting de Vite, historial para modales en móvil y `aria-modal`/focus trap en el chat de escritorio).

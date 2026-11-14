# Reporte Etapa 13 — Correcciones de la rúbrica

Rama: `fix/correcciones-rubrica` (desde `main`, `0a09394`).
Fecha de cierre de implementación: 14-11-2026.

## Resumen de cambios por bloque

1. **Bloque `c1-chatbot-contraste-y-tests` (Chatbot y diseño del comprobante)**
   - `src/components/chatbot/Chatbot.css`: `.chatbot__comprobante` pasa a fondo oscuro `var(--reserva-seccion, #161616)` y texto `var(--reserva-texto, #f2f2f2)` para restaurar la paridad visual y el contraste WCAG AA/AAA con `ConfirmacionReserva`; se fijó `min-height: 44px` en `.chatbot__accion`, `.chatbot__boton-primario`, `.chatbot__boton-secundario` y `.chatbot__boton-peligro`, y `44x44 px` en `.chatbot__enviar`.
   - `src/components/chatbot/Chatbot.test.jsx` (nuevo): 3 pruebas de integración UI (montaje en portal, foco al abrir y cierre con `Escape` + retorno de foco y `stopPropagation`, confirmación de propuesta + apertura/cierre del comprobante con `Escape` y `Listo`, y reinicio con "Nueva conversación").

2. **Bloque `g1-gsap-y-pulido-diseno` (GSAP y pulido de interacción/accesibilidad visual)**
   - `src/components/reservas/torneo/Bracket.jsx` y `src/components/reservas/torneo/CalendarioTorneo.jsx`: reemplazo de `gsap.context(() => { const mm = gsap.matchMedia(); ... })` por `gsap.matchMedia(rootRef)` con `return () => mm.revert()`, evitando listeners huérfanos al cambiar equipos, modo móvil o pestaña de fase.
   - `src/components/hero/DeporteHero.jsx`: `video?.pause()` en los cleanups de efecto al desmontar la página de inicio.
   - `src/components/reactbits/DepthCarousel.jsx` y `DepthCarousel.test.jsx`: suscripción reactiva a `matchMedia('(prefers-reduced-motion: reduce)')` (`change` / fallback `addListener`) para detener el autoplay si la preferencia cambia en caliente (+ 1 prueba unitaria).
   - `src/components/reactbits/DepthCarousel.css`: `.depth-carousel__dot` ampliado a `44x44 px` (ajustando `gap` y `padding` de `.depth-carousel__dots`) y comentario de apilamiento local sobre `z-index: 3000`.
   - `src/components/reservas/CanchasElegidas.css`: expansión del área táctil de `.canchas-elegidas__quitar` a `44x44 px` mediante pseudo-elemento `::after` sin deformar el chip.
   - `src/components/eventos/EventoCTA.css`: neutralización de `transition` y `transform: none` en `.evento-cta__boton.button.large` bajo `@media (prefers-reduced-motion: reduce)`.

3. **Bloque `n1-navegabilidad-y-api-tests` (Navegabilidad, landmarks y pruebas de `/api/chat`)**
   - `src/components/layout/PaginaInicio.jsx` y `src/components/canchas/VistaCanchas.jsx`: `<main id="contenido-principal" tabIndex={-1}>` único en ambas vistas.
   - `src/App.jsx`, `src/App.css` y `src/App.test.jsx`: enlace `.skip-link` ("Saltar al contenido principal") antes del `<header>` visible al enfocar, con traslado de foco a `#contenido-principal` (+ verificación en los 2 tests de `App.test.jsx`).
   - `src/components/layout/Navbar.jsx`, `src/components/layout/Footer.jsx` y `src/components/layout/Navbar.test.jsx`: uso uniforme de `irASeccion` en clics normales sobre enlaces de sección estando también en `/` y scroll suave al tope desde `irAInicio` respetando `prefers-reduced-motion` (+ 1 prueba en `Navbar.test.jsx`).
   - `api/_lib/chat.test.js` (nuevo): 7 pruebas unitarias del handler `fetch` mockeando `@google/genai` (405 `GET`, 400 por `Content-Type` y tamaño > 48 KB, 500 sin `GEMINI_API_KEY`, 200 con acción `CONFIRMAR_RESERVA`, respaldo automático ante 503, corte inmediato ante 400 del SDK, 429 cuando todos superan cuota y 504 por timeout).

## Verificación con números

- **`npm test`**: **31 de 31 archivos pasando (295/295 tests en verde)**, duración `17.06 s`.
- **`npm run lint`**: **0 errores, 0 warnings**.
- **`npm run build`**: exitoso en `1.75 s` (`dist/assets/index-C_Sv8R46.js` `511.74 kB`, aviso esperado de chunk > 500 kB dejado fuera de alcance en el plan).
- **Chrome headless sobre `npm run preview` (`1440×900` y `390×844`)**, capturas en `planificacion/etapas/13-correcciones-rubrica/revision/`:
  - `01-skip-link.png`: `mainsInicio: 1`, `skipCheck` visible (`top: 16`, `height: 44`) tras `Tab`, foco movido a `MAIN#contenido-principal`.
  - `02-chatbot-comprobante.png`: `.chatbot__comprobante` con fondo `rgb(22, 22, 22)` y título/código/botón descargar en `rgb(242, 242, 242)`, `btnHeight: 44`.
  - `03-movil-carrusel-dots.png`: en `390×844`, `overflowX: false` (`scrollWidth: 390`), 3 dots de `44x44 px`.
  - `04-torneo-chips.png`: cambio de equipos y recorrido por pestañas de fase sin errores de consola (`consoleErrors: []`).

## Pendientes

- Revisión y fusión del PR de `fix/correcciones-rubrica` hacia `main`.
- Si se requiere verificación adicional del chatbot contra Gemini real en preview/producción tras fusionar, correr `node scripts/probar-chat.mjs` cuidando la cuota gratuita diaria.

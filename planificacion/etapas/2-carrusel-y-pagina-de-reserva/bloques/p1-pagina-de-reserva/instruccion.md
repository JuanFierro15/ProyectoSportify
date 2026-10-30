Implementa dos cambios en el sitio de reservas de canchas: (A) volver a mostrar características y descripción sobre la foto del carrusel SOLO en las canchas de fútbol, y (B) convertir la vista de reserva, que hoy es un modal a pantalla completa encima de la página de inicio, en una PÁGINA PROPIA del sitio con su URL (`/reservar/<deporte>`). Aplica los cambios directamente en los archivos.

Contexto:
- Proyecto: raíz del repositorio
- Stack: React 19 + Vite (base '/', SPA), Foundation (foundation-sites) para maquetación, GSAP + ScrollTrigger, Vitest + Testing Library. Sin TypeScript, sin router. NO agregues dependencias nuevas (nada de react-router): la navegación se hace con la History API, como ya hace `VistaCanchasContext`.
- Código, comentarios, props y estados en español. Componentes funcionales con Hooks, uno por archivo. Archivos con JSX en `.jsx`; `src/lib/*.js` es JS puro sin JSX ni React.
- Textos visibles en español con tuteo ("Vuelve", "Elige"); nada de copy técnico (no mencionar "modal", "ruta", "localStorage", etc.).
- Mantén la densidad y el estilo de comentarios del código existente (comentarios en español que explican el porqué). Actualiza los comentarios de cabecera que queden desactualizados (hablan de "vista superpuesta", "portal", "hash", etc.).

======================================================================
PARTE A — Detalle sobre la foto solo en fútbol
======================================================================
Archivos: src/data/deportes.js, src/components/reservas/TarjetaCanchaCarrusel.jsx y .css, src/components/canchas/VistaCanchas.css.

Hoy `TarjetaCanchaCarrusel` (se pinta encima de cada foto del carrusel vía `renderOverlay`) muestra en la tarjeta activa: nombre, una fila con precio por hora y disponibilidad, y la acción ("Cancha elegida" o el botón "Agregar al evento"/"Quitar del evento"). Las características y la descripción se quitaron hace poco (están en el visor en grande). Ahora el dueño quiere volver a verlas sobre la foto, pero SOLO en las canchas de fútbol.

1. src/data/deportes.js: en el objeto de fútbol (slug 'futbol') agrega `detalleEnTarjeta: true` con un comentario corto (muestra características y descripción sobre la foto del carrusel; los demás deportes solo nombre, precio y disponibilidad). No lo agregues a los otros deportes. No hardcodees 'futbol' en ningún componente.
2. TarjetaCanchaCarrusel.jsx: el componente ya recibe `deporte` (objeto de DEPORTES). Si `activa && deporte?.detalleEnTarjeta`, renderiza entre el `<h3>` del nombre y `.tarjeta-cancha__pie`:
   - hasta 3 características: `<div className="tarjeta-cancha__badges">` con `<span key={item} className="tarjeta-cancha__badge">{item}</span>` (de `cancha.caracteristicas`, `.slice(0, 3)`);
   - la descripción si existe: `<p className="tarjeta-cancha__descripcion">{cancha.descripcion}</p>`.
   Actualiza el comentario de cabecera del componente.
3. TarjetaCanchaCarrusel.css: vuelve a agregar estas reglas (eran las originales):
   .tarjeta-cancha__badges { display: flex; flex-wrap: wrap; gap: 0.3rem; }
   .tarjeta-cancha__badge { padding: 0.18rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; color: #ffffff; background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.22); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); text-shadow: none; }
   .tarjeta-cancha__descripcion { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; font-size: 0.8rem; line-height: 1.35; color: rgba(255, 255, 255, 0.88); }
   El degradado oscuro ya está en `.tarjeta-cancha__cuerpo` y crece con el texto: no lo cambies.
4. VistaCanchas.css: agrega `.vista-canchas__cuerpo .tarjeta-cancha__descripcion { font-size: clamp(0.85rem, 2.4cqh, 1rem); }` junto a la regla existente de `.vista-canchas__cuerpo .tarjeta-cancha__nombre`.

======================================================================
PARTE B — La reserva pasa de modal a página propia
======================================================================

Situación actual (léela en el código antes de cambiar nada):
- src/App.jsx: `ReservasProvider` > `VistaCanchasProvider` > `AppContenido` que renderiza Navbar, un `DeporteHero` por deporte dentro de `<div id="hero-placeholder">`, `EventoCTA`, `Ubicacion`, `Footer`, `<VistaCanchas />` (siempre montada; se pinta por portal solo cuando está abierta) y `<Chatbot />`.
- src/context/VistaCanchasContext.jsx: estado `deporteAbierto` (slug o null) sincronizado con el hash `#canchas-<slug>` (pushState al abrir, replaceState al cambiar de pestaña, popstate para "atrás"), `modoInicial`, `abrirVista(slug, { modo })`, `cambiarDeporte(slug)`, `cerrarVista()`, `restaurarFoco()`.
- src/components/canchas/VistaCanchas.jsx: overlay `role="dialog" aria-modal="true"` por `createPortal` a `document.body`, con botón X (`.vista-canchas__cerrar`), animación GSAP de entrada/salida con estado `montado`/`salirRef`, bloqueo del scroll del body, bloqueo del scroll propio de `.vista-canchas` cuando el visor (`<dialog>` con showModal) está abierto, Escape para cerrar, foco al botón X y `restaurarFoco` al cerrar. Usa `useReserva({ activo: montado, modoInicial, canchaInicial })`.
- src/components/canchas/VistaCanchas.css: `.vista-canchas` es `position: fixed; inset: 0; z-index: 1001; overflow-y: auto; overflow-x: hidden; background: #ffffff;`. `.vista-canchas__marco` (es `grid-container`) tiene `padding-top: 4.5rem` y `overflow-x: clip`. El voucher es sticky con `top: 1.5rem`. `.vista-canchas__cuerpo` usa alturas con `100dvh - 250px` calculadas para la cabecera actual.
- Consumidores del contexto: src/components/layout/Navbar.jsx (enlace "Canchas" → `abrirVista('voley-playa')`; enlaces ancla `#hero-placeholder`, `#eventos`, `#ubicacion`; `checkHero()` usa `#hero-placeholder` para elegir estilo transparente u opaco), src/components/layout/Footer.jsx (mismos enlaces), src/components/hero/DeporteHero.jsx (CTA `<a href="#canchas-placeholder">` que llama `onVerCanchas`), src/components/eventos/EventoCTA.jsx (`<button>` "Reserva un evento" → `abrirVista(DEPORTES[0].slug, { modo: 'torneo' })`), src/components/chatbot/useAccionesChat.js (irACanchas, irAEventos, irAUbicacion; hoy espera a que `.vista-canchas` salga del DOM), src/components/chatbot/useDeporteActivo.js (usa `deporteAbierto` y un IntersectionObserver sobre `#root [data-sport]` creado una sola vez).
- `MODOS` (valores 'cancha', 'torneo', 'cumpleanos') está exportado en src/components/reservas/useReserva.js.
- El `<body>` tiene fondo oscuro (#141414). El navbar (`.site-header`) es `position: fixed`, z-index 1000, se oculta al bajar y aparece al subir.
- DeporteHero ancla cada hero con ScrollTrigger (`pin: true`) y la duración del pin depende de `video.duration` (refresca ScrollTrigger en `loadedmetadata`): hasta que los videos tienen metadatos, la altura de la página no es la final.

Requisitos:

B1. Lógica de rutas pura: crea src/lib/rutas.js (JS puro, sin React ni DOM global salvo lo que reciba por parámetro) con tests en src/lib/rutas.test.js (Vitest, `globals: true`, estilo de los demás `src/lib/*.test.js`):
  - `rutaReserva(slug, modo)` → `/reservar/<slug>`, más `?modo=<modo>` solo si `modo` existe y no es 'cancha'.
  - `leerRuta({ pathname, search, hash }, { slugs, modos })` → `{ deporte, modo, redirigir }`:
    - `/reservar/<slug>` (con o sin barra final) con slug válido → `deporte: slug`; `modo` = `?modo=` si está en `modos`, si no 'cancha'; `redirigir: null`.
    - `/reservar` o `/reservar/<slug inválido>` → `deporte: null, modo: 'cancha', redirigir: '/'`.
    - pathname `/` con hash `#canchas-<slug>` válido (enlaces viejos) → `deporte: slug, modo: 'cancha', redirigir: rutaReserva(slug)`.
    - cualquier otro caso → `deporte: null, modo: 'cancha', redirigir: null`.
  - `esClicNormal(evento)` → true solo si `button === 0` y sin `metaKey`, `ctrlKey`, `shiftKey`, `altKey`, y `!defaultPrevented` (para dejar que Ctrl+clic / clic medio abran otra pestaña).
  - Tests que cubran todos esos casos.

B2. src/context/VistaCanchasContext.jsx: reescribe la sincronización para que use rutas de path en vez del hash, conservando el nombre del contexto y del hook (`useVistaCanchas`) y la API que usan los consumidores. Valor del contexto:
  - `deporteAbierto` (slug o null = página de inicio), `modoInicial`, `apertura` (número que sube en cada `abrirVista`; App lo usa como `key` de la página de reserva para que vuelva a arrancar limpia, p. ej. si el chat abre eventos estando ya en la página).
  - Estado inicial desde `leerRuta(window.location, { slugs: DEPORTES.map(d => d.slug), modos: MODOS.map(m => m.valor) })`; si trae `redirigir`, haz `history.replaceState(null, '', redirigir)` al montar.
  - En el montaje: `window.history.scrollRestoration = 'manual'` (lo maneja el sitio).
  - `abrirVista(slug, { modo = 'cancha' } = {})`: si el slug no es válido, nada. Si se está en la página de inicio, guarda la posición actual en la entrada de historial del inicio (`history.replaceState({ ...history.state, inicioScrollY: window.scrollY }, '')`). Luego `pushState({ vistaCanchas: true }, '', rutaReserva(slug, modo))`, actualiza estado y sube `apertura`.
  - `cambiarDeporte(slug)`: `replaceState({ vistaCanchas: true }, '', rutaReserva(slug, modoActualEnLaUrl))` (conserva `?modo`) y actualiza `deporteAbierto`.
  - `actualizarModo(modo)`: solo `replaceState` de la URL actual con el `?modo` nuevo (sin cambiar estado ni apilar historial). La usa la página al cambiar de modo, para que recargar o compartir conserve el modo.
  - `cerrarVista()`: vuelve a la página de inicio y, al aparecer, restaura la posición donde estaba el usuario. Si la entrada actual tiene `history.state?.vistaCanchas` y se llegó desde el inicio en esta sesión, usa `history.back()` (el `popstate` hace el resto). Si se entró directo por enlace, `pushState(null, '', '/')`, estado a null y destino arriba (y = 0).
  - `irASeccion(id)` para los enlaces "Inicio" (`hero-placeholder`), "Eventos" (`eventos`) y "Ubicación" (`ubicacion`) y para el chat: si ya se está en el inicio, hace `document.getElementById(id)?.scrollIntoView({ behavior: prefers-reduced-motion ? 'auto' : 'smooth', block: 'start' })`. Si se está en la página de reserva, guarda un destino pendiente `{ seccion: id }` y vuelve al inicio como `cerrarVista()`.
  - Destino al volver al inicio: guárdalo en una ref del contexto. Expón `leerDestinoInicio()` (devuelve `{ seccion } | { y } | null` sin borrarlo) y `limpiarDestinoInicio()`. En `popstate`, si se pasa de la página de reserva al inicio y no hay un destino de sección pendiente, el destino es `{ y: event.state?.inicioScrollY ?? 0 }`. Un `popstate` entre anclas del propio inicio (p. ej. tras clicar `#eventos`) NO debe fijar destino ni tocar nada (usa una ref con el `deporteAbierto` actual para distinguirlo).
  - `popstate` también actualiza `deporteAbierto` y `modoInicial` leyendo la ruta con `leerRuta`.
  - Elimina `restaurarFoco` y lo relacionado con el foco previo (el elemento que abrió la vista ya no existe al volver, porque el inicio se desmonta).
  - Reescribe el comentario de cabecera del archivo.

B3. Página de inicio como componente: crea src/components/layout/PaginaInicio.jsx con lo que hoy está en `AppContenido` entre el Navbar y el Footer: `<div id="hero-placeholder">` con los `DeporteHero` (mueve ahí la constante `VIDEOS`, `BASE` y su comentario), `<EventoCTA />` y `<Ubicacion />`. Agrega un efecto de restauración al montar:
  - lee `leerDestinoInicio()`; si es null, no hace nada;
  - espera a que todos los `<video>` dentro de `#hero-placeholder` tengan metadatos (`readyState >= 1`, escuchando `loadedmetadata`) o 2500 ms como máximo;
  - luego `ScrollTrigger.refresh()` y: si el destino es `{ seccion }`, `document.getElementById(seccion)?.scrollIntoView({ block: 'start' })` sin animación (si es 'hero-placeholder', `window.scrollTo(0, 0)`); si es `{ y }`, `window.scrollTo(0, y)`; y recién entonces `limpiarDestinoInicio()`.
  - Debe funcionar con React.StrictMode (en desarrollo los efectos corren dos veces): usa una bandera `cancelado` en el cleanup y NO borres el destino hasta haberlo aplicado.

B4. src/App.jsx: `ReservasProvider` > `VistaCanchasProvider` > `AppContenido`, que ahora renderiza: `<Navbar />`, luego `deporteAbierto ? <VistaCanchas key={apertura} /> : <PaginaInicio />`, luego `<Footer />` y `<Chatbot />` (el chat queda montado siempre, fuera del cambio de página, para conservar la conversación). Actualiza el comentario de cabecera (ids de anclaje, flujo de páginas).

B5. src/components/canchas/VistaCanchas.jsx → página de reserva:
  - Sin `createPortal`, sin `role="dialog"`/`aria-modal`. La raíz pasa a ser `<main className="vista-canchas" data-sport={...} style={estiloAcento(acento)}>` dentro del flujo normal de la página (el `<div className="vista-canchas__marco grid-container">` y todo su contenido se quedan).
  - Elimina el estado `montado`, `deporteMostrado` como estado (usa directamente `deporteAbierto` del contexto: la página solo se renderiza cuando no es null), la animación de salida (`salirRef`), el bloqueo de scroll del body por estar abierta, el listener de Escape para cerrar y el botón X (`cerrarBtnRef`). Conserva el efecto que reinicia filtro/cancha activa/visor al cambiar de deporte.
  - `useReserva({ activo: true, modoInicial, canchaInicial })`. Verifica en src/components/reservas/useReserva.js que con `activo` siempre true se reinicie bien al montar (`prevActivoRef` arranca en false); no cambies useReserva salvo que sea imprescindible.
  - Cuando cambie `reserva.modo`, llama `actualizarModo(reserva.modo)` del contexto.
  - Al montar: `window.scrollTo(0, 0)` (en un `useLayoutEffect`, para que no se vea un salto), `document.title` = `${reserva.modoInfo.titulo} · Sportify` (actualízalo si cambia el modo) y restaura el título anterior al desmontar; mueve el foco al título (`<h1 id="vista-canchas-titulo" className="vista-canchas__titulo" tabIndex={-1}>`, antes era `<h2>`) con `focus({ preventScroll: true })`.
  - Animación de entrada (opcional pero deseable): con `gsap.matchMedia()` solo en `(prefers-reduced-motion: no-preference)`, un fade corto del marco y el stagger existente de pestañas y título; siempre dentro de un contexto con `revert()` en el cleanup.
  - Arriba del título, en lugar de la X, un enlace para volver: `<a href="/" className="vista-canchas__volver" onClick={(e) => { if (esClicNormal(e)) { e.preventDefault(); cerrarVista(); } }}><ArrowLeft size={18} aria-hidden="true" /> Volver al inicio</a>` (`ArrowLeft` de lucide-react; quita `X` del import si ya no se usa; el visor sigue usando `X` para su botón de cerrar, así que probablemente se queda).
  - Visor en grande (`VisorCancha`, `<dialog>` con showModal): el bloqueo de scroll que hoy se aplica a `.vista-canchas` mientras está abierto debe aplicarse ahora al documento (`document.documentElement`), con la misma compensación del ancho de la barra de scroll con padding-right. Su botón "Elegir horario" ya hace `scrollIntoView` de `#reserva-horario`: déjalo.
  - Cuando `reserva.confirmado` pase a tener valor (se muestra la confirmación con el QR), `window.scrollTo({ top: 0 })` para que se vea la confirmación.
  - "Listo" (ConfirmacionReserva) y "Cancelar" (VoucherReserva) siguen llamando a `cerrarVista`.

B6. src/components/canchas/VistaCanchas.css:
  - `.vista-canchas`: quita `position: fixed`, `inset`, `z-index`, `overflow-y` y `overflow-x` (OJO: `overflow-x: hidden` en un elemento que no es el scroller lo convierte en contenedor de scroll y rompe el voucher sticky). Deja `background: #ffffff;` y agrega `min-height: 100vh;`. Actualiza el comentario.
  - `.vista-canchas__marco`: conserva `overflow-x: clip`; cambia `padding-top` para despejar el navbar fijo (mide su alto en src/components/layout/Navbar.css; algo como `padding-top: 6rem`). Conserva min-height si tiene sentido o quítalo si sobra.
  - Elimina `.vista-canchas__cerrar` (y su `:hover`, también en el bloque de reduced-motion). Agrega `.vista-canchas__volver`: `display: inline-flex; align-items: center; gap: 0.4rem; margin: 0 0 0.75rem; font-weight: 600; color: #4a4a4a; text-decoration: none;` con hover/focus-visible usando el acento (`color-mix(in srgb, var(--accent, #1779ba) 70%, black)` para que se lea sobre blanco) y `outline` visible en `:focus-visible`.
  - Voucher sticky: `top: 1.5rem` → `top: 5.5rem` (para no quedar debajo del navbar cuando aparece).
  - `.vista-canchas__cuerpo`: deja las fórmulas de alto como están (el número 250px lo ajustará otra persona después de medir).
  - En src/components/reservas/FormularioReserva.css agrega `scroll-margin-top: 6rem;` a `#reserva-horario` (o a `.formulario-reserva__campo`) para que el navbar fijo no tape el título al hacer `scrollIntoView`.

B7. Navbar y Footer (src/components/layout/Navbar.jsx y Footer.jsx):
  - Navbar: `checkHero()` debe devolver `false` (estilo opaco) cuando no existe `#hero-placeholder` (página de reserva), y el estado `sobreHero` debe recalcularse cuando cambia `deporteAbierto` (al pasar de una página a otra). Hoy devuelve true y en la página de reserva quedaría texto blanco sobre fondo blanco.
  - Enlaces "Inicio" (y la marca), "Eventos" y "Ubicación" en Navbar y Footer (incluido el `footer__volver`): mantienen su `href` de ancla, pero si `deporteAbierto` no es null y `esClicNormal(e)`, hacen `e.preventDefault()` + `irASeccion(id)`. En la página de inicio se comportan exactamente como hoy (no cambies el comportamiento del inicio; "Inicio" del navbar sigue llamando a `irAInicio`).
  - Enlace "Canchas" (navbar y footer): `href={rutaReserva(DEPORTES[0].slug)}` en vez de `#canchas-placeholder`. En el inicio, con clic normal: `preventDefault` + `abrirVista(DEPORTES[0].slug)`. En la página de reserva: `aria-current="page"` y el clic normal solo hace `preventDefault` + `window.scrollTo({ top: 0, behavior: reduced-motion ? 'auto' : 'smooth' })`.

B8. Enlaces de verdad para abrir la reserva (para que Ctrl+clic / clic medio abran otra pestaña):
  - DeporteHero.jsx: el CTA pasa a `href={rutaReserva(slug)}` y su `onClick` solo intercepta si `onVerCanchas && esClicNormal(e)`.
  - EventoCTA.jsx: el `<button>` "Reserva un evento" pasa a `<a className="button large evento-cta__boton" href={rutaReserva(DEPORTES[0].slug, 'torneo')} onClick={...esClicNormal → preventDefault + abrirVista(DEPORTES[0].slug, { modo: 'torneo' })}>` (mismas clases y texto; revisa que su CSS siga viéndose igual en un `<a>`).

B9. Chat:
  - src/components/chatbot/useAccionesChat.js: elimina `esperarCierreVista` y `cerrarVistaSiHaceFalta`. `irACanchas(slug)`: con `deporteAbierto` → `cambiarDeporte(slug)`, si no → `abrirVista(slug)`. `irAEventos()`: `abrirVista(DEPORTES[0].slug, { modo: 'torneo' })` (si ya estaba en la página, `apertura` la reinicia en modo torneo). `irAUbicacion()`: `irASeccion('ubicacion')`. Mantén la firma que usa AccionSeccion.jsx y actualiza el comentario.
  - src/components/chatbot/useDeporteActivo.js: el efecto del IntersectionObserver debe depender de `deporteAbierto` (al volver al inicio los heros se montan de nuevo y hay que observarlos otra vez). Actualiza el comentario ("la vista vive en un portal" ya no es cierto).

B10. vercel.json: agrega, sin tocar lo existente (`framework`, `functions`), `"rewrites": [{ "source": "/reservar/:path*", "destination": "/index.html" }]` para que recargar o abrir directo `/reservar/padel` en producción sirva la app (Vite dev y `vite preview` ya hacen ese fallback solos). No reescribas otras rutas (ni `/api`).

B11. Tests:
  - src/lib/rutas.test.js (ver B1).
  - src/App.test.jsx: conserva el smoke test y agrega uno que haga `window.history.pushState({}, '', '/reservar/padel')` antes de renderizar `<App />` y compruebe que aparece el título "Reserva tu cancha" (heading) y el enlace "Volver al inicio"; restaura la URL a '/' al terminar (afterEach). Usa `vi` de 'vitest' si necesitas mocks. src/setupTests.js ya simula matchMedia, IntersectionObserver, ResizeObserver, HTMLMediaElement y scrollTo.

B12. README.md:
  - Sección "Vista de canchas: la ventana de reserva": renómbrala a algo como "Página de reserva" y explica que es una página propia del sitio con su URL: cambia el ítem "URL compartible" para que diga que la página tiene su dirección (`/reservar/padel`, y `/reservar/padel?modo=torneo` en modo torneo), que se puede abrir en otra pestaña y que el botón "atrás" vuelve al inicio donde estabas. Ajusta el texto del carrusel: en fútbol la foto muestra también las características y la descripción.
  - Busca en todo el README y actualiza menciones a la vista "superpuesta"/"a pantalla completa"/hash `#canchas-…` (incluidos diagramas Mermaid y el árbol de estructura: `VistaCanchasContext.jsx` ahora sincroniza con la URL; agrega `src/lib/rutas.js` y `src/components/layout/PaginaInicio.jsx` donde corresponda).
  - NO toques las capturas (docs/capturas): las rehace otra persona. Sin menciones a IA ni a herramientas del flujo de desarrollo.

Verificación (corre tú estos comandos desde la raíz y corrige lo que falle):
- `npm run lint` (0 errores, 0 warnings)
- `npm test`
- `npm run build`
- Busca con grep que no queden referencias a `#canchas-placeholder`, `restaurarFoco`, `esperarCierreVista` ni `.vista-canchas__cerrar`.
- No arranques `npm run dev`, `vercel dev` ni `npm run preview` (el equipo tiene poca RAM).

Restricciones:
- NO hagas git add, commit, push ni git rm: solo edita/crea archivos en el disco. El control de versiones lo hace otra persona.
- No agregues dependencias ni cambies package.json.
- No cambies la lógica de reservas (ReservasContext, precios, validación, cancelación), el servidor (`api/`) ni las capturas.

Formato de salida: resumen breve con la lista de archivos creados/cambiados y qué hiciste en cada uno, cualquier decisión que hayas tenido que tomar distinta de lo pedido (y por qué), y el resultado de lint, test y build.

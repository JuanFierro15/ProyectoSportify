Rediseña el carrusel de fotos de la vista de reserva de canchas para que las FOTOS sean las protagonistas: sin el recuadro/escenario que lo rodea, sin fondos con degradado, tarjetas más grandes y mucho menos texto encima de la foto. Aplica los cambios directamente en los archivos.

Contexto:
- Proyecto: raíz del repositorio
- Stack: React 19 + Vite, Foundation (foundation-sites) para maquetación, GSAP. Sin TypeScript. Código, comentarios, props y estados en español (salvo DepthCarousel, que es un componente de React Bits con props en inglés).
- Archivos involucrados:
  - src/components/canchas/VistaCanchas.jsx (la vista de reserva; usa DepthCarousel y contiene también el componente VisorCancha, el visor de la foto en grande)
  - src/components/canchas/VistaCanchas.css
  - src/components/canchas/TexturaCancha.jsx (se elimina)
  - src/components/reactbits/DepthCarousel.jsx (componente de React Bits con "adiciones manuales" comentadas)
  - src/components/reservas/TarjetaCanchaCarrusel.jsx y .css (contenido que se pinta encima de cada tarjeta del carrusel vía renderOverlay)
  - README.md
- Fotos: public/img/canchas/<id>.webp (720x893) y <id>-lg.webp (1440x1786), verticales.

Situación actual (lo que hay que cambiar):
- En VistaCanchas.jsx, dentro de `.vista-canchas__cuerpo`, hay un `<div className="vista-canchas__escenario-fondo">` con la foto de la cancha activa muy difuminada (`.vista-canchas__backdrop`) y `<TexturaCancha>` (líneas de cancha en SVG). En pantalla se ve como una caja gris-azulada con esquinas redondeadas y degradado alrededor del carrusel. El usuario NO quiere ver ese encuadre ni ese degradado.
- `.vista-canchas` tiene `background: radial-gradient(...)` (degradado azul claro de toda la vista).
- La tarjeta activa mide `height: min(88cqh, 560px)` dentro de `.vista-canchas__cuerpo` (`height: clamp(420px, 62vh, 620px); container-type: size`). En 1440x900 queda de unos 396x491 px: muy chica.
- `.tarjeta-cancha` (TarjetaCanchaCarrusel.css) pinta un degradado oscuro (hasta 94 % de opacidad) sobre toda la foto, y en la tarjeta activa muestra características (badges), descripción, precio, disponibilidad y un botón: tapa media foto.
- DepthCarousel se encoge solo con `transform: scale(sc)`, donde `sc = clamp(anchoContenedor / (cardWidth + 2*spread + 120), 0.4, 1)`. En celular eso deja la tarjeta diminuta y un hueco vacío arriba y abajo, porque el scale no achica la caja de layout.

Requisitos:

1. Quitar el encuadre y los degradados de fondo
   - VistaCanchas.jsx: elimina el bloque `<div className="vista-canchas__escenario-fondo" ...>` completo (backdrop + TexturaCancha) y el import de TexturaCancha.
   - Borra el archivo src/components/canchas/TexturaCancha.jsx (no lo usa nadie más).
   - VistaCanchas.css: elimina `.vista-canchas__escenario-fondo`, `.vista-canchas__backdrop`, `@keyframes vista-canchas-backdrop-in`, `.vista-canchas__textura`, el `@media (max-width: 480px)` que solo ajustaba el escenario y las reglas que solo existían para quedar encima del escenario (`position: relative; z-index: 1` de `.vista-canchas__vacio, .vista-canchas__grid-estatico` y de `.vista-canchas__cuerpo > .depth-carousel`). Conserva el resto de `.vista-canchas__vacio`.
   - `.vista-canchas`: fondo blanco liso (`background: #ffffff;`), sin degradado ni la transición de background. Agrega `overflow-x: hidden;` (además del `overflow-y: auto` que ya tiene) para que las tarjetas laterales del carrusel que se salgan por la derecha en pantallas angostas se recorten en el borde de la ventana en vez de crear scroll horizontal.
   - NO toques `imagenPlaceholderCancha` (src/lib/canchas.js): es el respaldo para canchas sin foto y se queda.

2. Tarjetas más grandes (VistaCanchas.css)
   - `.vista-canchas__cuerpo` (mantén `position: relative`, `margin-bottom: 1rem` y `container-type: size`):
     - base (celular): `height: clamp(380px, 112vw, 600px);`
     - `@media screen and (min-width: 40em)`: `height: clamp(480px, 74vh, 800px);`
     - `@media screen and (min-width: 64em)`: `height: clamp(480px, 78vh, 820px);`
   - `.vista-canchas__cuerpo .depth-carousel__card`: `width: auto; aspect-ratio: 720 / 893;` y
     - base (celular): `height: min(92cqh, 102cqw, 760px);` (unos 82 % del ancho)
     - `@media screen and (min-width: 40em)`: `height: min(92cqh, 92cqw, 760px);`
     - sombra más suave para fondo blanco: `box-shadow: 0 28px 50px -28px rgba(15, 23, 42, 0.55), 0 10px 22px -14px rgba(15, 23, 42, 0.35);`
   - Puntos del carrusel debajo de la tarjeta, no encima de la foto, y con colores para fondo blanco (override desde VistaCanchas.css, sin tocar DepthCarousel.css):
     - `.vista-canchas__cuerpo .depth-carousel__dots { bottom: 2px; background: rgba(15, 23, 42, 0.06); backdrop-filter: none; }`
     - `.vista-canchas__cuerpo .depth-carousel__dot { background: rgba(15, 23, 42, 0.25); }`
     - `.vista-canchas__cuerpo .depth-carousel__dot.is-active { background: var(--accent, #1779ba); }`
   - Reemplaza la regla `.vista-canchas__cuerpo .tarjeta-cancha__nombre` por `font-size: clamp(1.25rem, 4.2cqh, 2rem);` y elimina la de `.vista-canchas__cuerpo .tarjeta-cancha__descripcion` (la descripción sale de la tarjeta).
   - Actualiza los comentarios del CSS que hablaban del escenario, del backdrop "del carrusel" o de los tamaños viejos (p. ej. el de `.vista-canchas__visor-fondo` dice "misma idea que el backdrop del carrusel": déjalo correcto sin mencionar algo que ya no existe).

3. DepthCarousel: prop nueva `autoScale` (src/components/reactbits/DepthCarousel.jsx)
   - Agrega `autoScale = true` a las props, con un comentario de "Adición manual" al estilo de las demás: con `false` el carrusel no se escala solo con transform según el ancho (scale fijo en 1) porque el consumidor dimensiona las tarjetas con CSS (container queries); con `true` (por defecto) el comportamiento es idéntico al original.
   - Inclúyela en `cfgRef.current` y úsala en el ResizeObserver: `scaleRef.current = cfg.autoScale ? clamp(w / needed, 0.4, 1) : 1;`.
   - No cambies nada más de la lógica del carrusel (layout 3D, arrastre, rueda, teclado, autoplay, visor).

4. Props del carrusel en VistaCanchas.jsx
   - Pasa `autoScale={false}`.
   - `cardWidth={420}` y `cardHeight={520}` (solo son respaldo sin container queries y la referencia del paso de arrastre/rueda; actualiza el comentario de arriba del CSS que lo explica si hace falta).
   - `radius={16}`, `falloff={0.18}`, `blur={3}` (antes 12, 0.32 y 10): así las tarjetas de los lados muestran la foto, un poco atenuada, en vez de un bloque oscuro. Deja `spread`, `depth`, `tilt` y `visibleCards` como están.
   - Actualiza `TAMANOS_IMAGEN_CARRUSEL` a `'(max-width: 639px) 82vw, 612px'` y su comentario (la tarjeta activa mide hasta 612 px de ancho: 760 px de alto x 720/893; en celular, unos 82 % del ancho).

5. Menos texto sobre la foto (TarjetaCanchaCarrusel.jsx y .css)
   - Arriba se queda la cabecera actual (chip del deporte y, en eventos, el check de "marcada").
   - Abajo, en la tarjeta activa, solo: nombre de la cancha, una fila con el precio por hora y la disponibilidad del día (mismo texto que hoy: "N de 13 horarios libres" o "Sin horarios libres ese día"), y debajo el botón "Agregar al evento"/"Quitar del evento" (modo evento) o la píldora "Cancha elegida" (modo cancha). En las tarjetas no activas, solo el nombre, como hoy.
   - Quita de la tarjeta las características (badges) y la descripción: elimina la variable `caracteristicasVisibles`, ese JSX y las reglas CSS `.tarjeta-cancha__badges`, `.tarjeta-cancha__badge` y `.tarjeta-cancha__descripcion`.
   - Degradado corto solo detrás del texto, no sobre toda la foto:
     - `.tarjeta-cancha`: sin `background` (quita el linear-gradient). Conserva el resto (flex column, space-between, padding 1.15rem, color blanco, text-shadow, pointer-events: none).
     - `.tarjeta-cancha__cuerpo`: quita `width: 100%` y agrega `margin: 0 -1.15rem -1.15rem; padding: 3.5rem 1.15rem 1.15rem; background: linear-gradient(to top, rgba(8, 10, 14, 0.85) 0%, rgba(8, 10, 14, 0.6) 45%, rgba(8, 10, 14, 0) 100%);` para que el degradado llegue a los bordes de la tarjeta y mida lo que mida el texto.
   - `.tarjeta-cancha__pie`: en fila (`flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 0.2rem 0.75rem;`), sin `border-top` ni `padding-top`.
   - El botón de evento conserva `pointer-events: auto`, `onPointerDown` con `stopPropagation` y el `aria-pressed`: no cambies su comportamiento.
   - Actualiza el comentario de cabecera del componente: ahora muestra deporte, nombre y, en la activa, precio, disponibilidad del día y la acción; las características y la descripción están en el visor en grande.

6. Visor en grande (componente VisorCancha dentro de VistaCanchas.jsx)
   - Agrega la descripción de la cancha, si existe, en `.vista-canchas__visor-info`, después de la lista de características y antes del botón: `<p className="vista-canchas__visor-descripcion">{cancha.descripcion}</p>`.
   - CSS: `.vista-canchas__visor-descripcion { margin: 0 0 1rem; font-size: 0.95rem; line-height: 1.5; color: rgba(255, 255, 255, 0.85); }`.

7. README.md (sección "Vista de canchas: la ventana de reserva")
   - Cambia el ítem "**Carrusel 3D** con la foto, las características, el precio y cuántos horarios libres tiene cada cancha el día elegido." por algo como: "**Carrusel 3D** con las fotos de las canchas en grande, el precio y cuántos horarios libres tiene cada una el día elegido."
   - Cambia el ítem del visor por: "**Visor en grande** de la foto, con las características, la descripción y su propio botón para elegir horario (o agregar la cancha al evento)."
   - No toques las capturas ni el resto del README. Sin menciones a IA ni a herramientas del flujo de desarrollo.

Reglas de estilo del proyecto:
- Textos visibles en español con tuteo ("Elige", "Reserva"); nada de copy técnico.
- Colores de deporte solo vía `var(--accent)`/`--accent-contrast` (los define `estiloAcento()`); no hardcodees colores de deporte.
- No crees componentes ni archivos nuevos. No cambies la lógica de reserva (useReserva, contexto, precios), los IDs de anclaje ni el visor salvo lo indicado.
- Mantén la densidad y el estilo de los comentarios existentes (comentarios en español que explican el porqué).

Verificación (corre tú estos comandos desde la raíz del proyecto y corrige lo que falle):
- `npm run lint` (deben quedar 0 errores y 0 warnings)
- `npm test`
- `npm run build`
- No arranques `npm run dev`, `vercel dev` ni `npm run preview` (el equipo tiene poca RAM).

Restricciones:
- NO hagas git commit, git push, git add ni git rm: solo edita y borra archivos en el disco. El control de versiones lo hace otra persona.
- No modifiques archivos fuera de los listados arriba.

Formato de salida: al final, un resumen breve con la lista de archivos cambiados/borrados, qué hiciste en cada uno y el resultado de lint, test y build.

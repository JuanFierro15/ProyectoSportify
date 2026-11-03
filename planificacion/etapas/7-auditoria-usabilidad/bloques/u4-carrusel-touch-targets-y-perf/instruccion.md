# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `GEMINI.md` (raíz; cada integrante lo
  tiene en local): léela antes de empezar y respétala. La parte del plan que
  te toca va copiada en tu tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.
# Tarea: scroll vertical sobre el carrusel, objetivos táctiles, ARIA, posters y `will-change` (`u4-carrusel-touch-targets-y-perf`)

> Versión corregida (31-10) contra el código real de la rama `usability-improve`. Reemplaza al
> borrador (`instruccion-borrador.md`). Cambios: la página de inicio está en
> `src/components/layout/PaginaInicio.jsx` (no en `src/pages/`), los posters ya existen (no hay
> "galería" en `deportes.js`) y el detalle en la tarjeta pasa a los tres deportes por decisión de
> Juan (31-10).

## Objetivo

Hallazgos `P0-02`, `P1-02` (carrusel y chat), `P1-08` (dots), `P2-01` y `P3-01`.

## Rutas

- Modificar: `src/components/reactbits/DepthCarousel.jsx`, `DepthCarousel.css`,
  `src/components/reactbits/AccordionGallery.css`, `src/components/chatbot/Chatbot.css`,
  `src/components/hero/DeporteHero.jsx`, `src/components/layout/PaginaInicio.jsx`,
  `src/data/deportes.js`.
- Ya existen (no los generes): `public/media/hero_futbol-poster.webp`,
  `public/media/hero_padel-poster.webp`, `public/media/hero_voleyplaya-poster.webp` (primer cuadro
  de cada video, 1280 px).
- No modifiques ningún otro archivo (otros agentes trabajan a la vez en `VistaCanchas.*`, el
  formulario, el navbar y la confirmación).

## Diseño

### 1. Rueda del ratón sobre el carrusel (P0-02): `DepthCarousel.jsx`

- En `onWheel` (cerca de la línea 216): antes de `e.preventDefault()`, si el gesto es vertical
  (`Math.abs(e.deltaY) >= Math.abs(e.deltaX)`) y no está pulsado `e.shiftKey`, `return` sin
  prevenir: la página baja normalmente. Con gesto horizontal (trackpad) o Shift + rueda, el
  carrusel se mueve como hoy (con Shift usa `deltaY` como desplazamiento).
- Actualiza el comentario de cabecera del archivo (lista de "agregados a mano") con este cambio.

### 2. Dots accesibles y objetivos táctiles (P1-08, P1-02)

- `DepthCarousel.jsx` (cerca de la línea 498): el contenedor de dots pasa de `role="tablist"` a
  `role="group"` con `aria-label="Elegir cancha"`; cada dot deja `role="tab"`/`aria-selected` y usa
  `aria-pressed={active === i}` y un `aria-label` "Ir a la cancha N de M" (si ya tiene uno con
  sentido, consérvalo).
- `DepthCarousel.css`:
  - `.depth-carousel__dot`: área clicable de mínimo 28×28 px (`min-width/min-height: 28px`,
    `display: inline-flex`, centrado, fondo transparente) y el punto visual de 8 px en `::after`
    (el estado activo cambia el `::after`). Conserva el aspecto actual del punto.
  - `.depth-carousel__arrow`: 44×44 px en todas las pantallas (revisa la regla de
    `max-width: 640px`).
  - `:focus-visible` con `outline: 2px solid var(--accent, #1779ba); outline-offset: 2px` en dots y
    flechas.
- `Chatbot.css`: `.chatbot__cabecera-boton` a 44×44 px (`2.75rem`), sin descuadrar la cabecera.

### 3. Detalle en la tarjeta para los tres deportes (P2-01): `deportes.js`

- Agrega `detalleEnTarjeta: true` también a `voley-playa` y `padel` (fútbol ya lo tiene) y
  actualiza el comentario que dice que es solo para fútbol. Revisa en
  `src/components/reservas/TarjetaCanchaCarrusel.jsx` (solo leer) que no haga falta nada más.

### 4. Posters de los heros (P3-01): `PaginaInicio.jsx` y `DeporteHero.jsx`

- `PaginaInicio.jsx`: junto a `VIDEOS` (cerca de la línea 19), un mapa `POSTERS` con
  `${BASE}media/hero_<nombre>-poster.webp` (mismos nombres de archivo que los videos), y pasar
  `posterSrc={POSTERS[d.slug]}` a cada `<DeporteHero>`.
- `DeporteHero.jsx`: prop nueva `posterSrc` (documentada en el comentario de props) y
  `poster={posterSrc}` en el `<video>`. No toques la lógica de scroll ni de `currentTime`.

### 5. `will-change` en reposo (P3-01)

- `AccordionGallery.css` (línea 37): `will-change: flex-grow, transform` → `will-change: transform`.
  Línea 63: `will-change: transform, filter` → `will-change: transform`.
- `DepthCarousel.css` (línea 50): `will-change: transform, opacity, filter` →
  `will-change: transform, opacity`.
- Actualiza el comentario de cabecera de `AccordionGallery` si lista estos agregados.

## Verificación al terminar

- `npm test` (todas en verde), `npm run lint` (0 errores, 0 warnings) y `npm run build`.
- No ejecutes `npm run dev` ni `npm run preview`.
- Responde con la lista de archivos cambiados y un resumen por punto (1 a 5).

> Nota: otros agentes editan otros archivos del proyecto al mismo tiempo. Si un test falla en un archivo que no es tuyo, menciónalo en tu respuesta y no lo arregles.

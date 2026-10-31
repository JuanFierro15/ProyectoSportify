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

# Tarea: scroll vertical en carrusel, touch targets, posters de video y `will-change` (`u4-carrusel-touch-targets-y-perf`)

## Objetivo

Resolver los hallazgos `P0-02`, `P1-02`, `P1-08` (en `DepthCarousel`), `P2-01` y `P3-01` de la auditoría de usabilidad:
1. Permitir el scroll vertical nativo de la página cuando el cursor está sobre `DepthCarousel`, interceptando el evento `wheel` únicamente cuando el gesto sea horizontal (`Math.abs(e.deltaX) > Math.abs(e.deltaY)`) o con `e.shiftKey` (`P0-02`).
2. Corregir la semántica ARIA de los indicadores de `DepthCarousel` (`role="group"` + `aria-pressed` en lugar de `role="tablist"` sin `tabpanel`) y ampliar el área táctil de los dots y flechas (`P1-02`, `P1-08`).
3. Subir el botón de cierre del Chatbot (`.chatbot__cabecera-boton`) a `44×44px` (`P1-02`).
4. Activar `detalleEnTarjeta: true` para todos los deportes en `src/data/deportes.js` para que las características de las canchas de Vóley Playa y Pádel también sean visibles en el carrusel (`P2-01`).
5. Añadir el atributo `poster` a los videos de `DeporteHero.jsx` y limpiar las propiedades costosas (`flex-grow`, `filter`) de `will-change` en `AccordionGallery.css` y `DepthCarousel.css` (`P3-01`).

## Rutas

- Modificar:
  - `src/components/reactbits/DepthCarousel.jsx`
  - `src/components/reactbits/DepthCarousel.css`
  - `src/components/reactbits/AccordionGallery.css`
  - `src/components/chatbot/Chatbot.css`
  - `src/components/hero/DeporteHero.jsx`
  - `src/pages/PaginaInicio.jsx`
  - `src/data/deportes.js`
- Prohibido modificar cualquier otro archivo fuera de la lista "Modificar".

## Diseño detallado

### 1. `src/components/reactbits/DepthCarousel.jsx` y `DepthCarousel.css`

- En `DepthCarousel.jsx`:
  - En el listener `onWheel`:
    - Calcula `const esGestoHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;`.
    - Si `!esGestoHorizontal`, retorna inmediatamente sin llamar a `e.preventDefault()`, permitiendo que la página haga scroll vertical normalmente.
  - En `.depth-carousel__dots`:
    - Usa `role="group"` en vez de `role="tablist"`, y en cada botón dot usa `aria-pressed={i === active}` en vez de `role="tab"` y `aria-selected`.
- En `DepthCarousel.css`:
  - Sube `.depth-carousel__arrow` en `@media (max-width: 640px)` a `width: 44px; height: 44px;`.
  - Amplía el área táctil de `.depth-carousel__dot` (`min-width: 28px; min-height: 28px; display: inline-flex; align-items: center; justify-content: center; background: transparent;`) dibujando el indicador visual en `.depth-carousel__dot::after`.
  - En `.depth-carousel__card`, cambia `will-change: transform, opacity, filter;` por `will-change: transform, opacity;`.

### 2. `src/components/reactbits/AccordionGallery.css` y `src/components/chatbot/Chatbot.css`

- En `AccordionGallery.css`: elimina `will-change: flex-grow;` en reposo de `.ag-panel`.
- En `Chatbot.css`: sube `.chatbot__cabecera-boton` a `width: 2.75rem; height: 2.75rem;` (`44×44px`).

### 3. `src/data/deportes.js`, `src/components/hero/DeporteHero.jsx` y `src/pages/PaginaInicio.jsx`

- En `src/data/deportes.js`: añade `detalleEnTarjeta: true` también en `voley-playa` y `padel`, y añade una propiedad `poster` en cada deporte apuntando a la primera imagen de su galería.
- En `DeporteHero.jsx` y `PaginaInicio.jsx`: pasa `poster={deporte.poster}` al elemento `<video>` de `DeporteHero`.

## Verificación al terminar

- Ejecuta `npx vitest run`, `npm run lint` y `npm run build`.
- Ejecuta `& "C:\Users\MIGUEL ANGEL\.gemini\antigravity-cli\skills\impeccable\scripts\impeccable.cmd" detect --json src` y verifica `0` hallazgos.

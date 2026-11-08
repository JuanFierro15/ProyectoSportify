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

# Tarea a1 — Accesibilidad de Mis reservas, navbar y heros (issue #14, specs S6 a S10)

Antes de editar, lee completos:

- `AGENTS.md` (raíz): guía del proyecto. Reemplaza a `GEMINI.md`.
- `odd/tasks/correcciones-auditoria-miguel.md` hasta `## Log` incluido. Tu tarea es **T2** y cubre **S6 a S10**.
- `planificacion/etapas/11-correcciones-auditoria-miguel/PLAN.md` (aprobado; si choca con la spec, manda el PLAN).
- La issue completa: `gh issue view 14` (solo lectura).
- `src/components/layout/MisReservas.jsx`, `MisReservas.test.jsx`, `Navbar.jsx`, `Navbar.css`, `Footer.jsx`, `src/components/hero/DeporteHero.jsx` y `DeporteHero.css`, y en `src/components/canchas/VistaCanchas.jsx` las pestañas de deporte (~210-240 y ~588-616: es el patrón a copiar).

## Archivos que puedes tocar

```
src/components/layout/MisReservas.jsx
src/components/layout/MisReservas.css
src/components/layout/MisReservas.test.jsx
src/components/layout/Navbar.jsx
src/components/layout/Navbar.css
src/components/layout/Navbar.test.jsx
src/components/layout/Footer.jsx
src/components/layout/useIrACanchas.js
src/components/hero/DeporteHero.jsx
src/components/hero/DeporteHero.css
README.md
```

En `README.md` solo la sección de accesibilidad (movimiento reducido). Nada fuera de la lista.

## Reglas

- Animaciones GSAP siempre dentro de `gsap.context()` (o `gsap.matchMedia()`) con `revert()` en el cleanup.
- Textos visibles en español con tuteo; no cambies textos existentes.
- Tests a través de la interfaz pública (roles y textos de Testing Library, no clases).
- No corras `npm run dev`, `vercel dev` ni `npm run preview`.
- Archivos temporales fuera del repositorio (`mktemp -d`); si dejas alguno, dime su ruta exacta.

## Qué hacer

### 1. Tests en RED (`MisReservas.test.jsx`)

Escribe primero y comprueba que **fallan** con el código actual (anota cuáles):

- **S6**: montado cerrado (`abiertoInicial={false}` o como lo monte el navbar), el foco **no** se mueve al botón disparador. Abrir y cerrar (botón de cerrar) devuelve el foco al disparador. Si hace falta, renderiza el botón disparador real del navbar o un botón con la misma ref que use el componente.
- **S7**: buscar por código, cerrar, volver a abrir: no aparecen los resultados ni el código escrito antes; la pestaña vuelve a la inicial.
- **S8**: las pestañas tienen `aria-controls` que apunta a un elemento con `role="tabpanel"` y `aria-labelledby` de la pestaña activa; solo la activa tiene `tabIndex=0`; flecha derecha/izquierda (circular), Inicio y Fin mueven el foco y activan la pestaña.
- Los tests que ya existen siguen pasando sin cambiarlos (prueban que el comportamiento previo se mantiene).

### 2. S6 y S7 en `MisReservas.jsx`

- Devuelve el foco al disparador solo en la transición abierto → cerrado (guarda el valor anterior de `abierto` en un `useRef`).
- Quita la rama muerta del efecto (~85-102): `dlg.close()` / `removeAttribute('open')` cuando `!abierto`. Deja solo lo que abre con `showModal()`.
- Al cerrar, reinicia todos los estados de la búsqueda (pestaña, inputs, errores, resultados, `qrVisibleId`, `cancelandoId`, `mensajeExito`, `errorCancelacion`) a sus valores iniciales. Una sola función de reinicio; `cambiarPestana` puede reutilizar la parte que ya reinicia.

### 3. S8: pestañas

Mismo patrón que las pestañas de deporte de `VistaCanchas.jsx`: `role="tablist"`, cada `role="tab"` con `id`, `aria-selected`, `aria-controls` y `tabIndex` móvil (0 la activa, -1 las otras), y un manejador de teclado con ArrowRight/ArrowLeft circulares, Home y End, `preventDefault` y foco a la pestaña nueva. El contenido de cada pestaña va en un `role="tabpanel"` con `id` y `aria-labelledby`.

### 4. S9: navbar

- `Navbar.css`: cuando el header está oculto (`.site-header--hidden`) y recibe foco (`:focus-within`), se muestra (`transform: none`). Agrega también una regla `prefers-reduced-motion: reduce` que quite su `transition` de transform.
- `useIrACanchas.js` (nuevo): hook con la lógica de `irACanchas` que hoy está duplicada en `Navbar.jsx` (~93-108) y `Footer.jsx` (~29-44). Ambos lo usan; borra las copias. Mismo comportamiento (incluido `esClicNormal`).
- Test nuevo `Navbar.test.jsx` (si el montaje con los proveedores es razonable): el header oculto que recibe foco en un enlace no tiene `aria-hidden` ni queda fuera del orden de Tab. Si jsdom no permite probar el CSS, prueba solo que el clic en "Canchas" del navbar y del footer navega igual que antes (`window.location.pathname` pasa a `/reservar/...`), y dilo en tu resumen.

### 5. S10: heros con movimiento reducido

- `DeporteHero.jsx` (~80-143): usa `gsap.matchMedia()` con `'(prefers-reduced-motion: no-preference)'` para crear el pin, la timeline con scrub y el seguimiento del video solo sin movimiento reducido. Con movimiento reducido no hay pin ni scrub: el contenido del hero se ve en su estado final (visible, sin escala ni fade pendientes) y el video queda en su primer cuadro (o el `poster`), sin reproducirse.
- Revisa que `#hero-placeholder`, el degradado de salida y el Navbar (que mira cuándo se pasó de los heros) sigan funcionando sin pin: el hero mide al menos `100vh`.
- `README.md`, sección de accesibilidad (~525-535): agrega que con movimiento reducido los heros no se fijan ni se animan con el scroll. Nada más del README.

## Verificación

Corre, en primer plano, y responde con `<comando>: <resultado observado>` de cada uno:

- `npx vitest run src/components/layout/`
- `npm test`
- `npm run lint`

Si algo falla, corrígelo dentro de los archivos permitidos. Al final responde con: archivos cambiados, tests que fallaron en RED, qué spec (S6-S10) cubriste y cualquier ruta temporal que hayas dejado.


# Tarea p1 — Página de reserva: carrusel, scroll-snap, pestañas y movimiento reducido (issue #15, specs S11 a S14)

Antes de editar, lee completos:

- `AGENTS.md` (raíz): guía del proyecto. Reemplaza a `GEMINI.md`. Lee la parte de `VistaCanchas` y del carrusel.
- `odd/tasks/correcciones-auditoria-miguel.md` hasta `## Log` incluido. Tu tarea es **T3** y cubre **S11 a S14**.
- `planificacion/etapas/11-correcciones-auditoria-miguel/PLAN.md` (aprobado; si choca con la spec, manda el PLAN).
- La issue completa: `gh issue view 15` (solo lectura).
- `src/components/canchas/VistaCanchas.jsx` (sobre todo ~210-290, ~430-460 y ~585-630), `VistaCanchas.css` (~820-860), `src/components/reactbits/DepthCarousel.jsx`, `src/components/shared/SelectorDia.jsx` y `SelectorDia.css`, y `src/components/reservas/torneo/Bracket.jsx` y `Bracket.css` (la vista `.bracket-torneo__movil`).

## Archivos que puedes tocar

```
src/components/canchas/VistaCanchas.jsx
src/components/canchas/VistaCanchas.css
src/components/canchas/VistaCanchas.test.jsx
src/components/reactbits/DepthCarousel.jsx
src/components/reactbits/DepthCarousel.test.jsx
src/components/shared/SelectorDia.jsx
src/components/shared/SelectorDia.css
src/components/reservas/torneo/Bracket.jsx
src/components/reservas/torneo/Bracket.css
```

En `Bracket.jsx` y `Bracket.css` solo lo del scroll-snap (S12): otro compañero limpia esos archivos en paralelo. Nada fuera de la lista.

## Reglas

- Tests a través de la interfaz pública (roles y textos de Testing Library, no clases).
- No cambies textos visibles ni el aspecto con movimiento normal.
- No corras `npm run dev`, `vercel dev` ni `npm run preview` (la prueba en el navegador la hace otro agente después).
- Archivos temporales fuera del repositorio (`mktemp -d`); si dejas alguno, dime su ruta exacta.

## Qué hacer

### 1. Tests en RED

Escribe primero y comprueba que **fallan** con el código actual (anota cuáles):

- **S11** en `DepthCarousel.test.jsx` (nuevo): monta `DepthCarousel` con 5 ítems e `initialIndex={4}` y un `renderOverlay` que pinte "activa" cuando su tercer argumento (`esActiva`) es true; vuelve a renderizar con 2 ítems: tiene que haber exactamente una tarjeta activa (y un punto con `aria-pressed="true"`). Caso previo que debe seguir: con 5 ítems, `initialIndex={2}` deja activa la tercera.
- **S11** en `VistaCanchas.test.jsx` (nuevo; mira cómo monta los proveedores `src/components/reservas/Torneo.test.jsx` y `src/App.test.jsx`, y fija el reloj con `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(new Date('2026-11-09T07:00:00'))`): en `/reservar/padel` (o el deporte con 3 o más canchas que use carrusel), con ocupación que deje sin horarios libres alguna cancha ese día, activar "Solo con horarios libres ese día" deja una tarjeta activa con su acción visible ("Cancha elegida" o el botón del visor). Si montar `VistaCanchas` completo no es razonable en jsdom, quédate con el test de `DepthCarousel` y dilo en el resumen.
- **S13** en `VistaCanchas.test.jsx`: cada pestaña de deporte tiene `aria-controls` que apunta a un elemento `role="tabpanel"` con `aria-labelledby` igual al `id` de la pestaña activa. Las flechas siguen funcionando como hoy (prueba que el comportamiento previo se mantiene).

### 2. S11: carrusel

- `VistaCanchas.jsx` (~437-458): la `key` del `DepthCarousel` incluye además los ids de la lista que recibe (por ejemplo `canchasFiltradas.map((c) => c.id).join(',')`), para que se remonte centrado en la cancha elegida cuando el filtro o el día cambian la lista. Comprueba qué pasa con `initialIndex` si la cancha elegida no está en la lista filtrada: tiene que caer en un índice válido (0).
- `DepthCarousel.jsx` (~368-370): cuando cambia `count`, si el índice activo/posición quedó `>= count`, acótalo a `count - 1` (posición, foco y `active`), y luego `layout`. Mantén el comentario de cabecera que lista lo agregado a mano: añade esta línea.

### 3. S12: scroll-snap

- `SelectorDia.css`: `scroll-snap-type: x proximity` en la tira con scroll horizontal de `.selector-dia` y `scroll-snap-align: start` en cada día.
- `Bracket.css`: lo mismo en `.bracket-torneo__movil` (rondas de izquierda a derecha en celular), con `scroll-snap-align: start` en cada ronda. Si la vista móvil no tiene un elemento por ronda donde poner el `align`, dilo en el resumen y no inventes estructura nueva (toca `Bracket.jsx` solo si hace falta una clase en la ronda).
- Con `prefers-reduced-motion` no hay que cambiar nada del snap (no anima).

### 4. S13: pestañas de deporte

- `VistaCanchas.jsx` (~588-616): cada `role="tab"` con `id` estable (por ejemplo `pestana-deporte-<slug>`) y `aria-controls` hacia el panel. El contenido que filtran las pestañas (filtro + carrusel/grid) va dentro de un elemento `role="tabpanel"` con `id` y `aria-labelledby` de la pestaña activa (`tabIndex={0}` si el panel no tiene nada enfocable al principio; si lo tiene, sin `tabIndex`). Siguen siendo enlaces con `href` real (Ctrl+clic). No cambies el manejo de teclado que ya existe.

### 5. S14: movimiento reducido

- `VistaCanchas.css` (~840-853): quita el reset universal sobre `.vista-canchas *` y pon reglas puntuales dentro de `@media (prefers-reduced-motion: reduce)` que quiten las transiciones de movimiento: `transform` (y el `box-shadow` que lo acompaña) en `.cancha-card` (~412), `.vista-canchas .cancha-card.vista-canchas__card-estatica` (~458), `.vista-canchas__visor-contenido` (~667), `.vista-canchas__visor-cta` (~792), el `transition: all` de `.vista-canchas .button.hollow:not(...)` (~942, que quede solo en color/fondo/borde), el `max-width` de `.vista-canchas__confirmacion` (~554) y el `left` del `.switch-paddle::after` (~281). Conserva `.cancha-card:hover { transform: none }` y las reglas de `.vista-canchas__visor` que ya existen (~831-836). Las transiciones de color pueden quedarse.
- Revisa en `DepthCarousel.jsx` que el Ken Burns y el movimiento del carrusel ya respetan `prefers-reduced-motion` (AGENTS.md dice que sí); si algo dependía del reset universal (alguna `animation` definida en `DepthCarousel.css` u otro archivo bajo `.vista-canchas`), cúbrelo con una regla puntual en `VistaCanchas.css` y dilo en el resumen.

## Verificación

Corre, en primer plano, y responde con `<comando>: <resultado observado>` de cada uno:

- `npx vitest run src/components/reactbits/ src/components/canchas/`
- `npm test`
- `npm run lint`
- `npm run build`

Si algo falla, corrígelo dentro de los archivos permitidos. Al final responde con: archivos cambiados, tests que fallaron en RED, qué spec (S11-S14) cubriste y cualquier ruta temporal que hayas dejado.

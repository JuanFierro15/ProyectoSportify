# Tarea: contraste WCAG AA, foco visible, movimiento reducido y antipatrón `side-tab` (`u3-accesibilidad-contraste-y-tokens`)

> Versión corregida (31-10) contra el código real de la rama `usability-improve`. Reemplaza al
> borrador (`instruccion-borrador.md`). Cambios frente al borrador: no existe el detector
> `impeccable` en esta máquina (se verifica con búsqueda), la regla de movimiento reducido **no**
> puede forzar `transform: none` (rompería el carrusel) y los tamaños táctiles del carrusel y del
> chat van en u4.

## Objetivo

Hallazgos `P1-01`, `P1-03`, `P1-05`, `P2-04` (parte de `SelectorDia` y `Bracket`) y `P2-06`.

## Rutas

- Modificar: `src/lib/canchas.js`, `src/lib/canchas.test.js` (solo si ya prueba `estiloAcento`, o
  agrega el caso), `src/components/reservas/torneo/Bracket.css`,
  `src/components/reservas/FormularioReserva.css`, `src/components/reservas/CanchasElegidas.css`,
  `src/components/reservas/SelectorModo.css`, `src/components/canchas/VistaCanchas.css`,
  `src/components/shared/SelectorDia.css`.
- No modifiques ningún otro archivo (otros agentes trabajan a la vez en `VistaCanchas.jsx`,
  `DepthCarousel.*`, `Chatbot.css`, el navbar y la confirmación).

## Diseño

### 1. Token de texto con contraste: `src/lib/canchas.js`

- `estiloAcento(acento)` es la única función que arma el estilo del acento. Agrega
  `'--accent-text': color-mix(in srgb, ${color} 50%, #0f172a)` al objeto. Con los tres acentos de
  `src/data/deportes.js` (`#f6a94b`, `#3fa9f5`, `#5bd67d`) y con el azul por defecto, da más de
  4,5:1 sobre blanco.
- Test en `canchas.test.js`: `estiloAcento('#5bd67d')['--accent-text']` contiene `color-mix` y
  `#0f172a`.
- `src/App.css` no está en tus rutas: no definas el token en `:root`. Usa siempre el respaldo
  `var(--accent-text, var(--accent, #1779ba))`.

### 2. Usar `--accent-text` cuando el acento es texto sobre fondo claro

Busca con `grep -n "color: var(--accent" src/components` dentro de tus archivos. Cambia a
`var(--accent-text, var(--accent))` solo cuando el texto va sobre fondo blanco o `--accent-soft`:
`.vista-canchas__badge`, `.bracket-torneo__badge`, `.bracket-torneo__ronda-fecha`,
`.calendario-torneo__badge`, `.formulario-reserva .button.hollow` (texto y borde), y
`.formulario-reserva__rango` (agregado en u1). No lo cambies en fondos oscuros ni en el texto sobre
el propio acento (ahí va `--accent-contrast`).

### 3. Foco visible (P1-03)

- Busca `outline: none` / `outline: 0` en tus archivos. Donde exista, conserva el quitar el
  contorno solo para `:focus:not(:focus-visible)` y agrega
  `:focus-visible { outline: 2px solid var(--accent-text, var(--accent, #1779ba)); outline-offset: 2px; }`.
- Como mínimo: `.formulario-reserva__hora`, `.selector-dia__opcion`, los botones de
  `SelectorModo`, `.canchas-elegidas__quitar`, `.canchas-elegidas__todas` y
  `.vista-canchas__visor-cerrar`.
- `.formulario-reserva__input:focus`: `border-color: var(--accent, #1779ba)` y
  `box-shadow: 0 0 0 3px var(--accent-soft, rgba(23, 121, 186, 0.14))` en vez de los colores fijos.

### 4. Movimiento reducido (P1-05): `VistaCanchas.css`

- El bloque `@media (prefers-reduced-motion: reduce)` (cerca de la línea 637) pone
  `transition-duration: 0.001ms !important` a todos los descendientes. Cámbialo así:
  - Conserva `animation-duration: 0.001ms !important` y `animation-iteration-count: 1 !important`
    (para el Ken Burns y cualquier keyframe).
  - Quita el `transition-duration` universal y, en su lugar, limita las transiciones a color y
    opacidad: `transition-property: color, background-color, border-color, opacity, box-shadow !important;`.
  - **No** pongas `transform: none` en selectores generales: `DepthCarousel` posiciona las tarjetas
    con `transform` en línea y se rompería. Deja las reglas puntuales que ya existen
    (`.cancha-card:hover { transform: none; }`).

### 5. Antipatrón `side-tab` (P2-06): `Bracket.css`

- `.alerta-tiempo` (cerca de la línea 12) usa `border-left: 4px solid #f59e0b`. Cámbialo por
  `border: 1px solid rgba(245, 158, 11, 0.45)` y `border-radius` coherente con los callouts.
  Verifica que no quede ningún `border-left` de 3 px o más en tus archivos:
  `grep -rnE "border-(left|right): *[3-9]px" src`.

### 6. Tiras horizontales y chips (P2-04, P1-02 parcial)

- `.selector-dia`: `scroll-snap-type: x proximity`; `.selector-dia__opcion`: `scroll-snap-align: start`.
- `.bracket-torneo__rondas`: `scroll-snap-type: x proximity`; `.bracket-torneo__ronda`:
  `scroll-snap-align: start`.
- `.canchas-elegidas__quitar`: área de 28×28 px (`width/height: 1.75rem`, centrado con flex) dentro
  de chips de `min-height: 2.375rem`.
- `.vista-canchas__visor-cerrar`: 44×44 px (`2.75rem`).

## Verificación al terminar

- `npm test` (todas en verde) y `npm run lint` (0 errores, 0 warnings).
- `grep -rnE "border-(left|right): *[3-9]px" src` sin resultados en tus archivos.
- No ejecutes `npm run dev` ni `npm run preview`.
- Responde con la lista de archivos cambiados y un resumen por punto (1 a 6).


# Tarea r1 — Tema oscuro, navbar, encabezado, modos, pestañas y carrusel

Antes de editar, lee completos:

- `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (secciones A, B, C1 a C5 y D).
- `planificacion/etapas/9-rediseno-pagina-de-reserva/PLAN.md` (secciones E4, E5, "Tokens", "Textos e íconos" y la fila `r1` de los bloques).
- La maqueta `planificacion/etapas/9-rediseno-pagina-de-reserva/referencia/cancha.html` (referencia visual; si choca con el PROMPT o el PLAN, mandan ellos).

Si el PROMPT y el PLAN no coinciden, manda el PLAN (está aprobado). En particular: el texto de una hora reservada será `#808080` (token `--reserva-reservada`), no `#7a7a7a`.

## Qué hacer (solo este bloque)

1. **Tokens** en `src/App.css`, dentro del `:root` que ya existe, junto a `--eventos-fondo`: todos los de la tabla "Tokens" del PLAN, con esos nombres y valores. Úsalos desde ahí en todo lo demás.
2. **Fondo y texto de la página de reserva**: `.vista-canchas` con fondo `var(--reserva-fondo)` y texto `var(--reserva-texto)`. Dentro de `.vista-canchas` sobrescribe `--accent-text: var(--accent)`. No toques `estiloAcento` ni nada de `src/lib/`.
3. **Overrides de Foundation** dentro de `.vista-canchas` (ver PLAN E4): `fieldset`, `legend`, `label`, `select`, `input`, `button`, `details`, `summary`, `tabs`, `tabs-title`, `switch`, `button hollow/small`, `callout alert/warning`, `form-error`, `card cancha-card`. Que nada quede blanco ni con texto azul de Foundation. No toques `foundation-sites`.
4. **C1 Navbar**: en `src/components/layout/Navbar.jsx` agrega la clase `site-header--reserva` al header cuando `deporteAbierto` no es nulo (ya lo lee de `useVistaCanchas()`). En `Navbar.css`, `.site-header.site-header--reserva`: fondo `#0d0d0d`, borde inferior `1px solid #262626`, enlaces `#f2f2f2`, "Mis reservas" con borde. Las reglas de `--scrolled` usan `!important`: las tuyas también, con más especificidad. El inicio no debe cambiar.
5. **C2 Encabezado** (`VistaCanchas.jsx` / `.css`):
   - Franja de 320 px (260 px en modo torneo) con la foto grande de la cancha activa (`imagenGrandeCancha` de `src/lib/canchas.js`; en modos de evento sin cancha elegida, la primera cancha de la pestaña visible), y un velo con degradado que termina en `#0d0d0d` sin línea de corte.
   - Dentro: "Volver al inicio", el `h1` del modo en 52 px negrilla (más chico en celular, con `clamp`), el subtítulo del modo y debajo el selector de modo.
   - Subtítulos (PLAN, "Textos e íconos"). Cancha: "Elige la cancha, el día y hasta 3 horas seguidas." usando `MAX_HORAS_SEGUIDAS` de `src/lib/precios.js`. Torneo: "Elige hasta 3 canchas de un deporte, el formato y la fecha de cada fase." usando `MAX_CANCHAS_TORNEO` de `src/lib/torneo.js`. Cumpleaños: "Elige las canchas, el día, el horario y cuántos invitados vienen."
   - El `h1` recibe foco programático al cargar: quita el contorno con `:focus:not(:focus-visible)` y deja el foco visible con teclado (`:focus-visible`).
6. **C3 Selector de modo** (`SelectorModo.jsx` / `.css`): control segmentado, contenedor `rgba(20, 20, 20, 0.85)`, borde `#333333`, radio 12 px; botones de 44 px de alto con ícono de `lucide-react` + texto: `LandPlot` (Cancha), `Trophy` (Torneo), `Cake` (Cumpleaños), íconos con `aria-hidden="true"`. Activo: fondo `#f2f2f2`, texto `#0d0d0d`. Conserva roles, textos y `aria-pressed`/lo que exista hoy.
7. **C4 Pestañas de deporte**: subrayado de 3 px del `colorAcento` de cada deporte en la activa (usa el acento que ya se pasa por estilo; no escribas colores de deporte a mano), inactivas en `#a8a8a8`, línea base de la fila `#262626`. El filtro "Solo con horarios libres ese día" a la derecha en la misma fila (debajo en celular). Conserva TODO lo de `z2`: `role`, `tabIndex` móvil, flechas, Inicio, Fin y `href`.
8. **C5 Carrusel**: solo CSS de flechas y puntos de `DepthCarousel` (fondo `#1c1c1c`, borde `#444444`, ícono blanco). No cambies su lógica ni la tarjeta. Si el fondo blanco del carrusel o del grid choca, pásalo al fondo de la página.
9. Objetivos táctiles de 44 px como mínimo y `:focus-visible` en todo control que toques. Contraste 4,5:1 en todo texto.

## Archivos que puedes editar

- `src/App.css`
- `src/components/layout/Navbar.jsx`, `src/components/layout/Navbar.css`
- `src/components/canchas/VistaCanchas.jsx`, `src/components/canchas/VistaCanchas.css`
- `src/components/reservas/SelectorModo.jsx`, `src/components/reservas/SelectorModo.css`
- `src/components/reactbits/DepthCarousel.css`
- `src/components/reservas/TarjetaCanchaCarrusel.css` (solo si hace falta para el fondo)

No toques `src/lib/`, `src/data/`, `src/context/`, `api/`, `useReserva.js`, la página de inicio, el chat, "Mis reservas" ni el footer. No toques los componentes de los bloques siguientes (`FormularioReserva`, `SelectorDia`, `VoucherReserva`, `ConfirmacionReserva`, `torneo/*`): de ellos solo cambia lo que hereden de los overrides del punto 3.

## Reglas

- Conserva clases, roles y textos que usan las pruebas (`App.test.jsx`: heading "Reserva tu cancha" y enlace "Volver al inicio"; `Torneo.test.jsx`).
- Sin dependencias ni tipografías nuevas. Animaciones: solo las que ya existen.
- Textos con tuteo, sin detalles de implementación.
- Al terminar corre `npm test` y `npm run lint` (sin `dev`, `preview` ni `vercel dev`) y reporta el resultado.

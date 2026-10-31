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

# Tarea: accesibilidad WCAG AA, contraste de acentos, `:focus-visible` y limpieza de antipatrón (`u3-accesibilidad-contraste-y-tokens`)

## Objetivo

Resolver los hallazgos `P1-01`, `P1-03`, `P1-05`, `P1-08` (parte CSS) y `P2-06` de la auditoría de usabilidad (`impeccable`):
1. Añadir el token `--accent-text` en `estiloAcento()` (`src/lib/canchas.js`) usando `color-mix(in srgb, ${color} 50%, #0f172a)` para garantizar un contraste `>= 4.5:1` (WCAG AA) cuando se usa el color del deporte como texto sobre fondos claros (`P1-01`).
2. Añadir `:focus-visible { outline: 2px solid var(--accent, #1779ba); outline-offset: 2px; }` en los botones de hora, día y modo (`P1-03`).
3. Corregir la regla `@media (prefers-reduced-motion: reduce)` en `VistaCanchas.css` para que desactive las transformaciones espaciales sin anular con `0.001ms !important` las transiciones de color/opacidad de todos los descendientes (`P1-05`).
4. Eliminar el antipatrón `side-tab` (`border-left: 4px solid #f59e0b`) en `src/components/reservas/torneo/Bracket.css` para que `impeccable detect --json src` devuelva `0` hallazgos (`P2-06`).
5. Subir el tamaño táctil de `.canchas-elegidas__quitar` a `28×28px` y `.vista-canchas__visor-cerrar` a `44×44px` (`P1-02` parcial) y añadir `scroll-snap-type: x proximity` en `.selector-dia` y `.bracket-torneo__rondas` (`P2-04`).

## Rutas

- Modificar:
  - `src/lib/canchas.js`
  - `src/components/reservas/torneo/Bracket.css`
  - `src/components/reservas/FormularioReserva.css`
  - `src/components/reservas/CanchasElegidas.css`
  - `src/components/reservas/SelectorModo.css`
  - `src/components/canchas/VistaCanchas.css`
  - `src/components/shared/SelectorDia.css`
- Prohibido modificar cualquier otro archivo fuera de la lista "Modificar".

## Diseño detallado

### 1. `src/lib/canchas.js`

- En `estiloAcento(color)`:
  - Añade `'--accent-text': 'color-mix(in srgb, ' + color + ' 50%, #0f172a)'` al objeto devuelto.

### 2. `src/components/reservas/torneo/Bracket.css`

- En `.alerta-tiempo`:
  - Reemplaza `border-left: 4px solid #f59e0b;` por `border: 1px solid rgba(245, 158, 11, 0.45);` y `box-shadow: inset 0 2px 0 rgba(245, 158, 11, 0.35);` (sin `border-left` >= 3px para cumplir `impeccable detect`).
- En `.bracket-torneo__badge`, `.bracket-torneo__ronda-fecha` y `.calendario-torneo__badge`:
  - Usa `color: var(--accent-text, var(--accent, #1779ba));`.
- En `.bracket-torneo__rondas`:
  - Añade `scroll-snap-type: x proximity;` y `scroll-snap-align: start;` en `.bracket-torneo__ronda`.

### 3. `src/components/reservas/FormularioReserva.css`, `SelectorModo.css`, `CanchasElegidas.css` y `SelectorDia.css`

- En `FormularioReserva.css`:
  - En `.formulario-reserva .button.hollow`: usa `color: var(--accent-text, var(--accent, #1779ba));`.
  - En `.formulario-reserva__hora:focus-visible`: añade `outline: 2px solid var(--accent, #1779ba); outline-offset: 2px;`.
  - En `.formulario-reserva__input:focus`: usa `border-color: var(--accent, #1779ba); box-shadow: 0 0 0 3px var(--accent-soft, rgba(23, 121, 186, 0.14));`.
- En `SelectorModo.css` y `SelectorDia.css`:
  - Añade `:focus-visible { outline: 2px solid var(--accent, #1779ba); outline-offset: 2px; }`.
  - En `.selector-dia` añade `scroll-snap-type: x proximity;` y en `.selector-dia__opcion` añade `scroll-snap-align: start;`.
- En `CanchasElegidas.css`:
  - Sube `.canchas-elegidas__quitar` a `width: 1.75rem; height: 1.75rem;`.

### 4. `src/components/canchas/VistaCanchas.css`

- En `.vista-canchas__badge`: usa `color: var(--accent-text, var(--accent));`.
- En `.vista-canchas__visor-cerrar`: sube `width: 2.75rem; height: 2.75rem;` (`44×44px`).
- En `@media (prefers-reduced-motion: reduce)`: reemplaza el selector universal `.vista-canchas *` con `0.001ms !important` por reglas específicas que desactiven `transform` sin romper las transiciones suaves de color/opacidad.

## Verificación al terminar

- Ejecuta `& "C:\Users\MIGUEL ANGEL\.gemini\antigravity-cli\skills\impeccable\scripts\impeccable.cmd" detect --json src` y verifica que devuelva `[]` (exit code `0`).
- Ejecuta `npx vitest run` y `npm run lint`.

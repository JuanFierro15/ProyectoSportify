# Mediciones antes y después — Bloque `p1-chips-y-carrusel` (14-11-2026)

Medido sobre el build de producción servido con `npm run preview` (`http://localhost:4173`) mediante Chrome headless por CDP (`revision/p1-prueba.mjs`), en los viewports `390×844` (`deviceScaleFactor: 2`, táctil) y `1440×900` (`deviceScaleFactor: 1`). Datos crudos en `p1-resultado-antes.json` y `p1-resultado.json`.

Nota sobre rutas: el slug real de vóley playa en `src/data/deportes.js` es `voley-playa` (`/reservar/voley-playa`); `/reservar/voley` redirige a `/`.

## P1 — Chips de sugerencias del chat (`.chatbot__chip`)

Cambio aplicado en `src/components/chatbot/Chatbot.css`: `min-height: 44px`, `display: inline-flex`, `align-items: center`, `justify-content: center` (sin pseudo-elementos `::after` y sin cambiar colores ni `font-size`).

| Viewport | Chips | Alto antes | Alto después | Tapa `.chatbot__input` o `.chatbot__enviar` |
| --- | --- | --- | --- | --- |
| `390×844` | Iniciales (3 chips, 2 filas) | `26.3 px` | `44 px` | No (`bottom` máx. `776 px`, `inputTop` `788 px`) |
| `390×844` | Simulados `["A", "B", "C"]` | — | `44 px` | No (`bottom` `776 px`, `inputTop` `788 px`) |
| `1440×900` | Iniciales (3 chips, 2 filas) | `26.3 px` | `44 px` | No (`bottom` máx. `739 px`, `inputTop` `751 px`) |
| `1440×900` | Simulados `["A", "B", "C"]` | — | `44 px` | No (`bottom` `739 px`, `inputTop` `751 px`) |

Clics con `window.fetch` interceptado (3 llamadas simuladas por viewport, sin tráfico a Gemini):
- Al hacer clic en el segundo chip (`"B"`) y en el último (`"C"`), el último mensaje del usuario enviado coincide con `"B"` y `"C"` en ambos viewports.

## P6 — Pastilla de puntos del carrusel (`.vista-canchas__cuerpo .depth-carousel__dots`)

### ¿Requirió cambio?
**Sí.** Antes del ajuste (`bottom: 2px`), la pastilla de `50 px` de alto tapaba el borde inferior de la tarjeta activa (`-22.3 px` a `390×844` y `-28 px` a `1440×900`) y quedaba superpuesta al botón de la tarjeta (`-3.9 px` a `390×844` y `-9.6 px` a `1440×900`).

### Cambio aplicado en `src/components/canchas/VistaCanchas.css`
- `.vista-canchas__cuerpo`: `margin-bottom` de `1rem` a `3.75rem` para reservar espacio bajo la pastilla sin que toque `CanchasElegidas` ni `FormularioReserva`.
- `.vista-canchas__cuerpo .depth-carousel__dots`: `bottom` de `2px` a `-40px`.

### Comparativa antes / después

Distancias verticales (`distDotsCard = dots.top - card.bottom`; `distDotsBtn = dots.top - btn.bottom`; valores negativos indican solape).

| Vista | Viewport | `distDotsCard` antes | `distDotsBtn` antes | `distDotsCard` después | `distDotsBtn` después | Espacio bajo pastilla (`distSiguienteDots`) | Gap a flechas | `scrollWidth === innerWidth` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/reservar/padel` | `390×844` | `-22.3 px` | `-3.9 px` | `+19.7 px` | `+38.1 px` | `+20 px` | `50 px` izq / `50 px` der | Sí (`390`) |
| `/reservar/voley-playa` | `390×844` | `-22.3 px` | `-3.9 px` | `+19.7 px` | `+38.1 px` | `+20 px` | `50 px` izq / `50 px` der | Sí (`390`) |
| `/reservar/futbol` | `390×844` | `-22.3 px` | `-3.9 px` | `+19.7 px` | `+38.1 px` | `+20 px` | `50 px` izq / `50 px` der | Sí (`390`) |
| `/reservar/padel?modo=torneo` | `390×844` | `-22.3 px` | `-3.9 px` | `+19.7 px` | `+38.1 px` | `+20 px` | `50 px` izq / `50 px` der | Sí (`390`) |
| `/reservar/padel` | `1440×900` | `-28 px` | `-9.6 px` | `+14 px` | `+32.4 px` | `+20 px` | `264 px` izq / `264 px` der | Sí (`1440`) |
| `/reservar/voley-playa` | `1440×900` | `-28 px` | `-9.6 px` | `+14 px` | `+32.4 px` | `+20 px` | `264 px` izq / `264 px` der | Sí (`1440`) |
| `/reservar/futbol` | `1440×900` | `-28 px` | `-9.6 px` | `+14 px` | `+32.4 px` | `+20 px` | `264 px` izq / `264 px` der | Sí (`1440`) |
| `/reservar/padel?modo=torneo` | `1440×900` | `-28 px` | `-9.6 px` | `+14 px` | `+32.4 px` | `+20 px` | `264 px` izq / `264 px` der | Sí (`1440`) |

### Interacción y `prefers-reduced-motion: reduce`
- Clic en los puntos `[1, 2, 2]` (segundo, último y último otra vez): `aria-pressed="true"` quedó en `[1, 2, 2]` en todas las vistas y viewports.
- Con `Emulation.setEmulatedMedia` (`prefers-reduced-motion: reduce`) en `390×844` (`/reservar/padel` y chat): `imgAnim: "none"`, `dotTrans: "0s"`, `dotAfterTrans: "0s"`, `chipTrans: "0s"`, `chipHeight: 44`, sin desborde horizontal (`scrollWidth === innerWidth`) y 0 errores de consola o excepciones.

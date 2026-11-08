# Reporte p1 — Página de reserva (issue #15)

Rama `fix/pagina-reserva-carrusel`. Escribió agy `gemini-3.8-flash-high` (un intento, 16 min) más una corrección (`correccion.md`); verificó un subagente independiente en lugar de Argon.

## Commits

| Commit | Qué |
| --- | --- |
| `daa308e` | `key` del carrusel con los ids de la lista filtrada y `DepthCarousel` acota el índice cuando cambia `count` (S11); pestañas de deporte con `id`, `aria-controls` y panel `role="tabpanel"` con `aria-labelledby` (S13) |
| `dfb874f` | `scroll-snap-type: x proximity` en `.bracket-torneo__movil` y `scroll-snap-align: start` en los encabezados de ronda (S12) |
| `5331437` | Sin el reset universal sobre `.vista-canchas *`: reglas puntuales de movimiento reducido para tarjetas, CTA del visor, botones `hollow`, confirmación y switch (S14) |

## Verificación

- `npm test`: 22 archivos, 235 tests. `npm run lint`: 0 warnings. `npm run build`: bien.
- RED contra `db1ff02`: fallan los 4 tests nuevos de S11 y S13; el de `initialIndex={2}` pasa también en la base (es de regresión).
- Chrome headless sobre `npm run preview`:
  - S11 (1440×900, pádel y fútbol): en la última tarjeta, con el filtro y cambiando de día (la lista pasó de 3 a 2, a 1 y a 3), siempre hubo exactamente una tarjeta activa con "Cancha elegida" y un punto activo. Flechas, clics rápidos y puntos siguen igual.
  - S12 (390×844): `.selector-dia` es un grid de 7 columnas que no desborda (341 = 341 px): el snap ahí no hacía nada y se quitó en la corrección. La única tira que desborda es `.bracket-torneo__movil` (418 frente a 320 px): ahí encaja.
  - S13: el panel existe y su `aria-labelledby` sigue a la pestaña activa con flechas, Inicio y Fin.
  - S14: con movimiento reducido, sin transiciones de `transform`/`max-width`/`left` y sin Ken Burns (`DepthCarousel.css`); con movimiento normal, todo sigue igual.
- Corrección: la regla reducida de los botones `hollow` quedaba antes de la base y no aplicaba; se movió después. Reindentación de `renderBloqueCanchas`.

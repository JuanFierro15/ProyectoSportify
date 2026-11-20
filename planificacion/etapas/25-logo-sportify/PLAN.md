# Etapa 25: logo de Sportify en el navbar y como ícono de la página

Estado: **terminado** (pedido de Juan el 20-11-2026, antes de actualizar el
README: "implementemos esta imagen como logo, ponla en SVG para que quede en
el navbar y también en el ícono de la página").

## Qué se pidió y qué hay hoy

- El logo llegó como JPG (2752×1536, fondo negro): una "S" de trazos naranja y
  verde y la palabra "SPORTIFY" en blanco, cursiva y gruesa.
- El navbar muestra un trofeo de lucide + el texto "Sportify", con tres
  estados de color (transparente sobre el video, claro al bajar y oscuro en
  la página de reserva).
- `favicon.ico`, `logo192.png` y `logo512.png` eran los de la plantilla de
  React.

## Decisiones

- **Vectorizar, no redibujar.** El coordinador trazó el JPG con potrace por
  capas de color (scripts en `planificacion/herramientas/logo/`). Coordenadas
  enteras ×4 y en relativo: los tres trazos pesan ~19 KB sin comprimir.
- **Un solo SVG en línea para el navbar**, con la palabra en `currentColor`:
  así sigue el color de cada estado del navbar sin tres archivos. La "S" lleva
  sus colores fijos (`#f16c13`, `#2f995c`, medidos del original).
- **Favicon con fondo oscuro y trazo engrosado.** A 16 px el trazo original
  (~0,4 px) casi no se ve; el `favicon.svg` y el `.ico` lo engruesan. Los PNG
  de 192 y 512 px (manifest y `apple-touch-icon`) van con el trazo original.
- **El navbar no debe crecer** más de 4 px frente a hoy (`scroll-margin-top`,
  el voucher sticky y la cabecera de la página de reserva dependen de su
  alto). Se mide con un script en el build real.
- `docs/marca/` guarda el logo completo en claro y oscuro y la "S" sola para
  el README, que se actualiza después.

## Bloques

| Id | Qué | Implementador | Verificador |
| --- | --- | --- | --- |
| (coordinador) | Vectorización, íconos de `public/`, `src/data/logoSportify.js` y `docs/marca/` (commit `8de4c0f`) | Opus | revisión visual con capturas |
| l1 | `LogoSportify.jsx`, navbar, CSS por estado, `index.html`, manifest, prueba y doc | `gemini-4-hydrogen-high` | `gemini-4-argon-high` |

## Verificación del bloque l1

Criterios en `bloques/l1-logo-navbar/criterios.md` (C1 a C12). El criterio
visual es `revision/medir-logo-navbar.mjs` sobre el build, en 14 anchos por
defecto más 8 que el implementador no conoce, en las tres escenas, contra la
línea base `revision/antes.json` (medida en `main` antes del cambio).

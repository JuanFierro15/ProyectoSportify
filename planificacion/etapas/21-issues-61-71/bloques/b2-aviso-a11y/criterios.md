# Criterios de aceptación del bloque b2 (issue #65)

- C1: Con dos avisos en pantalla, el contenedor `.avisos-conflicto` no tiene `aria-live`, ningún elemento del componente tiene `aria-live` y hay exactamente dos elementos con `role="alert"`, uno por aviso.
  Cómo comprobarlo: prueba con Testing Library (la del implementador y una propia).
- C2: Con un aviso hay exactamente un `role="alert"`, y con cero avisos el componente no renderiza nada.
- C3: Cerrar el segundo aviso deja solo el primero; cerrar después el último deja el componente vacío. El botón conserva `aria-label="Cerrar aviso"`.
- C4: Ninguna regla `.avisos-conflicto*` de `src/App.css` tiene un color literal (hex, `rgb()`, `rgba()`, `hsl()` ni nombre de color); solo `var(--…)`, `transparent` o `currentColor`.
  Cómo comprobarlo: leer las reglas, o con un `grep` sobre el bloque de reglas del aviso.
- C5: Los tokens `--aviso-*` están definidos una sola vez, en el `:root` de `src/App.css`, con un comentario. `--aviso-borde` usa `color-mix` con `var(--color-marca)` y el valor `246, 169, 75` ya no aparece repetido en el CSS del aviso.
- C6: Los valores no cambian el color visible: cada token da el mismo color que el literal que reemplaza (fondo `rgba(26,26,26,.96)`, texto `#fde68a`, borde `rgba(246,169,75,.55)`, botón `#f2f2f2`, hover `rgba(255,255,255,.12)`, sombra `rgba(0,0,0,.45)`). El contraste del texto y del botón sobre el fondo sigue siendo al menos 4.5:1.
  Cómo comprobarlo: comparar los valores y calcular el contraste con la fórmula de WCAG (anotar los números). No levantes servidores.
- C7: `z-index` sigue con `var(--z-aviso-conflicto)` y no se agregan `z-index` sueltos.
- C8: `npm test -- src/components/shared src/App.test.jsx` y `npm run lint` terminan con código 0 (lint sin avisos). Las pruebas que ya existían no cambiaron sus aserciones.

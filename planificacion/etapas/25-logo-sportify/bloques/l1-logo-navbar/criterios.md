- C1: Con un build nuevo (`npm run build`), `node "planificacion/etapas/25-logo-sportify/revision/medir-logo-navbar.mjs" --preview . --base "planificacion/etapas/25-logo-sportify/revision/antes.json"` termina con código 0 y "RESULTADO: logo y favicon correctos" en los 14 anchos por defecto (320 a 1440 px) y las tres escenas (tope, bajado y reserva).
  Cómo comprobarlo: correr el comando y leer la salida completa, no solo la última línea.
- C2: El mismo script termina con código 0 con `--anchos 340,400,450,700,900,1100,1366` (sin `--base`, porque la línea base no tiene esos anchos). Prueba también otros anchos tuyos entre 320 y 1920 px e informa el resultado.
- C3: En cada ancho y escena, el logo (`svg.logo-sportify` dentro de `a.site-header__brand`) mide entre 28 y 44 px de alto, conserva la proporción 8623/2129 (±0,03), queda dentro del ancho de la ventana y no pisa ningún enlace del menú; la página no desborda en horizontal.
  Cómo comprobarlo: columnas `logo=`, `prop=`, `x=` y `desborde=` de la salida del script.
- C4: El navbar no crece más de 4 px de alto frente a la línea base en ningún ancho ni escena (`antes.json`, medido en `main` antes del cambio).
  Cómo comprobarlo: columna `altoHeader=... (antes ...)` de la salida con `--base`.
- C5: La "S" se pinta con `#f16c13` y `#2f995c` en los tres estados; la palabra "SPORTIFY" toma el color del estado: blanco `#ffffff` sobre el video (tope), `#0f172a` con el navbar claro (bajado) y `#f2f2f2` en la página de reserva. Sobre el video el logo lleva `drop-shadow`.
  Cómo comprobarlo: columna `fills=` de la salida; el script falla si un color no es el esperado o si falta el `drop-shadow` en tope.
- C6: El enlace de la marca tiene nombre accesible exactamente "Sportify", el SVG lleva `aria-hidden="true"` y `focusable="false"`, y el trofeo (`Trophy` de lucide) ya no está en el navbar ni en sus importaciones. Con Tab, el enlace sigue recibiendo foco con contorno visible, y al activarlo hace lo mismo que antes (sube al inicio).
  Cómo comprobarlo: el script (nombre y `aria-hidden`); prueba de Testing Library con `getByRole('link', { name: 'Sportify' })`; revisión del diff de `Navbar.jsx`; foco con teclado en el build (headless o captura).
- C7: `index.html` declara `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />` y conserva `/favicon.ico` como respaldo con `sizes="32x32"`; `public/manifest.json` declara para `favicon.ico` los tamaños reales del archivo (`64x64 48x48 32x32 16x16`). `/favicon.svg`, `/favicon.ico`, `/logo192.png` y `/logo512.png` responden 200 con su tipo en el build.
  Cómo comprobarlo: línea `favicon` de la salida del script y lectura del diff.
- C8: `Navbar.test.jsx` tiene al menos una prueba nueva que falla si se quita el logo o se vuelve al trofeo: comprueba el enlace "Sportify", que dentro está `svg.logo-sportify` con `aria-hidden="true"`, tres trazos, el de la palabra con `fill="currentColor"` y los de la "S" con los dos colores, y que no hay `.lucide-trophy`. Cada prueba ejercita lo que dice su título.
  Cómo comprobarlo: leer la prueba; quitar el logo a mano en una copia y ver que la prueba falla (y restaurar).
- C9: No queda CSS muerto del trofeo ni del texto de la marca (`.site-header__brand-icon`, `.site-header__brand-text`) si ya nada los usa; no hay colores ni `z-index` nuevos sueltos fuera de lo que pide la tarea, y los selectores del estado reserva le ganan al estado claro (el header de reserva lleva también `site-header--scrolled`).
  Cómo comprobarlo: `grep` de las clases en `src/` y lectura del diff de `Navbar.css`.
- C10: `src/data/logoSportify.js` y los archivos de `public/` no cambian (son generados); solo cambian los archivos permitidos.
  Cómo comprobarlo: `git status` y `git diff --stat`.
- C11: `docs/agentes/pagina-reserva.md` describe el logo del navbar en una viñeta corta: componente, de dónde salen los trazos (archivo generado, no editar a mano), los colores de la palabra por estado y los íconos de `index.html`.
- C12: `npm test`, `npm run lint` (0 avisos) y `npm run build` pasan.

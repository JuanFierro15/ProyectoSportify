- C1: Con un build nuevo (`npm run build`), `node "planificacion/etapas/23-hallazgos-revision-74-81/revision/medir-pastillas.mjs" --preview .` termina con código 0 y "RESULTADO: todas las pastillas caben" en los 21 anchos por defecto (320 a 1440 px), en las escenas torneo (Semifinal con 2 días "bloqueado") y cancha.
  Cómo comprobarlo: correr el comando y leer la salida completa, no solo la última línea.
- C2: El mismo script termina con código 0 con `--anchos 330,345,405,420,445,460,500,560`.
  Cómo comprobarlo: correrlo. Prueba también otros anchos tuyos entre 320 y 640 px (por ejemplo 352, 395, 437, 470, 520, 610) e informa el resultado.
- C3: En todos los anchos medidos, la letra del estado es de 8 px o más y el texto queda a 1 px o más del borde interno de su pastilla.
  Cómo comprobarlo: columnas `font` y `margenes` de la salida del script.
- C4: Desde 600 px, el estado sigue con `font-size: 12px` y `letter-spacing` normal en las dos escenas, como antes del cambio.
  Cómo comprobarlo: columnas `font` y `ls` de la salida para 600, 639, 640, 700, 768, 820, 900, 1023, 1024, 1280 y 1440 px.
- C5: Ningún ancho medido desborda la página horizontalmente.
  Cómo comprobarlo: `desbordePagina=0` en todas las líneas.
- C6: Solo cambia `src/components/shared/SelectorDia.css`; `SelectorDia.jsx` no cambia, así que los textos de estado siguen siendo "bloqueado", "N libres" y "completo".
  Cómo comprobarlo: `git diff --stat` y `git status`.
- C7: El comentario del CSS explica la regla nueva y no menciona anchos o valores que ya no apliquen (por ejemplo, "< 400 px" o "~41 px" si ya no son ciertos).
  Cómo comprobarlo: leer el diff del CSS.
- C8: `npm test -- src/components/shared`, `npm run lint` (0 avisos) y `npm run build` pasan.

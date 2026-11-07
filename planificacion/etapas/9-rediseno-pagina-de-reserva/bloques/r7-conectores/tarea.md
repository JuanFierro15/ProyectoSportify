
# Tarea r7 — Conectores de las llaves torcidos

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (sección C11) y mira `docs/capturas/torneo-bracket.webp`. El rediseño de las llaves ya está hecho y en commits (`src/components/reservas/torneo/Bracket.jsx` y `Bracket.css`).

## El defecto (lo reportó Miguel Medina)

En las llaves hay líneas que **no apuntan a un partido sino que van torcidas**. En la captura de 8 equipos, del lado de los cuartos de final, las líneas que salen de cada par de partidos bajan en **diagonal** y llegan a un punto que no es el centro de la tarjeta del partido siguiente.

Lo correcto (C11: "Conectores de 2 px en `#3a3a3a` entre cada par de partidos y el siguiente"): conectores **ortogonales**, en forma de codo (horizontal, vertical, horizontal). Una línea horizontal sale del centro vertical de cada uno de los dos partidos; una línea vertical las une, y una horizontal sale del punto medio de esa vertical **exactamente al centro vertical** de la tarjeta del partido siguiente, tocando su borde. Ninguna línea en diagonal y ninguna que termine en el aire. Los dos conectores que llegan a la final van en el color de acento.

## Cómo trabajar

1. **Reprodúcelo antes de tocar el código.** Corre `npm run build` y levanta **solo** `npm run preview` (4173). Con el **MCP de Playwright** abre `http://localhost:4173/reservar/futbol?modo=torneo`, agrega dos canchas desde el carrusel ("Agregar al evento"), elige 8 equipos, elige mañana como día y horas para cada fase hasta que aparezcan las llaves, y toma capturas de la sección "Llaves y cronograma del torneo". Repite con 4 y 16 equipos, a 1440×900 y a 390×844, y en la confirmación de un torneo (versión compacta). Identifica cada conector torcido o que no llega al centro de un partido.
2. Corrige el cálculo de los conectores en `Bracket.jsx` (y `Bracket.css` si hace falta), tanto en la vista simétrica de escritorio (los dos lados, en espejo) como en la de celular y en la compacta. Usa los centros reales de las tarjetas (la misma fuente de coordenadas con que se posicionan), no aproximaciones.
3. **Compruébalo con el MCP de Playwright** en los mismos casos: captura y mide (por ejemplo, con `getBoundingClientRect()` de las tarjetas y los puntos de los trazos SVG) que cada conector termina en el centro vertical del partido siguiente, con 0 a 1 px de diferencia, y que todos los tramos son horizontales o verticales.
4. Al terminar, cierra el navegador de Playwright y **mata el árbol del proceso de `preview`** (`taskkill /PID <pid> /T /F`).

## Archivos que puedes editar

- `src/components/reservas/torneo/Bracket.jsx`, `src/components/reservas/torneo/Bracket.css`
- `src/components/reservas/Torneo.test.jsx` solo si una prueba depende de la estructura de los conectores (no la debilites)

No toques nada más. No cambies la ubicación de las tarjetas, los textos ni el resto del diseño de C11.

## Reglas

- Sin dependencias nuevas.
- Corre `npm test` y `npm run lint` al final y reporta el resultado.
- Responde con: qué conectores estaban mal y por qué (la causa en el código), qué cambiaste y las medidas de la comprobación con Playwright.

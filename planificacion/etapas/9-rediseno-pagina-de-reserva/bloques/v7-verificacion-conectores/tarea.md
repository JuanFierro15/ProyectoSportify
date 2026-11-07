
# Tarea v7 — Verificar los conectores de las llaves y rehacer sus capturas

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/bloques/r7-conectores/tarea.md`. El arreglo ya está en el árbol de trabajo (`git diff -- src/components/reservas/torneo/Bracket.jsx`): el segundo trazo de cada par de partidos tomaba el `y` del partido de arriba (`{ x1: xStart, y1, ... }`) y bajaba en diagonal. Tu trabajo es **verificarlo de forma independiente** y rehacer las capturas que mostraban el error. **No edites código de `src/`.**

## Qué hacer

1. Revisa el diff: que solo cambie el cálculo de los conectores y nada más del `Bracket`.
2. Corre `npm test` y `npm run lint`.
3. `npm run build` y levanta **solo** `npm run preview` (4173). Con el **MCP de Playwright**, en torneos de 4, 8 y 16 equipos (`/reservar/futbol?modo=torneo`: agrega dos canchas desde el carrusel, elige el número de equipos, mañana como día y horas para cada fase), a 1440×900 y 390×844, y en la confirmación de un torneo de 8 equipos (versión compacta):
   - Toma capturas de las llaves y míralas: **ninguna línea en diagonal ni que termine en el aire**.
   - Mide con `getBoundingClientRect()` de las tarjetas y las coordenadas de los trazos SVG que cada tramo es horizontal o vertical y que cada conector llega al centro vertical del partido siguiente tocando su borde (diferencia de 0 a 1 px), en los dos lados de la vista simétrica.
   - Los dos conectores que llegan a la final van en el color de acento.
4. Con el `preview` arriba, rehaz las capturas:
   - `BASE_URL=http://localhost:4173 OUT_DIR=planificacion/etapas/9-rediseno-pagina-de-reserva/revision/despues node planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` (sobrescribe las 20 capturas "después").
   - `node planificacion/herramientas/capturas/capturas.mjs` y luego **restaura con `git checkout -- <archivo>`** todo lo de `docs/capturas/` menos `torneo-bracket.webp` (y `confirmacion-qr.webp` o `modo-torneo.webp` solo si de verdad muestran conectores). Mira `torneo-bracket.webp` nueva y confirma que los conectores están bien.
5. Cierra el navegador de Playwright, **mata el árbol del proceso de `preview`** (`taskkill /PID <pid> /T /F`) y borra los temporales.

## Archivos que puedes modificar

- `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/despues/*.webp`
- `docs/capturas/torneo-bracket.webp` (y las otras dos indicadas, solo si muestran conectores)

Nada más. No hagas commits.

## Al terminar

Responde con: revisión del diff; test y lint; tabla por caso (equipos, ancho, vista) con `pasa`/`falla` y las medidas; capturas rehechas; y confirmación de que no quedó `preview` ni navegador abiertos.

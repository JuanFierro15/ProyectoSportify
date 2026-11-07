
# Recomprobación v1b — solo los tres defectos de r1 (no edites código)

La primera verificación de r1 encontró tres defectos y ya se corrigieron (ver `bloques/r1-tema-y-encabezado/retoma.md`). Comprueba **solo** estos tres, más que el inicio no haya cambiado. No hagas una revisión completa nueva.

1. "Volver al inicio" (`.vista-canchas__volver`) visible y no tapado por el navbar fijo en `/reservar/futbol` a 390, 640, 1024 y 1440 px de ancho (compara el `getBoundingClientRect()` del enlace con el `bottom` de `.site-header`).
2. En `/reservar/futbol?modo=torneo` a 1440×900, el contenido de `.vista-canchas__encabezado-contenido` cabe dentro de los 260 px del encabezado con aire (sin desbordar).
3. La pestaña activa tiene subrayado de 3 px con el `colorAcento` de su deporte (prueba las tres pestañas).
4. En `/` (inicio), a 390 y 1440 px, el navbar no tiene `site-header--reserva` y se ve como en `revision/antes/` o como antes del cambio (transparente sobre el video).

Además corre `npm test` y `npm run lint` una vez.

Usa `npm run build` + `npm run preview` y Chrome por CDP (puedes basarte en `revision/capturas-etapa9.mjs`; archivos temporales fuera del repositorio). Al terminar, mata el árbol del proceso de `preview` (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

Responde con `pasa`/`falla` y la evidencia (medidas) de cada punto, y los resultados de test y lint.

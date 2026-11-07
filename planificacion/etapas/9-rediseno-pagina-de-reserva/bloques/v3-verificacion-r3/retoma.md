
# Recomprobación v3b — solo los dos defectos de r3 (no edites código)

La verificación de r3 encontró dos defectos y ya se corrigieron (ver `bloques/r3-tiquete-y-confirmacion/retoma.md`). Comprueba **solo** esto, con medidas por CDP:

1. En la confirmación de un torneo de 8 equipos a 390×844: `.vista-canchas__confirmacion` y `.confirmacion-reserva` miden como máximo el ancho disponible (≤ 390 px), el título, "Copiar código", el QR completo, el resumen y "Listo" quedan dentro de la pantalla, y el scroll horizontal ocurre solo dentro de `.confirmacion-reserva__bracket`. Comprueba también a 1440×900 que la confirmación se ve igual que antes (centrada, con su ancho máximo).
2. `.voucher-reserva__linea-tachado` con contraste ≥ 4,5:1 sobre el fondo del comprobante (mídelo) y todavía tachado.
3. La regla tocada en `src/components/canchas/VistaCanchas.css` (revisa `git diff -- src/components/canchas/VistaCanchas.css`) no cambia nada fuera de la confirmación: la página de reserva en modo cancha a 390 y 1440 px se ve igual.

Corre también `npm test` y `npm run lint` una vez.

Usa `npm run build` + `npm run preview` (solo ese servidor) y Chrome por CDP (puedes usar `revision/capturas-etapa9.mjs` para llegar a la confirmación), con temporales fuera del repositorio. Al terminar, mata el árbol del proceso de `preview` (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

Responde con `pasa`/`falla` y la evidencia de cada punto, y los resultados de test y lint.

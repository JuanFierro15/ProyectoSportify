
---

# [MODO EJECUTOR] Bloque d2-pruebas-revision (etapa 16)

Solo pruebas. Lee `planificacion/etapas/16-descuento-torneo/PLAN.md`.

## Rutas permitidas
`src/components/reservas/Torneo.test.jsx`, `src/components/reservas/torneo/CalendarioTorneo.test.jsx`, `src/lib/precios.test.js`. Prohibido todo lo demás (ni código de producción ni `api/`). No hagas commits.

## Cambios
1. `Torneo.test.jsx`: en una prueba de torneo que ya muestre ahorro en el voucher, comprueba el texto exacto `Descuento de torneo por hora`; y en una de cumpleaños con 2 horas seguidas, `Descuento por horas seguidas`.
2. `CalendarioTorneo.test.jsx:73`: el título dice "debajo del texto de ayuda"; comprueba que el párrafo de la promoción es el siguiente hermano (`nextElementSibling`) del párrafo de ayuda `Toca una hora para marcarla o desmarcarla en cada cancha...`.
3. `precios.test.js`:
   - en la prueba de 6 líneas (~111-119) comprueba también el `total` exacto de la segunda y de la última línea;
   - agrega el límite exacto del tope: una cancha con `precioHora` 15.000 da `descuentoHora` 15.000 y `total` 0 por 1 hora, y una de 15.001 da `total` 1.

## Verificación
`npm test` en verde y `npm run lint` con 0 warnings. Si `npm test` deja modificado `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por fin de línea, restáuralo con `git checkout -- <archivo>`. Responde con los archivos cambiados y el número de pruebas.

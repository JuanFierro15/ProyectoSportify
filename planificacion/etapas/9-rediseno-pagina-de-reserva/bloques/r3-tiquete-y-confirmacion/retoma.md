
# Retoma r3 — Corrección de lo que encontró la verificación

El bloque r3 ya está implementado en el árbol de trabajo (`git diff`; r1 y r2 están en commits). La verificación encontró dos defectos. Corrige **solo** esto:

1. **Confirmación de torneo recortada a 390 px.** `.vista-canchas__confirmacion` (con `margin: 0 auto`, sin `width: 100%` ni `min-width: 0`) y `.confirmacion-reserva` (`display: flex; flex-direction: column`, sin `width: 100%` ni `min-width: 0`) crecen con el ancho intrínseco del `<Bracket compacto />` hasta 615 px (la confirmación) y 665 px (su contenedor) en una ventana de 390 px. Como `.vista-canchas__marco` tiene `overflow-x: clip`, no hay scroll pero la mitad derecha (título, "Copiar código", medio QR, resumen y "Listo") queda cortada. Haz que ambos respeten el ancho disponible (`width: 100%; min-width: 0; box-sizing: border-box` o equivalente, con su `max-width` actual) y que `.confirmacion-reserva__bracket` tenga su propio `overflow-x: auto` (scroll horizontal solo dentro del recuadro de las llaves). La regla de `.vista-canchas__confirmacion` está en `ConfirmacionReserva.css`; si estuviera en `VistaCanchas.css`, puedes editar solo esa regla allí.
2. **Precio tachado con contraste 4,41:1.** `.voucher-reserva__linea-tachado` usa `--reserva-reservada` (`#808080`) sobre el comprobante `#1a1a1a`. Usa `var(--reserva-texto-tenue)` (`#a8a8a8`, 7,28:1) para ese texto, conservando el tachado.

Archivos que puedes editar: `src/components/reservas/ConfirmacionReserva.css`, `src/components/reservas/VoucherReserva.css` (y, solo si la regla está allí, la de `.vista-canchas__confirmacion` en `src/components/canchas/VistaCanchas.css`). Al terminar corre `npm test` y `npm run lint` y reporta.

---

La tarea original del bloque, para contexto:

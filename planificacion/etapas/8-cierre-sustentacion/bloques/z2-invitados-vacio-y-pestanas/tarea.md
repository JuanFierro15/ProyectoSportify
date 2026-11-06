# Tarea: Invitados, estado vacío y pestañas con teclado (`z2-invitados-vacio-y-pestanas`)

## Objetivo

Cerrar los puntos pendientes `P2-05` (mostrar invitados en voucher y confirmación de cumpleaños), el aviso de estado vacío en `CanchasElegidas` y `P1-08` (navegación por teclado con flechas, Home y End en las pestañas de deporte).

## Rutas

- Modificar:
  - `src/components/reservas/useReserva.js`
  - `src/components/reservas/VoucherReserva.jsx`
  - `src/components/reservas/ConfirmacionReserva.jsx`
  - `src/components/reservas/CanchasElegidas.jsx`
  - `src/components/canchas/VistaCanchas.jsx`
  - `src/components/canchas/VistaCanchas.css`
  - `src/components/reservas/Torneo.test.jsx`
- Prohibido modificar cualquier otro archivo.

## Diseño

1. **Invitados (auditoría P2-05).** Hoy se piden y se guardan, pero no se muestran.
   - Voucher: pasar `invitados={reserva.modo === 'cumpleanos' ? reserva.invitados : null}` en `VistaCanchas.jsx:553` y mostrar la línea "Invitados: N" si hay un valor.
   - Confirmación: agregar `invitados` al resumen de `setConfirmado` (`useReserva.js`, cerca de la línea 974) y mostrarlo en `ConfirmacionReserva.jsx`, solo en cumpleaños.
   - Test: en cumpleaños la cantidad aparece en voucher y confirmación; en cancha y torneo, no.
2. **Estado vacío.** `CanchasElegidas.jsx:34`: cambiar `"Aún no has elegido canchas."` por `"Aún no has elegido canchas. Agrégalas desde el carrusel."` No preseleccionar ninguna.
3. **Pestañas de deporte (auditoría P1-08).** `VistaCanchas.jsx:371-396` tiene `role="tablist"` y `role="tab"`, pero sin navegación con flechas.
   - Foco móvil: `tabIndex={0}` en la pestaña activa y `-1` en las demás.
   - `ArrowLeft`, `ArrowRight`, `Home` y `End`: enfocan y activan la pestaña, igual que el clic, de forma circular. Reutiliza la lógica del `onClick` en una función, sin duplicarla.
   - `role="presentation"` en cada `<li>`.
   - Conserva el `href`: Ctrl+clic debe seguir abriendo otra pestaña.

## Verificación al terminar

- `npm test`, `npm run lint` y `npm run build` pasan sin avisos.


# Tarea: consulta y cancelación por código, voucher no destructivo y copia de código (`u2-contacto-mis-reservas-y-voucher`)

## Objetivo

Resolver los hallazgos `P0-01`, `P2-02`, `P2-03` y `P2-07` de la auditoría de usabilidad:
1. Permitir buscar reservas cancelables también por código de reserva (`SPF-XXXXXX`) en `src/lib/cancelacion.js` y añadir en `Navbar.jsx` un acceso a **"Mis reservas"** para consultar o cancelar reservas desde la web (`P0-01`).
2. Evitar que el botón secundario de `VoucherReserva` expulse al usuario a la portada perdiendo todo su progreso; cambiar su acción en `VistaCanchas.jsx` a `reserva.reiniciar` con la etiqueta **"Limpiar selección"** (`P2-02`).
3. Añadir en `ConfirmacionReserva.jsx` un botón **"Copiar código"** con feedback `"¡Copiado!"` y mostrar las políticas de abono (50% en 2h) y cancelación (6h de anticipación) de `negocio.json` (`P2-03`).
4. Unificar el nombre de marca **Sportify** en `Navbar.jsx` y `Footer.jsx` (`P2-07`).

## Rutas

- Modificar:
  - `src/lib/validacion.js`
  - `src/lib/cancelacion.js`
  - `src/components/layout/Navbar.jsx`
  - `src/components/layout/Navbar.css`
  - `src/components/layout/Footer.jsx`
  - `src/components/layout/Footer.css`
  - `src/components/reservas/VoucherReserva.jsx`
  - `src/components/reservas/VoucherReserva.css`
  - `src/components/reservas/ConfirmacionReserva.jsx`
  - `src/components/reservas/ConfirmacionReserva.css`
  - `src/components/canchas/VistaCanchas.jsx`
- Leer (sin modificar):
  - `src/context/ReservasContext.jsx`
  - `src/data/negocio.json`
- Prohibido modificar cualquier otro archivo fuera de la lista "Modificar".

## Diseño detallado

### 1. `src/lib/cancelacion.js`

- En `buscarReservasCancelables(reservas, { nombre, telefono, codigo }, ahora = new Date())`:
  - Conserva intacta la búsqueda por `{ nombre, telefono }` para no romper ningún test existente.
  - Si se proporciona `codigo` (ej. `'SPF-ABC123'`), busca reservas cuyo `r.codigo` coincida (ignorando mayúsculas/minúsculas y espacios) y evalúa `evaluarVentanaCancelacion(r, ahora)`.

### 2. `src/components/layout/Navbar.jsx`, `Navbar.css` y `Footer.jsx`

- En `Navbar.jsx` y `Footer.jsx`: usa `"Sportify"` como nombre principal de marca (`Sportify · Reservas Deportivas`).
- Añade en `Navbar.jsx` un botón/modal ligero **"Mis reservas"** que permita buscar por código `SPF-XXXXXX` (o teléfono) entre las reservas del `ReservasContext`, ver su estado/horario y cancelar si cumple la ventana de 6 horas.

### 3. `src/components/reservas/VoucherReserva.jsx` y `src/components/canchas/VistaCanchas.jsx`

- En `VoucherReserva.jsx`, cambia el texto del botón secundario de `"Cancelar"` a `"Limpiar selección"` (cuando recibe `onCancelar`).
- En `VistaCanchas.jsx`, pasa `onCancelar={reserva.reiniciar}` a `<VoucherReserva />` y añade también `bloqueadaPorTope={reserva.topeCanchasAlcanzado}` en `<TarjetaCanchaCarrusel />`.

### 4. `src/components/reservas/ConfirmacionReserva.jsx` y `ConfirmacionReserva.css`

- Añade un botón `"Copiar código"` junto a `.confirmacion-reserva__codigo-valor` que copie `codigo` con `navigator.clipboard?.writeText(codigo)` y muestre `"¡Copiado!"` durante 2 segundos.
- Añade un bloque informativo con las condiciones de reserva: abono del 50% en las próximas 2 horas y cancelación sin costo hasta 6 horas antes del turno.

## Verificación al terminar

- Ejecuta `npx vitest run` y verifica que todas las pruebas pasen.
- Ejecuta `npm run lint` y verifica 0 errores.

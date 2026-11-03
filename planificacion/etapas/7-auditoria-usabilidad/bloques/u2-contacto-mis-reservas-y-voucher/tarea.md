# Tarea: "Mis reservas", voucher no destructivo, copiar código y marca (`u2-contacto-mis-reservas-y-voucher`)

> Versión corregida (31-10) contra el código real de la rama `usability-improve` (u1 ya está
> integrado). Reemplaza al borrador (`instruccion-borrador.md`).

## Objetivo

Hallazgos `P0-01`, `P2-02`, `P2-03` y `P2-07` de la auditoría (`../../PLAN.md`).

## Rutas

- Modificar:
  - `src/lib/cancelacion.js` y `src/lib/cancelacion.test.js`
  - `src/components/layout/Navbar.jsx`, `Navbar.css`, `Footer.jsx`, `Footer.css`
  - `src/components/reservas/VoucherReserva.jsx`
  - `src/components/reservas/ConfirmacionReserva.jsx`, `ConfirmacionReserva.css`
  - `src/components/canchas/VistaCanchas.jsx`
- Crear:
  - `src/components/layout/MisReservas.jsx` y `MisReservas.css` (un componente por archivo)
  - `src/components/layout/MisReservas.test.jsx`
- Leer sin modificar: `src/context/ReservasContext.jsx` (expone `reservas`, `canchas` y
  `cancelar(reservaId)` → `{ ok, error }`), `src/data/negocio.json`, `src/lib/validacion.js`,
  `src/lib/codigoReserva.js` (`textoQr`), `src/lib/fechas.js` (`fechaCompleta`, `horaAmPm`),
  `src/lib/precios.js` (`formatoPrecio`, `finDeFranja`), `src/components/chatbot/Chatbot.jsx`
  (como referencia de modal accesible y de GSAP).
- No modifiques ningún otro archivo. No toques `VistaCanchas.jsx` más allá del punto 3: u1 ya
  conectó `motivoBloqueo`/`motivoNoAgregable` (no agregues `bloqueadaPorTope`, ya no existe en la
  tarjeta).

## Diseño

### 1. Búsqueda por código: `src/lib/cancelacion.js`

- Nueva función pura `buscarReservaPorCodigo(reservas, codigo)`: normaliza el código (sin espacios,
  en mayúsculas; acepta `spf-abc123`, `SPF ABC123` o `ABC123` y antepone `SPF-` si falta) y
  devuelve la reserva con ese `codigo` o `null`. Sirve para los dos tipos (`individual` y `evento`).
- Nueva función pura `buscarReservasDePersona({ reservas, nombre, telefono, ahora })`: devuelve
  las reservas futuras (de cualquier tipo) con el mismo teléfono normalizado y el mismo nombre
  normalizado (`normalizarComparacion`), ordenadas por inicio. Las reservas sin teléfono no
  coinciden, como en `buscarReservasCancelables`.
- `buscarReservasCancelables` queda **igual** (la usa el chat).
- Para saber si se puede cancelar, se usa `verificarCancelable(reserva, ahora)` (eventos: no;
  individuales: hasta `negocio.cancelacion.horasMinimas` antes).
- Tests nuevos en `cancelacion.test.js` para las dos funciones (normalización del código, código
  inexistente, eventos incluidos, sin teléfono no coincide, pasadas excluidas).

### 2. "Mis reservas": `MisReservas.jsx` y `.css`, y `Navbar.jsx`

- En el navbar, un botón "Mis reservas" en el menú de la derecha (después de "Ubicación"; en móvil
  puede ser solo icono `lucide-react` `Ticket` con `aria-label="Mis reservas"` y texto
  `show-for-medium`, para que quepa en una fila como los demás enlaces).
- Abre `MisReservas`: `<dialog>` nativo con `showModal()` (como el visor de `VistaCanchas`), con
  título "Mis reservas", botón cerrar de 44×44 px con `aria-label="Cerrar"`, Escape y clic en el
  fondo cierran, y el foco vuelve al botón del navbar. Bloquea el scroll del documento mientras
  está abierto. Montarlo vía portal a `document.body` desde el `Navbar`.
- Dos formas de buscar (pestañas o dos formularios): **por código** (`SPF-XXXXXX`) o **por nombre y
  teléfono** (mismas reglas de limpieza y validación que el formulario: `limpiarNombre`,
  `limpiarTelefono`, `errorTelefono`). Errores con `form-error` de Foundation, textos en tuteo.
- Cada resultado muestra: código, tipo ("Cancha" o el `tipoEtiqueta` del evento), cancha(s),
  `fechaCompleta(fecha)`, horario (`h[0]` a `finDeFranja(última)`), total con `formatoPrecio`, y:
  - Botón "Ver QR" que muestra el QR (`QRCodeCanvas` de `qrcode.react`, con `textoQr`).
  - Si `verificarCancelable` da `ok`: botón "Cancelar reserva" con confirmación en dos pasos dentro
    del propio diálogo ("¿Seguro? Esta acción libera el horario" + "Sí, cancelar" / "No"). Nada de
    `window.confirm`. Al confirmar llama `cancelar(reserva.id)` del contexto y muestra el resultado.
  - Si no: el motivo de `verificarCancelable` en texto (por ejemplo, eventos o fuera de plazo).
- Sin resultados: "No encontramos reservas con esos datos." Nada de copy técnico.
- Acento: tokens de marca (`--color-marca`, `--color-marca-soft`, `--color-marca-contraste`).
  `z-index` por debajo del chat (`--z-chatbot`) y por encima del navbar. Animación de entrada
  opcional con GSAP en `gsap.context()` y respetando `prefers-reduced-motion`.
- Responsive: a pantalla completa bajo 640 px (con safe-area, `100dvh`).
- `MisReservas.test.jsx` (dentro de `ReservasProvider`): crea una reserva con `reservar()` (o con
  el estado que permita el contexto), la busca por código y por nombre + teléfono, y la cancela.
  Usa relojes falsos (`vi`) si hace falta para el plazo.

### 3. Voucher no destructivo: `VoucherReserva.jsx` y `VistaCanchas.jsx`

- En `VistaCanchas.jsx` (cerca de la línea 561), el voucher recibe `onCancelar={reserva.reiniciar}`
  en vez de `cerrarVista`. "Volver al inicio" sigue arriba.
- En `VoucherReserva.jsx`, el botón secundario dice "Limpiar selección" en vez de "Cancelar".
  Revisa que `reiniciar` deje el formulario limpio sin desmontar la página.

### 4. `ConfirmacionReserva.jsx` y `.css`

- Botón "Copiar código" junto al código (`navigator.clipboard?.writeText(codigo)`, en try/catch).
  Muestra "¡Copiado!" 2 s (con `aria-live="polite"`) y limpia el timeout al desmontar. Si el
  portapapeles falla, "No se pudo copiar".
- Bloque "Condiciones" con datos de `negocio.json`, **sin cifras escritas a mano**:
  - Abono de `pagos.abonoPorcentaje` % dentro de las `pagos.abonoPlazoHoras` horas siguientes por
    `pagos.abonoMedios` (unidos con "o").
  - Cancelación sin costo hasta `cancelacion.horasMinimas` horas antes; luego,
    `cancelacion.condicion`.
  - "Puedes consultar o cancelar tu reserva en Mis reservas, con tu código."

### 5. Marca: `Navbar.jsx` y `Footer.jsx` (y sus CSS si hace falta)

- Navbar: `site-header__brand-text` dice "Sportify".
- Footer: `footer__marca` dice "Sportify", con "Reservas deportivas" como subtítulo pequeño, y el
  copyright: `© {year} Sportify · Proyecto universitario`.

## Verificación al terminar

- `npm test` (todas las suites en verde) y `npm run lint` (0 errores, 0 warnings).
- No ejecutes `npm run dev` ni `npm run preview`.
- Responde con la lista de archivos cambiados y un resumen por punto (1 a 5).

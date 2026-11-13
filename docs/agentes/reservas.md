# Reservas, estado y reglas compartidas (`src/lib/`)

Detalle del estado en `ReservasContext`, la ventana de 7 días, la semilla `canchas.json`, los tipos de reserva, la cancelación y los módulos de `src/lib/`. Lee este archivo antes de tocar `src/context/ReservasContext.jsx`, `src/data/canchas.json` o `src/lib/`.

## Fuente de verdad y ventana de 7 días

**Fuente de verdad del estado**: `src/context/ReservasContext.jsx`, un Context + `useReducer` que se espeja en `localStorage` (`sportify_reservas_v2`) en cada cambio. Se consume con `useReservas()`; nunca acceder a `localStorage` fuera de este archivo.

- **Ventana de 7 días**: hoy + 6 (`dias`). Por cancha y fecha solo se guarda la lista de horas ocupadas (`ocupados`); el resto se infiere libre. Si la pestaña sigue abierta al cambiar el día, la acción `RENOVAR_VENTANA` (al recuperar el foco o la visibilidad) rehace la ventana con `fusionarConSemilla`, y `useReserva` pasa la fecha elegida y las fases que quedaron fuera al nuevo hoy. Una fecha fuera de `dias` nunca está libre.
- **`src/data/canchas.json`** es la semilla: `horas` base (común) + `ocupadosSemilla` por cancha (por offset de día, 0 = hoy) + campos de **catálogo** por cancha: `precioHora`, `imagen`, `descripcion`, `caracteristicas`. Al iniciar, `ReservasContext` mapea los offsets a fechas reales y reconcilia con `localStorage` mediante la función pura `fusionarConSemilla(...)` (exportada), que solo fusiona `ocupados` (descarta fechas fuera de la ventana). Los campos de catálogo salen siempre del JSON, nunca de `localStorage`: cambiarlos en el JSON basta para que se reflejen.

## Tipos de reserva, choques y cancelación

- **Dos tipos de reserva** (`tipo` en el mismo array `reservas`):
  - `individual`: una cancha, de 1 a 3 horas seguidas contiguas. Acción `RESERVAR`; guarda `horas`, `precioHora`, `descuentoHora`, `total`, `aguaGratis`.
  - `evento` (torneo/cumpleaños): varias canchas y/o horas consecutivas, bloqueo **todo-o-nada** (si una celda cancha×hora está ocupada, no se reserva nada). Acción `RESERVAR_EVENTO`; guarda `total`, `ahorro` y `packsAgua` con `calcularPrecioEvento` (mismas reglas por cancha).
  - Torneos por fases: ver `docs/agentes/torneo.md`.
  - Ambos tipos guardan un `codigo` (`SPF-XXXXXX`, `generarCodigo`) que se genera en `reservar` / `reservarEvento` antes de despachar.
  - El choque se valida dos veces: antes de despachar (`reservar` / `reservarEvento` devuelven `{ ok, codigo }` o `{ ok: false, error }` sin tocar el estado) y otra vez dentro del reducer, que ante un rechazo devuelve el estado intacto (el estado no tiene campo `error`). En eventos las dos validaciones comparten `validarReservaEvento`: celdas libres, horas consecutivas por bloque y, en torneos, el orden entre fases (`validarJornadas`).
  - **Cancelación** (acción `CANCELAR`, función `cancelar(reservaId)` → `{ ok, error }`, mismo patrón de doble validación): solo reservas `individual`, hasta `negocio.cancelacion.horasMinimas` (6) horas antes de empezar; quita solo las horas de esa reserva de `ocupados` (la ocupación semilla, que no tiene registro en `reservas`, se queda) y elimina el registro. Lógica pura en `src/lib/cancelacion.js` (`verificarCancelable`, `aplicarCancelacion`, `buscarReservasCancelables`). La usan el chat y Mis reservas; no crear otra acción.

## Reglas compartidas (`src/lib/`)

- `precios.js`: única fuente de las reglas de precio — `MAX_HORAS_SEGUIDAS` (3), `MIN_HORAS_BENEFICIO` (2), `DESCUENTO_POR_HORA` (5.000, por cada hora desde 2 seguidas, con pack de agua gratis), `calcularPrecio`, `calcularPrecioEvento` (suma por cancha con esas mismas reglas; también alimenta el voucher en modo cancha, con una sola), `calcularPrecioJornadas` (torneos: por cada bloque y sus canchas, con las mismas reglas), `finDeFranja`, `formatoPrecio`. No redefinir `formatoPrecio` en otros archivos.
- `torneo.js` y `pasosTorneo.js`: ver `docs/agentes/torneo.md`.
- `horarios.js`: selección de horas de la reserva, pura y con tests — `alternarHoraIndividual` (modo cancha) y `seleccionarRango` (eventos).
- `codigoReserva.js`: `generarCodigo` y `textoQr` (texto que lleva el QR).
- `validacion.js`: regex y limpieza de nombre (solo letras y espacios) y teléfono (3 + 9 dígitos). En la reserva el nombre es obligatorio (`errorNombreObligatorio`) y el teléfono opcional.
- `fechas.js`: etiquetas y meses, `fechaCompleta` (fecha absoluta, la que usan voucher, confirmación y QR: nunca "mañana") y `esHoraPasada(fecha, hora)`. Las horas de hoy que ya empezaron cuentan como no disponibles (`calcularDisponibilidad` y `horaLibre` en `ReservasContext`), así que no se pueden reservar ni se cuentan como libres.
- `canchas.js`: agrupación por deporte, `tituloCancha`, `estiloAcento`, `imagenGrandeCancha`, `imagenPlaceholderCancha`.
- `cancelacion.js`: plazo de cancelación, estado tras cancelar y búsqueda de las reservas de una persona (teléfono normalizado igual y nombre sin tildes ni mayúsculas; las reservas sin teléfono nunca coinciden). También `buscarReservaPorCodigo`, `buscarReservasDePersona` y `horasDeReserva`, que usa `MisReservas`.
- `negocio.js`: `formatoTelefono` ("310 774 0572"), `enlaceTelefono` (`tel:+57...`) y `textoHorario(horas)` ("8:00 - 21:00": primera franja a `finDeFranja` de la última). (Para `src/data/negocio.json`, ver `docs/agentes/pagina-reserva.md`.)
- `modelosChat.js`: respaldo de modelo de `/api/chat` (`listaModelos`, `esReintentable`, `ordenarPorDisponibilidad`, `tiempoIntento`, `respuestaFinal`). Solo lo importa el servidor; sin el SDK, JS puro. (Ver también `docs/agentes/chatbot.md`.)
- `validacion.js` también tiene lo del chat: `normalizarNombre`, `normalizarTelefono`, `validarContactoChat` (teléfono obligatorio), `validarPropuestaReserva(propuesta, contexto)` (cancha, ventana de 7 días, 1 a `MAX_HORAS_SEGUIDAS` horas seguidas y libres, contacto), `fechasVentana` y los textos fijos `MENSAJES_CHAT`. Lo importan el formulario, el widget y `/api/chat`: tiene que seguir siendo JS puro.
- `fechas.js`: `horaAmPm('13:00')` → "1:00 p. m." (formato del chat).
- `rutas.js`: ver `docs/agentes/pagina-reserva.md`.

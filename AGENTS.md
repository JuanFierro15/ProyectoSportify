# AGENTS.md — Proyecto Reservas de Canchas (Sportify)

Guía para los asistentes de código (Claude Code, agy) al trabajar en este
repositorio. `CLAUDE.md` solo importa este archivo (`@AGENTS.md`): las
instrucciones se editan aquí.

## Contexto del proyecto

Proyecto final de Lenguajes para la Web. Página de un local deportivo donde
se reservan canchas de voley playa, pádel y fútbol, con manejo de torneos,
cumpleaños y eventos especiales.

Restricciones fijas (no negociables):
- Frontend en **React** con **Vite** (lo exige el profesor; hasta el 14-10-2026
  fue Create React App: la migración está en `2af2ec3..c7193d2`).
- Maquetación con **Foundation** (foundation-sites), no Bootstrap ni Tailwind.
- **Sin base de datos**: disponibilidad y reservas con estado de React +
  localStorage, más un JSON semilla. Nada de SQL, Mongo, Firebase ni backend
  persistente.
- Debe incluir un **chatbot**: asistente con Gemini detrás de una función de
  servidor de Vercel (`/api/chat`), acotado al negocio (ver "Chatbot").
- Animaciones con **GSAP** (incluido ScrollTrigger) sobre la estructura de
  Foundation.

## Comandos

```bash
npm install                    # instalar dependencias
npm run dev                    # Vite en http://localhost:5173 (no ejecuta /api; `npm start` es alias)
set -a; . <(tr -d '\r' < .env.local); set +a; vercel dev   # sitio + /api en http://localhost:3000 (ver nota)
npm run build                  # build de producción en /dist
npm run preview                # sirve /dist en http://localhost:4173
npm test                       # Vitest, una sola corrida (`npm run test:watch` para modo watch)
npm run lint                   # ESLint sobre src, api y scripts (0 warnings esperados)
node scripts/probar-chat.mjs [url] [ids...]  # casos de prueba de /api/chat
```

- Configs: `vite.config.mjs` (plugin de React, polling del watcher con
  `CHOKIDAR_USEPOLLING=true` en `.env`, `css.lightningcss.errorRecovery` y la
  config de Vitest) y `eslint.config.mjs` (ESLint 10 plano). Van en `.mjs`
  porque el paquete no es `"type": "module"` (ver "Servidor" en Chatbot).
- El build avisa "Invalid media query" por un hack de IE de
  `foundation.min.css`; es esperado: `errorRecovery` descarta esa regla.
- Lint: ya no corre dentro de dev ni build. `no-unused-vars` ignora `React`,
  los argumentos y los errores de `catch`, como hacía CRA. React Hooks solo con
  `rules-of-hooks` y `exhaustive-deps` (el preset v7 trae reglas del React
  Compiler: no activarlo sin revisar el código). `eslint-plugin-react` no
  acepta ESLint 10. El handler de `api/chat.js` es `export default { fetch }`
  (forma estándar de Vercel): no cambiarla.
- Ids de `probar-chat.mjs`: `disponibilidad`, `reservalo`, `reservalo-varias`,
  `datos-validos`, `nombre-invalido`, `telefono-invalido`, `hora-ocupada`,
  `ubicacion`, `parqueadero`, `fuera-de-tema`, `torneo-proceso`,
  `cancelar-codigo`.
- Tests: Vitest (jsdom, `globals: true`) + Testing Library. Los de lógica pura
  viven junto a su módulo en `src/lib/*.test.js` (precios, validación, fechas,
  horarios, código de reserva, datos del negocio, chat, cancelación, torneos,
  rutas, canchas y respaldo de modelo). De interfaz:
  `src/components/reservas/Torneo.test.jsx` (torneo y cumpleaños),
  `FormularioReserva.test.jsx` (prop `seccion`), los del asistente en
  `src/components/reservas/torneo/` (`AsistenteTorneo`, `useAsistenteTorneo`) y
  `src/components/layout/MisReservas.test.jsx`. `api/_lib/funciones.test.js`
  cubre las funciones del chat y `src/App.test.jsx` es un smoke test. `src/setupTests.js` carga
  `@testing-library/jest-dom/vitest` y simula `matchMedia`,
  `IntersectionObserver`, `ResizeObserver`, `HTMLMediaElement` y
  `window.scrollTo`. Relojes falsos con `vi` (`import { vi } from 'vitest'`).
- Vite solo acepta JSX en `.jsx`: un archivo nuevo con JSX va en `.jsx`.
  `src/lib/*.js` y `src/data/deportes.js` se quedan en `.js` sin JSX porque los
  importa `api/`. Las rutas de `public/` se arman con
  `import.meta.env.BASE_URL` (ya termina en `/`).
- El equipo tiene poca RAM: no correr `npm run dev`, `vercel dev` ni
  `npm run preview` a la vez (`vercel dev` levanta su propio servidor de Vite).
- `.env` y `.env.local` NO se versionan (están en `.gitignore`); la plantilla
  es `.env.example`. Las variables `VITE_*` quedan incrustadas en el
  bundle del cliente: nunca poner ahí una API key. `GEMINI_API_KEY` y
  `GEMINI_MODEL` solo las lee `/api/chat`.

## Arquitectura

**Fuente de verdad del estado**: `src/context/ReservasContext.jsx`, un
Context + `useReducer` que se espeja en `localStorage`
(`sportify_reservas_v2`) en cada cambio. Se consume con `useReservas()`;
nunca acceder a `localStorage` fuera de este archivo.

- **Ventana de 7 días**: hoy + 6 (`dias`). Por cancha y fecha solo se guarda
  la lista de horas ocupadas (`ocupados`); el resto se infiere libre.
- **`src/data/canchas.json`** es la semilla: `horas` base (común) +
  `ocupadosSemilla` por cancha (por offset de día, 0 = hoy) + campos de
  **catálogo** por cancha: `precioHora`, `imagen`, `descripcion`,
  `caracteristicas`. Al iniciar, `ReservasContext` mapea los offsets a fechas
  reales y reconcilia con `localStorage` mediante la función pura
  `fusionarConSemilla(...)` (exportada), que solo fusiona `ocupados`
  (descarta fechas fuera de la ventana). Los campos de catálogo salen siempre
  del JSON, nunca de `localStorage`: cambiarlos en el JSON basta para que se
  reflejen.
- **Dos tipos de reserva** (`tipo` en el mismo array `reservas`):
  - `individual`: una cancha, de 1 a 3 horas seguidas contiguas. Acción
    `RESERVAR`; guarda `horas`, `precioHora`, `descuentoHora`, `total`,
    `aguaGratis`.
  - `evento` (torneo/cumpleaños): varias canchas y/o horas consecutivas,
    bloqueo **todo-o-nada** (si una celda cancha×hora está ocupada, no se
    reserva nada). Acción `RESERVAR_EVENTO`; guarda `total`, `ahorro` y
    `packsAgua` con `calcularPrecioEvento` (mismas reglas por cancha).
  - Torneos por fases: no tienen acción propia. Usan `RESERVAR_EVENTO` /
    `reservarEvento` con `bloques` (uno por fase: `fecha`, `canchaIds`,
    `horas`), también todo-o-nada, y el precio sale de
    `calcularPrecioJornadas(bloques, canchas)`. El plan lo arma `useReserva`
    con las funciones de `src/lib/torneo.js`.
  - Ambos tipos guardan un `codigo` (`SPF-XXXXXX`, `generarCodigo`) que se
    genera en `reservar` / `reservarEvento` antes de despachar.
  - El choque se valida dos veces: antes de despachar (`reservar` /
    `reservarEvento` devuelven `{ ok, codigo }` o `{ ok: false, error }` sin
    tocar el estado) y otra vez dentro del reducer.
  - **Cancelación** (acción `CANCELAR`, función `cancelar(reservaId)` →
    `{ ok, error }`, mismo patrón de doble validación): solo reservas
    `individual`, hasta `negocio.cancelacion.horasMinimas` (6) horas antes de
    empezar; quita solo las horas de esa reserva de `ocupados` (la ocupación
    semilla, que no tiene registro en `reservas`, se queda) y elimina el
    registro. Lógica pura en `src/lib/cancelacion.js` (`verificarCancelable`,
    `aplicarCancelacion`, `buscarReservasCancelables`). La usan el chat y Mis
    reservas; no crear otra acción.
- **Reglas compartidas (`src/lib/`)**:
  - `precios.js`: única fuente de las reglas de precio — `MAX_HORAS_SEGUIDAS`
    (3), `MIN_HORAS_BENEFICIO` (2), `DESCUENTO_POR_HORA` (5.000, por cada hora
    desde 2 seguidas, con pack de agua gratis), `calcularPrecio`,
    `calcularPrecioEvento` (suma por cancha con esas mismas reglas; también
    alimenta el voucher en modo cancha, con una sola),
    `calcularPrecioJornadas` (torneos: por cada bloque y sus canchas, con las
    mismas reglas), `finDeFranja`, `formatoPrecio`. No redefinir
    `formatoPrecio` en otros archivos.
  - `torneo.js`: reglas de torneos, JS puro sin imports (lo importa `api/`) —
    `OPCIONES_EQUIPOS` (4, 8, 16), `OPCIONES_DURACION` (15, 20, 30 min),
    `MAX_CANCHAS_TORNEO` (3, de un solo deporte), `DESEMPATES` por deporte
    (penales en fútbol, tie-break en voley playa, super tie-break en pádel),
    `fasesDelTorneo`, `validarJornadas` (orden cronológico entre fases),
    `validarCanchasTorneo`, `sortearEquipos`, `validarCrucesManuales`,
    `programarTorneo` y `armarTorneo`.
  - `horarios.js`: selección de horas de la reserva, pura y con tests —
    `alternarHoraIndividual` (modo cancha) y `seleccionarRango` (eventos).
  - `codigoReserva.js`: `generarCodigo` y `textoQr` (texto que lleva el QR).
  - `validacion.js`: regex y limpieza de nombre (solo letras y espacios) y
    teléfono (3 + 9 dígitos). En la reserva el nombre es obligatorio
    (`errorNombreObligatorio`) y el teléfono opcional.
  - `fechas.js`: etiquetas y meses, `fechaCompleta` (fecha absoluta, la que
    usan voucher, confirmación y QR: nunca "mañana") y
    `esHoraPasada(fecha, hora)`. Las horas de hoy que ya empezaron cuentan
    como no disponibles (`calcularDisponibilidad` y `horaLibre` en
    `ReservasContext`), así que no se pueden reservar ni se cuentan como
    libres.
  - `canchas.js`: agrupación por deporte, `tituloCancha`, `estiloAcento`,
    `imagenGrandeCancha`, `imagenPlaceholderCancha`.
  - `cancelacion.js`: plazo de cancelación, estado tras cancelar y búsqueda
    de las reservas de una persona (teléfono normalizado igual y nombre sin
    tildes ni mayúsculas; las reservas sin teléfono nunca coinciden). También
    `buscarReservaPorCodigo`, `buscarReservasDePersona` y `horasDeReserva`,
    que usa `MisReservas`.
  - `negocio.js`: `formatoTelefono` ("310 774 0572"), `enlaceTelefono`
    (`tel:+57...`) y `textoHorario(horas)` ("8:00 - 21:00": primera franja
    a `finDeFranja` de la última).
  - `modelosChat.js`: respaldo de modelo de `/api/chat` (`listaModelos`,
    `esReintentable`, `ordenarPorDisponibilidad`, `tiempoIntento`,
    `respuestaFinal`). Solo lo importa el servidor; sin el SDK, JS puro.
  - `validacion.js` también tiene lo del chat: `normalizarNombre`,
    `normalizarTelefono`, `validarContactoChat` (teléfono obligatorio),
    `validarPropuestaReserva(propuesta, contexto)` (cancha, ventana de 7
    días, 1 a `MAX_HORAS_SEGUIDAS` horas seguidas y libres, contacto),
    `fechasVentana` y los textos fijos `MENSAJES_CHAT`. Lo importan el
    formulario, el widget y `/api/chat`: tiene que seguir siendo JS puro.
  - `fechas.js`: `horaAmPm('13:00')` → "1:00 p. m." (formato del chat).
- **Datos del negocio**: `src/data/negocio.json` es la única fuente de la
  información del local: contacto (dirección, zona, ciudad, teléfono, días),
  mapa (`mapaEmbed`, `mapaEnlace`), demanda (informativa), pagos y abono,
  cancelación (`horasMinimas` como número), servicios y `eventos` (los tipos
  que muestra `EventoCTA`). El horario no se escribe a mano: sale de
  `canchas.json` con `textoHorario`. Lo usan `Ubicacion`, `Footer`,
  `EventoCTA` y el chatbot (no inventar datos del local que no estén ahí).
- **Colores por deporte**: `src/data/deportes.js` (`DEPORTES`, con
  `colorAcento`) es la única fuente de verdad visual (heros, vista de
  canchas y tarjetas del carrusel de reserva). No hardcodear colores de deporte
  en otro lugar. `estiloAcento(acento)` arma el estilo en línea (`--accent`,
  `--accent-soft`, `--accent-contrast` con contraste WCAG y `--accent-text`,
  el acento oscurecido para leerse sobre fondo claro) y es la única función
  que lo hace.
- **IDs de anclaje** (de la página de inicio, `PaginaInicio.jsx`; no
  renombrar sin actualizar a quien los usa): `#hero-placeholder` (link
  "Inicio"; `Navbar` lo usa también para saber cuándo se pasó de los heros y,
  si no existe, se pinta opaco), `#eventos` (link "Eventos especiales",
  "Eventos" en móvil; lo consume `EventoCTA`) y `#ubicacion` (link
  "Ubicación" del navbar y el footer; lo consume `Ubicacion`). Desde la
  página de reserva esos enlaces usan `irASeccion(id)` (vuelve al inicio y
  baja a la sección).
- **Dos páginas, sin router** (desde el 23-10-2026, pedido de Juan: la
  reserva era un modal y pasó a página propia). `App.jsx`: `ReservasProvider`
  → `VistaCanchasProvider` → `Navbar` → **`PaginaInicio`** (heros +
  `EventoCTA` + `Ubicacion`) **o** `<VistaCanchas key={apertura} />` (página
  de reserva) → `Footer` → `Chatbot` (montado una sola vez, portal a
  `document.body`; conserva la conversación entre páginas). Al reservar, el
  inicio se **desmonta** (videos y ScrollTriggers incluidos).
  - Rutas: `/` y `/reservar/<slug>` (+ `?modo=torneo|cumpleanos`), con la
    History API. Lógica pura y con tests en `src/lib/rutas.js`
    (`rutaReserva`, `leerRuta`, `esClicNormal`). Los enlaces viejos
    `/#canchas-<slug>` redirigen a la ruta nueva. `vercel.json` reescribe
    `/reservar/:path*` a `/index.html` (sin eso, recargar da 404 en
    producción); Vite dev y `preview` ya hacen ese fallback.
  - Los enlaces que abren la reserva ("Ver canchas…", "Canchas", "Reserva un
    evento") tienen `href` real: con `esClicNormal(e)` navegan dentro del
    sitio; Ctrl+clic o clic medio abren otra pestaña.
- **Tokens globales** (`src/App.css`, `:root`): `--eventos-fondo`,
  `--color-marca` (+ `-soft`, `-contraste`; el ámbar `#f6a94b`, color base
  cuando no hay deporte activo) y `--z-chatbot` (1100, encima del navbar
  1000). Nada de z-index sueltos para el chat.
- Cada `DeporteHero` lleva `data-sport={slug}` en su `<section>` (lo usa el
  chat para el acento).
- **`DeporteHero`**: video de fondo pinned con GSAP/ScrollTrigger; el
  `currentTime` del video sigue al scroll (`PX_POR_SEGUNDO`, `SUAVIZADO`),
  por eso los videos de `public/media/hero_*.mp4` son all-intra (`keyint=1`),
  1080p30 y sin audio. Los fuente en alta calidad van en
  `public/media/fuente/` (ignorado por git).
- **`VistaCanchas` / `VistaCanchasContext`**: `VistaCanchas` **es la página
  de reserva** (`<main className="vista-canchas">` en el flujo normal, scroll
  de la ventana, navbar opaco arriba y footer abajo; sin X ni Escape: un
  enlace "Volver al inicio"). Al entrar sube al tope, pone `document.title`
  según el modo y lleva el foco al `<h1>`. El contexto (nombre heredado)
  hace la navegación:
  - `abrirVista(slug, { modo })` ("Ver canchas de..." y "Canchas" en modo
    `cancha`; "Reserva un evento" y el chat en `torneo`): guarda
    `inicioScrollY` en la entrada de historial del inicio, hace `pushState`
    (o `replaceState` si ya se está en la página, para que "Volver" siga
    llevando al inicio) y sube `apertura`, que remonta la página limpia.
  - `cambiarDeporte(slug)` (pestañas): `replaceState`, conserva `?modo`.
    `actualizarModo(modo)`: la página lo llama al cambiar de modo para que
    la URL lo refleje.
  - `cerrarVista()`: `history.back()` si se llegó desde el inicio; si se
    entró por enlace directo, `pushState('/')` y arriba. `irASeccion(id)`:
    en el inicio hace scroll; en la reserva deja la sección como destino y
    vuelve.
  - Al volver, `PaginaInicio` espera los metadatos de los videos (la altura
    de los pins depende de su duración; máx. 2,5 s), hace
    `ScrollTrigger.refresh()` y restaura la posición o va a la sección
    (`leerDestinoInicio`/`limpiarDestinoInicio`, a prueba de StrictMode).
    `history.scrollRestoration = 'manual'`.
  - Estado de la reserva: hook `useReserva` (`components/reservas/`), con
    todo el estado, derivados y acciones (modo, fecha, cancha/canchas, horas,
    datos, contacto, precio, `motivoBloqueo`, `confirmar`). Arranca limpio al
    montar la página (`activo: true`).
  - Layout: título según el modo + `SelectorModo` (Cancha · Torneo ·
    Cumpleaños), pestañas por deporte (filtran el carrusel en todos los modos;
    en eventos la selección se conserva entre pestañas; con `tabIndex` móvil,
    flechas, Inicio y Fin de forma circular, y `href` real para Ctrl+clic),
    filtro "Solo con
    horarios libres ese día" (día elegido en el formulario) y, en `large`, dos
    columnas: carrusel + `CanchasElegidas` (eventos) + `FormularioReserva` a
    la izquierda, `VoucherReserva` sticky a la derecha. Al confirmar, el
    cuerpo pasa a `ConfirmacionReserva` (sube al tope); "Listo" vuelve al
    inicio. "Limpiar selección" del voucher (`reiniciar`) limpia sin salir de
    la página. El voucher sticky va con `top: 5.5rem` por el navbar.
  - Modo cancha: la cancha elegida es siempre una de la pestaña visible (si
    no, se elige la primera de la pestaña; manda la pestaña que se mira).
    Cambiar de modo conserva día, contacto y cancha y limpia las horas.
  - Modos de evento: `canchaIds` arranca vacío, así que al entrar a torneo no
    hay canchas elegidas (decisión de la etapa 8: "Reserva un evento" siempre
    abre en voley y una cancha ya elegida bloquearía el torneo a ese deporte).
    Los avisos dicen qué hacer.
  - Carrusel: `DepthCarousel` de React Bits (`src/components/reactbits/`),
    con `renderOverlay`, atributos del `<img>`, `initialIndex`, `autoScale`
    y textos accesibles agregados a mano. Las fotos son las protagonistas
    (pedido de Juan, 23-10-2026): sin encuadre ni fondo con degradado
    alrededor, fondo blanco liso y poco texto encima. Encima de cada tarjeta,
    `TarjetaCanchaCarrusel`: deporte arriba y, abajo, sobre un degradado
    corto solo detrás del texto, nombre, precio, "N de 13 horarios libres"
    del día elegido y la acción ("Cancha elegida" o, en eventos, "Agregar al
    evento"/"Quitar del evento" con `pointer-events: auto` porque el overlay
    no los recibe). Las características y la descripción van en el visor
    en grande y también sobre la foto, en los tres deportes
    (`detalleEnTarjeta: true` en `deportes.js`). `key` =
    deporte + modo (cancha/evento): se remonta centrado en la cancha elegida.
    Menos de 3 canchas por deporte → grid estático (elige o alterna según el
    modo). Las cards del grid usan `card cancha-card` (`VistaCanchas.css`).
  - Identidad por deporte: `.vista-canchas` y el `<dialog>` del visor reciben
    `data-sport` + `estiloAcento(...)`; el resto consume `var(--accent)`.
  - Fotos: `imagen` en el JSON es `/img/canchas/<id>.webp` (720 px); la de
    1440 px es `<id>-lg.webp`, derivada con `imagenGrandeCancha()`. Las
    cards usan `srcSet` con ambas (`sizes` hasta 612 px); el fondo
    difuminado del visor usa la de 720. Sin imagen o si falla, degradado SVG
    de `imagenPlaceholderCancha()`.
  - Tarjeta activa: `.vista-canchas__cuerpo` es `container-type: size` con
    alto propio (celular `clamp(380px, 112vw, 600px)`; desde `large`
    `clamp(480px, min(78vh, 100dvh - 300px), 820px)`, para que la tarjeta y
    su botón entren enteros bajo la cabecera de ~325 px: navbar, "Volver",
    título, modos, pestañas y filtro; si cambia, ajustar los 300px) y la
    tarjeta mide `min(92cqh, 92cqw, 760px)` (`102cqw` en celular) con
    `aspect-ratio: 720/893`: unos 445×552 en 1440×900. Eso pisa el tamaño por props de
    `DepthCarousel` (420×520, solo respaldo y paso de arrastre), que se
    monta con `autoScale={false}`: su escala con `transform` no achica la
    caja y en celular dejaba la tarjeta diminuta. `.vista-canchas__marco`
    lleva `overflow-x: clip` para recortar las laterales en el borde sin
    scroll horizontal. Laterales: `spread` 140 (con `autoScale` apagado ya
    no afecta la escala), `falloff` 0.18 y `blur` 3, para que se vea la
    foto siguiente. Ken Burns lento, respeta `prefers-reduced-motion`.
  - Visor en grande (`VisorCancha`, mismo archivo): `<dialog>` nativo
    (`showModal()`) a `100dvw/100dvh` con `max-width/max-height: none` (si no,
    el navegador deja ver la vista detrás), fondo opaco, layout lado a lado en
    pantallas más anchas que altas. Bloquea el scroll del documento
    (`document.documentElement`). Clic en el fondo cierra
    (`!target.closest('.vista-canchas__visor-imagen-wrap, .vista-canchas__visor-info')`);
    Esc/clic/botón disparan el `close` nativo que sincroniza `visorAbierto`. Su botón
    depende del modo: "Elegir horario" (cierra y lleva a `#reserva-horario`)
    o "Agregar al evento"/"Quitar del evento" (alterna y cierra).
- **Componentes de reserva** (`components/reservas/`), usados por
  `VistaCanchas`:
  - Horas (`FormularioReserva`): modo cancha con `alternarHoraIndividual` (bloque de hasta 3;
    vecina amplía, la cuarta avisa, elegida quita, lejana reinicia). Eventos
    con `seleccionarRango`: inicio y fin eligen todo lo de en medio (08:00 →
    20:00 = 13 h, hasta las 21:00); si hay una hora ocupada en medio en
    alguna cancha, no se aplica y se avisa. Si la franja queda con choques
    (cambian fecha, canchas o disponibilidad) se limpia.
  - `VoucherReserva`: total en vivo en todos los modos, una línea por cancha,
    packs de agua, ahorro y el motivo por el que aún no se puede confirmar.
    En cumpleaños muestra los invitados.
  - `ConfirmacionReserva`: código con botón de copiar, QR (`qrcode.react`,
    `QRCodeCanvas`) con `textoQr`, "Descargar QR" y las condiciones de
    `negocio.json`. En cumpleaños, los invitados; en torneo, las llaves. Sin
    backend, el QR lleva los datos dentro.
  - `SelectorDia` (`components/shared/`) cuenta los horarios libres de la
    cancha (modo cancha) o los libres en todas las elegidas (eventos).
  - `torneo/`: `CalendarioTorneo` (día y horario por fase, con bloqueo de lo
    anterior a la fase previa), `Bracket` (llaves; también en la confirmación),
    `AsignacionManual` (cruces manuales con intercambio) y `AlertaTiempo`
    (tiempo insuficiente, con acción para bajar a 15 min por partido).
  - **Asistente del torneo en móvil** (desde el 07-11-2026; spec en
    `odd/tasks/asistente-torneo-movil.md`): bajo `large`
    (`(max-width: 63.9375em)`) el modo torneo muestra un paso a la vez; en
    escritorio y en los otros modos, el layout de siempre.
    - Pasos (`src/lib/pasosTorneo.js`, puro y con tests): `canchas`,
      `formato`, `fechas`, `llaves`, `datos` y `resumen`.
      `estadoPasosTorneo(reserva)` da la completitud y el motivo de cada uno;
      `pasosAlcanzables` decide a qué paso se puede saltar (los completos y
      el primero incompleto). `IndicadorPasos` usa la misma regla y en
      escritorio sigue mostrando 5 pasos.
    - `torneo/useAsistenteTorneo.js` (`esMovil` con `matchMedia`, paso
      actual, `siguiente`/`anterior`/`irA`, scroll y foco al título del
      paso) y `torneo/AsistenteTorneo.jsx` (cabecera, indicador clicable y
      barra inferior fija con "Paso N de 6"). Todo lo elegido sigue en
      `useReserva`: cambiar de paso o de tamaño no pierde nada.
    - La barra publica `--alto-barra-inferior` en `<html>` y `Chatbot.css`
      sube el botón y el panel esa distancia (sin asistente vale 0).
    - `FormularioReserva` acepta `seccion` (`'formato' | 'fechas' | 'llaves'
      | 'datos' | 'guardados'`): con un valor válido en modo torneo solo
      renderiza ese bloque (`torneo/Paso*.jsx`); sin él, todo como antes. El
      `Bracket` del paso `llaves` lo pone `SeccionLlaves`.
    - El bracket tiene ancho fijo (616-646 px): bajo `large`,
      `contain: inline-size` en `.bracket-torneo__movil` y
      `.bracket-torneo__canvas-scroll` evita que ensanche la página y lo deja
      desplazarse dentro de su caja. No quitarlo.
- **`MisReservas` (`components/layout/`)**: `<dialog>` con `showModal()`, abierto
  desde el navbar. Busca por código o por nombre + teléfono, muestra el QR y
  cancela reservas individuales hasta 6 horas antes. Torneos y cumpleaños se
  consultan pero no se cancelan: se llama al local. Una reserva sin teléfono
  solo se encuentra por código.
- **`EventoCTA` (`#eventos`)**: sección de 100vh en dos columnas
  (`large-5` / `large-7`, apiladas bajo `large`). Izquierda: mensaje, 4 stats
  de datos reales (`DEPORTES.length`, `canchas.length`, `dias.length` y el
  horario; no inventar cifras) con conteo GSAP desde 0 (el HTML trae el
  valor final, así que sin animación se ve bien) y el enlace con forma de
  botón que abre la página de reserva en modo torneo. Derecha: `AccordionGallery` de React Bits
  (`components/reactbits/`) con un tipo de evento por deporte (`TIPOS_EVENTO`:
  Torneos → fútbol, Cumpleaños → vóley playa, Eventos especiales → pádel);
  foto vía `canchasDelDeporte` + `imagenGrandeCancha` y acento vía
  `deportePorSlug`, sin rutas ni colores fijos. `AccordionGallery` tiene
  agregados a mano `item.acento`, `item.detalle`, la prop `ariaLabel` y
  `loading="lazy"` (ver su comentario de cabecera). Las animaciones de
  entrada van en `gsap.matchMedia('(prefers-reduced-motion:
  no-preference)')` y animan el **contenedor** de la galería, nunca los
  paneles (el accordion los anima por dentro). El hero previo tiene un
  degradado de salida (`--eventos-fondo` en `src/App.css`).
- **`Ubicacion` (`#ubicacion`, `components/ubicacion/`)**: sección "Visítanos"
  en dos columnas (`large-5` / `large-7`): dirección, teléfono con `tel:`,
  horario y "Cómo llegar" (`mapaEnlace`, pestaña nueva) a la izquierda; el
  iframe de Google Maps (`mapaEmbed`, `loading="lazy"`, `title`) a la
  derecha. Entrada GSAP como en `EventoCTA` (texto en cascada y el mapa
  desde `x: 40`); por eso la sección lleva `overflow: hidden`, o la página
  tendría scroll horizontal mientras el mapa espera su animación. El footer
  tiene 4 columnas (marca, navegación, horario, contacto) con costuras solo
  desde `large`.

## Chatbot

Plan detallado por partes (6.1 servidor, 6.2 widget, 6.3 reservar/cancelar):
el plan del chatbot está en `planificacion/etapas/1-chatbot/PLAN.md`.

- **Arquitectura**:
  - El navegador es la única fuente de verdad. `/api/chat` no guarda estado
    ni lee `localStorage`: en cada mensaje el widget le manda el historial
    reciente y una foto de la disponibilidad.
  - Gemini nunca escribe reservas. Para reservar, cancelar o abrir una
    sección llama una función; el servidor valida los argumentos con
    `src/lib/validacion.js` y devuelve una **acción propuesta** que el
    navegador ejecuta solo si el usuario confirma.
  - Una llamada a Gemini por mensaje (más los reintentos con otro modelo si
    falla: ver "Respaldo de modelo"). Negocio, precios y disponibilidad
    van en la system instruction. Los errores de validación los responde el
    servidor con texto fijo (`MENSAJES_CHAT`), sin volver a llamar al modelo.
- **Servidor** (`api/chat.js`, Vercel Function de Node, handler Web estándar
  `export default { fetch }`; los helpers van en `api/_lib/`, que no se
  vuelven rutas):
  - Sintaxis ESM en `.js` sin `"type": "module"`: Vercel la compila a
    CommonJS, incluidos los módulos de `src/` y los JSON que importa (por eso
    se importan directo, con extensión, sin duplicar código). Por eso
    `package.json` **no** lleva `"type": "module"` aunque el proyecto use
    Vite: los JSON se importan sin atributos y la función dejaría de
    compilar a CommonJS (las configs ESM van en `.mjs`).
    `.vercelignore` es lista blanca: `/api`, `/vercel.json`, `/index.html` y
    `/vite.config.mjs` tienen que estar permitidos.
  - Como la función queda en CommonJS, `require('@google/genai')` usa
    `dist/node/index.cjs`, pero el rastreo de archivos de Vercel solo
    incluía `index.mjs` (en producción: "Cannot find module ...index.cjs").
    `vercel.json` lo agrega con `functions["api/chat.js"].includeFiles`. Si
    se agrega otra dependencia con exports dobles, revisar lo mismo con
    `vercel build` (en `.vercel/output/functions/api/chat.func`).
  - SDK `@google/genai` (`ai.models.generateContent`), modelo principal de
    `GEMINI_MODEL` (por defecto `gemini-3.5-flash-lite`), `thinkingLevel:
    MINIMAL`, `maxOutputTokens: 400`, timeout por intento con `abortSignal`.
  - **Respaldo de modelo** (lógica pura en `src/lib/modelosChat.js`, con
    tests; `api/chat.js` solo hace el bucle):
    - Cadena: `GEMINI_MODEL` + `GEMINI_MODELOS_RESPALDO` (comas; sin definir =
      `gemini-3.1-flash-lite,gemini-3.6-flash`; vacía = sin respaldo), sin
      duplicados, máx. 3.
    - Pasa al siguiente ante 503, 500, 429, 404 o tiempo agotado; corta ante
      400/401/403 (problema de la petición o de la key).
    - Presupuesto 17 s (el widget aborta a los 20 s): primer intento hasta
      7 s, los siguientes hasta 6 s, y no intenta con menos de 2,5 s.
    - `fallasModelos` (Map a nivel de módulo) deja de lado 60 s un modelo que
      falló, para no esperarlo en cada mensaje durante una caída. Es memoria
      de la instancia (Fluid Compute la reutiliza), no datos de usuarios.
      `vercel dev` recarga la función en cada petición: ahí no se ve.
    - Si fallan todos: 429 si todos fueron 429, 504 si alguno se colgó, 502
      en el resto. Logs: `[chat] falló el modelo <m>: <name> <status>` y
      `[chat] respondió el modelo de respaldo <m>`.
    - Todo modelo de la cadena debe aceptar `thinkingLevel: MINIMAL`:
      `gemini-3.7-flash` y `gemini-3.8-flash` responden 400 ("Thinking level
      MINIMAL is not supported") y los 2.5/`*-latest` tampoco sirven
      (`gemini-2.5-flash-lite` además ya no está disponible para cuentas
      nuevas). `gemini-3.6-flash` va último: su cuota gratuita es baja y
      responde menos ceñido al negocio que los *lite*.
  - Function calling en modo `ANY` con 4 funciones: `responder({ texto,
    sugerencias })` (interna, para contestar con texto),
    `proponer_reserva({ canchaId, fecha, horas, nombre, telefono })`,
    `proponer_cancelacion({ nombre, telefono, canchaId?, fecha?, hora? })` y
    `abrir_seccion({ seccion, deporte?, mensaje })`. Se probó salida JSON
    estructurada + funciones: el modelo dejaba de llamar funciones, por eso
    existe `responder`.
  - Catálogo y precios salen siempre de `canchas.json`; del contexto del
    cliente solo se usa la disponibilidad, filtrada a canchas y fechas
    válidas.
  - Reglas de las instrucciones que costó afinar (`api/_lib/instrucciones.js`):
    si el último mensaje del bot ofrecía más de una franja, día o cancha y el
    usuario no dijo cuál ("resérvalo"), eso es un dato que falta: pregunta
    cuál, sin suponer; y pide solo los datos que faltan (antes volvía a pedir
    la fecha). Caso de prueba: `reservalo-varias`. Con código `SPF-XXXXXX` o
    sin teléfono no se llama `proponer_cancelacion`: remite a "Mis reservas"
    (el chat no busca por código, decisión de la etapa 8).
  - **Un dato fijo lo garantiza el servidor, no el modelo.** Con `abrir_seccion`
    de ubicación, si el mensaje no trae la dirección real, `procesarLlamada`
    (`api/_lib/funciones.js`) responde con `TEXTOS.seccion.ubicacion`. Reforzar
    las instrucciones no bastó (etapa 8, sección 7 del reporte).
  - Ambigüedad conocida del modelo: "de 5:00 p. m. a 7:00 p. m." a veces lo
    lee como si incluyera la franja de 7:00 y se contradice (no propone
    tarjeta, así que no reserva nada mal). Con las franjas nombradas ("las
    de 5:00 y 6:00 p. m.") no pasa. Pendiente de reforzar si se repite.
  - Gemini devuelve a veces 503 (sobrecarga) o se cuelga: para eso está el
    respaldo de modelo; si fallan todos, el widget muestra el mensaje
    genérico, que es lo correcto.
  - **Caída del 13-10-2026:** toda la línea *lite* (`3.5-flash-lite`,
    `3.1-flash-lite`, `flash-lite-latest`) daba 503 "high demand" o se
    colgaba. Para diagnosticar, leer `vercel logs requests --environment
    production --since 15m --query 'httpStatus >= 500 AND httpStatus < 600'`
    (el handler registra `error.name` y `status`).
  - **Cuotas del plan gratuito (por proyecto y por modelo):** `gemini-3.5-flash`
    tiene solo **20 consultas por día** (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`):
    no sirve como modelo del sitio. Cambiarlo ese día fue un error: las
    pruebas gastaron las 20 y hubo que volver al lite. No quemar cuota con
    diagnósticos; leer el detalle del 429 (`quotaId`, `quotaValue`) antes de
    cambiar de modelo. Los modelos 2.5 y `*-latest` no aceptan `thinkingLevel`
    (400): no son reemplazo directo.
- **Contrato**:
  - Petición `POST` JSON (máx. 48 KB): `mensaje` (1-500 caracteres),
    `historial` `[{ rol: 'usuario' | 'bot', texto }]` (últimos 20),
    `contexto` `{ fechaHoy, horaActual, canchas, disponibilidad: [{ canchaId,
    fecha, franjasLibres }] }` (hoy + 6 días, sin franjas ya pasadas).
  - Respuesta siempre `{ respuesta, sugerencias (máx. 3), accion | null }`,
    también en errores (405 método, 400 petición inválida; si fallan todos
    los modelos, 429/504/502 según `respuestaFinal`).
  - Acciones: `CONFIRMAR_RESERVA` (`canchaId`, `fecha`, `horas`, `nombre`,
    `telefono` normalizados), `BUSCAR_CANCELACION` (`nombre`, `telefono` y
    filtros opcionales) y `ABRIR_SECCION` (`seccion`: canchas | eventos |
    ubicacion, `deporte`).
- **Widget** (`src/components/chatbot/`):
  - `Chatbot.jsx`: botón flotante + panel ("Asistente Sportify"), portal a
    `document.body`, montado una vez en `App.jsx`. Abre/cierra con GSAP en
    `gsap.context()` (respeta `prefers-reduced-motion`), foco al input al
    abrir; Escape cierra solo el chat (`stopPropagation`) y devuelve el foco
    al botón. Bajo 640 px, panel a
    pantalla completa (safe-area con `env()`); al usar un botón de sección
    se cierra para que se vea la sección.
  - `useChatbot.js`: mensajes en `sessionStorage` (`sportify_chat_v1`, en
    try/catch), envío con timeout de 20 s, bloqueo de envíos dobles,
    "Nueva conversación" (`reiniciar`, descarta respuestas de una
    conversación ya reiniciada). El contexto sale de `useReservas()` vía
    `contextoChat` (`src/lib/chat.js`): `dias[0]` como hoy y franjas con
    `disponible: true`.
  - `useDeporteActivo.js`: acento = deporte de la página de reserva si se
    está en ella; si no, IntersectionObserver sobre `#root [data-sport]` (los
    heros; se vuelve a crear al volver al inicio porque depende de
    `deporteAbierto`); sin deporte, tokens de marca. El acento por deporte
    sale solo de `estiloAcento()`.
  - `useAccionesChat.js` + `AccionSeccion.jsx`: `ABRIR_SECCION` reutiliza la
    navegación del sitio: canchas con `cambiarDeporte`/`abrirVista`, eventos
    con `abrirVista(…, { modo: 'torneo' })` (si ya está en la página, la
    remonta en torneo) y ubicación con `irASeccion('ubicacion')`.
  - El visor de fotos (`<dialog>` con `showModal()`) deja inerte el chat
    mientras está abierto: es lo esperado.
  - CSS: `.chatbot__mensajes` lleva `position: relative` y `min-height: 0`,
    y el panel `overflow: clip`. Sin eso, los `.show-for-sr` (absolutos en
    Foundation) de cada mensaje se ubican respecto al panel, lo agrandan y
    al enfocar el input el navegador lo desplaza (se pierde la cabecera).
  - El foco va al input al terminar la animación de entrada (con
    `autoAlpha: 0` el panel está en `visibility: hidden`).
- **Reservar y cancelar desde el chat** (`useAccionesReserva.js`,
  `TarjetaReserva`, `TarjetaCancelacion`, `OpcionesCancelacion`):
  - Regla: el modelo propone, el usuario confirma (clic en la tarjeta o un
    "sí" explícito, `detectarSiNo` de `src/lib/chat.js`) y el código valida y
    ejecuta. Nada se escribe sin esa confirmación.
  - Los mensajes llevan `estado` (`pendiente` | `confirmada` | `cancelada` |
    `descartada` | `fallida`), la copia de los datos y el `comprobante`; todo
    persiste en `sessionStorage`. Solo hay una tarjeta pendiente a la vez.
    Con una pendiente, "sí"/"no" se resuelven sin llamar al servidor y
    cualquier otro texto la descarta y sigue normal.
  - Reservar usa `reservar()` (la del formulario; todo o nada). El total es
    `calcularPrecio` (con el descuento desde 2 horas), no `precioHora × horas`.
    "Ver comprobante" reutiliza `ConfirmacionReserva` (código + QR) dentro
    del panel; `VoucherReserva` no se reutiliza (traería sus botones).
  - Los textos fijos del navegador (`src/lib/chat.js`) son mensajes `bot`
    normales, sin `error`, para que entren al historial que ve el modelo.
- **Interfaz**: nada de copy técnico ("Gemini", "IA", "API"); tuteo neutro.
- **Pruebas**: `scripts/probar-chat.mjs` corre los casos contra `vercel dev`
  o producción. `npm run dev` no ejecuta `/api`. `vercel dev` **no** le pasa a
  las funciones las variables de `.env.local` (responde 500 "falta
  GEMINI_API_KEY"), pero sí las del entorno de la shell: arrancarlo con
  `set -a; . <(tr -d '\r' < .env.local); set +a; vercel dev`. Para cerrarlo,
  matar el árbol del proceso de `vercel dev` (detener solo la shell deja vivo
  el servidor en :3000; en PowerShell: buscar el proceso con
  `*vercel*dist*vc.js*dev*` en la línea de comandos y `taskkill /PID … /T /F`).
  En el equipo de Juan falló el 06-11-2026 con `EPERM` al crear symlinks en la
  caché de la CLI. Salida: cargar el handler con `vite.ssrLoadModule` detrás de
  un servidor mínimo. En Git Bash, `vercel curl /ruta` necesita
  `MSYS_NO_PATHCONV=1`.
- **El modelo no es determinista**: un caso que pasa una vez puede fallar la
  siguiente, y producción puede responder distinto que local. Antes y después
  de cambiar las instrucciones, correr los casos afectados varias veces en
  bucle (p. ej. 6) y comparar, no una sola vez, **también en el despliegue**
  (preview con `vercel curl`) y con el contexto completo de `probar-chat.mjs`:
  un ajuste dio 7 de 8 en local y 0 de 8 en el preview, con el mismo modelo.

## Despliegue

- Producción: https://proyecto-sportify.vercel.app (proyecto de Vercel
  `kgb10/proyecto-sportify`, enlazado en `.vercel/`, ignorado por git).
- **Cada push a `main` despliega a producción.** Para esperar el despliegue
  de un commit: `gh api repos/JuanFierro15/ProyectoSportify/commits/<sha>/status`
  (estado `success`, contexto `Vercel`).
- Preset Vite (salida `dist/`) en el dashboard (cambiado el 14-10-2026 con
  `vercel api /v9/projects/<id> -X PATCH -f framework=vite`) y también en
  `vercel.json` (`"framework": "vite"`, que es el que manda). Un push a otra
  rama crea un despliegue *Preview* (no producción, con Deployment Protection:
  probarlo con `vercel curl`, no con `curl`).
- Variables en Vercel (Production y Preview): `GEMINI_API_KEY` (sensible) y
  `GEMINI_MODEL`. Aplican desde el siguiente despliegue: cambiar con
  `vercel env update GEMINI_MODEL production --value … --yes` y luego
  `vercel redeploy https://proyecto-sportify.vercel.app --target production`.
  Ojo: `vercel env run` muestra el valor de `.env.local` (lo pisa); para
  verificar el valor real, `vercel env pull` a un archivo temporal del
  scratchpad, leer solo esa línea y borrarlo (la key, al ser Secret, no se
  baja). **Nunca imprimir el
  valor de la key ni de ningún secreto** (ni en código, logs o reportes): de
  la key solo se dice si existe, si está vacía y cuántos caracteres tiene.
- Probar en producción con Chrome escribe en el `localStorage` real del
  navegador: respaldarlo antes y restaurarlo al terminar (o usar un perfil
  temporal, como el de las capturas).

## Documentación (README y capturas)

- `README.md` es la documentación formal del repositorio (en GitHub):
  descripción, funcionalidades con capturas, reglas del negocio, arquitectura
  (diagramas Mermaid), stack, estructura, instalación, pruebas, despliegue,
  accesibilidad, bloques y créditos. Si cambia la interfaz o una regla de un
  bloque, actualizar el README y sus capturas en el mismo trabajo. Sin
  menciones a Claude ni a las herramientas del flujo de desarrollo.
- Capturas en `docs/capturas/` (WebP de 35-90 KB y `chat-reserva.gif`, unos
  330 KB; todo cerca de 1,1 MB). `docs/` no entra al build (lista blanca de
  `.vercelignore`).
- Cómo se tomaron (por si hay que repetirlas): un script Node 24 sin
  dependencias (el script está versionado en
  `planificacion/herramientas/capturas/capturas.mjs` (correr desde la raíz con
  `preview` arriba; perfil y verificación en la carpeta temporal del sistema)) que abre
  `chrome.exe --headless=new --remote-debugging-port=9333` con un
  `--user-data-dir` temporal, lo maneja por CDP con el `WebSocket` nativo y
  captura con `Page.captureScreenshot` (`format: 'webp'`, calidad 82) contra
  producción. Escritorio 1440×900; celular 390×844 con DPR 2. Las de la
  página de reserva (`vista-canchas`, `reserva-voucher`, `modo-torneo`) se
  pueden tomar contra `npm run build` + `npm run preview` (4173), navegando a
  `/reservar/padel` y desplazando con `window.scrollBy` (la página no usa
  `/api`). Al terminar, matar el árbol del proceso de `preview` (detener la
  shell deja vivo Vite en 4173). Detalles que importan:
  - Los heros se capturan con 400 px de scroll dentro de su sección (con 0 no
    aparece el texto); la sección está dentro de un `.pin-spacer`.
  - Elegir **mañana** en el `SelectorDia`: de noche, hoy no tiene franjas y
    las tarjetas dicen "Sin horarios libres ese día".
  - Pasar por `about:blank` entre escenas para que cada una arranque con
    `load` y estado limpio.
  - En modo torneo no entra ninguna cancha agregada y "Agregar al evento"
    solo existe en la tarjeta activa del carrusel (avanzar con
    `.depth-carousel__arrow--next`).
  - Los inputs controlados de React se llenan con `Input.insertText` tras
    enfocar el campo.
  - El GIF: `Page.startScreencast` (PNG) con los timestamps de cada frame →
    lista de `concat` de ffmpeg con duraciones → recorte al panel del chat,
    `setpts=PTS/1.2`, 12 fps, `palettegen=max_colors=256:stats_mode=full` y
    `paletteuse`. El screencast no manda frames si la pantalla no cambia:
    alargar a mano la duración del último frame.
  - Datos ficticios: "Ana Gómez", 300 123 4567. Nunca datos reales.
- Créditos de medios (los pidió Juan así): fotos de las canchas creadas con
  Gemini (Nano Banana) y videos de los heros con Gemini (Omni).

## Cómo trabajamos

- El proyecto avanza **por bloques independientes**. No mezcles trabajo de un
  bloque futuro dentro del actual ni modifiques bloques cerrados salvo que se
  pida.
- Bloques:
  1. ✅ Estructura base con Foundation
  2. ✅ Hero + animaciones GSAP/ScrollTrigger
  3. ✅ Catálogo de canchas (`VistaCanchas` con `DepthCarousel`)
  4. ✅ Sistema de reservas (1 a 3 horas seguidas, descuento, validación)
  5. ✅ Modo evento especial (torneos por fases multi-día con llaves, cumpleaños)
  6. ✅ Chatbot (ver "Chatbot" y la etapa 1 de `planificacion/`)
  7. Panel de estado/admin: descartado el 06-11-2026 (decisión de Juan), no se
     hace. En el README esa fila quedó como "Mis reservas" y la auditoría de
     usabilidad. Lo pendiente está en `planificacion/etapas/8-cierre-sustentacion/`.
- Al terminar un bloque, deja el código funcionando y documentado.

## Configuración de repositorio (obligatorio siempre)

- `AGENTS.md` (estas instrucciones) y `CLAUDE.md` (una sola línea,
  `@AGENTS.md`) se versionan desde el 07-11-2026 (decisión de Juan) para que
  todo el equipo use las mismas reglas. Los cambios se hacen en `AGENTS.md`;
  no duplicar contenido en `CLAUDE.md` ni en `GEMINI.md`.
- El `.gitignore` excluye la config local de los asistentes (`.claude/`,
  `GEMINI.md`, `.mcp.json`, `.claude.json`, `.agents/`), además de `.env` y
  los videos fuente. `.vercelignore` es lista blanca, así que estos archivos
  no llegan al despliegue.
- **Ningún commit debe mencionar IA, Claude ni Anthropic**, ni incluir
  coautoría de ellos.
- Commits en español con prefijo (`feat:`, `fix:`, `chore:`, `docs:`,
  `test:`), un tema por commit.
- El repositorio debe tener **Topics de GitHub** relevantes (`react`,
  `foundation-framework`, `gsap`, `javascript`, `reservas-deportivas`,
  `proyecto-universitario`, `chatbot`, `gemini-api`, `vercel-functions`).
  La descripción y el sitio web del repo apuntan a la demo de producción.

## Estilo de código

- Componentes funcionales con Hooks, un componente por archivo, agrupados por
  dominio en `src/components/` (`layout/`, `hero/`, `canchas/`, `reservas/`,
  `eventos/`, `ubicacion/`, `shared/`, `reactbits/`, `chatbot/`).
- Datos semilla en `src/data/*.json`.
- Props y estados en español, de forma consistente.

## Estándar de calidad UI

Aplica a todos los bloques:

- **Nada de detalles de implementación en el texto visible**: prohibido
  mencionar `localStorage`, "se guarda en tu navegador", JSON, estado de
  React, nombres de componentes, etc.
- **Tuteo** ("Elige", "Reserva", "Vive"); nada de voseo ("Elegí", "Podés").
- **Color de acento por deporte** siempre desde `src/data/deportes.js`.
- **Cards con altura pareja y filas centradas**: `flex` column con el CTA al
  fondo (`margin-top: auto`); filas incompletas con `grid-x align-center`.
- **Disponibilidad explícita**: todo indicador visual (colores, puntos) va con
  texto claro ("6 de 13 horarios disponibles") y leyenda.
- Animaciones GSAP siempre dentro de `gsap.context()` con `ctx.revert()` en
  el cleanup.

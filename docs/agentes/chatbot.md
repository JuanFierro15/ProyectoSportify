# Chatbot (servidor, contrato y widget)

Detalle del asistente conversacional: arquitectura, función de servidor `/api/chat`, respaldo de modelo, contrato JSON, widget y flujo de reserva y cancelación. Lee este archivo antes de tocar `api/`, `src/components/chatbot/`, `src/lib/chat.js`, `src/lib/modelosChat.js` o `scripts/probar-chat.mjs`.

Plan detallado por partes (6.1 servidor, 6.2 widget, 6.3 reservar/cancelar): el plan del chatbot está en `planificacion/etapas/1-chatbot/PLAN.md`.

## Arquitectura

- El navegador es la única fuente de verdad. `/api/chat` no guarda estado ni lee `localStorage`: en cada mensaje el widget le manda el historial reciente y una foto de la disponibilidad.
- Gemini nunca escribe reservas. Para reservar, cancelar o abrir una sección llama una función; el servidor valida los argumentos con `src/lib/validacion.js` y devuelve una **acción propuesta** que el navegador ejecuta solo si el usuario confirma.
- Una llamada a Gemini por mensaje (más los reintentos con otro modelo si falla: ver "Respaldo de modelo"). Negocio, precios y disponibilidad van en la system instruction. Los errores de validación los responde el servidor con texto fijo (`MENSAJES_CHAT`), sin volver a llamar al modelo.

## Servidor (`api/chat.js` y `api/_lib/`)

(`api/chat.js`, Vercel Function de Node, handler Web estándar `export default { fetch }`; los helpers van en `api/_lib/`, que no se vuelven rutas):

- Sintaxis ESM en `.js` sin `"type": "module"`: Vercel la compila a CommonJS, incluidos los módulos de `src/` y los JSON que importa (por eso se importan directo, con extensión, sin duplicar código). Por eso `package.json` **no** lleva `"type": "module"` aunque el proyecto use Vite: los JSON se importan sin atributos y la función dejaría de compilar a CommonJS (las configs ESM van en `.mjs`). `.vercelignore` es lista blanca: `/api`, `/vercel.json`, `/index.html` y `/vite.config.mjs` tienen que estar permitidos.
- Como la función queda en CommonJS, `require('@google/genai')` usa `dist/node/index.cjs`, pero el rastreo de archivos de Vercel solo incluía `index.mjs` (en producción: "Cannot find module ...index.cjs"). `vercel.json` lo agrega con `functions["api/chat.js"].includeFiles`. Si se agrega otra dependencia con exports dobles, revisar lo mismo con `vercel build` (en `.vercel/output/functions/api/chat.func`).
- SDK `@google/genai` (`ai.models.generateContent`), modelo principal de `GEMINI_MODEL` (por defecto `gemini-3.5-flash-lite`), `thinkingLevel: MINIMAL`, `maxOutputTokens: 400`, timeout por intento con `abortSignal`.
- **Respaldo de modelo** (lógica pura en `src/lib/modelosChat.js`, con tests; `api/chat.js` solo hace el bucle):
  - Cadena: `GEMINI_MODEL` + `GEMINI_MODELOS_RESPALDO` (comas; sin definir = `gemini-3.1-flash-lite,gemini-3.6-flash`; vacía = sin respaldo), sin duplicados, máx. 3.
  - Pasa al siguiente ante 504, 503, 500, 429, 404 o tiempo agotado; corta ante 400/401/403 (problema de la petición o de la key).
  - Presupuesto 17 s (el widget aborta a los 20 s): primer intento hasta 7 s, los siguientes hasta 6 s, y no intenta con menos de 2,5 s.
  - `fallasModelos` (Map a nivel de módulo) deja de lado 60 s un modelo que falló, para no esperarlo en cada mensaje durante una caída. Es memoria de la instancia (Fluid Compute la reutiliza), no datos de usuarios. `vercel dev` recarga la función en cada petición: ahí no se ve.
  - Si fallan todos: 429 si todos fueron 429, 504 si alguno se colgó, 502 en el resto. Logs: `[chat] falló el modelo <m>: <name> <status>` y `[chat] respondió el modelo de respaldo <m>`.
  - Todo modelo de la cadena debe aceptar `thinkingLevel: MINIMAL`: `gemini-3.7-flash` y `gemini-3.8-flash` responden 400 ("Thinking level MINIMAL is not supported") y los 2.5/`*-latest` tampoco sirven (`gemini-2.5-flash-lite` además ya no está disponible para cuentas nuevas). `gemini-3.6-flash` va último: su cuota gratuita es baja y responde menos ceñido al negocio que los *lite*.
- Function calling en modo `ANY` con 4 funciones: `responder({ texto, sugerencias })` (interna, para contestar con texto), `proponer_reserva({ canchaId, fecha, horas, nombre, telefono })`, `proponer_cancelacion({ nombre, telefono, canchaId?, fecha?, hora? })` y `abrir_seccion({ seccion, deporte?, mensaje })`. Se probó salida JSON estructurada + funciones: el modelo dejaba de llamar funciones, por eso existe `responder`.
- Catálogo y precios salen siempre de `canchas.json`; del contexto del cliente solo se usa la disponibilidad, filtrada a canchas y fechas válidas.
- Reglas de las instrucciones que costó afinar (`api/_lib/instrucciones.js`): si el último mensaje del bot ofrecía más de una franja, día o cancha y el usuario no dijo cuál ("resérvalo"), eso es un dato que falta: pregunta cuál, sin suponer; y pide solo los datos que faltan (antes volvía a pedir la fecha). Caso de prueba: `reservalo-varias`. Con código `SPF-XXXXXX` o sin teléfono no se llama `proponer_cancelacion`: remite a "Mis reservas" (el chat no busca por código, decisión de la etapa 8).
- **Un dato fijo lo garantiza el servidor, no el modelo.** Con `abrir_seccion` de ubicación, si el mensaje no trae la dirección real, `procesarLlamada` (`api/_lib/funciones.js`) responde con `TEXTOS.seccion.ubicacion`. Reforzar las instrucciones no bastó (etapa 8, sección 7 del reporte).
- Ambigüedad conocida del modelo: "de 5:00 p. m. a 7:00 p. m." a veces lo lee como si incluyera la franja de 7:00 y se contradice (no propone tarjeta, así que no reserva nada mal). Con las franjas nombradas ("las de 5:00 y 6:00 p. m.") no pasa. Pendiente de reforzar si se repite.
- Gemini devuelve a veces 503 (sobrecarga) o se cuelga: para eso está el respaldo de modelo; si fallan todos, el widget muestra el mensaje genérico, que es lo correcto.
- **Caída del 13-10-2026:** toda la línea *lite* (`3.5-flash-lite`, `3.1-flash-lite`, `flash-lite-latest`) daba 503 "high demand" o se colgaba. Para diagnosticar, leer `vercel logs requests --environment production --since 15m --query 'httpStatus >= 500 AND httpStatus < 600'` (el handler registra `error.name` y `status`).
- **Cuotas del plan gratuito (por proyecto y por modelo):** `gemini-3.5-flash` tiene solo **20 consultas por día** (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`): no sirve como modelo del sitio. Cambiarlo ese día fue un error: las pruebas gastaron las 20 y hubo que volver al lite. No quemar cuota con diagnósticos; leer el detalle del 429 (`quotaId`, `quotaValue`) antes de cambiar de modelo. Los modelos 2.5 y `*-latest` no aceptan `thinkingLevel` (400): no son reemplazo directo.

## Contrato

- Petición `POST` JSON (máx. 48 KB): `mensaje` (1-500 caracteres), `historial` `[{ rol: 'usuario' | 'bot', texto }]` (últimos 20), `contexto` `{ fechaHoy, horaActual, disponibilidad: [{ canchaId, fecha, franjasLibres }] }` (hoy + 6 días, sin franjas ya pasadas; `fechaHoy` tiene que ser una fecha real). Un `canchas` en el contexto se ignora: el catálogo sale de `canchas.json`.
- Respuesta siempre `{ respuesta, sugerencias (máx. 3), accion | null }`, también en errores (405 método, 400 petición inválida, 500 si falla armar el contexto; si fallan todos los modelos, 429/504/502 según `respuestaFinal`). El widget guarda toda respuesta con `!res.ok` como mensaje con `error: true`, que no entra al historial.
- Con una tarjeta pendiente, `detectarSiNo(texto, tipo)`: "cancelar" es sí en una de cancelación, no en una de reserva y ninguno de los dos en la lista de opciones.
- Acciones: `CONFIRMAR_RESERVA` (`canchaId`, `fecha`, `horas`, `nombre`, `telefono` normalizados), `BUSCAR_CANCELACION` (`nombre`, `telefono` y filtros opcionales) y `ABRIR_SECCION` (`seccion`: canchas | eventos | ubicacion, `deporte`).

## Widget (`src/components/chatbot/`)

- `Chatbot.jsx`: botón flotante + panel ("Asistente Sportify"), portal a `document.body`, montado una vez en `App.jsx`. Abre/cierra con GSAP en `gsap.context()` (respeta `prefers-reduced-motion`), foco al input al abrir; Escape cierra solo el chat (`stopPropagation`) y devuelve el foco al botón. Bajo 640 px, panel a pantalla completa (safe-area con `env()`); al usar un botón de sección se cierra para que se vea la sección.
- `useChatbot.js`: mensajes en `sessionStorage` (`sportify_chat_v1`, en try/catch), envío con timeout de 20 s, bloqueo de envíos dobles, "Nueva conversación" (`reiniciar`, descarta respuestas de una conversación ya reiniciada). El contexto sale de `useReservas()` vía `contextoChat` (`src/lib/chat.js`): `dias[0]` como hoy y franjas con `disponible: true`.
- `useDeporteActivo.js`: acento = deporte de la página de reserva si se está en ella; si no, IntersectionObserver sobre `#root [data-sport]` (los heros; se vuelve a crear al volver al inicio porque depende de `deporteAbierto`); sin deporte, tokens de marca. El acento por deporte sale solo de `estiloAcento()`.
- `useAccionesChat.js` + `AccionSeccion.jsx`: `ABRIR_SECCION` reutiliza la navegación del sitio: canchas con `cambiarDeporte`/`abrirVista`, eventos con `abrirVista(…, { modo: 'torneo' })` (si ya está en la página, la remonta en torneo) y ubicación con `irASeccion('ubicacion')`.
- El visor de fotos (`<dialog>` con `showModal()`) deja inerte el chat mientras está abierto: es lo esperado.
- CSS: `.chatbot__mensajes` lleva `position: relative` y `min-height: 0`, y el panel `overflow: clip`. Sin eso, los `.show-for-sr` (absolutos en Foundation) de cada mensaje se ubican respecto al panel, lo agrandan y al enfocar el input el navegador lo desplaza (se pierde la cabecera).
- El foco va al input al terminar la animación de entrada (con `autoAlpha: 0` el panel está en `visibility: hidden`).

## Reservar y cancelar desde el chat

(`useAccionesReserva.js`, `TarjetaReserva`, `TarjetaCancelacion`, `OpcionesCancelacion`):

- Regla: el modelo propone, el usuario confirma (clic en la tarjeta o un "sí" explícito, `detectarSiNo` de `src/lib/chat.js`) y el código valida y ejecuta. Nada se escribe sin esa confirmación.
- Los mensajes llevan `estado` (`pendiente` | `confirmada` | `cancelada` | `descartada` | `fallida`), la copia de los datos y el `comprobante`; todo persiste en `sessionStorage`. Solo hay una tarjeta pendiente a la vez. Con una pendiente, "sí"/"no" se resuelven sin llamar al servidor y cualquier otro texto la descarta y sigue normal.
- Reservar usa `reservar()` (la del formulario; todo o nada). El total es `calcularPrecio` (con el descuento desde 2 horas), no `precioHora × horas`. "Ver comprobante" reutiliza `ConfirmacionReserva` (código + QR) dentro del panel; `VoucherReserva` no se reutiliza (traería sus botones).
- Los textos fijos del navegador (`src/lib/chat.js`) son mensajes `bot` normales, sin `error`, para que entren al historial que ve el modelo.

## Interfaz y pruebas del chatbot

- **Interfaz**: nada de copy técnico ("Gemini", "IA", "API"); tuteo neutro.
- **Pruebas**: el handler tiene pruebas unitarias en `api/_lib/chat.test.js` (los tests del servidor van en `api/_lib/` para no volverse rutas de Vercel). `scripts/probar-chat.mjs` corre los casos contra `vercel dev` o producción. `npm run dev` no ejecuta `/api`. `vercel dev` **no** le pasa a las funciones las variables de `.env.local` (responde 500 "falta GEMINI_API_KEY"), pero sí las del entorno de la shell: arrancarlo con `set -a; . <(tr -d '\r' < .env.local); set +a; vercel dev`. Para cerrarlo, matar el árbol del proceso de `vercel dev` (detener solo la shell deja vivo el servidor en :3000; en PowerShell: buscar el proceso con `*vercel*dist*vc.js*dev*` en la línea de comandos y `taskkill /PID … /T /F`). En el equipo de Juan falló el 06-11-2026 con `EPERM` al crear symlinks en la caché de la CLI. Salida: cargar el handler con `vite.ssrLoadModule` detrás de un servidor mínimo. En Git Bash, `vercel curl /ruta` necesita `MSYS_NO_PATHCONV=1`.
- **El modelo no es determinista**: un caso que pasa una vez puede fallar la siguiente, y producción puede responder distinto que local. Antes y después de cambiar las instrucciones, correr los casos afectados varias veces en bucle (p. ej. 6) y comparar, no una sola vez, **también en el despliegue** (preview con `vercel curl`) y con el contexto completo de `probar-chat.mjs`: un ajuste dio 7 de 8 en local y 0 de 8 en el preview, con el mismo modelo.

# Plan Bloque 6: Chatbot de Sportify

<estado>
<!-- El coordinador actualiza esta lista al cerrar cada parte, con el hash del commit. -->
- [x] Preparación (`4bb1b64`)
- [x] 6.1 Datos del negocio y función serverless (`79c5fa0`, `1759fab`, `e7c4739`, `e744a5f`, `6164057`)
- [x] 6.2 Widget global (consultas y navegación) (`20ed731`, `3ec95bc`, `1dee7f3`)
- [x] 6.3 Reservar y cancelar desde el chat (`a096de2`, `1255aa9`, `1a1f021`)
</estado>

<instrucciones_de_uso>
- Este archivo es el plan completo del Bloque 6. Léelo entero antes de empezar y vuelve a él al inicio de cada parte; es la referencia si la conversación se compacta.
- Las partes se hacen en orden y una a la vez. Para cada parte:
  1. Lee las <notas_entre_partes> y revisa el código actual. Si algo de esta parte ya no encaja con lo que encuentres, dilo en el plan.
  2. Preséntame el plan de la parte y espera mi aprobación, como indica la guía del proyecto.
  3. Delega la escritura de código a agy según la guía del proyecto, con delegaciones autocontenidas (agy no comparte el contexto de esta conversación). Puedes lanzar delegaciones en paralelo solo si tocan archivos distintos; nunca dos agentes sobre el mismo archivo.
  4. Todo lo que requiera terminal lo haces tú: instalar dependencias, tests, build, vercel dev, scripts de prueba, commit y push.
  5. Revisa git status y el diff de cada delegación antes de aceptarla.
  6. Corre la verificación de la parte. Si algo falla, corrígelo antes de seguir.
  7. Haz commit y push, marca la parte en <estado> con el hash del commit y deja en <notas_entre_partes> lo que la siguiente parte necesita saber.
  8. Detente y muéstrame el reporte de la verificación. No empieces la siguiente parte hasta que te escriba "continúa con 6.x".
</instrucciones_de_uso>

<contexto>
- Sportify: React 19 + CRA 5 + Foundation 6 + GSAP, sin backend. Publicado en Vercel (https://proyecto-sportify.vercel.app) con deploy automático desde main.
- Las reservas viven en ReservasContext (useReducer) + localStorage, con src/data/canchas.json como semilla:
  - 9 canchas (voley-1..3, padel-1..3, futbol-1..3).
  - 13 franjas de una hora, de 08:00 a 20:00 (la última termina a las 21:00).
  - La ocupación de cada cancha son 7 arreglos, uno por día desde hoy.
- Acciones actuales del reducer:
  - RESERVAR: recibe varias horas de una cancha.
  - RESERVAR_EVENTO: reserva varias canchas con horas consecutivas, todo o nada.
  - Ambas validan choques antes de despachar y dentro del reducer, y devuelven { ok, error }.
  - No existe una acción para cancelar.
- La vista de canchas se abre con abrirVista(slug): App.js la pasa a los heros como onVerCanchas. Hace pushState a #canchas-<slug>; popstate la cierra, y un enlace directo con el hash la abre.
- z-index actuales: navbar 1000; vista de canchas 1001 (position: fixed, pantalla completa). No hay Reveal de Foundation. El único modal es el visor de fotos, un <dialog> abierto con showModal().
- Validaciones actuales del formulario de reserva:
  - REGEX_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u
  - REGEX_TELEFONO = /^3\d{9}$/
  - En el formulario el teléfono es opcional.
- La dirección, el teléfono del local y la sección de ubicación con Google Maps ya existen en el sitio, y el horario del footer ya está corregido.
- Entorno verificado:
  - Proyecto enlazado con Vercel.
  - GEMINI_API_KEY (Secret) y GEMINI_MODEL (Config, gemini-3.5-flash-lite) en Production y Preview.
  - .env.local con ambas en local.
  - package.json sin "type": "module".
  - @google/genai no está instalado.
</contexto>

<arquitectura>
- El navegador es la única fuente de verdad. La función serverless no guarda estado ni puede leer localStorage: en cada petición, el widget le envía el historial reciente y una foto de la disponibilidad.
- Gemini nunca escribe reservas. Cuando el usuario quiere reservar o cancelar, Gemini llama una función; el servidor valida los argumentos con código y devuelve una acción propuesta. El navegador la ejecuta solo después de que el usuario confirma.
- Una sola llamada a Gemini por mensaje del usuario. La disponibilidad y la información del negocio van en el system instruction, no como funciones de consulta. Los errores de validación los responde el servidor con texto fijo, sin volver a llamar al modelo.
- Las validaciones de nombre y teléfono existen en un solo lugar y las usan el formulario, el widget y la función serverless.
</arquitectura>

<reglas_comunes>
- El texto visible va en español, con tuteo neutro y sin voseo. En la interfaz no aparece copy técnico: ni "Gemini", ni "IA", ni "API".
- Nunca imprimas el valor de GEMINI_API_KEY ni de otros secretos, ni en código, ni en logs, ni en reportes.
- Los commits siguen la guía del proyecto: en español, con prefijo (feat:, fix:, chore:…), sin mencionar IA ni poner coautoría.
- No toques archivos fuera de los que la parte necesita. Si hace falta cambiar algo que este plan dice que no se toca, pregúntame antes.
- Al cierre de cada parte deben pasar npm test -- --watchAll=false y npm run build, sin errores ni warnings nuevos.
</reglas_comunes>

<preparacion>
- El árbol de trabajo debe estar limpio, y la sección de ubicación, el teléfono del local y el arreglo del horario del footer deben estar commiteados. Si hay cambios sin commit, detente y avísame.
- Agrega PLAN_CHATBOT.md al .gitignore y haz el commit (chore).
</preparacion>

<parte id="6.1" nombre="Datos del negocio y función serverless">
<objetivo>
- Información del negocio centralizada y /api/chat respondiendo. Sin interfaz todavía.
</objetivo>

<tarea id="1" nombre="Validaciones compartidas">
- Mueve REGEX_NOMBRE, REGEX_TELEFONO y sus mensajes a src/utils/validaciones.js, en JS puro (sin JSX ni APIs del navegador). El formulario debe importarlos de ahí sin cambiar su comportamiento: ahí el teléfono sigue siendo opcional.
- Agrega:
  - normalizarNombre: recorta y deja un solo espacio entre palabras.
  - normalizarTelefono: quita espacios, guiones, puntos y un +57 inicial.
  - Ambas se aplican a lo que llega del chat antes de validar.
- Agrega validarPropuestaReserva(propuesta, contexto) como función pura. Comprueba que:
  - la cancha exista;
  - la fecha esté dentro de la ventana;
  - las horas sean consecutivas y estén todas libres según el contexto;
  - el nombre sea válido;
  - el teléfono, aquí obligatorio, sea válido.
  Devuelve { ok, error }, con mensajes listos para mostrar.
- Escribe tests de Jest dentro de src/ (CRA solo corre tests ahí). Incluye:
  - nombres con tildes y ñ;
  - nombre con números;
  - teléfono que empieza por 2, de 9 dígitos y con +57;
  - horas no consecutivas;
  - una franja ocupada.
- La función de api/ debe importar este mismo módulo. Como package.json no tiene "type": "module", verifica cómo resuelve Vercel ese import (puede servir que la función sea .mjs). Si no hay una forma limpia, explícame por qué antes de duplicar nada.
</tarea>

<tarea id="2" nombre="Datos del negocio">
- negocio.json debe ser la única fuente de la información del local:
  - Busca dónde quedaron la dirección, el teléfono, el enlace o las coordenadas de Maps y el horario.
  - Si ya existe un archivo de datos con esa información, amplía ese en vez de crear otro.
  - Si esos datos están escritos dentro de los componentes, pásalos a src/data/negocio.json y haz que la sección de ubicación y el footer lean de ahí.
- El horario debe coincidir con las franjas de canchas.json (8:00 a. m. a 9:00 p. m.). Si el footer dice otra cosa, avísame antes de cambiarlo.
- Completa la información con:
  - franjas de mayor y menor demanda (solo informativas, no cambian precios);
  - métodos de pago, porcentaje de abono y plazo para enviarlo (política informativa, el sitio no la ejecuta);
  - política de cancelación, con las horas mínimas de anticipación como número;
  - parqueadero (carros y motos), vestuarios, cafetería y zonas comunes.
- Para torneos y cumpleaños, revisa EventoCTA.jsx y los datos de eventos que ya existan. No dupliques precios ni reglas: léelos de donde ya están.
- No inventes direcciones ni teléfonos. Lo que sí inventes debe ser coherente para un local en Neiva; al final, lístalo para que lo revise.
</tarea>

<tarea id="3" nombre="Función serverless">
- Crea /api/chat como Vercel Function de Node, con el SDK oficial @google/genai (instálalo tú).
  - Antes de diseñar la integración, consulta en ai.google.dev la documentación actual de function calling y de thinking.
  - No uses el SDK viejo @google/generative-ai.
- Configuración:
  - el modelo sale de GEMINI_MODEL, con gemini-3.5-flash-lite por defecto;
  - la key sale de GEMINI_API_KEY;
  - usa el nivel de thinking más bajo que admita el modelo, para reducir la latencia.
- Petición POST:
  - mensaje: string obligatorio, máximo 500 caracteres.
  - historial: [{ rol: "usuario" | "bot", texto }], máximo 20 turnos; descarta lo que sobre.
  - contexto: { fechaHoy, horaActual, canchas: [{ id, nombre, deporte, precioHora }], disponibilidad: [{ canchaId, fecha, franjasLibres }] }. Cubre hoy y los 6 días siguientes, sin franjas ya pasadas de hoy.
- Respuesta: { respuesta: string, sugerencias: string[] (máximo 3), accion: objeto | null }.
- System instruction en un archivo aparte (por ejemplo, api/_lib/instrucciones). Debe indicar que:
  - Es el asistente de Sportify. Solo habla de Sportify y redirige con amabilidad cualquier otro tema.
  - Responde en español, con tuteo neutro y sin voseo, en texto plano sin Markdown y con respuestas cortas. Escribe los precios como $60.000 y las horas como 9:00 a. m.
  - Recibe negocio.json y la disponibilidad en un formato compacto, y nunca inventa horarios, precios, políticas ni datos de contacto.
  - Si alguien necesita algo que el chat no resuelve, le da el teléfono del local.
  - Al dar disponibilidad, nombra la cancha, la fecha y las franjas exactas.
  - Resuelve referencias como "resérvalo" con el historial. Si hay ambigüedad (ofreció varias franjas o canchas), pregunta cuál antes de llamar una función.
  - Para reservar necesita cancha, fecha, una o varias horas seguidas, nombre y teléfono. En el chat el teléfono es obligatorio. Pide todos los datos que falten en un solo mensaje.
  - Los eventos (torneos, cumpleaños) no se reservan ni se cancelan desde el chat: explica el proceso y ofrece abrir esa sección.
  - Si preguntan dónde queda el local, da la dirección y ofrece abrir la sección de ubicación.
  - Nunca afirma que una reserva quedó hecha; eso lo confirma el sitio.
- Funciones declaradas a Gemini:
  - proponer_reserva({ canchaId, fecha, horas: string[], nombre, telefono })
  - proponer_cancelacion({ nombre, telefono, canchaId?, fecha?, hora? })
  - abrir_seccion({ seccion: "canchas" | "eventos" | "ubicacion", deporte? })
- Cuando Gemini llama una función:
  - Normaliza y valida con el módulo compartido. Para la cancelación, valida al menos nombre y teléfono.
  - Si algo falla, devuelve el mensaje de error del módulo con accion null, sin volver a llamar al modelo.
  - Si todo es válido, devuelve la acción (CONFIRMAR_RESERVA, BUSCAR_CANCELACION o ABRIR_SECCION) con los datos normalizados.
  - El texto que acompaña la acción: para ABRIR_SECCION, el que haya generado el modelo (o uno corto fijo si no generó ninguno); para las demás, un texto fijo.
- Errores y abuso:
  - Valida método, Content-Type, tamaño del cuerpo y longitudes; responde 400 a lo demás.
  - Pon un timeout de unos 15 s hacia Gemini y un maxOutputTokens bajo (unos 400).
  - Si Gemini responde 429, devuelve un mensaje amable de "intenta en un minuto"; ante cualquier otro error, un mensaje genérico.
  - Nunca expongas detalles internos ni la key, ni en las respuestas ni en los logs.
</tarea>

<tarea id="4" nombre="Configuración y documentación">
- Crea .env.example con GEMINI_API_KEY= y GEMINI_MODEL=gemini-3.5-flash-lite, sin valores reales.
- En el README explica cómo sacar la key en Google AI Studio, cómo configurarla en Vercel, y que en local se prueba con vercel dev, porque npm start no ejecuta /api.
- En la guía del proyecto, reemplaza la mención de que el chatbot "puede ser por reglas o con proxy" por una sección "Chatbot" con esta arquitectura y el contrato.
- Agrega al repo los Topics chatbot, gemini-api y vercel-functions.
</tarea>

<restricciones>
- No toques ReservasContext, la vista de canchas, los heros ni el visor de fotos. Del formulario solo cambia el import de las validaciones.
- No crees el widget todavía.
</restricciones>

<verificacion>
- Con vercel dev corriendo, ejecuta un script en scripts/ con estos casos y muéstrame las respuestas:
  - "¿Qué horarios tiene libres la cancha 1 de voley hoy?" con un contexto de ejemplo: responde solo con franjas del contexto.
  - Historial donde el bot ofreció de 9:00 a 10:00 a. m., más "resérvalo": pide nombre y teléfono.
  - El mismo historial, más "Juan Pérez, 300 123 4567": devuelve CONFIRMAR_RESERVA con el teléfono normalizado.
  - "Juan123" o "2001234567": error fijo y accion null.
  - Una hora que no está libre en el contexto: error fijo y accion null.
  - "¿Dónde quedan?": da la dirección y devuelve ABRIR_SECCION con ubicacion.
  - "¿Tienen parqueadero para motos?": responde con negocio.json.
  - Una pregunta fuera de tema: redirige.
- Después del commit y el push, cuando termine el deploy de producción, repite contra https://proyecto-sportify.vercel.app/api/chat el caso del parqueadero y el de "Juan123". Así se confirma que la key llega en Vercel y que el import del módulo compartido funciona en el runtime real.
</verificacion>
</parte>

<parte id="6.2" nombre="Widget global (consultas y navegación)">
<objetivo>
- Widget del chat disponible en todas las vistas. Maneja texto, sugerencias y la acción ABRIR_SECCION.
- Si llegan CONFIRMAR_RESERVA o BUSCAR_CANCELACION, por ahora muestra solo el texto; ejecutarlas es la 6.3.
</objetivo>

<tarea id="1" nombre="Montaje global">
- Monta el widget una sola vez a nivel de App, fuera de las vistas, con un portal a document.body. La conversación debe conservarse al abrir y cerrar la vista de canchas o el modo evento.
- Define una variable CSS (por ejemplo --z-chatbot) por encima de la navbar (1000) y de la vista de canchas (1001). Nada de números sueltos.
- El visor de fotos es un <dialog> con showModal(): queda en la capa superior del navegador y deja inerte el resto de la página, chat incluido. Ese es el comportamiento esperado; no intentes ponerte encima ni romper el inert.
</tarea>

<tarea id="2" nombre="UI en sintonía con el sitio">
- Botón flotante abajo a la derecha que abre y cierra un panel.
- Usa las fuentes, tokens y estilos existentes; no introduzcas fuentes ni paletas nuevas. Si usas frontend-design, que respete la identidad actual.
- El acento sigue al deporte activo, con --accent, --accent-soft y --accent-contrast del sistema de temas por data-sport:
  - Con la vista de canchas abierta, el deporte sale de su estado o del hash #canchas-<slug>.
  - Fuera de la vista, usa IntersectionObserver sobre las secciones con data-sport; nunca un listener de scroll.
  - Sin deporte activo, usa el color base de la marca.
- El panel tiene:
  - cabecera "Asistente Sportify" con botón cerrar;
  - lista de mensajes;
  - chips de sugerencias;
  - input con botón enviar;
  - mensaje de bienvenida con 3 sugerencias iniciales.
- Muestra un indicador de "escribiendo" mientras espera, y bloquea el envío durante la espera para no duplicar peticiones.
- Por debajo de 640 px, el panel ocupa toda la pantalla y respeta las safe-area.
- Anima la apertura y el cierre con GSAP usando gsap.context() con cleanup, como el resto del proyecto. No instales @gsap/react ni uses useGSAP. Respeta prefers-reduced-motion.
</tarea>

<tarea id="3" nombre="Estado y peticiones">
- Hook propio (por ejemplo, useChatbot) con mensajes, envío, estado de espera y error.
- Persiste la conversación en sessionStorage dentro de try/catch; si falla, el chat sigue funcionando en memoria.
- Antes de cada envío, arma el contexto desde useReservas():
  - canchas, precios y franjasLibres de hoy y los 6 días siguientes;
  - franjasLibres = horas − ocupadas − franjas ya pasadas de hoy;
  - usa la misma definición de "hoy" que ReservasContext, para que el chat y el calendario nunca muestren días distintos;
  - nunca envíes reservas ni datos personales.
- Envía solo los últimos 20 turnos.
- Renderiza el texto del bot como texto plano con saltos de línea. Nunca uses dangerouslySetInnerHTML.
- Agrega un botón "Nueva conversación" que limpie el historial y el sessionStorage.
</tarea>

<tarea id="4" nombre="Acción ABRIR_SECCION">
- Muestra un botón bajo el mensaje del bot. Según la sección:
  - canchas: abre la vista con abrirVista(slug), el mismo mecanismo de los heros. Si no llegó deporte, muestra un botón por deporte.
  - eventos: usa el mecanismo que ya abre el modo evento.
  - ubicacion: si la vista de canchas está abierta, ciérrala con su mecanismo actual y luego desplázate a la sección de ubicación (sin animación si prefers-reduced-motion).
- No dupliques lógica de navegación que ya exista.
</tarea>

<tarea id="5" nombre="Accesibilidad">
- aria-live="polite" en la lista de mensajes.
- Al abrir, el foco va al input. Escape cierra y devuelve el foco al botón flotante.
- El botón flotante lleva aria-label y aria-expanded.
</tarea>

<restricciones>
- No toques ReservasContext ni el formulario; solo lee datos.
- No implementes confirmaciones, reservas ni cancelaciones desde el chat.
</restricciones>

<verificacion>
- Con vercel dev:
  - Abre el chat en la home, abre la vista de canchas y vuelve: la conversación sigue y el panel queda por encima de la vista.
  - Abre el visor de fotos: el chat queda inerte. Al cerrar el visor, el chat vuelve a funcionar.
  - Pregunta "¿qué horarios tiene disponible la cancha 1 de voley?" y compara con el calendario del sitio: deben coincidir.
  - "Quiero ver las canchas de pádel": el botón abre la vista con el hash correcto, y el botón atrás del navegador la cierra como siempre.
  - "¿Dónde quedan?": el botón lleva a la sección de ubicación, también desde dentro de la vista de canchas.
  - Al recargar la pestaña, la conversación sigue. "Nueva conversación" la limpia.
  - El acento cambia al pasar de un deporte a otro.
  - Sin errores en consola al abrir y cerrar el panel muchas veces.
- Prueba en producción después del push: el chat responde en https://proyecto-sportify.vercel.app.
</verificacion>
</parte>

<parte id="6.3" nombre="Reservar y cancelar desde el chat">
<objetivo>
- El navegador ejecuta CONFIRMAR_RESERVA y BUSCAR_CANCELACION.
- Regla central: el modelo propone, el usuario confirma y el código valida y ejecuta.
</objetivo>

<antes_de_empezar>
- Antes de implementar, verifica y repórtalo en el plan:
  - Que los registros de reserva guardan nombre y teléfono y persisten en localStorage (el voucher sugiere que sí). Si no, detente y explícame.
  - Cómo distingue el estado las reservas normales, las de eventos y la ocupación semilla de canchas.json.
- Si el plan del proyecto tenía la cancelación prevista para un bloque posterior, la acción CANCELAR que se crea aquí es la que ese bloque reutilizará. Anótalo en la guía del proyecto.
</antes_de_empezar>

<tarea id="1" nombre="Confirmación de reserva">
- Ante CONFIRMAR_RESERVA, muestra en el chat una tarjeta con cancha, fecha, horas, total (precioHora × horas), nombre y teléfono, y botones "Confirmar" y "Cancelar".
- Al confirmar:
  - valida otra vez nombre y teléfono con el módulo compartido;
  - reserva con la misma función que usa el formulario. RESERVAR ya admite varias horas de una cancha y valida choques; no crees otra acción.
- Si la reserva sale bien: mensaje fijo con el resumen y las instrucciones de abono de negocio.json. Si el componente del voucher se puede reutilizar sin refactor, agrega un botón "Ver comprobante"; si requiere refactor, no lo hagas y dímelo.
- Si devuelve { ok: false } por choque de horario: mensaje fijo que ofrece las otras franjas libres de esa cancha ese día.
- Si el usuario escribe mientras hay una tarjeta pendiente, sin llamar al servidor:
  - un sí claro ("sí", "confirmo", "dale", "listo") equivale a Confirmar;
  - un no claro equivale a Cancelar;
  - cualquier otro texto descarta la tarjeta y la conversación sigue normal.
- Los botones de una tarjeta ya resuelta quedan deshabilitados.
</tarea>

<tarea id="2" nombre="Cancelación">
- Crea la acción CANCELAR en el reducer, con el mismo patrón de RESERVAR:
  - valida dentro del reducer que la reserva exista, que no sea de un evento y que esté fuera de la ventana mínima de cancelación;
  - libera las horas en la ocupación y elimina el registro;
  - persiste igual que las demás acciones y devuelve { ok, error }.
- Ante BUSCAR_CANCELACION:
  - busca reservas futuras cuyo teléfono y nombre coincidan (comparación sin tildes ni mayúsculas), filtrando por cancha, fecha u hora si llegaron;
  - excluye las de eventos, la ocupación semilla y las que estén dentro de la ventana mínima; en ese último caso, explica la política.
- En el formulario el teléfono es opcional, así que las reservas sin teléfono no se pueden encontrar desde el chat. Cuando no haya coincidencias, el mensaje fijo sugiere contactar al local con el teléfono de negocio.json.
- Según las coincidencias:
  - ninguna: mensaje fijo;
  - una: tarjeta de confirmación;
  - varias: lista para elegir una, y luego la tarjeta.
- Nunca muestres reservas de un teléfono distinto al que escribió el usuario.
</tarea>

<tarea id="3" nombre="Historial y tests">
- Los mensajes fijos que genera el navegador (éxito, error, cancelación) se guardan en el historial como mensajes del bot, para que en el siguiente turno el modelo sepa qué pasó.
- Escribe tests de Jest para CANCELAR (caso exitoso, reserva inexistente, reserva de evento, dentro de la ventana) y para la detección de sí/no.
</tarea>

<restricciones>
- No se escribe ninguna reserva ni cancelación sin el clic en Confirmar o un sí explícito ante una tarjeta.
- No cambies el comportamiento del formulario ni del modo evento.
- En ReservasContext solo se agrega CANCELAR; las demás acciones quedan como están.
</restricciones>

<verificacion>
- Flujo completo: "¿qué horarios tiene disponible la cancha 1 de voley?" → "resérvalo" (si ofreció varias franjas, debe preguntar cuál) → nombre y teléfono → tarjeta → Confirmar. El calendario muestra la franja ocupada sin recargar.
- "Resérvame de 9 a 11 la cancha 2 de pádel mañana" reserva dos franjas. Si una se ocupa antes de confirmar, no reserva ninguna.
- Con "Juan123", "2001234567" o un teléfono de 9 dígitos, el bot vuelve a pedir el dato y no aparece tarjeta.
- Cancelar con el nombre y el teléfono usados libera la franja. Con otro teléfono no encuentra nada.
- Una reserva dentro de la ventana mínima no se cancela, y el bot explica la política.
- Una reserva hecha desde el formulario sin teléfono no aparece al cancelar, y el bot sugiere contactar al local.
- Responder "sí" a una tarjeta confirma; responder otra cosa la descarta.
- Al recargar, las reservas y cancelaciones hechas desde el chat persisten.
- Repite el flujo completo en producción después del push.
</verificacion>
</parte>

<notas_entre_partes>
<!-- El coordinador escribe aquí al cerrar cada parte: nombres reales de archivos, cómo se resolvió el import en api/, dónde quedó negocio.json, decisiones que cambien el plan. -->

## Después de 6.1

Archivos reales:
- Validaciones: NO hay src/utils/. Todo quedó en `src/lib/validacion.js` (convención del proyecto: lógica pura en src/lib). El formulario no cambió. Exporta además: `normalizarNombre`, `normalizarTelefono`, `validarContactoChat(nombre, telefono)` (teléfono obligatorio), `validarPropuestaReserva(propuesta, contexto)`, `fechasVentana(fechaHoy)`, `MENSAJES_CHAT`, `mensajeHoraOcupada(hora)`. Tests en `src/lib/validacion.test.js`.
- `src/lib/fechas.js` tiene `horaAmPm('13:00')` -> '1:00 p. m.' ('12:00' -> '12:00 m.'). Úsalo en los mensajes fijos del widget (6.3).
- Datos del negocio: `src/data/negocio.json` (era local.json; se renombró y amplió). Tiene contacto, mapa, demanda, `pagos { metodos, abonoPorcentaje, abonoPlazoHoras, abonoMedios }`, `cancelacion { horasMinimas: 6, condicion }`, servicios y `eventos` (los lee EventoCTA). Helpers en `src/lib/negocio.js` (`formatoTelefono`, `enlaceTelefono`, `textoHorario`).
- Servidor: `api/chat.js` (handler Web `export default { fetch }`), `api/_lib/peticion.js` (validarPeticion, prepararContexto), `api/_lib/instrucciones.js` (system instruction, `precioChat`), `api/_lib/funciones.js` (declaraciones, procesarLlamada, `TEXTOS`).
- Script de prueba: `scripts/probar-chat.mjs [url] [ids...]` (ids: disponibilidad, reservalo, datos-validos, nombre-invalido, telefono-invalido, hora-ocupada, ubicacion, parqueadero, fuera-de-tema).

Import en api/ (resuelto y verificado en producción):
- `api/*.js` con sintaxis ESM y sin "type": "module": Vercel compila a CommonJS la función y los módulos de src/ y JSON que importa. Se importan directo (rutas relativas con extensión). No hay código duplicado.
- Problema encontrado en producción: el rastreo de Vercel incluía `@google/genai/dist/node/index.mjs` pero el código compilado hace require -> `index.cjs`. Arreglo: `vercel.json` con `functions["api/chat.js"].includeFiles` = ese .cjs. `.vercelignore` permite `/api` y `/vercel.json`.

Decisiones que cambian el plan:
- Salida JSON estructurada + funciones: la API la acepta, pero el modelo dejaba de llamar funciones. Se usa function calling en modo ANY con una 4.ª función interna `responder({ texto, sugerencias })`. `abrir_seccion` tiene además el parámetro obligatorio `mensaje` (su texto acompaña la acción).
- El catálogo y los precios del contexto los pone el servidor desde canchas.json; del cliente solo se usa `disponibilidad` (filtrada).
- `validarPropuestaReserva` también exige de 1 a MAX_HORAS_SEGUIDAS (3) horas, como el formulario.
- Las instrucciones le dicen al modelo que, con los cinco datos, llame proponer_reserva sin verificar él la franja ni el formato: así los errores son siempre los textos fijos.

Contrato real de /api/chat (para el widget, 6.2):
- POST JSON `{ mensaje (1-500), historial: [{ rol: 'usuario'|'bot', texto (máx. 1500) }] (últimos 20), contexto: { fechaHoy, horaActual 'HH:MM', canchas: [] (se ignora, pero debe ser arreglo), disponibilidad: [{ canchaId, fecha, franjasLibres }] } }`. Cuerpo máx. 48 KB.
- Respuesta siempre `{ respuesta, sugerencias, accion }`, también con 400/405/429/500/502/504: el widget puede mostrar `respuesta` sin mirar el status.
- Acciones: `{ tipo: 'ABRIR_SECCION', seccion: 'canchas'|'eventos'|'ubicacion', deporte: slug|null }`, `{ tipo: 'CONFIRMAR_RESERVA', canchaId, fecha, horas, nombre, telefono }`, `{ tipo: 'BUSCAR_CANCELACION', nombre, telefono, canchaId|null, fecha|null, hora|null }`.
- Armar el contexto en el widget: `useReservas()` da `dias` (hoy + 6, misma definición de "hoy" que el calendario: usar `dias[0]` como fechaHoy) y `disponibilidad(canchaId, fecha)`, que devuelve `[{ hora, disponible }]` con ocupadas y horas ya pasadas de hoy en `disponible: false`. franjasLibres = filter(disponible).map(hora).
- Latencia observada: ~1-1,5 s en producción, ~2-2,5 s con vercel dev.

Entorno local:
- `vercel dev` NO le pasa a la función las variables de `.env.local` (responde 500 "falta GEMINI_API_KEY"). Arrancarlo así (Git Bash): `set -a; . <(tr -d '\r' < .env.local); set +a; BROWSER=none vercel dev --listen 3000 --yes`.
- Detener solo la shell deja vivo `vercel dev` en :3000: matar el árbol del proceso `vercel/dist/vc.js dev` (taskkill /T).
- No correr junto a `npm start` ni a `npm run build` (RAM). Pedirle a Juan que cierre su npm start antes.

## Después de 6.2

Archivos reales (src/components/chatbot/):
- `Chatbot.jsx`: portal a document.body, botón flotante + panel; montado una vez en App.js después de <VistaCanchas />. Estados `abierto`/`montado` (el panel sigue montado mientras sale); entrar/salir con GSAP en refs (`entrarRef`, `salirRef`) dentro de un gsap.context; reabrir a mitad de la salida funciona. Foco al input al terminar la entrada (con autoAlpha 0 el panel está en visibility hidden y focus() antes no sirve).
- `MensajeChat.jsx`: un <li> por mensaje; hoy solo pinta botones para ABRIR_SECCION. AQUÍ va la tarjeta de CONFIRMAR_RESERVA / BUSCAR_CANCELACION en 6.3 (hoy esas acciones solo muestran el texto).
- `AccionSeccion.jsx` + `useAccionesChat.js`: navegación de ABRIR_SECCION.
- `useChatbot.js`: { mensajes, enviar, esperando, error, reiniciar }. Modelo de mensaje: { id, rol: 'usuario'|'bot', texto, sugerencias?, accion?, bienvenida?, error? }, persistido entero en sessionStorage `sportify_chat_v1` (los botones de acción sobreviven a la recarga). `generacionRef` descarta respuestas de una conversación ya reiniciada. NO expone una forma de agregar mensajes sin llamar al servidor: 6.3 necesita agregarla (por ejemplo `agregarMensajeBot(texto, extra)`) para los mensajes fijos del navegador, y para la intercepción de sí/no antes del fetch dentro de `enviar`. El estado de una tarjeta (pendiente/confirmada/cancelada) conviene guardarlo en el propio mensaje para que persista.
- `src/lib/chat.js` (+ tests): `contextoChat`, `historialParaEnviar` (excluye bienvenida y errores: los mensajes fijos de 6.3 NO deben marcarse como error si el modelo tiene que verlos), `normalizarRespuesta`, `parsearConversacion`, `TEXTO_ERROR_CHAT`, `crearId`.
- Tokens en src/App.css: `--color-marca`, `--color-marca-soft`, `--color-marca-contraste`, `--z-chatbot` (1100). DeporteHero tiene `data-sport`.

Verificado (vercel dev + Chrome, escritorio y 390 px): conversación conservada al abrir/cerrar la vista y al recargar; panel encima de la vista; visor deja el chat inerte y al cerrarlo vuelve; disponibilidad del chat = calendario (hoy y mañana); "canchas de pádel" abre #canchas-padel y "atrás" la cierra; "¿Dónde quedan?" lleva a #ubicacion también desde la vista (la cierra antes); "Nueva conversación"; acento por hero (vóley/pádel/fútbol) y marca fuera de los heros; 10 ciclos abrir/cerrar sin errores. Producción: responde.

Trampas encontradas en 6.2:
- Los `.show-for-sr` de Foundation son position: absolute. Dentro de la lista de mensajes se ubicaban respecto al panel (fixed) y lo hacían más alto que su caja; al enfocar el input el navegador desplazaba el panel y escondía la cabecera. Arreglo: `.chatbot__mensajes { position: relative; min-height: 0 }` y `overflow: clip` en el panel. Cualquier tarjeta nueva con show-for-sr queda cubierta por esto.
- Escape: el panel hace stopPropagation (la vista escucha Escape en window).
- En las pruebas automáticas, Chrome frena rAF con la pestaña en segundo plano: los tweens de GSAP avanzan solo cuando se toma una captura o pasa tiempo; comprobar estados finales, no tiempos.

## Después de 6.3

- Nuevo: src/lib/cancelacion.js (+ tests), acción CANCELAR y `cancelar()` en ReservasContext (el Bloque 7 debe reutilizarlos), useAccionesReserva.js, TarjetaReserva, TarjetaCancelacion, OpcionesCancelacion; "Ver comprobante" reutiliza ConfirmacionReserva dentro del panel. Textos fijos y detectarSiNo en src/lib/chat.js.
- Verificado con vercel dev: flujo completo; dos franjas (y todo o nada al ocupar una desde el formulario); datos inválidos sin tarjeta; cancelar con el teléfono correcto (y nada con otro); lista de varias reservas; ventana mínima; reserva sin teléfono no aparece; "sí"/"no"/otra cosa; persistencia al recargar. Producción: reservar y cancelar desde el chat funcionan.
- PENDIENTE (Juan pidió parar las pruebas por límite de tokens):
  1. ✅ RESUELTO (977e512, dde6bdf): regla reforzada en api/_lib/instrucciones.js + caso `reservalo-varias` en scripts/probar-chat.mjs. Antes: 1 de 5 respuestas válidas en producción omitía la franja. Después: 6/6 en local y 6/6 en producción preguntan cuál; suite completa 10/10 en local. Detalle de estilo abierto: a veces dice "ofrecí varias franjas" en vez de repetir las opciones.
  2. Gemini devolvió 503 momentáneos varias veces: el widget responde con el mensaje genérico (correcto). Si se vuelve frecuente, considerar un reintento en el servidor ante 503.
</notas_entre_partes>

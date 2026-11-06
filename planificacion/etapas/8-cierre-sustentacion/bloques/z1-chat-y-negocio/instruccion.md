# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `GEMINI.md` (raíz; cada integrante lo
  tiene en local): léela antes de empezar y respétala. La parte del plan que
  te toca va copiada en tu tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

# Tarea: Chat y datos del negocio al día con los torneos (`z1-chat-y-negocio`)

## Objetivo

Actualizar las instrucciones del asistente (`/api/chat`), el texto de torneos en `negocio.json` y los casos de prueba de `scripts/probar-chat.mjs` para reflejar los torneos multi-día por fases y la consulta/cancelación desde "Mis reservas".

## Rutas

- Modificar:
  - `api/_lib/instrucciones.js`
  - `src/data/negocio.json`
  - `scripts/probar-chat.mjs`
- Leer sin modificar:
  - `src/lib/torneo.js` (`MAX_CANCHAS_TORNEO`, `OPCIONES_EQUIPOS`)
  - `src/lib/precios.js` (`calcularPrecioJornadas`)
  - `src/lib/negocio.test.js`
- Prohibido modificar cualquier otro archivo. No importes `MAX_INVITADOS` desde `api/` (vive en `useReserva.js`, que usa React).

## Diseño

1. `api/_lib/instrucciones.js:76`: el proceso describe el torneo viejo. Reemplazar por un texto como este, tomando los valores de `MAX_CANCHAS_TORNEO` y `OPCIONES_EQUIPOS` de `src/lib/torneo.js` (ese módulo no tiene imports, se puede usar desde `api/`), sin escribirlos a mano:

   > Proceso: se reservan desde la página de reserva del sitio, en el modo Torneo o Cumpleaños, y se reserva todo o nada. Torneo: de 1 a 3 canchas de un solo deporte, 4, 8 o 16 equipos, y un día y horario por cada fase, en orden cronológico dentro de los próximos 7 días. Cumpleaños: una o varias canchas, una franja de horas seguidas y el número de invitados.

   Antes de escribir la frase de precio, léela en `calcularPrecioJornadas` (`src/lib/precios.js:72`) y escribe solo lo que el código hace.

2. `api/_lib/instrucciones.js:33`: agregar a la regla de cancelar que, si la persona tiene el código `SPF-XXXXXX` o reservó sin teléfono, debe usar **"Mis reservas"** en el menú. Agregar en la línea 34 que esa misma opción sirve para consultar torneos y cumpleaños, que no se cancelan por ahí ni por el chat, sino llamando al local.

3. `src/data/negocio.json`, evento "Torneos": cambiar `"Combina varias canchas en la misma franja, con trofeos y premiación."` por `"Organízalo por fases, en una o varias canchas del mismo deporte, con trofeos y premiación."`

4. `scripts/probar-chat.mjs`: agregar dos casos.
   - `torneo-proceso`: `"¿Cómo reservo un torneo?"`. Pasa si `accion.seccion === 'eventos'` y la respuesta no dice `"misma franja"` ni promete reservarlo por el chat.
   - `cancelar-codigo`: `"Quiero cancelar, tengo el código SPF-ABC123 y no di teléfono"`. Pasa si menciona `"Mis reservas"` y `accion` no es `BUSCAR_CANCELACION`.

## Verificación al terminar

- `npm test` y `npm run lint` pasan sin avisos.

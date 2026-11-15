[MODO EJECUTOR]

# Base común para las instrucciones de agy — Sportify

Eres el desarrollador de un bloque del proyecto Sportify (proyecto final de
Lenguajes para la Web, Universidad Surcolombiana): página de un local
deportivo para reservar canchas de vóley playa, pádel y fútbol, con torneos,
cumpleaños, eventos especiales y un chatbot.

- Stack fijo: React + Vite, Foundation (foundation-sites), GSAP con
  ScrollTrigger, sin base de datos (estado de React + localStorage + JSON
  semilla), chatbot con Gemini detrás de una función de Vercel (`/api/chat`).
- La guía completa del proyecto está en `AGENTS.md` (raíz, versionado): léela
  antes de empezar y respétala. La parte del plan que te toca va copiada en tu
  tarea.
- Todo el texto en español, con tildes correctas y tuteo neutro (nada de
  voseo).
- **No hagas commits ni push**, ni cambies ramas. Solo edita los archivos que
  tu tarea permite.
- **Nunca imprimas ni copies el valor de una API key o secreto** (`.env`,
  `.env.local`).
- No ejecutes `npm run dev`, `vercel dev` ni `npm run preview` a la vez: el
  equipo tiene poca RAM.
- Al terminar, responde con un resumen de qué archivos cambiaste.

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

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

# Recomprobación v1b — solo los tres defectos de r1 (no edites código)

La primera verificación de r1 encontró tres defectos y ya se corrigieron (ver `bloques/r1-tema-y-encabezado/retoma.md`). Comprueba **solo** estos tres, más que el inicio no haya cambiado. No hagas una revisión completa nueva.

1. "Volver al inicio" (`.vista-canchas__volver`) visible y no tapado por el navbar fijo en `/reservar/futbol` a 390, 640, 1024 y 1440 px de ancho (compara el `getBoundingClientRect()` del enlace con el `bottom` de `.site-header`).
2. En `/reservar/futbol?modo=torneo` a 1440×900, el contenido de `.vista-canchas__encabezado-contenido` cabe dentro de los 260 px del encabezado con aire (sin desbordar).
3. La pestaña activa tiene subrayado de 3 px con el `colorAcento` de su deporte (prueba las tres pestañas).
4. En `/` (inicio), a 390 y 1440 px, el navbar no tiene `site-header--reserva` y se ve como en `revision/antes/` o como antes del cambio (transparente sobre el video).

Además corre `npm test` y `npm run lint` una vez.

Usa `npm run build` + `npm run preview` y Chrome por CDP (puedes basarte en `revision/capturas-etapa9.mjs`; archivos temporales fuera del repositorio). Al terminar, mata el árbol del proceso de `preview` (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

Responde con `pasa`/`falla` y la evidencia (medidas) de cada punto, y los resultados de test y lint.

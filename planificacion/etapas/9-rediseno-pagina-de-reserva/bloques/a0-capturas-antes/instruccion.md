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

# Tarea a0 — Capturas "antes" de la etapa 9

Lee primero `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (sección F) y `PLAN.md` de la misma carpeta.

## Objetivo

Tomar las capturas del diseño ACTUAL (antes del rediseño) de la página de reserva, contra producción (`https://proyecto-sportify.vercel.app`, que hoy es igual a `main`). No levantes ningún servidor local (`npm run dev`, `preview`, `vercel dev`): otro agente está trabajando en paralelo y el equipo tiene poca RAM.

## Qué hacer

1. Copia `planificacion/herramientas/capturas/capturas.mjs` a `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` y adáptala:
   - `BASE_URL` configurable por variable de entorno `BASE_URL` (por defecto `http://localhost:4173`).
   - Carpeta de salida configurable por variable `OUT_DIR` (obligatoria).
   - Perfil de Chrome temporal en la carpeta temporal del sistema (como hoy), nunca dentro del repositorio.
   - Las escenas de abajo, cada una en 1440×900 y en 390×844 (DPR 2), formato WebP calidad 82. Nombres: `<escena>-escritorio.webp` y `<escena>-celular.webp`.
2. Escenas (pasa por `about:blank` entre una y otra; datos ficticios "Ana Gómez", 300 123 4567; en el selector de día elige **mañana**):
   - `cancha-futbol`: `/reservar/futbol`, mañana como día, 2 horas seguidas elegidas, con el comprobante visible (puede ser más de una captura: `cancha-futbol-arriba`, `cancha-futbol-horario`).
   - `torneo-4`, `torneo-8`, `torneo-16`: `/reservar/futbol?modo=torneo` (o el deporte que tenga canchas suficientes), agregando canchas desde el carrusel (`.depth-carousel__arrow--next` + "Agregar al evento"), eligiendo 4, 8 y 16 equipos, con fechas por fase y horas elegidas para que se vean las llaves. Captura la zona de las llaves.
   - `cumpleanos`: `?modo=cumpleanos` con invitados escritos.
   - `confirmacion-cancha`, `confirmacion-torneo`, `confirmacion-cumpleanos`: tras "Confirmar reserva", con el QR visible.
   - Los inputs controlados de React se llenan con `Input.insertText` tras enfocar el campo.
3. Ejecuta: `BASE_URL=https://proyecto-sportify.vercel.app OUT_DIR=planificacion/etapas/9-rediseno-pagina-de-reserva/revision/antes node planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs`.
4. Abre (lee) algunas de las imágenes generadas para comprobar que muestran lo que dicen. Si una escena no se pudo lograr, déjala anotada.

## Archivos que puedes crear o editar

- `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs`
- `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/antes/*.webp`

Nada más: no toques `src/`, `docs/` ni el script original.

## Al terminar

Responde con: la lista de capturas generadas, las escenas que fallaron y por qué, y si cerraste el proceso de Chrome.

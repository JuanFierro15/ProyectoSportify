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

# Tarea v3 — Recomprobación de la falla a 960×800 (solo lectura)

Eres el verificador. **No edites ningún archivo de `src/`, `api/` ni de la raíz.**

Lee `planificacion/etapas/10-asistente-torneo-secciones/revision/v2/verificacion.md` (sobre todo la falla de S8 a 960×800) y `git diff HEAD -- src/components/reservas/torneo/Bracket.css`: es la corrección, que agrega `.bracket-torneo__canvas-scroll` a la regla `contain: inline-size` de la media query móvil.

Usa el mismo método de v2: carpeta temporal **fuera del proyecto** con `mktemp -d`, `npm run build`, `npm run preview` en segundo plano (4173) y Chrome headless por CDP, como `planificacion/herramientas/capturas/capturas.mjs`.

Mide **solo** esto, con el mismo estado que en v2: dos canchas de fútbol, mañana, horas por fase y "Ana Gómez" / "3001234567".

1. **960×800** (`mobile: true`, DPR 1), en `/reservar/futbol?modo=torneo`: los pasos `llaves` y `resumen` con "Torneos reservados" abierto. Registra `doc.scrollWidth`, `body.scrollWidth`, `.vista-canchas__marco.scrollWidth` e `innerWidth`, y `clientWidth` / `scrollWidth` del contenedor de scroll del bracket que esté presente (`.bracket-torneo__canvas-scroll` o `.bracket-torneo__movil`). Comprueba que con `scrollLeft = scrollWidth` se ve entera la última columna.
2. **390×844** (`mobile: true`, DPR 2): repite solo `llaves` (Aleatorio) y confirma que sigue en 390 / 390 / 390 con el bracket en `320` / `646`.
3. **1440×900**: repite solo `1440-torneo-1400` y `1440-torneo-2100` y compáralas píxel por píxel con las de `revision/v1/`. Deben dar 0 %.

Pasa si en 1 y 2 `doc`, `body` y `marco` no superan `innerWidth` (se aceptan 2 px por las muescas del voucher en `resumen`) y en 3 la diferencia es 0 %.

## Entregable

Agrega al final de `revision/v2/verificacion.md` una sección `## Recomprobación v3` con la tabla de valores y el veredicto final de S8 (PASA / FALLA). No dejes capturas en el proyecto.

## Al terminar

Detén `preview` matando el árbol de su proceso (`taskkill /PID <pid> /T /F`), comprueba que el 4173 quedó libre y cierra Chrome (que no quede ningún `chrome.exe` con `--remote-debugging-port=9333`). Responde con la ruta de tu carpeta temporal y el veredicto.

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

# Recomprobación v2b — solo los siete defectos de r2 (no edites código)

La verificación de r2 encontró siete defectos y ya se corrigieron (ver `bloques/r2-dia-horario-y-datos/retoma.md`, que los describe uno por uno). Comprueba **solo** esos siete, con estilos computados y medidas por CDP. No hagas una revisión completa nueva.

1. Las tarjetas `fieldset.formulario-reserva__campo` tienen fondo `#161616`, borde `1px #2a2a2a`, radio 16 px, padding y separación; en torneo no hay tarjeta dentro de tarjeta con el mismo fondo.
2. Horas libres: fondo `#1f1f1f`, borde `#4a4a4a`, radio 10 px. Pastillas inactivas del torneo: fondo `#1f1f1f`, radio 999 px. "Cambiar a 15 min por partido": borde y texto ámbar.
3. En `?modo=torneo` y `?modo=cumpleanos` **sin canchas elegidas**, las horas no están tachadas ni tienen "reservada" en su `aria-label`. Con canchas elegidas y una hora ocupada de verdad, sí (busca una fecha u hora con ocupación semilla, o reserva una hora en modo cancha y vuelve al modo evento con esa cancha).
4. En `CalendarioTorneo`, una hora ocupada de verdad tiene `aria-label` "<fase> HH:00, reservada"; las libres conservan "<fase> HH:00".
5. A 390 px, las 7 casillas de `SelectorDia` caben en su contenedor (en el formulario y en las fases del torneo) sin desbordar, con 44 px de alto; los días bloqueados sin `opacity` y con contraste ≥ 4,5:1 (mídelo).
6. Con teclado (Tab), `input` y `select` de la página muestran foco visible con el acento.
7. `#reserva-horario .formulario-reserva__horas button` existe; el script `revision/capturas-etapa9.mjs` vuelve a funcionar para `cancha-futbol` y `torneo-8`.

Corre también `npm test` y `npm run lint` una vez.

Usa `npm run build` + `npm run preview` (solo ese servidor) y Chrome por CDP, con temporales fuera del repositorio. Al terminar, mata el árbol del proceso de `preview` (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

Responde con `pasa`/`falla` y la evidencia (medidas) de cada punto, y los resultados de test y lint.

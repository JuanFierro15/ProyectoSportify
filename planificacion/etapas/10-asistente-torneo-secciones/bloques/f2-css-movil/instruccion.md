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

# Tarea f2 — CSS móvil del contenido de los pasos (B2, spec S8)

Antes de editar, lee completos:

- `AGENTS.md` (raíz).
- `odd/tasks/asistente-torneo-movil.md` hasta `## Log`: tu tarea es **B2** y cubre **S8**.
- `planificacion/etapas/10-asistente-torneo-secciones/PLAN.md` (sección "Diseño (B2)").
- `planificacion/etapas/10-asistente-torneo-secciones/revision/v1/medicion.md`, sobre todo "Diagnóstico". Es la medición a 390 px **antes** de tu cambio.

## El problema (medido en v1)

A 390 px, el paso `llaves` y el paso `resumen` con "Torneos reservados" abierto se ensanchan a ~700 px y el marco de la página los recorta: el contenido queda cortado a la derecha. La causa es que `div.bracket-torneo__simetrico` (de 616 a 646 px de ancho fijo) propaga su `min-content` a través de `.bracket-torneo__movil`, aunque este tenga `overflow-x: auto`, hasta el grid de la página. Así el contenedor de scroll del bracket nunca desplaza: se estira. En modo "Manual", además, `AsignacionManual` muestra dos columnas de 280 px en lugar de una.

Los pasos `canchas`, `formato`, `fechas` y `datos` y la confirmación ya miden bien: no los cambies.

## Qué hacer

Todo dentro de `@media screen and (max-width: 63.9375em) { … }`, el corte de S2. Fuera de ese bloque no cambies ni una regla: escritorio (>= 64em) debe quedar idéntico.

1. En `src/components/reservas/torneo/Bracket.css`: que el contenedor de scroll móvil del bracket (`.bracket-torneo__movil`, y si hace falta `.bracket-torneo`) no aporte su ancho intrínseco a los padres. Lo recomendado es `contain: inline-size` en `.bracket-torneo__movil`, con `min-width: 0` y `max-width: 100%` en `.bracket-torneo`. Así el bracket desplaza en horizontal **dentro de su propio contenedor** y las rondas siguen a su tamaño actual: no achiques las tarjetas ni el texto (12 px es el mínimo que hay hoy y debe seguir así).
2. En `src/components/reservas/torneo/SeccionLlaves.css`: `max-width: 100%` en `.seccion-llaves` (ya tiene `min-width: 0`), si después de 1 todavía hace falta.
3. En `src/components/reservas/FormularioReserva.css`: `min-width: 0` y `max-width: 100%` en `.formulario-reserva`, `.formulario-reserva__torneos-guardados` y `.formulario-reserva__torneo-guardado`, para que el bracket compacto de "Torneos reservados" haga scroll dentro de su caja.
4. Si con eso `AsignacionManual` sigue en dos columnas a 390 px, revisa por qué. Su CSS no está en tu lista de archivos: no lo toques y repórtalo.

Agrega solo las reglas que de verdad hagan falta, cada una con un comentario corto de por qué.

## Verificación (obligatoria, tú mismo)

1. Crea una carpeta temporal **fuera del proyecto** con `mktemp -d`. Ahí va tu script de medición.
2. `npm run build` y `npm run preview` en segundo plano (4173). Mide a 390×844 (`mobile: true`, DPR 2) con Chrome headless por CDP, como `planificacion/herramientas/capturas/capturas.mjs`. Recorre en `/reservar/futbol?modo=torneo` los pasos `llaves` (Aleatorio y Manual) y `resumen` con un torneo ya confirmado y "Torneos reservados" abierto. Para llegar, agrega dos canchas, elige mañana y horas para cada fase y llena los datos con "Ana Gómez" / "3001234567". En cada uno reporta:
   - `document.documentElement.scrollWidth`, `.vista-canchas__marco.scrollWidth` y `innerWidth`. Los tres deben dar 390.
   - `clientWidth` y `scrollWidth` de `.bracket-torneo__movil`: `scrollWidth` mayor que `clientWidth`, y `clientWidth` <= 390.
   - Cuántas columnas tiene `AsignacionManual` en modo Manual.
3. Detén `preview` matando el árbol del proceso (`taskkill /PID <pid> /T /F`), comprueba que el 4173 quedó libre y cierra Chrome (que no quede ningún `chrome.exe` con `--remote-debugging-port=9333`).
4. `npm test` y `npm run lint` sin errores ni warnings.

## Archivos que puedes editar

- `src/components/reservas/torneo/Bracket.css`
- `src/components/reservas/torneo/SeccionLlaves.css`
- `src/components/reservas/FormularioReserva.css`
- `src/components/reservas/torneo/CalendarioTorneo.css` (solo si la medición lo pide)

Nada más: ni JSX, ni `VistaCanchas.*`, `AsistenteTorneo.*`, `IndicadorPasos.*`, `VoucherReserva.*` ni `AsignacionManual.*`. No dejes archivos nuevos en el proyecto.

## Al terminar

Resume las reglas que agregaste (archivo y selector), los valores medidos en cada paso, la ruta de tu carpeta temporal y el resultado de `npm test` y `npm run lint`.

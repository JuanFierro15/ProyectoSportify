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

# Retoma r6 — Terminar el README

Un intento anterior de esta misma tarea se cortó a mitad de camino (falta de memoria del equipo) después de cambiar unas 96 líneas de `README.md`. Esos cambios siguen en el árbol de trabajo: míralos con `git diff -- README.md`.

1. Revisa lo que ya cambió: que sea correcto contra el código y las capturas, que no haya frases cortadas, secciones duplicadas, tablas rotas ni Markdown mal cerrado.
2. Recorre los seis puntos de la tarea (abajo) y completa solo los que falten. No dupliques lo que ya está bien.
3. Comprueba el conteo de pruebas con `npm test` (debe ser 197 en 16 archivos).

Al terminar, responde con qué puntos ya estaban, cuáles completaste y qué corregiste del intento anterior.

---

La tarea original del bloque:

# Tarea r6 — README al día con el rediseño de la etapa 9

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md`, `PLAN.md` y `revision/verificacion-final.md`. El rediseño ya está hecho y en commits; las 5 capturas de `docs/capturas/` que cambian (`vista-canchas`, `reserva-voucher`, `confirmacion-qr`, `modo-torneo`, `torneo-bracket`) ya están actualizadas. Ábrelas para describirlas bien.

## Qué hacer

Actualiza **solo `README.md`** para que describa la página de reserva tal como quedó, sin reescribir lo que sigue siendo cierto:

1. En la descripción de la página de reserva y sus modos: tema oscuro igual al inicio (encabezado con la foto de la cancha, selector de modo con íconos, pestañas con el color de cada deporte), horario agrupado en Mañana, Tarde y Noche con leyenda (Libre, Elegida, Reservada), y el comprobante con forma de tiquete.
2. En torneos: llaves simétricas en escritorio con la final al centro y el trofeo, por rondas con scroll horizontal en celular, partidos numerados "Partido N" en orden de juego, e indicador de pasos (Canchas, Formato, Fechas por fase, Llaves, Tus datos).
3. En la confirmación: tema oscuro, el QR sigue sobre fondo blanco.
4. El texto alternativo (`alt`) de las 5 capturas que cambiaron, para que describa lo que muestran ahora.
5. El conteo de pruebas: ahora son **197 pruebas en 16 archivos** (comprueba con `npm test`). Si el README nombra pruebas de `Torneo.test.jsx`, agrega que cubren "Ganador del partido N", la final con el trofeo y el indicador de pasos.
6. Si el README tiene una sección de accesibilidad, agrega lo verificado en la etapa: contraste mínimo 4,5:1 medido en todo texto de la reserva con los tres acentos, foco visible con teclado y `prefers-reduced-motion` respetado.

## Reglas

- Español con tildes, tuteo neutro, el mismo tono y formato del README actual. Sin menciones a herramientas de desarrollo, IA ni asistentes.
- No inventes funciones que no existan ni cifras que no estén en el código o en `revision/verificacion-final.md`.
- No toques ningún otro archivo. No hagas commits.
- Al terminar, responde con la lista de secciones que cambiaste.

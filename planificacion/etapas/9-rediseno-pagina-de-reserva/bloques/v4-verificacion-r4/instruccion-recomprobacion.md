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

# Recomprobación v4b — solo los cinco defectos de r4 (no edites código)

La verificación de r4 encontró cinco defectos y ya se corrigieron (ver `bloques/r4-llaves/retoma.md`, que los describe). Comprueba **solo** esto, con medidas por CDP:

1. En escritorio (1440×900), torneo de 8 equipos: al hacer scroll hasta las llaves, el comprobante **no** se monta sobre `.seccion-llaves` (compara los rectángulos de `.voucher-reserva` y `.seccion-llaves` en varios puntos del scroll); mientras se recorre el formulario el comprobante sigue `sticky`. En celular (390×844), el orden es formulario, llaves, comprobante.
2. Con 4, 8 y 16 equipos en escritorio, el ícono del trofeo de la final no se superpone con el encabezado "Final" ni con ningún otro texto, y nada se sale del lienzo.
3. En celular (390×844) hay conectores entre rondas (2 px `#3a3a3a`; los que llegan a la final en acento) alineados con las tarjetas; sin scroll horizontal de la página.
4. En la confirmación de torneo y en "Torneos reservados" (versión compacta), las líneas tocan el borde de las tarjetas (0 px de separación).
5. Con Tab se enfoca el recuadro con scroll de las llaves (16 equipos en escritorio y cualquier torneo en celular), tiene foco visible, `role="region"` y `aria-label`, y con las flechas se desplaza.

Corre también `npm test` y `npm run lint` una vez.

Usa `npm run build` + `npm run preview` (solo ese servidor) y Chrome por CDP (puedes usar `revision/capturas-etapa9.mjs` para llegar a cada escena), con temporales fuera del repositorio. Al terminar, mata el árbol del proceso de `preview` (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

Responde con `pasa`/`falla` y la evidencia de cada punto, y los resultados de test y lint.

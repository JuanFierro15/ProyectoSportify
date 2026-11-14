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

# Retoma del bloque t1 (intento 2)

En el intento 1 ya quedaron hechos P2, P3, P5 y el primer caso de P4 (429, 503, 429 → 502) en los archivos permitidos: revísalos, no los rehagas. Corrección del plan: el segundo caso de P4 estaba mal. `respuestaFinal` devuelve 504 si **alguno** de los errores es tiempo agotado (`errores.some(esTiempoAgotado)`, contrato documentado en `docs/agentes/chatbot.md`). El segundo caso queda así:

- 429, 429, timeout (`name: 'TimeoutError'`) → status **504** (no 429), cuerpo `{ respuesta: TEXTOS.generico, sugerencias: [], accion: null }`, 3 llamadas. Título: que un tiempo agotado manda sobre los 429 parciales.

Luego haz la verificación con mutación completa (sección final de la tarea), restaura el código de producción, corre `npm test` y `npm run lint`, y responde en español con tuteo (sin voseo) con archivos, número de pruebas y resultado de cada mutación. No hagas preguntas: si algo no cuadra, repórtalo al final.

---

# Bloque t1-pruebas (etapa 14)

Lee también `planificacion/etapas/14-pendientes-pr27/PLAN.md` (P2 a P5).

## Rutas permitidas
- `src/components/reservas/torneo/Bracket.test.jsx` (nuevo)
- `src/components/reservas/torneo/CalendarioTorneo.test.jsx` (existe: agrega casos)
- `src/components/hero/DeporteHero.test.jsx` (nuevo)
- `api/_lib/chat.test.js`
- `src/components/layout/Navbar.test.jsx`

Prohibido cambiar código de producción, `src/setupTests.js`, `AGENTS.md` o
`docs/`. Si una prueba revela un defecto real, NO lo corrijas: repórtalo. No
hagas commits.

## Reglas de calidad de las pruebas
- El título dice exactamente lo que la prueba ejercita.
- Nada de `toThrow()` a secas ni `try/catch` sin aserción.
- Todo mock global (`window.matchMedia`, spies de prototipos) se restaura en
  `afterEach` o `finally` (`vi.restoreAllMocks()` y devolver el
  `window.matchMedia` original).

## P2: limpieza GSAP de Bracket y CalendarioTorneo
`Bracket.jsx:125-138` y `CalendarioTorneo.jsx:75-86` usan
`gsap.matchMedia(rootRef)` + `mm.add('(prefers-reduced-motion: no-preference)', ...)`
+ `return () => mm.revert()`. El `matchMedia` de `setupTests.js` devuelve
`matches: false`; en estas pruebas reemplaza `window.matchMedia` por uno que
devuelva `matches: true` para `(prefers-reduced-motion: no-preference)` y false
para el resto, y restáuralo después.
Con `vi.spyOn(gsap, 'matchMedia')` (que llama a la implementación real)
captura cada instancia devuelta y espía su `revert`; espía también `gsap.from`.
Casos por componente:
- (a) al montar se llama `gsap.from` con el selector del componente
  (`.bracket-torneo__partido` / `.calendario-torneo__fase:not([hidden])`);
- (b) al cambiar una dependencia (`partidos.length` en Bracket con `rerender`;
  cambiar de fase en CalendarioTorneo) se revierte la instancia anterior y se
  crea otra;
- (c) al desmontar se revierte la última instancia;
- (d) con `matches: true` solo para `(prefers-reduced-motion: reduce)` no se
  llama `gsap.from`.
Mira los tests existentes (`CalendarioTorneo.test.jsx`,
`src/components/reservas/Torneo.test.jsx`) para armar las props.

## P3: pausa del video de DeporteHero
`src/components/hero/DeporteHero.jsx:136-146` llama `video?.pause()` en los
cleanups. Espía `HTMLMediaElement.prototype.pause` (ya simulado en
`setupTests.js`), monta `DeporteHero` con props válidas, desmonta y verifica
que se llamó. Repite con reduced-motion (`matches: true` para
`(prefers-reduced-motion: reduce)`): la pausa debe llegar igual por el cleanup.

## P4: caso mixto en `api/_lib/chat.test.js`
Sigue el estilo de los casos 429 y 504 existentes. Dos casos nuevos:
1. 429, 503, 429 → status 502, cuerpo
   `{ respuesta: TEXTOS.generico, sugerencias: [], accion: null }`, 3 llamadas.
2. (Corregido en la retoma: da 504, no 502.) 429, 429, timeout → 504, mismo
   cuerpo, 3 llamadas.
La regla está en `respuestaFinal` de `src/lib/modelosChat.js:93-104`.

## P5: Navbar y Footer
`src/components/layout/Navbar.test.jsx:97` dice "Navbar y Footer" pero solo
prueba Navbar→Eventos y Footer→Ubicación. Conviértelo en `it.each` con las
cuatro combinaciones (Navbar y Footer × Eventos y Ubicación) y en cada una haz
el clic dos veces, con las mismas aserciones del caso actual en ambos clics.

## Verificación con mutación (obligatoria; anótala en tu respuesta)
Comprueba que las pruebas fallan al quitar temporalmente el código que cubren,
y **restaura el código después** (al final, `git status` no debe mostrar
cambios fuera de tus rutas permitidas):
- quitar `mm.revert()` en Bracket y en CalendarioTorneo → falla (b) o (c);
- quitar `video?.pause()` en DeporteHero → falla P3;
- hacer que `respuestaFinal` devuelva 429 si hay algún 429 → falla P4.

Al final: `npm test` en verde y `npm run lint` con 0 warnings. Si `npm test`
deja modificado `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por
fin de línea, restáuralo con `git checkout` de ese archivo.

Responde con los archivos cambiados, el número de pruebas y el resultado de
cada mutación.

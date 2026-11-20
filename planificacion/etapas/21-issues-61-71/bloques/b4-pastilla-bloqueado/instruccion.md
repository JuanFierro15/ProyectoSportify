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

# Tarea del bloque b4: "bloqueado" no se corta en el selector de día (issue #70)

## Objetivo

A 390 px, en el asistente móvil del torneo (paso 3, "Fechas por fase"), la
pastilla del día bloqueado del selector de día no alcanza para la palabra
"bloqueado": se corta en el borde derecho ("bloqueadc"). Lee
`gh issue view 70` y mira la captura
`planificacion/etapas/20-revision-prs-57-60/revision/v3/R3-asistente-390.png`.

Medido en la captura: a 390 px cada pastilla mide unos 45 px de ancho, el
texto de estado (`.selector-dia__libres`) sale a 9 px
(`clamp(9px, 2.2vw, 12px)`) con `white-space: nowrap`, `overflow: hidden` y
`text-overflow: clip`, y "bloqueado" se pasa por 2 o 3 px. "11 libres" y
"13 libres" sí caben a 390 px, pero a 360 px las pastillas son unos 4 px más
angostas.

La parte 2 de la issue (barra inferior semitransparente) **no se cambia**: la
barra ya tiene `rgba(22, 22, 22, 0.95)` con `backdrop-filter: blur(12px)` y en
la captura se ve opaca. Eso se confirma en el navegador al final de la etapa.

## Archivos

- Puedes editar solo: `src/components/shared/SelectorDia.css`,
  `src/components/shared/SelectorDia.jsx`,
  `src/components/shared/SelectorDia.test.jsx` (nuevo) y `AGENTS.md` (solo la
  lista de pruebas de la sección "Comandos", para nombrar el archivo nuevo).
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.
- No levantes servidores (`npm run dev` ni `npm run preview`): la revisión en
  el navegador a 390 y 360 px la hace el coordinador al final.

## Diseño

1. Que el texto de estado de **todas** las pastillas ("bloqueado",
   "completo", "13 libres") quepa completo a 360 y 390 px sin cambiar el ancho
   de las pastillas (la grilla de 7 columnas iguales no cambia) y sin bajar de
   9 px. Hazlo solo con CSS, en una `@media screen and (max-width: 399px)` o
   similar sobre `.selector-dia__libres`: por ejemplo `letter-spacing`
   negativo (como ya hace `.selector-dia__sem`) y menos padding horizontal de
   la pastilla en ese rango. Desde `40em` el aspecto no cambia.
2. El texto visible sigue siendo "bloqueado", "completo" y "N libres", y el
   `aria-label` del botón no cambia (sigue terminando en ", bloqueado").
3. Prueba nueva `src/components/shared/SelectorDia.test.jsx`: un día
   bloqueado muestra "bloqueado", queda deshabilitado y su `aria-label`
   termina en ", bloqueado"; un día lleno no seleccionado muestra "completo" y
   queda deshabilitado; un día con 13 libres muestra "13 libres" y está
   habilitado; al hacer clic en un día habilitado se llama `onChange` con su
   fecha ISO, y en uno bloqueado no. Prueba el segundo y el último día de la
   tira, no solo el primero.
4. Agrega el archivo nuevo a la lista de pruebas de `AGENTS.md`.

## Comandos

- `npm test -- src/components/shared src/components/reservas`
- `npm run lint` (0 errores y 0 avisos)

La carpeta `src/verificacion/b4/` es del verificador: no la crees ni la toques.

---

## Lo que se te va a exigir

Un verificador independiente va a comprobar estos criterios intentando romperlos:

- C1: El CSS hace que el texto de estado (`.selector-dia__libres`) quepa en pastillas de unos 41 px de ancho (360 px) sin bajar de 9 px: reduce el espacio que ocupa (por ejemplo `letter-spacing` negativo y menos padding horizontal) solo por debajo de unos 400 px de ancho de ventana.
  Cómo comprobarlo: leer el CSS y estimar el ancho de "bloqueado" a 9 px con ese `letter-spacing` (anotar el cálculo). La medición real a 360 y 390 px la hace el coordinador en el navegador. No levantes servidores.
- C2: La grilla no cambia: `.selector-dia` sigue con `repeat(7, minmax(0, 1fr))`, y desde `40em` las reglas de `.selector-dia__opcion` y `.selector-dia__libres` dan el mismo resultado que antes.
- C3: El texto visible sigue siendo exactamente "bloqueado", "completo" y "N libres", y el `aria-label` de un día bloqueado termina en ", bloqueado".
- C4: `SelectorDia.test.jsx` prueba: día bloqueado (texto, `disabled` y `aria-label`), día lleno no seleccionado ("completo" y `disabled`), día con 13 libres ("13 libres", habilitado), y clic: `onChange` recibe la fecha ISO en un día habilitado (el segundo y el último de la tira) y no se llama en uno bloqueado.
- C5: Un día lleno **seleccionado** sigue habilitado (regla actual `lleno && !sel`), y la prueba lo cubre.
- C6: `AGENTS.md` nombra `SelectorDia.test.jsx` en la lista de pruebas, y no cambia nada más de ese archivo.
- C7: No se cambiaron ni `AsistenteTorneo.css` ni la barra inferior.
- C8: `npm test -- src/components/shared src/components/reservas` y `npm run lint` terminan con código 0 (lint sin avisos).

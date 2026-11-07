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

# Tarea v4 — Verificación del bloque r4 (solo pruebas, no edites código)

Lee `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (C10, C11), `PLAN.md` (E1, E2, E3, E6) y `bloques/r4-llaves/tarea.md`. El bloque r4 ya está implementado en el árbol de trabajo (`git diff` y archivos nuevos sin seguimiento; r1, r2 y r3 ya están en commits). Tu trabajo es **verificarlo**, no corregirlo.

## Qué hacer

1. **Revisión del diff:**
   - `git diff -- src/components/reservas/Torneo.test.jsx`: confirma que las pruebas cambiadas siguen comprobando lo mismo que antes (solo cambian los textos `R1-P1` → "Partido N" y los nombres de los combobox, más el arnés que monta `SeccionLlaves`), que ninguna se debilitó (asserts quitados, `queryBy` donde había `getBy`, regex tan amplias que pasan con cualquier cosa) y que las nuevas comprueban algo real. Verifica que el número de partido de cada prueba es el correcto (con 4 equipos: Partido 1 y 2 en semifinal y Partido 3 la final; con 8: Partidos 1 a 4 en cuartos, 5 y 6 en semifinal y 7 la final).
   - `git diff -w -- src/components/reservas/FormularioReserva.jsx src/components/canchas/VistaCanchas.jsx src/components/reservas/torneo/AsignacionManual.jsx`: confirma que solo se movió el bloque de las llaves, se montaron `SeccionLlaves` e `IndicadorPasos` y cambiaron las etiquetas de `AsignacionManual`, sin otros cambios de lógica.
   - Confirma que no se tocaron `src/lib/`, `src/data/`, `src/context/`, `api/` ni `useReserva.js` (`git diff --stat HEAD`).
2. Corre `npm test`, `npm run lint` y `npm run build`. Anota el resultado real.
3. Levanta **solo** `npm run preview` (4173) y usa `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/capturas-etapa9.mjs` con `BASE_URL=http://localhost:4173 OUT_DIR=<carpeta temporal del sistema>/sportify-v4` (fuera del repositorio) para `torneo-4`, `torneo-8`, `torneo-16` y `confirmacion-torneo`, en escritorio y celular. Mira las imágenes y mide por CDP.
4. Comprueba y anota `pasa`/`falla` con evidencia:
   - E1: en escritorio (1440×900) la sección de llaves ocupa el ancho del contenedor, debajo del formulario y del comprobante; el comprobante sigue `sticky` mientras se recorre el formulario; en celular, el orden es formulario, llaves, comprobante.
   - C11 escritorio (≥ 900 px): llaves simétricas con la final al centro (4: Semifinal, Final, Semifinal; 8: Cuartos, Semifinal, Final, Semifinal, Cuartos; 16: con octavos en los extremos); columnas de 190 px con 38 px entre ellas; encima de cada columna, nombre de la ronda y fecha/horario, alineados a la derecha en el lado derecho; tarjetas de dos filas de 38 px, fondo `#1f1f1f`, borde `#333333`, radio 10 px; nombres alineados a la derecha en el lado derecho; "Partido N, HH:MM" y la cancha en 12 px `#a8a8a8`, o "Por programar" sin hora; no aparecen "Hora por definir", "Cancha por elegir" ni "Turno"; "Ganador del partido N" en `#a8a8a8` sin negrilla; conectores de 2 px `#3a3a3a` entre partidos, los dos que llegan a la final en acento; final de 96 px de alto, borde 2 px del acento, fondo del acento al 12 % sobre `#0d0d0d`, ícono de trofeo y "Trofeo y premiación al terminar."; sin marcadores; con 16 equipos las tarjetas no se encogen y el recuadro tiene scroll horizontal; ninguna tarjeta ni la final quedan cortadas.
   - C11 celular (< 900 px): rondas de izquierda a derecha con las tarjetas y conectores nuevos, scroll horizontal dentro del recuadro y sin scroll horizontal de la página (390 px).
   - "Partido N" en orden de juego (índice + 1), también en `AsignacionManual` (botón "Manual" en el formato) y en los `aria-label` (`Partido N: <local> contra <visitante>`, sin "Partido Partido").
   - La versión compacta en la confirmación de torneo y en "Torneos reservados" sigue las mismas reglas.
   - E3 indicador de pasos: Canchas, Formato, Fechas por fase, Llaves, Tus datos; completos marcados, el actual con `aria-current="step"` y el acento; avanza al elegir canchas, fechas y datos.
   - Contraste ≥ 4,5:1 de cada texto nuevo (12 px incluido) con los tres acentos (fútbol `#5bd67d`, pádel `#3fa9f5`, vóley `#f6a94b`).
   - Navegación con teclado por la sección de llaves y el indicador: foco visible y orden lógico.
   - Con `prefers-reduced-motion: reduce` (emúlalo por CDP con `Emulation.setEmulatedMedia`) las llaves aparecen sin animación.
5. Al terminar, **mata el árbol del proceso de `preview`** (`taskkill /PID <pid> /T /F`), cierra Chrome y borra los temporales.

## Restricciones

- No edites ningún archivo del repositorio. No hagas commits. No levantes `npm run dev` ni `vercel dev`.

## Al terminar

Responde con: resultado de la revisión del diff (incluidas las pruebas); resultados de test, lint y build; tabla de verificación (punto, pasa/falla, evidencia con medidas); tabla de contrastes medidos; defectos concretos con archivo y descripción; y confirmación de que no quedó ningún proceso de `preview` ni de Chrome.

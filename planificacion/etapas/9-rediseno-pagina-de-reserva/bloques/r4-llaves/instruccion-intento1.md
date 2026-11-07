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

# Tarea r4 — Llaves simétricas, "Partido N" e indicador de pasos

Antes de editar, lee completos:

- `planificacion/etapas/9-rediseno-pagina-de-reserva/PROMPT.md` (secciones A, B, C10, C11 y D).
- `planificacion/etapas/9-rediseno-pagina-de-reserva/PLAN.md` (E1, E2, E3, E6, Tokens y la fila `r4`).
- La maqueta `planificacion/etapas/9-rediseno-pagina-de-reserva/referencia/torneo.html`.
- Las capturas actuales de las llaves en `planificacion/etapas/9-rediseno-pagina-de-reserva/revision/antes/torneo-*.webp`.

Si el PROMPT y el PLAN no coinciden, manda el PLAN (está aprobado). Los bloques `r1`, `r2` y `r3` ya están hechos: la página es oscura y los tokens `--reserva-*` existen en `src/App.css`. Úsalos.

## Qué hacer

### 1. Llaves a ancho completo (PLAN E1)

- Crea `src/components/reservas/torneo/SeccionLlaves.jsx` (y su CSS si hace falta): recibe `reserva` y `canchas` y muestra el subtítulo "Llaves y cronograma del torneo" y el `<Bracket partidos={reserva.torneoPlan?.partidos || []} canchas={canchas} />`, dentro de una tarjeta de sección oscura (`var(--reserva-seccion)`, borde `var(--reserva-seccion-borde)`, radio 16 px).
- Quita de `FormularioReserva.jsx` el bloque que hoy muestra ese subtítulo y el `<Bracket>` principal (en `main` eran las líneas 336-345; búscalo por el texto "Llaves y cronograma del torneo"). La lista "Torneos reservados" con su `Bracket compacto` **se queda** en el formulario.
- En `VistaCanchas.jsx`, monta `<SeccionLlaves reserva={reserva} canchas={canchas} />` solo cuando `reserva.modo === 'torneo'`, **dentro** de `.vista-canchas__reserva`, como hermano de `.vista-canchas__principal` y del comprobante. En `VistaCanchas.css`, `.vista-canchas__reserva` pasa a `grid-template-areas`: desde `large` (64em), fila 1 `principal | comprobante` y fila 2 `llaves` ocupando las dos columnas; por debajo, `principal`, `llaves`, `comprobante`. El comprobante sigue `sticky` en la fila 1. No dupliques estado: es la misma `reserva`.

### 2. Llaves (C11, `torneo/Bracket.jsx` y `Bracket.css`)

- **Escritorio (desde 900 px de ancho):** simétricas. La mitad de los partidos de cada ronda, salvo la final, va a la izquierda y la otra mitad a la derecha, en espejo. Con 8 equipos: Cuartos, Semifinal, Final, Semifinal, Cuartos. Con 4: Semifinal, Final, Semifinal. Con 16 se agregan los octavos en los extremos.
- Columnas de 190 px con 38 px entre ellas. Encima de cada columna, el nombre de la ronda (como encabezado `h4` con el texto exacto de la ronda, por ejemplo "Semifinal" y "Final": lo buscan las pruebas con `getByRole('heading', { name: /^Semifinal$/i })`) y, en otro elemento, su fecha y horario. En el lado derecho, alineados a la derecha. Ojo: con la simetría habrá dos columnas "Semifinal"; las pruebas usan `getByRole` (uno solo): pon el nombre de la ronda como encabezado una sola vez por ronda (por ejemplo, en la columna izquierda) y en la columna espejo un rótulo que no sea encabezado con el mismo texto visual, o el encabezado sobre la pareja de columnas. Lo que elijas, las pruebas de los encabezados deben seguir pasando sin cambiarlas.
- Tarjeta de partido: dos filas de 38 px (una por equipo), fondo `#1f1f1f` (`var(--reserva-control)`), borde `#333333`, radio 10 px. En el lado derecho, los nombres alineados a la derecha. Encima de cada tarjeta, en 12 px y `#a8a8a8`: "Partido N, HH:MM" y la cancha cuando ya está definida. Si todavía no hay hora: "Por programar". Desaparecen "Hora por definir", "Cancha por elegir" y "Turno N".
- Rondas siguientes: "Ganador del partido N" en `#a8a8a8`, sin negrilla.
- Conectores de 2 px en `var(--reserva-linea)` (`#3a3a3a`) entre cada par de partidos y el siguiente. Los dos que llegan a la final, en el color de acento.
- Final en el centro: 96 px de alto, borde de 2 px del acento, fondo del acento al 12 % sobre `#0d0d0d` (`color-mix`), el ícono `Trophy` de `lucide-react` encima y debajo "Trofeo y premiación al terminar."
- No muestres marcadores.
- Con 16 equipos (7 columnas) las tarjetas no se encogen: el recuadro de las llaves tiene scroll horizontal.
- **Celular (por debajo de 900 px):** las rondas de izquierda a derecha, como hoy, con las tarjetas y los conectores nuevos y scroll horizontal dentro del recuadro, sin scroll horizontal de la página.
- La versión compacta (`compacto`, la de la confirmación y la de "Torneos reservados") sigue las mismas reglas.
- Si el componente tiene una animación GSAP, consérvala dentro de `gsap.context()` y respetando `prefers-reduced-motion`; no agregues animaciones nuevas.

### 3. "Partido N" (PLAN E6)

- "Partido N" = índice del partido en el arreglo `partidos` + 1 (el arreglo ya viene por ronda y en orden de juego). No uses `turno`.
- Los textos `Ganador R1-P1` llegan de `src/lib/torneo.js` (no se toca): en el `Bracket`, arma un mapa id → número y muéstralos como "Ganador del partido N".
- `aria-label` de cada partido: `Partido N: <local> contra <visitante>` (sin "Partido Partido"). Usa "Ganador del partido N" también ahí.
- `AsignacionManual.jsx`: la etiqueta `R1-P${m+1}` pasa a `Partido ${m+1}`, y sus `aria-label` a `Partido ${m+1}, equipo local` y `Partido ${m+1}, equipo visitante`.

### 4. Indicador de pasos (PLAN E3)

Crea `src/components/reservas/torneo/IndicadorPasos.jsx` (+ CSS), solo en modo torneo, debajo del selector de modo o al inicio de la columna principal. Pasos: Canchas, Formato, Fechas por fase, Llaves, Tus datos. Cada paso completo se marca (ícono `Check`) y el actual (el primer incompleto) se resalta con el acento. Usa una lista ordenada con `aria-current="step"` en el actual. Reglas de completo, solo con lo que devuelve `useReserva` (no lo modifiques):

- Canchas: `canchaIds.length > 0` y sin `torneoPlan?.errorCanchas`.
- Formato: `equipos` válido y `duracionPartido` definido (queda completo desde el inicio; es lo aprobado).
- Fechas por fase: todas las fases con horas elegidas (`jornadas`) y ninguna `torneoPlan?.validacionesJornadas[i]?.error`. Revisa la forma real de esos objetos en `useReserva.js` antes de escribir la regla.
- Llaves: `torneoPlan?.partidos?.length > 0` y sin `torneoPlan?.errorCruces`.
- Tus datos: sin `errNombre` y sin `errTelefono`, con nombre no vacío.

### 5. Pruebas (`src/components/reservas/Torneo.test.jsx`, PLAN E2)

- Líneas ~185-187: `getByText('R1-P1')`, `R1-P2`, `R2-P1` pasan a los textos nuevos ("Partido 1", "Partido 2", "Partido 5" o los que correspondan con 8 equipos: el primer partido de la ronda 2 es el 5).
- Líneas ~295 y ~298: los combobox `Llave R1-P1 equipo local/visitante` pasan a `Partido 1, equipo local/visitante`.
- Líneas ~446-452: `R1-P1`…`R3-P1` dentro de "Torneos reservados" pasan a "Partido 1"…"Partido 7".
- El arnés que monta `FormularioReserva` solo (alrededor de las líneas 84 y 581) debe montar también `SeccionLlaves` con la misma `reserva`, para que las pruebas de llaves sigan encontrando el `Bracket`.
- Cuidado: con la tarjeta nueva el texto "Partido 1" puede aparecer como parte de "Partido 1, 14:00". Usa la consulta que corresponda (regex o `getAllByText`) sin debilitar lo que la prueba comprueba.
- Agrega pruebas para: "Ganador del partido N" en las rondas siguientes, la final con "Trofeo y premiación al terminar." y el indicador de pasos (el paso actual con `aria-current="step"` cambia al elegir canchas).
- No cambies ninguna otra prueba. Si otra falla, detente y repórtalo.

## Archivos que puedes editar o crear

- `src/components/reservas/torneo/Bracket.jsx`, `src/components/reservas/torneo/Bracket.css`
- `src/components/reservas/torneo/SeccionLlaves.jsx` (nuevo) y su CSS
- `src/components/reservas/torneo/IndicadorPasos.jsx` (nuevo) y su CSS
- `src/components/reservas/torneo/AsignacionManual.jsx`
- `src/components/reservas/FormularioReserva.jsx` (solo quitar el bloque de las llaves principales)
- `src/components/canchas/VistaCanchas.jsx`, `src/components/canchas/VistaCanchas.css` (montar `SeccionLlaves` e `IndicadorPasos` y la rejilla)
- `src/components/reservas/Torneo.test.jsx`

No toques `src/lib/`, `src/data/`, `src/context/`, `api/`, `useReserva.js`, `VoucherReserva.*` ni `ConfirmacionReserva.*`.

## Reglas

- Sin dependencias ni tipografías nuevas (`lucide-react` ya está).
- Objetivos táctiles de 44 px, `:focus-visible`, contraste 4,5:1 en todo texto (también en el de 12 px).
- Textos con tuteo, sin detalles de implementación.
- Al terminar corre `npm test` y `npm run lint` (sin `dev`, `preview` ni `vercel dev`) y reporta el resultado, incluida la lista de pruebas cambiadas y agregadas.

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

# [MODO EJECUTOR] Bloque u1-interfaz-torneo (etapa 15)

Lee también `planificacion/etapas/15-horas-torneo-por-cancha/PLAN.md`
(decisiones 1, 2, 6, 7, 8 y 10), `docs/agentes/torneo.md` y
`docs/agentes/pagina-reserva.md`. Los bloques anteriores ya cambiaron la
lógica: **léelos antes de empezar y no los modifiques**:
- `src/lib/torneo.js`: `jornadas[ronda] = { fecha, horasPorCancha }`,
  `horasDeJornada`, `turnosDeCancha`, `turnosDeFase`, `capacidadFase`,
  `validarJornadas` (inicio/fin de la fase con cualquier cancha),
  `sugerenciasTiempoFase({ ..., horasPorCancha })`, `programarTorneo` por
  turnos reales, `horasSinPartido`, `mensajeHorasSinPartido`,
  `limpiarJornadasConChoque(jornadas, (ronda, canchaId, hora) => bool)` que
  devuelve `{ jornadas, huboChoque, quitadas }`, y `fasesDelTorneo` con
  `canchaIds` = todas las canchas del torneo.
- `src/context/ReservasContext.jsx`: acepta bloques `{ ronda, nombreRonda,
  fecha, canchaIds: [id], horas }` (uno por fase y cancha), sin exigir horas
  seguidas en torneos, y exporta `ERROR_EVENTO_FECHA_FASE`.
- `src/lib/precios.js`: precio por (fase, cancha); descuento desde 2 horas
  de esa cancha en la fase aunque no sean seguidas.

## Rutas permitidas
- `src/components/reservas/useReserva.js`
- `src/components/reservas/` y `src/components/reservas/torneo/` (`.jsx`,
  `.css` y sus tests), incluido un componente nuevo
  `src/components/reservas/torneo/DialogoHorasSinPartido.jsx` (+ `.css`)
- `src/components/canchas/VistaCanchas.jsx` (solo para montar el diálogo y
  pasar la fase a revisar)
- `src/components/layout/MisReservas.jsx` y su test
- `planificacion/etapas/15-horas-torneo-por-cancha/revision/` (scripts,
  capturas y notas de la prueba headless)

Prohibido: `src/lib/`, `src/context/`, `api/`, `docs/`, `AGENTS.md`,
`src/App.css` (salvo que necesites un token de z-index nuevo: en ese caso,
detente y repórtalo). No hagas commits ni cambies de rama.

## Cambios

### 1. `useReserva.js`
- **Estado:** `jornadas[ronda] = { fecha, horasPorCancha: {} }` en
  `inicializarJornadas` (conserva lo previo si existe) y en todos los sitios
  que hoy leen o escriben `j.horas` (`normalizarJornadasCascada`,
  `moverFechaJornadas`, `cambiarFechaFase`, efectos de choque, `confirmar`).
  En la cascada, "la fase tiene horas" es `horasDeJornada(j).length > 0`, su
  primera hora es `horasDeJornada(j)[0]` y su fin es
  `finDeFranja(última)`; cuando la cascada hoy vacía `horas`, ahora vacía
  `horasPorCancha` de esa fase.
- **`esLibreFase(ronda, canchaId, hora, jornadasBase = jornadas)`:** la hora
  está libre en **esa** cancha en la fecha de la fase (ya no en todas) y no
  cae antes del fin de una fase previa del mismo día (ni en fecha anterior),
  con el fin calculado por `horasDeJornada`.
- **`elegirHoraFase(ronda, canchaId, hora)`:** alterna esa hora en esa cancha
  (un toque marca, otro desmarca; sin rangos ni `seleccionarRango`). Si la
  hora no está libre y no estaba marcada, no hace nada. Mantén el patrón
  actual de precalcular y aplicar en `setJornadas` y luego normaliza la
  cascada.
- **Choques:** usa la nueva `limpiarJornadasConChoque` con
  `(r, cid, h) => esLibreFase(r, cid, h, base)`. Se quita solo esa hora.
  Mensaje: con una hora quitada
  `La hora de las ${hora} en ${nombreCancha} (${nombreRonda}) ya no está libre: la quitamos.`
  y con varias `Algunas horas ya no están libres: las quitamos de ${nombreRonda}.`
  (usa `tituloCancha` de `src/lib/canchas.js` para el nombre).
- **Canchas del torneo:** si se quita una cancha del torneo, se borran sus
  horas en todas las fases.
- **`torneoPlan`:** `sugerenciasPorFase` con `horasPorCancha`;
  `bloques` = uno por (fase, cancha con horas), en orden de fase y luego en
  el orden de `canchaIds`, con `horas` ordenadas;
  `horasSinPartidoPorFase[ronda] = { lista, mensaje }` con
  `horasSinPartido(j.horasPorCancha, minutosTurno, fase.partidos, canchaIds)`
  y `mensajeHorasSinPartido({ nombreRonda, partidos, duracionPartido,
  horasElegidas: total de horas marcadas en todas sus canchas, sinPartido })`;
  y `fasesConHorasDeMas` (lista de rondas con `lista.length > 0`).
- **Confirmación por horas de más:** `confirmar()` en modo torneo, si
  `fasesConHorasDeMas.length > 0` y el usuario no lo aceptó, **no reserva**:
  pone `avisoHorasDeMas = true`. Expón:
  - `avisoHorasDeMas` (bool) y el detalle (mensajes por fase);
  - `reservarIgual()`: cierra el aviso y reserva (misma ruta que hoy);
  - `revisarHorasDeMas()`: cierra el aviso y pone `faseARevisar` =
    primera ronda con horas de más (más un contador o marca para que
    repetirlo vuelva a funcionar).
  Si las horas cambian mientras el aviso está abierto, se cierra.
- **`confirmar` torneo:** `fecha` y `horas` del primer bloque como hoy;
  `bloques` nuevos. Si el contexto rechaza por choque, limpia solo las horas
  afectadas (como arriba); si rechaza por otra razón, muestra el error sin
  tocar horas. Texto del comprobante (`horario`): con varias fases o
  canchas, `${n} jornadas`; con un único bloque, las horas separadas por
  coma si no son seguidas o `inicio a fin` si lo son.
- Elimina imports muertos (`seleccionarRango` solo si ya no se usa en otros
  modos: el cumpleaños y la reserva individual siguen igual).

### 2. `CalendarioTorneo.jsx` (+ CSS)
- Texto de ayuda nuevo (reemplaza el de "toca la hora de inicio y luego la
  hora final"): `Toca una hora para marcarla o desmarcarla en cada cancha. Puedes elegir horas salteadas y distintas en cada cancha.`
- En el panel de cada fase, tras el selector de día, **una fila de horas por
  cada cancha del torneo** con su nombre (`tituloCancha`) como etiqueta y
  sus horas agrupadas por franja como hoy. Cada hora es un `<button>` con
  `aria-pressed`, `data-hora`, `data-cancha` y `aria-label`
  `${nombreRonda}, ${nombreCancha}, ${hora}` (más `, reservada` si está
  ocupada). Llama `onElegirHoraFase(ronda, canchaId, hora)`.
- Resumen de la fase: por cancha, `Pádel 1: 16:00, 18:00 · Pádel 2: 19:00`
  y el total de horas. La pestaña muestra `día · N horas` o `Sin horario`.
- Cambia el badge de "canchas efectivas" por
  `${fase.partidos} ${partido|partidos} · turnos de ${minutosTurno} min` y
  `Mínimo: ${fase.horasMinimas} ${hora|horas} con ${fase.canchasEfectivas} ${cancha|canchas}`.
- Aviso de horas de más (no bloquea): `callout warning` con
  `role="status"`, texto `torneoPlan.horasSinPartidoPorFase[ronda].mensaje`
  y la lista de horas sin partido (`Pádel 1 · 17:00`). La pestaña con horas
  de más muestra el icono de aviso.
- Prop nueva `faseARevisar` (y su marca): cuando cambia, activa esa pestaña y
  le pasa el foco al panel.
- Mantén el `gsap.matchMedia` actual con `mm.revert()`.
- Sin desborde horizontal a 390 px con 3 canchas: las filas envuelven
  (`flex-wrap`) y la etiqueta de la cancha va arriba en pantallas chicas.

### 3. `DialogoHorasSinPartido.jsx` (nuevo; no uses `window.confirm`)
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` con título
  `Hay horas sin partido`, el mensaje de cada fase con horas de más y la
  pregunta `¿Quieres reservar igual? Esas horas se cobran.`
- Botones `Revisar horas` (primero, con el foco al abrir) y `Reservar igual`.
- Atrapa el foco (Tab y Shift+Tab giran dentro), Escape equivale a "Revisar
  horas", y al cerrar el foco vuelve al botón que lo abrió (guarda
  `document.activeElement` al abrir).
- Se monta donde se muestra el voucher del torneo: `VistaCanchas.jsx`
  (escritorio) y `AsistenteTorneo.jsx` (móvil). En el asistente, "Revisar
  horas" lleva al paso "Fechas por fase" y a la fase indicada.
- Capa: usa el patrón de overlay que ya exista en el proyecto; si necesitas
  z-index, usa un token existente de `src/App.css` (`var(--z-...)`), nunca
  un número suelto.

### 4. Otros componentes
- `PasoFechas.jsx`, `AsistenteTorneo.jsx`: pasar las props nuevas.
- `VoucherReserva.jsx`, `ConfirmacionReserva.jsx` y `PasoGuardados.jsx`: por
  fase, si hay `horasPorCancha`, mostrar `Cuartos de final: sáb 21 · Pádel 1: 16:00, 18:00 · Pádel 2: 19:00`;
  si solo hay `horas` (reservas viejas, o bloques viejos de varias canchas),
  el formato de hoy `inicio a fin (N canchas)`. En `PasoGuardados`, agrupa
  los bloques guardados por `ronda` (hoy los empareja por índice: con
  bloques por cancha eso se desalinea).
- `MisReservas.jsx`: para un torneo con `bloques`, mostrar cada fase con sus
  canchas y horas (agrupando por `ronda`), en vez de `horas[0] a fin` del
  primer bloque. Reservas viejas siguen viéndose igual.
- Textos visibles sin detalles de implementación y con tuteo.

### 5. Pruebas (actualiza las existentes y agrega)
Las pruebas de interfaz que usan el contrato viejo (`Torneo.test.jsx`,
`CalendarioTorneo.test.jsx`, `PasoGuardados.test.jsx`,
`AsistenteTorneo.test.jsx`, `FormularioReserva.test.jsx`,
`MisReservas.test.jsx`) se adaptan. Agrega, con valores exactos:
- Elegir cuartos en Pádel 1 a las 16:00 y 18:00 y en Pádel 2 a las 19:00 con
  8 equipos y 2 canchas: los botones quedan `aria-pressed="true"`, el
  resumen lo muestra, `torneoPlan.bloques` tiene 2 bloques de ronda 1 con
  esas horas exactas.
- Tocar dos veces la misma hora la desmarca; desmarcar la **segunda** y la
  **última** hora elegidas deja las demás.
- Una hora ocupada en Pádel 2 está deshabilitada solo en Pádel 2 (Pádel 1
  sigue libre a esa hora).
- Semifinal antes del fin de cuartos (por la cancha 2): aparece el error de
  orden y el botón de reservar queda bloqueado.
- Final con 5 horas: aparece el aviso; pulsar Reservar abre el diálogo y no
  reserva; "Revisar horas" cierra, activa la pestaña de la Final y no
  reserva; volver a pulsar Reservar y "Reservar igual" reserva una sola vez;
  Escape cierra el diálogo y devuelve el foco al botón; repetir la reserva no
  la duplica.
- Una hora que otra reserva ocupa después (simula con `reservar` del
  contexto) se quita sola con el mensaje exacto y deja las demás.
- Cumpleaños y reserva individual siguen pidiendo horas seguidas (prueba
  existente en verde).
- `MisReservas` y `PasoGuardados` muestran un torneo nuevo por cancha y uno
  viejo (un bloque por fase con dos canchas).
Reglas: títulos que dicen lo que se prueba, errores acotados al texto
exacto, sin `toThrow()` a secas ni try/catch sin aserción, mocks restaurados.

## Verificación (obligatoria; anótala en tu respuesta)
1. `npm test` completo en verde, `npm run lint` con 0 warnings y
   `npm run build` OK. Si `npm test` deja modificado
   `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por fin de línea,
   restáuralo con `git checkout -- <archivo>`.
2. Mutaciones (restaura después): quitar la apertura del diálogo en
   `confirmar` → falla alguna prueba; volver a `esLibreFase` que exige todas
   las canchas → falla alguna.
3. Headless: `npm run build` y `npm run preview` (puerto 4173), Chrome
   headless por CDP; parte de un script existente de
   `planificacion/etapas/14-pendientes-pr27/revision/` (cópialo a
   `revision/u1-prueba.mjs`). En `/reservar/padel?modo=torneo` a 390×844 y
   1440×900: el caso de cuartos por cancha, la semifinal mal ordenada, la
   final con 5 horas (aviso, diálogo, Revisar, Reservar igual) y que "Mis
   reservas" lo liste; sin desborde (`scrollWidth === innerWidth`) con 3
   canchas a 390 px; sin errores de consola. No abras el chat. Capturas en
   `revision/u1-*.png` y notas en `revision/u1-verificacion.md`.
4. **Cierra el `preview` y todo Chrome headless al terminar** y comprueba que
   no quede nada escuchando en el puerto 4173.
5. `git status`: cambios solo en tus rutas.

Responde con los archivos cambiados, el número de pruebas, el resultado de
cada mutación y lo visto en headless.

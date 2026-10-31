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

# Tarea: dominio, precios, contexto y hook para torneos multi-día por fases (`t1-dominio-jornadas`)

## Objetivo

Extender la capa de dominio (`src/lib/torneo.js`, `src/lib/precios.js`,
`src/lib/codigoReserva.js`), el contexto de reservas (`src/context/ReservasContext.jsx`)
y el hook de reserva (`src/components/reservas/useReserva.js`) para que cada
fase de un torneo de eliminación directa (**Octavos de final**, **Cuartos de final**,
**Semifinal** y **Final**) tenga su propio día y horario (`jornadas`), ocupe y
cobre únicamente las canchas efectivas de esa fase
(`min(canchasElegidas.length, partidosDeLaFase)`), valide el tiempo por fase y
el orden cronológico estricto entre fases, y confirme todas las jornadas como
una sola reserva atómica todo-o-nada (`bloques`).

## Rutas

- Modificar:
  - `src/lib/torneo.js`
  - `src/lib/torneo.test.js`
  - `src/lib/precios.js`
  - `src/lib/precios.test.js`
  - `src/lib/codigoReserva.js`
  - `src/context/ReservasContext.jsx`
  - `src/components/reservas/useReserva.js`
- Leer (sin modificar):
  - `src/lib/fechas.js`
  - `src/lib/horarios.js`
- Prohibido modificar cualquier otro archivo fuera de la lista "Modificar".

## Diseño detallado

### 1. `src/lib/torneo.js` y `src/lib/torneo.test.js`

Mantén intactas todas las funciones y constantes existentes para no romper
retrocompatibilidad y añade/extiende lo siguiente:

- **`fasesDelTorneo({ equipos, canchaIds = [], minutosTurno = 30 })`**:
  - Calcula las rondas con `partidosPorRonda(equipos)`.
  - Por cada ronda `idx` (`ronda = idx + 1`), con `partidos` partidos:
    - `numCanchasFase = ids.length > 0 ? Math.min(ids.length, partidos) : 1`
    - `canchasFase = ids.slice(0, numCanchasFase)`
    - `turnos = Math.ceil(partidos / numCanchasFase)`
    - `minutos = turnos * Number(minutosTurno)`
    - Devuelve `{ ronda, nombreRonda: nombreRonda(partidos), partidos, canchasEfectivas: numCanchasFase, canchaIds: canchasFase, turnos, minutosRequeridos: minutos, horasMinimas: Math.ceil(minutos / 60) }`.

- **`validarJornadas(fases, jornadas = {})`**:
  - Recorre `fases` en orden llevando `finPrevio = null` (`{ fecha, horaFin, nombreRonda }`).
  - Para cada `fase`, obtiene `j = jornadas[fase.ronda] || {}`, `fecha = j.fecha || null`, `horas = Array.isArray(j.horas) ? j.horas : []`.
  - Si `!fecha || horas.length === 0`, devuelve:
    `{ ronda: fase.ronda, nombreRonda: fase.nombreRonda, completa: false, alcanza: false, ordenValido: true, disponibles: 0, deficit: fase.minutosRequeridos, error: "Elige el día y el horario para " + fase.nombreRonda + "." }`
    (sin sobrescribir `finPrevio` si está incompleta).
  - Si tiene `fecha` y `horas`:
    - `validacion = validarFranja(fase.minutosRequeridos, horas.length)`
    - `horaInicio = horas[0]`
    - `horaFin = sumarMinutos(horas[horas.length - 1], 60)`
    - `ordenValido = !finPrevio || (fecha > finPrevio.fecha || (fecha === finPrevio.fecha && horaInicio >= finPrevio.horaFin))`
    - Si `!ordenValido`, `error = "${fase.nombreRonda} debe jugarse después de que termine ${finPrevio.nombreRonda} (${finPrevio.fecha} a las ${finPrevio.horaFin})."`
    - Si `ordenValido && !validacion.alcanza`, `error = "La franja de ${fase.nombreRonda} no alcanza (faltan ${validacion.deficit} min)."`
    - Actualiza `finPrevio = { fecha, horaFin, nombreRonda: fase.nombreRonda }`.
    - Devuelve `{ ronda: fase.ronda, nombreRonda: fase.nombreRonda, completa: true, alcanza: validacion.alcanza, ordenValido, disponibles: validacion.disponibles, deficit: validacion.deficit, error }`.

- **`sugerenciasTiempoFase({ fase, canchasTotales, duracionPartido, deporte, horasReservadas })`**:
  - Calcula sugerencias accionables cuando una `fase` no alcanza en `horasReservadas`:
    1. Ampliar la franja de `fase.nombreRonda` a al menos `fase.horasMinimas` horas (`fase.horasMinimas * 60` min).
    2. Si `canchasTotales < Math.min(MAX_CANCHAS_TORNEO, fase.partidos)`, sugerir agregar más canchas del mismo deporte.
    3. Si `Number(duracionPartido) > OPCIONES_DURACION[0]`, sugerir reducir la duración por partido a 15 min.

- **`programarTorneo({ orden, canchaIds = [], horaInicio = null, minutosTurno = 30, jornadas = null })`**:
  - Si `jornadas` es `null`, conserva exactamente el comportamiento actual de un solo bloque.
  - Si `jornadas` es un objeto `{ [ronda]: { fecha, horas } }`:
    - En cada ronda `ronda`:
      - `numCanchasFase = ids.length > 0 ? Math.min(ids.length, numPartidos) : 1`
      - `canchasFase = ids.slice(0, numCanchasFase)`
      - `j = jornadas[ronda] || {}`
      - `fechaFase = j.fecha || null`
      - `horaInicioFase = Array.isArray(j.horas) && j.horas.length > 0 ? j.horas[0] : horaInicio`
      - Para cada partido `i` de esa ronda:
        - `turnoDentroDeRonda = Math.floor(i / numCanchasFase) + 1`
        - `canchaId = canchasFase.length > 0 ? canchasFase[i % canchasFase.length] : null`
        - `inicio = horaInicioFase ? sumarMinutos(horaInicioFase, (turnoDentroDeRonda - 1) * minutosTurno) : null`
        - Incluye `fecha: fechaFase` y `turno: turnoDentroDeRonda` en el objeto del partido.

- **`armarTorneo({ deporte, equipos, duracionPartido, emparejamiento, orden, canchaIds = [], horaInicio = null, jornadas = null })`**:
  - Si recibe `jornadas`, construye también `jornadasResumen` a partir de `fasesDelTorneo({ equipos, canchaIds, minutosTurno })` con `{ ronda, nombreRonda, fecha, horas, canchaIds: fase.canchaIds, canchasEfectivas: fase.canchasEfectivas, partidos: fase.partidos, turnos: fase.turnos, minutosRequeridos: fase.minutosRequeridos }` y lo devuelve en la propiedad `jornadas` del objeto torneo, además de pasar `jornadas` a `programarTorneo`.

- En `src/lib/torneo.test.js`: agrega pruebas unitarias para `fasesDelTorneo` (AC-009), `validarJornadas` (AC-010, AC-011), y `programarTorneo` con `jornadas`.

### 2. `src/lib/precios.js` y `src/lib/precios.test.js`

- Añade `calcularPrecioJornadas(bloques = [], canchasCatalogo = [])` en `src/lib/precios.js` (AC-013):
  - Recorre cada bloque `b` de `bloques` (`{ ronda, nombreRonda, fecha, horas, canchaIds }`).
  - Si `b.horas` tiene `nH > 0`, para cada `id` en `b.canchaIds` busca la cancha `c` en `canchasCatalogo` y calcula `p = calcularPrecio(c.precioHora, nH)`.
  - Agrega una línea `{ canchaId: b.ronda ? "R" + b.ronda + "-" + c.id : b.fecha + "-" + c.id, ronda: b.ronda || null, nombreRonda: b.nombreRonda || null, fecha: b.fecha || null, nombre: b.nombreRonda ? b.nombreRonda + " · " + c.nombre : c.nombre, deporte: c.deporte, ...p }`.
  - Suma `subtotal`, `total`, `ahorro`, `packsAgua` (líneas con `aguaGratis === true`) y `nHoras` (suma de horas de los bloques).
- Añade pruebas unitarias en `src/lib/precios.test.js` verificando el cobro por canchas efectivas (`3 + 2 + 1` en 8 equipos con 3 canchas) y el descuento por jornada de 2+ horas.

### 3. `src/lib/codigoReserva.js`

- En `textoQr`: si `torneo && Array.isArray(torneo.jornadas) && torneo.jornadas.length > 0`, añade una línea por cada jornada con formato:
  `Fase ${j.nombreRonda}: ${j.fecha} (${j.horas[0]} a ${finDeFranja(j.horas[j.horas.length - 1])})`.

### 4. `src/context/ReservasContext.jsx`

- Actualiza `horaDeEvento(state, canchaId, fecha, hora)` para que devuelva `true` tanto si la reserva de evento coincide por `{ fecha, canchaIds, horas }` como si tiene `Array.isArray(r.bloques)` con algún bloque `b` donde `b.fecha === fecha && Array.isArray(b.canchaIds) && b.canchaIds.includes(canchaId) && Array.isArray(b.horas) && b.horas.includes(hora)`.
- En `RESERVAR_EVENTO` y `reservarEvento`:
  - Si `datos.bloques` es un arreglo no vacío:
    - Valida que cada bloque tenga `fecha`, `canchaIds.length > 0` y `horas.length > 0`.
    - Comprueba que todas las celdas `(cid, b.fecha, h)` estén libres con `horaLibre(state, cid, b.fecha, h)` y que dos bloques distintos del mismo evento no repitan la misma celda `${cid}__${b.fecha}__${h}`.
    - Si hay conflicto, no modifica `ocupados` y retorna error `'Alguna cancha u horario del evento ya no está disponible. No se reservó nada.'`.
    - Si todo está libre, marca en `ocupados[cid][b.fecha]` las horas de cada bloque para las canchas de ese bloque (`b.canchaIds`), calcula el precio con `calcularPrecioJornadas(bloques, state.canchas)` y guarda `bloques` en el objeto `evento` (manteniendo también `fecha: bloques[0].fecha`, `canchaIds`, `canchaNombres` y `horas: bloques[0].horas` para compatibilidad con lectores existentes).
  - Si no viene `bloques`, mantiene exactamente el flujo actual para cumpleaños y eventos de un solo bloque.

### 5. `src/components/reservas/useReserva.js`

- Añade el estado `jornadas` inicializado para las fases del torneo actual (`4`, `8` o `16` equipos):
  `{ 1: { fecha: dias[0], horas: [] }, 2: { fecha: dias[0], horas: [] }, ... }`.
- Cuando cambie `equipos` (`cambiarEquiposTorneo`) o en `reiniciar`, sincroniza las claves de `jornadas` para que existan todas las rondas de `partidosPorRonda(equipos)` (conservando las fechas/horas ya elegidas si la ronda sigue existiendo, o reiniciándolas en `reiniciar`).
- Mantén además compatibilidad con `elegirHora(hora)` y `cambiarFecha(iso)`:
  - Si el usuario o un test llama a `cambiarFecha(iso)`, actualiza `fecha` y también actualiza la fecha de las jornadas que aún no tengan horas seleccionadas (o la jornada 1).
  - Si en `modo === 'torneo'` todas las jornadas tienen `horas: []` pero `horasSel.length > 0` (por ejemplo si alguien usó `elegirHora` directamente), usa ` { fecha, horas: horasSel } ` como fallback o permite tanto seleccionar por fase (`elegirHoraFase(ronda, hora)`, `cambiarFechaFase(ronda, iso)`) como con los ayudantes expuestos:
    - `cambiarFechaFase(ronda, iso)`
    - `elegirHoraFase(ronda, hora)`
    - `esLibreFase(ronda, hora)`: verifica que `hora` esté libre en `jornadas[ronda].fecha` para todas las canchas efectivas de esa ronda (`fase.canchaIds`) y que otra ronda `otraRonda !== ronda` con la misma `fecha` y alguna cancha en común no tenga ya seleccionada esa `hora`.
    - `contarLibresFase(ronda)`: devuelve `(iso) => number` con la cantidad de horas disponibles ese día en las canchas efectivas de esa fase.
- En `torneoPlan`:
  - Calcula `fases = fasesDelTorneo({ equipos: Number(equipos), canchaIds, minutosTurno })`.
  - Calcula `validacionesJornadas = validarJornadas(fases, jornadasEfectivas)`.
  - Calcula `sugerenciasPorFase` usando `sugerenciasTiempoFase`.
  - Calcula `bloques` a partir de `fases` y `jornadasEfectivas`.
  - Pasa `jornadas: jornadasEfectivas` a `programarTorneo`.
  - Incluye `fases`, `jornadas: jornadasEfectivas`, `validacionesJornadas`, `sugerenciasPorFase` y `bloques` en `torneoPlan`.
- En `precio`:
  - Si `modo === 'torneo'`, usa `calcularPrecioJornadas(torneoPlan.bloques, canchas)`.
- En `motivoBloqueo`:
  - En `modo === 'torneo'`, tras validar `errorCanchas`, `OPCIONES_EQUIPOS` y `errorCruces`, revisa `torneoPlan.validacionesJornadas`: si alguna tiene `error`, devuelve ese `error`. Luego valida `errNombre` y `errTelefono`.

## Verificación al terminar

- Ejecuta `npx vitest run src/lib/torneo.test.js src/lib/precios.test.js src/lib/codigoReserva.test.js` y verifica que todas las pruebas pasen.
- Ejecuta `npm run lint` y verifica 0 errores.
- **Bitácora del bloque:** Al terminar, agrega una sección `### Bloque t1-dominio-jornadas` al final de `planificacion/etapas/5-torneo-multidia/REPORTE.md` detallando qué archivos modificaste, qué funciones añadiste/actualizaste y el resultado de las pruebas y el linter.

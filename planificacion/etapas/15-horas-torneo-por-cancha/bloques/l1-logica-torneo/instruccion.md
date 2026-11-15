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

# [MODO EJECUTOR] Bloque l1-logica-torneo (etapa 15)

Lee también `planificacion/etapas/15-horas-torneo-por-cancha/PLAN.md`
(decisiones 1, 4, 5, 7 y 8) y `docs/agentes/torneo.md`.

## Objetivo
Pasar la lógica pura del torneo a **horas por cancha**: cada fase tiene una
fecha y, por cada cancha del torneo, su propia lista de horas, que pueden ir
salteadas. Este bloque solo toca lógica pura y sus pruebas. La interfaz
(`useReserva.js`, componentes) y `ReservasContext.jsx` son de bloques
posteriores: **no los toques aunque dejen de compilar sus pruebas**; anota en
tu respuesta qué llamadas de esos archivos quedan desalineadas con el nuevo
contrato.

## Rutas permitidas
- `src/lib/torneo.js` y `src/lib/torneo.test.js`
- `src/lib/pasosTorneo.js` y `src/lib/pasosTorneo.test.js`
- `src/lib/codigoReserva.js` y su test (`src/lib/codigoReserva.test.js`)

Prohibido todo lo demás (`src/components/`, `src/context/`, `api/`,
`docs/`, `AGENTS.md`, `src/lib/precios.js`, `src/lib/horarios.js`). No hagas
commits ni cambies de rama.

## Contrato nuevo (firmas exactas)

Las horas son cadenas `"HH:MM"` en punto (`"16:00"`). Dos horas son
**seguidas** si la segunda es `sumarMinutos(primera, 60)`.

```js
// jornadas[ronda] = { fecha: 'YYYY-MM-DD', horasPorCancha: { [canchaId]: ['16:00', '18:00'] } }
```

1. `horasDeJornada(j)` → lista plana, sin repetidos y ordenada, de todas las
   horas de la jornada en cualquier cancha. Tolera `j` nulo o sin
   `horasPorCancha` (devuelve `[]`). Ignora canchas con lista vacía.

2. `turnosDeCancha(horas, minutosTurno)` → `string[]` con la hora de inicio de
   cada turno posible en una cancha. Ordena las horas, las parte en **tramos
   de horas seguidas** y en cada tramo caben
   `Math.floor(horasDelTramo * 60 / minutosTurno)` turnos, que empiezan en el
   inicio del tramo y se suceden cada `minutosTurno`. Un turno nunca cruza un
   hueco. Ejemplos exactos:
   - `['16:00']`, 35 → `['16:00']` (60/35 = 1, no 2).
   - `['16:00','17:00']`, 35 → `['16:00','16:35','17:10']`.
   - `['16:00']`, 30 → `['16:00','16:30']` (límite exacto 60/30 = 2).
   - `['16:00','18:00']`, 25 → `['16:00','16:25','18:00','18:25']`.
   - Horas desordenadas o repetidas se normalizan; `[]` → `[]`.

3. `turnosDeFase(horasPorCancha, minutosTurno, ordenCanchas = [])` →
   `Array<{ canchaId, inicio }>` con todos los turnos de todas las canchas,
   ordenados por `inicio` y, a igual hora, por la posición de la cancha en
   `ordenCanchas` (las que no estén ahí van al final, por id).

4. `capacidadFase(horasPorCancha, minutosTurno)` → número total de turnos
   (largo de `turnosDeFase`).

5. `fasesDelTorneo({ equipos, canchaIds, minutosTurno })`: misma salida que
   hoy, más `minutosTurno`, pero `canchaIds` de cada fase pasa a ser **todas**
   las canchas del torneo (cualquiera sirve en cualquier fase).
   `canchasEfectivas`, `turnos`, `minutosRequeridos` y `horasMinimas` siguen
   siendo el mínimo ideal con `min(canchas, partidos)` canchas en paralelo (lo
   usan las sugerencias y la cascada de fechas).

6. `validarJornadas(fases, jornadas)`: misma forma de salida por fase
   (`ronda, nombreRonda, completa, alcanza, ordenValido, disponibles, deficit,
   error`) más `turnosDisponibles` y `partidosSinUbicar`.
   - Incompleta si no hay `fecha` o `horasDeJornada(j)` está vacía: mismo
     mensaje de hoy.
   - `turnosDisponibles = capacidadFase(j.horasPorCancha, fase.minutosTurno)`;
     `partidosSinUbicar = max(0, fase.partidos - turnosDisponibles)`;
     `alcanza = partidosSinUbicar === 0`;
     `disponibles = turnosDisponibles * minutosTurno`;
     `deficit = partidosSinUbicar * minutosTurno`.
     Si `fase.minutosTurno` no viene, se deduce como
     `fase.minutosRequeridos / fase.turnos` (y si no se puede, 30).
   - Orden: la fase **empieza** en su hora más temprana en cualquier cancha y
     **termina** en `sumarMinutos(horaMásTardía, 60)` en cualquier cancha.
     Regla igual a la de hoy: válida si no hay fase previa, si su fecha es
     posterior, o si es el mismo día y `inicio >= finPrevio`. Mismo texto de
     error de orden que hoy.
   - Texto si no alcanza:
     `Las horas de ${nombreRonda} no alcanzan: faltan ${k} ${k === 1 ? 'partido' : 'partidos'} por ubicar.`
   - El orden se revisa antes que la capacidad (como hoy).

7. `sugerenciasTiempoFase({ fase, canchasTotales, duracionPartido, deporte, horasPorCancha })`:
   devuelve `[]` si `capacidadFase` alcanza para `fase.partidos`. Si no, la
   primera sugerencia es
   `Marca más horas en ${fase.nombreRonda}: faltan turnos para ${k} ${k === 1 ? 'partido' : 'partidos'}.`
   y se conservan las de "Agrega más canchas" y "Reduce la duración" con la
   misma lógica que hoy.

8. `programarTorneo({ orden, canchaIds, horaInicio, minutosTurno, jornadas })`:
   - Sin `jornadas`: comportamiento actual intacto.
   - Con `jornadas`: por cada fase, `turnos = turnosDeFase(j.horasPorCancha, minutosTurno, canchaIds)`.
     El partido `i` (0-based) de la fase toma `turnos[i]`: `canchaId` e
     `inicio` de ese turno, `fecha` de la jornada. Si no hay turno para él,
     `canchaId: null` e `inicio: null`. `turno` = posición 1-based del
     `inicio` entre los inicios distintos asignados en esa fase (dos partidos
     a la misma hora en canchas distintas comparten `turno`; sin inicio,
     `turno: null`). Local/visitante y los ids `R{ronda}-P{n}` no cambian.

9. `horasSinPartido(horasPorCancha, minutosTurno, partidos, ordenCanchas = [])` →
   `Array<{ canchaId, hora }>` ordenado por hora y cancha: las horas
   marcadas en las que no cae ningún partido. Se asignan los primeros
   `partidos` turnos de `turnosDeFase`; una hora `h` de la cancha `c` está
   usada si algún turno asignado de `c` se solapa con `[h, h+60)`
   (`inicio < h+60` y `inicio + minutosTurno > h`).
   - Final de 20 min de fútbol (turno 30), 1 partido, cancha `futbol-1` con
     `16:00..20:00` (5 horas) → 4 horas sin partido (`17:00` a `20:00`).
   - Con solo `16:00` → `[]`.
   - Turno 35 con `16:00` y `17:00` y 2 partidos: el segundo va
     `16:35-17:10` y usa la hora `17:00` → `[]`.

10. `mensajeHorasSinPartido({ nombreRonda, partidos, duracionPartido, horasElegidas, sinPartido })` →
    `La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.`
    Plurales correctos (`1 partido`/`2 partidos`, `1 hora`/`2 horas`), y la
    concordancia: `quedaría` con 1, `quedarían` con más. Con
    `sinPartido === 0` devuelve `''`. El artículo: "La Final", "La
    Semifinal", "Los Cuartos de final", "Los Octavos de final" (para otras
    rondas, sin artículo). Si es "Los ...", el verbo es "son" (`Los Cuartos de
    final son 4 partidos de 20 min...`).

11. `limpiarJornadasConChoque(jornadas, esHoraLibre)` donde
    `esHoraLibre(ronda, canchaId, hora)` → `{ jornadas, huboChoque, quitadas }`.
    Quita **solo** las horas no libres de esa cancha en esa fase (deja las
    demás intactas, incluida la fecha); `quitadas` es
    `Array<{ ronda, canchaId, hora }>`. No muta la entrada.

12. `armarTorneo(...)`: en `jornadasResumen`, por fase:
    `horasPorCancha` (copia, sin canchas vacías), `horas` = `horasDeJornada`,
    `canchaIds` = canchas con horas en esa fase (en el orden del torneo), y
    los campos que ya tenía (`ronda, nombreRonda, fecha, canchasEfectivas,
    partidos, turnos, minutosRequeridos`).

13. Elimina lo que quede muerto por el cambio (por ejemplo `validarFranja` si
    nadie lo usa en tus rutas ni en el resto del repo; búscalo con grep antes
    de borrar, y si algo fuera de tus rutas lo usa, déjalo).

## `pasosTorneo.js`
Paso "fechas": una fase cuenta con horario si `horasDeJornada(j).length > 0`
(importa `horasDeJornada` de `./torneo.js`). Lo demás igual.

## `codigoReserva.js` (`textoQr`)
Hoy escribe `Fase X: fecha (inicio a fin)`. Si la jornada trae
`horasPorCancha`, escribe una línea por fase y las horas por cancha, por
ejemplo `Fase Cuartos de final: 2026-11-21 · futbol-1: 16:00, 18:00 · futbol-2: 19:00`
(usa el id de la cancha si no hay otro dato). Si solo trae `horas` (reservas
viejas), deja el formato de hoy.

## Pruebas (valores exactos; nada de `toThrow()` a secas ni try/catch sin aserción)
Actualiza las pruebas existentes al contrato nuevo y agrega, como mínimo:
- Los cinco ejemplos de `turnosDeCancha` del punto 2.
- Capacidad: 4 partidos en 2 canchas, turno 25, `futbol-1: ['16:00','18:00']`,
  `futbol-2: ['19:00']` → `capacidadFase` 6, alcanza.
- Orden: semifinal que empieza a la hora exacta en que termina la última hora
  de cuartos en otra cancha → válida; un minuto antes (usa horas tipo
  `"16:59"` solo en esta prueba si hace falta, o un caso equivalente con la
  misma regla) → inválida; cuartos el día 2 y semifinal el día 1 → inválida.
  Revisa también una fase cuyo inicio está en la **segunda** cancha.
- `programarTorneo`: con el caso de capacidad, el **segundo** partido de
  cuartos va en `futbol-1` a las `16:25` y el **último** (4.º) en `futbol-1`
  a las `18:25`; ninguno cruza un hueco; la final en la cancha 2 cuando solo
  la cancha 2 tiene horas.
- `horasSinPartido` y `mensajeHorasSinPartido` con los ejemplos dados, más
  "Los Cuartos de final son 4 partidos…" y un caso con 1 hora sin partido
  (`quedaría`).
- `limpiarJornadasConChoque`: quita solo la hora ocupada de la segunda
  cancha y deja la primera cancha y la fecha; repetirla sobre el resultado no
  quita nada más (`huboChoque: false`).
- `pasosTorneo`: el paso Fechas se completa con horas solo en la segunda
  cancha.
- `textoQr` con `horasPorCancha` y con una reserva vieja.

## Verificación (obligatoria; anótala en tu respuesta)
1. `npx vitest run src/lib` en verde.
2. Mutaciones (restaura el código después): quitar el corte por tramos (usar
   `horas.length * 60 / minutosTurno`) → falla alguna prueba; quitar la regla
   de orden → falla alguna; asignar partidos sin ordenar por hora → falla
   alguna.
3. `npm run lint` con 0 warnings **en tus archivos** (si fallan otros por el
   contrato nuevo, anótalo, no los arregles).
4. `git status`: cambios solo en tus rutas.

Responde con los archivos cambiados, el número de pruebas de `src/lib`, el
resultado de cada mutación y la lista de llamadas fuera de tus rutas que
quedan desalineadas (archivo:línea).

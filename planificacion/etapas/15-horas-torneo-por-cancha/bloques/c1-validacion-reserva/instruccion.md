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

# [MODO EJECUTOR] Bloque c1-validacion-reserva (etapa 15)

Lee también `planificacion/etapas/15-horas-torneo-por-cancha/PLAN.md`
(decisiones 2, 3 y 9), `docs/agentes/reservas.md` y `docs/agentes/torneo.md`.
El bloque anterior (l1) ya cambió `src/lib/torneo.js`: `jornadas[ronda]` es
`{ fecha, horasPorCancha: { [canchaId]: [horas] } }` y `validarJornadas`
calcula el inicio de una fase con su hora más temprana en cualquier cancha y
el fin con `sumarMinutos(horaMásTardía, 60)`. Léelo antes de empezar y úsalo;
no lo modifiques.

## Objetivo
Que `ReservasContext` acepte y valide las reservas de torneo con **un bloque
por par (fase, cancha)** y horas salteadas, sin romper las reservas viejas
(un bloque por fase con varias canchas y horas seguidas) ni el cumpleaños.

## Rutas permitidas
- `src/context/ReservasContext.jsx` y `src/context/ReservasContext.test.jsx`
- `src/lib/precios.js` y `src/lib/precios.test.js`

Prohibido todo lo demás (`src/lib/torneo.js`, `src/components/`, `api/`,
`docs/`, `AGENTS.md`). Nunca accedas a `localStorage` fuera de
`ReservasContext.jsx`. No hagas commits ni cambies de rama.

## Formato de los bloques (contrato)
```js
// Nuevo: uno por (fase, cancha)
{ ronda: 1, nombreRonda: 'Cuartos de final', fecha: '2026-11-21', canchaIds: ['padel-1'], horas: ['16:00', '18:00'] }
// Viejo (debe seguir valiendo): uno por fase con varias canchas
{ ronda: 1, nombreRonda: 'Cuartos de final', fecha: '2026-11-21', canchaIds: ['padel-1', 'padel-2'], horas: ['16:00', '17:00'] }
```
Si un bloque no trae `ronda` (reservas muy viejas), usa su posición
(`idx + 1`), como hoy.

## Cambios en `validarReservaEvento` (rama con `bloques`)
1. Se mantiene el chequeo de bloques completos (`fecha`, `canchaIds` y
   `horas` no vacíos) con `ERROR_EVENTO_NO_DISPONIBLE`.
2. **Agrupar por `ronda`**, no por índice:
   - Fases ordenadas por número de ronda:
     `{ ronda, nombreRonda, partidos: 0, turnos: 1, minutosTurno: 60, minutosRequeridos: 0 }`
     (con `partidos: 0` la capacidad no se revisa aquí; solo el orden).
   - `jornadas[ronda] = { fecha, horasPorCancha }`, uniendo las horas de cada
     cancha de todos los bloques de esa ronda.
   - Si dos bloques de la misma ronda tienen fechas distintas, rechaza con la
     constante nueva exportada
     `ERROR_EVENTO_FECHA_FASE = 'Todas las canchas de una fase deben jugarse el mismo día. No se reservó nada.'`
   - El orden entre fases usa `validarJornadas` de `torneo.js` (devuelve su
     `error` cuando `ordenValido` es falso), igual que hoy.
3. **En torneos ya no se exigen horas seguidas.** Quita ese chequeo de la rama
   con bloques. Cada hora debe existir en `cancha.horas` (horario base de la
   cancha) y la cancha debe existir; si no, `ERROR_EVENTO_NO_DISPONIBLE`.
4. Se mantienen: celda (cancha, fecha, hora) libre (`horaLibre`) y sin
   repetirse entre bloques (`ERROR_EVENTO_NO_DISPONIBLE`), y el todo o nada.
5. La rama sin bloques (cumpleaños) **no cambia**: sigue exigiendo horas
   seguidas con `ERROR_EVENTO_HORAS_NO_SEGUIDAS`.
6. El reducer `RESERVAR_EVENTO` ya marca ocupadas las horas por bloque y
   cancha: revisa que siga bien con bloques por cancha y que `canchaIds` y
   `canchaNombres` del evento no repitan canchas.

## Cambios en `precios.js` (`calcularPrecioJornadas`)
- Una línea por par (ronda, cancha): si llegan dos bloques con la misma ronda
  y la misma cancha, se suman sus horas (sin repetir) en una sola línea. Una
  reserva vieja con un bloque de varias canchas da una línea por cancha, como
  hoy.
- Descuento desde `MIN_HORAS_BENEFICIO` horas de esa cancha en esa fase,
  **aunque no sean seguidas** (usa `calcularPrecio`). Ajusta el comentario de
  cabecera que habla de "horas seguidas" para que diga que en torneos cuenta
  por cancha y fase.
- Las claves de línea (`canchaId: R{ronda}-{id}`) y el resto de la salida no
  cambian de forma.

## Pruebas (valores exactos; error exacto en cada rechazo; nada de `toThrow()` a secas)
En `ReservasContext.test.jsx` (usa el reducer o `reservarEvento`, como las
pruebas existentes; pon fechas futuras de la ventana y horas libres de la
semilla):
- Acepta cuartos con `padel-1: 16:00, 18:00` y `padel-2: 19:00` (dos bloques
  de ronda 1) y semifinal en otra ronda después: `ok: true`; las cinco celdas
  quedan ocupadas y ninguna otra.
- Rechaza una semifinal que empieza antes del cierre de la última hora de
  cuartos en **la segunda** cancha (mensaje exacto de `validarJornadas`), y
  acepta la que empieza justo en ese cierre (límite exacto).
- Rechaza fases con fechas distintas en la misma ronda
  (`ERROR_EVENTO_FECHA_FASE`).
- Rechaza una celda ocupada en el **último** bloque y una celda repetida
  entre dos bloques (`ERROR_EVENTO_NO_DISPONIBLE`), sin ocupar nada.
- Rechaza una hora que no existe en el horario de la cancha.
- Reserva vieja (un bloque por fase con dos canchas y horas seguidas): se
  acepta igual.
- Cumpleaños con horas salteadas sigue rechazado con
  `ERROR_EVENTO_HORAS_NO_SEGUIDAS`.
- Repetir la misma reserva de torneo dos veces: la segunda se rechaza y no
  duplica la reserva.
En `precios.test.js`:
- 2 horas salteadas en una cancha y fase → descuento (`$60.000` × 2 en pádel,
  `ahorro` 10.000); 1 hora → sin descuento.
- Dos bloques de la misma ronda y cancha se unen en una línea.
- Reserva vieja de dos canchas da dos líneas.

## Verificación (obligatoria; anótala en tu respuesta)
1. `npx vitest run src/context src/lib` en verde (si fallan pruebas fuera de
   tus rutas por el contrato nuevo, anótalas con archivo:prueba, no las
   arregles).
2. Mutaciones (restaura el código después): agrupar otra vez por índice de
   bloque → falla alguna prueba; volver a exigir horas seguidas en torneos →
   falla alguna; quitar el chequeo de celda repetida → falla alguna.
3. `npm run lint` con 0 warnings en tus archivos.
4. `git status`: cambios solo en tus rutas. Si `npm test` deja modificado
   `api/_lib/__snapshots__/instrucciones.test.js.snap` solo por fin de línea,
   restáuralo con `git checkout -- <archivo>`.

Responde con los archivos cambiados, el número de pruebas y el resultado de
cada mutación.

# Etapa 15: horas del torneo por cancha y aviso de horas de más

Estado: **Aprobado** por Juan el 15-11-2026.
Rama: `feat/horas-torneo-por-cancha` (desde `main`, `1ad7242`).
Responsable: Juan Fierro.

## Qué se pidió y qué hay hoy

Juan pidió dos cambios en el modo torneo. Un tercero (rediseñar la animación de
GSAP) va en otra etapa.

1. **Horas libres por cancha.** En una fase, cada cancha puede tener sus propias
   horas, salteadas: por ejemplo, en cuartos la cancha 1 a las 4 y las 6 p. m. y
   la cancha 2 a las 7 p. m. Se mantiene que una fase no empieza antes de que
   termine la anterior.
2. **Aviso de horas de más.** Si la final es un partido de 20 min y el usuario
   elige 5 horas, avisarle y pedirle confirmación antes de reservar horas que no
   se usan.

Hoy:

| Pieza | Comportamiento actual |
| --- | --- |
| `useReserva.js:505-557` (`elegirHoraFase`) | Usa `seleccionarRango` (`src/lib/horarios.js:45`): primer toque = inicio, segundo = fin; solo rangos seguidos |
| `jornadas[ronda]` | `{ fecha, horas }`: **una** lista de horas para todas las canchas de la fase |
| `fasesDelTorneo` (`torneo.js:118`) | Cada fase usa las primeras `min(canchas, partidos)` canchas: la final siempre va en la primera |
| `validarFranja` / `validarJornadas` (`torneo.js:108-191`) | Capacidad = `horas × 60 ≥ turnos × minutosTurno`; orden: inicio de la fase ≥ fin de la anterior |
| `programarTorneo` (`torneo.js:356`) | Partidos uno tras otro desde `horas[0]`, sin saltos |
| `ReservasContext.jsx:208-275` | Cada bloque `{ ronda, fecha, canchaIds, horas }` debe tener horas seguidas (`ERROR_EVENTO_HORAS_NO_SEGUIDAS`); el orden se valida tomando el índice del bloque como ronda |
| `calcularPrecioJornadas` (`precios.js:77`) | Precio por bloque y cancha; descuento desde 2 horas |
| `CalendarioTorneo.jsx:139` | Texto "toca la hora de inicio y luego la hora final" |
| `api/_lib/instrucciones.js:72` | El chat explica torneos con "horas seguidas en cada bloque" |
| `docs/agentes/torneo.md:10` | "se limpia la franja entera de esa fase, nunca solo esa hora (dejaría un hueco)" |

## Decisiones y su porqué

1. **Modelo:** `jornadas[ronda] = { fecha, horasPorCancha: { [canchaId]: [horas] } }`.
   Una sola fecha por fase (todas las canchas de la fase el mismo día). Se
   pueden usar cualquiera de las canchas elegidas para el torneo, no solo las
   primeras. Así, la final puede ir en la cancha 2.
2. **Formato guardado compatible:** al reservar se arma un bloque por cada par
   fase y cancha con horas: `{ ronda, nombreRonda, fecha, canchaIds: [id], horas }`.
   Es la misma forma de hoy, así que las reservas ya guardadas en el navegador
   siguen siendo válidas y no hace falta migrar `localStorage`.
3. **Validación en `ReservasContext`:**
   - En torneos (bloques), las horas ya no tienen que ser seguidas.
   - El orden se valida agrupando por `b.ronda`, no por el índice del bloque.
   - Una fase empieza en su primera hora (de cualquier cancha) y termina al cierre
     de su última hora; la siguiente fase debe empezar después.
   - Se mantienen el todo o nada y el rechazo de celdas repetidas u ocupadas.
   - Cumpleaños (sin bloques) sigue exigiendo horas seguidas.
4. **Capacidad real con huecos:**
   - Un partido no puede quedar partido entre dos horas que no son seguidas.
   - Por cancha, cada tramo de horas seguidas da `floor(minutos del tramo / minutosTurno)` turnos.
   - La fase alcanza si la suma de turnos de sus canchas ≥ partidos de la fase.
   - El mensaje de faltante dice cuántos partidos faltan por ubicar.
5. **Programación (`programarTorneo`):**
   - Arma los turnos posibles (cancha, hora de inicio) de cada fase.
   - Los ordena por hora y luego por cancha.
   - Asigna los partidos en ese orden. El bracket y el calendario muestran cancha y hora reales.
6. **Selección:** un toque marca o desmarca una sola hora de una cancha (sin
   rangos). En el panel de cada fase hay una fila de horas por cancha del torneo.
   Se cambia el texto de ayuda.
7. **Horas sin partido:**
   - Son las horas elegidas donde, tras programar, no cae ningún partido.
   - En el panel de la fase se muestra un aviso, por ejemplo: "La Final es 1
     partido de 20 min: con 1 hora basta. Elegiste 5; 4 quedarían sin partido."
   - Al pulsar **Reservar**, si alguna fase tiene horas sin partido, sale un
     diálogo propio (no `window.confirm`) con el detalle por fase y dos botones:
     "Revisar horas" (vuelve a la fase) y "Reservar igual".
8. **Limpieza por choque:** si una hora deja de estar libre, se quita solo esa
   hora de esa cancha, con aviso. Ya no hace falta borrar la franja entera,
   porque ahora se aceptan huecos.
9. **Precio:** se mantiene el cobro por fase y cancha con la regla actual de
   descuento (desde 2 horas de esa cancha en esa fase), aunque no sean seguidas.
   Solo se cobra lo que se marca en cada cancha: hoy, en cambio, la franja de
   la fase se reserva y se cobra en todas sus canchas.
   Se ajusta el texto "por horas seguidas" en el comprobante del torneo y en las
   instrucciones del chat. La reserva individual de una cancha no cambia (1 a 3
   horas seguidas).
10. **Asistente móvil y "Mis reservas":** `pasosTorneo.js` (paso Fechas) y
    `PasoGuardados.jsx` pasan a leer `horasPorCancha` y los bloques por cancha.
    Las reservas viejas, con un bloque de varias canchas, se siguen mostrando.

## Bloques, rutas y olas

Es lógica de reglas de negocio con datos guardados (alto riesgo, casos (a) y
(b) del `CLAUDE.md` global): implementa Hydrogen `xhigh` y verifica Argon
`high`. Los bloques van en serie porque cada uno usa el contrato del anterior.

| Ola | Bloque | Agente | Objetivo | Rutas permitidas |
| --- | --- | --- | --- | --- |
| 1 | `l1-logica-torneo` | agy, Hydrogen `xhigh` | Decisiones 1, 4, 5 y 7 en lógica pura: `capacidadFase`, `validarJornadas` con `horasPorCancha`, `programarTorneo` por turnos reales, `horasSinPartido`, `limpiarJornadasConChoque` por hora | `src/lib/torneo.js`, `src/lib/pasosTorneo.js`, `src/lib/codigoReserva.js` (texto del QR) y sus tests |
| 2 | `c1-validacion-reserva` | agy, Hydrogen `xhigh` | Decisiones 2, 3 y 9: validación de bloques en `ReservasContext`, precio por bloque y cancha | `src/context/ReservasContext.jsx`, `src/lib/precios.js` y sus tests (`src/context/*.test.jsx`, `src/lib/precios.test.js`) |
| 3 | `u1-interfaz-torneo` | agy, Hydrogen `xhigh` | Decisiones 6, 7, 8 y 10: `useReserva` (`elegirHoraFase` por cancha y bloques), `CalendarioTorneo` (filas por cancha, aviso), diálogo de confirmación, `PasoGuardados`, `VoucherReserva`, textos | `src/components/reservas/` (y sus tests), `src/components/layout/MisReservas.jsx` |
| 4 | `v1-verificacion` | agy, Argon `high` | Verifica l1+c1+u1 contra este plan: lee el diff, intenta romperlo y prueba en la app headless | solo `planificacion/etapas/15-horas-torneo-por-cancha/revision/` |

El coordinador actualiza `api/_lib/instrucciones.js` (una línea) y su
snapshot, `docs/agentes/torneo.md`, `docs/agentes/reservas.md` y `AGENTS.md`.

## Verificación

### Automática (cada bloque y al cierre)
- `npm test`, `npm run lint` (0 warnings), `npm run build`.
- Casos de lógica, con valores exactos:
  - **Capacidad:**
    - 4 partidos en 2 canchas con turnos de 25 min y horas salteadas (4 y 6 p. m. en la cancha 1, 7 p. m. en la 2) da 6 turnos: alcanza.
    - Con una sola hora suelta de 60 min y turnos de 35 min caben 1 turno, no 2.
    - Dos horas seguidas de 35 min dan 3 turnos.
    - Límite exacto: 60 min / 30 min = 2 turnos.
  - **Orden:**
    - Una semifinal que empieza a la misma hora en que termina el último partido de cuartos (en otra cancha) es válida.
    - Si empieza un minuto antes, no.
    - Cuartos el día 2 y semifinal el día 1 se rechaza.
  - **Programación:** el **segundo** y el **último** partido caen en el turno y la cancha correctos. Ningún partido cruza un hueco.
  - **Horas sin partido:**
    - Final de 20 min con 5 horas: quedan 4 sin partido.
    - Con 1 hora: 0 sin partido.
  - **`ReservasContext`:**
    - Acepta horas salteadas en torneo.
    - Rechaza celdas ocupadas, celdas repetidas y orden invertido.
    - Sigue rechazando cumpleaños no seguidos.
    - Una reserva vieja (un bloque con varias canchas y horas seguidas) se carga y se valida igual.
  - **Precio:** 2 horas salteadas en una cancha dan descuento; 1 hora no.
- Mutación: al quitar la regla de tramos, la de orden y el diálogo, alguna prueba falla.

### En la app (headless con `npm run preview`, 390×844 y 1440×900; se cierra al terminar)
- Torneo de 8 equipos y 2 canchas, con cuartos a las 4 y 6 p. m. en la cancha 1 y a las 7 p. m. en la cancha 2:
  - se puede reservar;
  - el bracket muestra esas horas;
  - "Mis reservas" lo lista.
- Semifinal antes del fin de cuartos: error claro y no deja reservar.
- Final con 5 horas:
  - aparece el aviso;
  - "Revisar horas" vuelve a la fase;
  - "Reservar igual" reserva.
  - Repetir la reserva después no la duplica.
- Desmarcar el segundo y el último toque. Elegir la misma hora dos veces la desmarca.
- Una hora que otra reserva ocupa luego: se quita solo esa hora, con aviso.
- Cumpleaños y reserva individual sin cambios (horas seguidas).
- Teclado y lector: las horas de cada cancha son botones con `aria-pressed`. El
  diálogo atrapa el foco, Escape lo cierra y el foco vuelve a "Reservar".
- Sin desborde horizontal a 390 px con 3 canchas.

## Commits

1. `feat: horas por cancha y salteadas en las fases del torneo` (lógica)
2. `feat: validación de reservas de torneo con horas por cancha`
3. `feat: elegir horas por cancha y avisar horas sin partido en el torneo`
4. `docs: reglas de horas del torneo en la guía y el asistente`
5. `docs: plan, verificación y reporte de la etapa 15`

## Por aprobar

1. El plan, la rama y los cuatro bloques en serie (xhigh + verificación con Argon).
2. Una sola fecha por fase (todas sus canchas el mismo día). Si quieres fechas
   distintas por cancha dentro de una fase, se agranda el cambio.
3. Descuento desde 2 horas por cancha y fase aunque no sean seguidas (decisión 9).
4. Cumpleaños y reserva individual siguen con horas seguidas.
5. El rediseño de la animación GSAP va en una etapa aparte, después de esta.

# Tarea n2: "Elegir otro horario" en un torneo descartado conserva las horas que no chocaron (#61)

Lee antes `AGENTS.md` y `docs/agentes/torneo.md`.

## Contexto (rama `refactor/sincronizacion-64`, PR #80, que trae la #61)

Cuando una reserva confirmada en una pestaña que no pudo guardar choca con otra
pestaña, la confirmación cambia a "Tu reserva no pudo completarse" con el botón
"Elegir otro horario" (`elegirOtroHorario` en
`src/components/reservas/useReserva.js`, cerca de la línea 1385). En modo
torneo, `elegirOtroHorario` quita **solo** las horas que chocan
(`limpiarJornadasConChoque` con `esLibreFase`) y normaliza la cascada.

**El problema**, comprobado en la app real a 390 px (asistente móvil) con dos
pestañas:

1. La pestaña A (sin poder guardar) confirma un torneo en Pádel 1: Cuartos el
   2.º día a las 11:00 y 12:00, Semifinal el 3.er día a las 11:00 y Final el
   4.º día a las 11:00.
2. La pestaña B reserva Pádel 1, 2.º día, 11:00 (sí guarda).
3. A muestra el aviso bien (foco en el título, sin código ni QR) y "Elegir otro
   horario" vuelve al paso "Fechas por fase". Pero **todas** las horas de las
   fases quedaron vacías: Cuartos perdió también las 12:00 y Semifinal y Final
   perdieron las suyas, aunque no chocaban.

**La causa:** el efecto de `useReserva.js` cerca de la línea 915 (el que limpia
horas de fase que dejan de estar libres) corre también mientras se ve la
confirmación. Apenas se confirma el torneo, sus propias horas quedan ocupadas
en `disponibilidad`, el efecto las ve "no libres" y las borra todas. Cuando
llega el choque y se pulsa "Elegir otro horario", ya no queda nada que
conservar.

Se comprobó en la app que con este cambio queda bien: en el efecto, salir
temprano si hay una confirmación en pantalla
(`if (modo !== 'torneo' || confirmado) return;`) y agregar `confirmado` a sus
dependencias. Con eso, en el mismo escenario, Cuartos conserva las 12:00 (las
11:00 quedan deshabilitadas) y Semifinal y Final conservan sus horas. "Listo"
cierra la vista (`cerrarVista`), así que el camino exitoso no depende de ese
efecto.

## Qué hacer

1. Aplica ese cambio en el efecto (o uno equivalente que cumpla los criterios).
   No cambies `elegirOtroHorario`, `limpiarJornadasConChoque` ni
   `normalizarJornadasCascada` salvo que un criterio lo exija; si lo haces,
   explica por qué en tu resumen.
2. Pruebas que fallen sin el cambio y pasen con él (ver criterios). Usa como
   modelo el `describe('VistaCanchas — Confirmación descartada por choque (#61)')`
   de `src/components/canchas/VistaCanchas.test.jsx` (`despacharChoqueStorage`,
   `setItem` que lanza), y para el asistente móvil, cómo
   `src/components/reservas/torneo/AsistenteTorneo.test.jsx` simula
   `matchMedia` (restáuralo en `afterEach`, ver `AGENTS.md`).
3. Si `docs/agentes/torneo.md` o `docs/agentes/pagina-reserva.md` describen
   qué conserva "Elegir otro horario" en torneo, actualízalos.

## Rutas

- Permitidas: `src/components/reservas/useReserva.js`,
  `src/components/canchas/VistaCanchas.test.jsx`,
  `src/components/reservas/Torneo.test.jsx`,
  `src/components/reservas/torneo/AsistenteTorneo.test.jsx`,
  `docs/agentes/torneo.md`, `docs/agentes/pagina-reserva.md`.
- Prohibidas: todo lo demás, incluida `src/verificacion/` (es del verificador).

## Pruebas

Comando final: `npm test && npm run lint`.

Reglas (se revisan): cada prueba ejercita lo que dice su título; valores
exactos; un rechazo esperado se acota al error exacto; nada de `try/catch` sin
una aserción que falle si no se lanza.

## Criterios de aceptación

- C1: Torneo descartado (escritorio): con `setItem` fallando, se confirma un
  torneo con Cuartos el 2.º día a las 11:00 y 12:00, Semifinal el 3.er día a
  las 11:00 y Final el 4.º día a las 11:00 en Pádel 1; un `storage` externo
  ocupa Pádel 1, 2.º día, 11:00. Tras "Elegir otro horario": en Cuartos, 12:00
  sigue elegida (`aria-pressed="true"`) y 11:00 está deshabilitada y sin
  elegir; Semifinal conserva 11:00 del 3.er día y Final conserva 11:00 del 4.º
  día; nombre y teléfono se conservan.
- C2: El mismo escenario con el choque en la **última** fase (Final, 4.º día,
  11:00): Cuartos y Semifinal conservan todas sus horas y Final queda sin la
  hora que chocó.
- C3: El mismo escenario de C1 en el asistente móvil (`matchMedia` de móvil):
  "Elegir otro horario" lleva al paso "Fechas por fase" y se cumplen las mismas
  horas de C1.
- C4: El camino exitoso no cambia: al confirmar un torneo sin choque se ve
  "Reserva confirmada" con código y QR, sin mensaje de error en pantalla.
- C5: Sin confirmación en pantalla, el efecto sigue funcionando como antes: si
  otra pestaña ocupa una hora de fase ya elegida mientras se llena el
  formulario, esa hora se quita y aparece el aviso de siempre
  (`formatearAvisoChoqueJornadas`). Las pruebas existentes de ese caso pasan
  sin cambios.
- C6: Las pruebas nuevas de C1 y C2 fallan sin el cambio del efecto.
  Cómo comprobarlo: deshacer temporalmente el cambio de `useReserva.js`, correr
  las pruebas nuevas y volver a aplicarlo.
- C7: `npm test` completo pasa y `npm run lint` termina con 0 avisos; ninguna
  prueba existente cambió sus valores esperados.
- C8: Las pruebas nuevas cumplen las reglas de arriba.

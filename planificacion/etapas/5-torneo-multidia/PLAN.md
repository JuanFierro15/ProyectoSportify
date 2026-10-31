# Etapa 5 — Torneos multi-día por fases (jornadas)

Aprobado por Miguel Medina el 30-10-2026 (atendiendo observación del docente).

## Qué se pidió

Extender el **Modo Torneo** para que las distintas fases de eliminación directa
(**Octavos de final**, **Cuartos de final**, **Semifinal** y **Final**) puedan
programarse en **distintos días y horarios** dentro de la ventana de 7 días
(o varias fases en un mismo día respetando su orden cronológico), en lugar de
obligar a que todo el torneo ocurra en una única franja continua de un solo día.

Además, sincronizar con `origin/main` (donde la vista de reservas pasó de modal
a página propia en `/reservar/<deporte>` y se integró el PR #1) y verificar que
todo el Modo Torneo funcione en la nueva interfaz de página individual.

## Qué había

- `src/components/canchas/VistaCanchas.jsx`: página individual de reservas en
  `/reservar/<deporte>` con integración del Modo Torneo de un solo día (`PR #1`,
  commits `0b57856..f119ff4`).
- `src/lib/torneo.js` y `src/lib/torneo.test.js`: cálculo de partidos, rondas,
  turnos, desempates por deporte, validación de franja única y `programarTorneo`
  para un único bloque horario.
- `src/lib/precios.js` y `src/lib/precios.test.js`: `calcularPrecio` y
  `calcularPrecioEvento` para una sola franja de `nHoras`.
- `src/lib/codigoReserva.js`: `textoQr` con resumen básico del torneo.
- `src/context/ReservasContext.jsx`: `RESERVAR_EVENTO` y `reservarEvento` para
  una única `fecha`, `canchaIds` y `horas`.
- `src/components/reservas/useReserva.js`: estado de reserva con una sola
  `fecha` y `horasSel` para todos los modos.
- `src/components/reservas/torneo/{AlertaTiempo.jsx, AsignacionManual.jsx, Bracket.jsx, Bracket.css}`:
  componentes visuales de torneo para un solo día.
- `src/components/reservas/{FormularioReserva.jsx, VoucherReserva.jsx, ConfirmacionReserva.jsx, Torneo.test.jsx}`:
  integración de un solo día en el flujo de reserva.

## Decisiones

- **Jornadas por fase (`DD-011`):** cada fase del torneo (`Octavos de final`,
  `Cuartos de final`, `Semifinal`, `Final`) tiene su propio día (`fecha`) y su
  propia franja de horas consecutivas (`horas`). Varias fases pueden compartir
  el mismo día si el usuario lo desea.
- **Canchas efectivas por fase (`DD-012`):** el organizador elige las canchas
  base del torneo una sola vez ($C \in [1, 3]$ del mismo deporte), pero cada
  fase solo ocupa y cobra las canchas que realmente utiliza:
  $C_{\text{fase}} = \min(C, \text{partidosDeLaFase})$. Por ejemplo, con 8
  equipos y 3 canchas: Cuartos usa 3 canchas, Semifinal usa 2 canchas y Final
  usa 1 cancha.
- **Orden cronológico estricto entre fases (`DD-013`):** la fase $r+1$ no puede
  iniciar antes de que termine la fase $r$. Debe cumplirse
  $\text{fecha}_{r+1} > \text{fecha}_r$, o bien
  $\text{fecha}_{r+1} === \text{fecha}_r$ y
  $\text{horaInicio}_{r+1} \ge \text{horaFin}_r$.
- **Reserva única todo-o-nada (`DD-014`):** al confirmar el torneo se crea una
  sola reserva de evento con un único código `SPF-XXXXXX` y un único QR que
  agrupa todas las jornadas (`bloques: [{ ronda, nombreRonda, fecha, horas, canchaIds }]`).
  Si cualquier celda `(canchaId, fecha, hora)` de cualquier fase está ocupada
  o se solapa con otra fase del mismo torneo, no se reserva nada.
- **Precio por jornada (`AC-013`):** se suma cada jornada sobre sus canchas
  efectivas con `calcularPrecioJornadas(bloques, canchasCatalogo)`. El
  descuento de `$5.000/h` y el pack de agua gratis aplican por cancha en cada
  jornada que tenga 2 o más horas seguidas.

## Bloques y olas

- **Ola 1 — `t1-dominio-jornadas`**:
  - Archivos: `src/lib/torneo.js`, `src/lib/torneo.test.js`,
    `src/lib/precios.js`, `src/lib/precios.test.js`,
    `src/lib/codigoReserva.js`, `src/context/ReservasContext.jsx`,
    `src/components/reservas/useReserva.js`.
  - Qué hace: añade `fasesDelTorneo`, `validarJornadas`, `sugerenciasTiempoFase`
    y soporte de `jornadas` en `programarTorneo` y `armarTorneo`; agrega
    `calcularPrecioJornadas` en `precios.js`; extiende `textoQr` con las
    jornadas; soporta `bloques` multi-día todo-o-nada en `ReservasContext.jsx` y
    gestiona el estado `jornadas` por fase en `useReserva.js`.
- **Ola 2 — `t2-calendario-y-bracket`**:
  - Archivos: `src/components/reservas/torneo/CalendarioTorneo.jsx` (nuevo),
    `src/components/reservas/torneo/Bracket.jsx`,
    `src/components/reservas/torneo/Bracket.css`.
  - Qué hace: crea `CalendarioTorneo.jsx` para elegir día y franja horaria por
    cada fase con validación en vivo de tiempo y orden cronológico; actualiza
    `Bracket.jsx` y `Bracket.css` para mostrar la fecha corta de cada ronda y
    estilizar las tarjetas de fase.
- **Ola 3 — `t3-integracion-vistas-y-tests`**:
  - Archivos: `src/components/reservas/FormularioReserva.jsx`,
    `src/components/reservas/FormularioReserva.css`,
    `src/components/reservas/VoucherReserva.jsx`,
    `src/components/reservas/VoucherReserva.css`,
    `src/components/reservas/ConfirmacionReserva.jsx`,
    `src/components/reservas/ConfirmacionReserva.css`,
    `src/components/canchas/VistaCanchas.jsx`,
    `src/components/reservas/Torneo.test.jsx`.
  - Qué hace: integra `CalendarioTorneo` en `FormularioReserva` cuando el modo
    es `torneo` (ocultando el selector de día/hora único global en modo torneo),
    muestra el desglose de jornadas por fase en `VoucherReserva`,
    `ConfirmacionReserva` y `VistaCanchas`, y actualiza/amplía las pruebas de
    integración en `Torneo.test.jsx` (`AC-009` a `AC-014`).

## Verificación

- `npx vitest run` (todas las suites en verde, incluyendo `torneo.test.js`,
  `precios.test.js` y `Torneo.test.jsx`).
- `npm run lint` (0 errores y 0 warnings).
- `npm run build` (compilación de producción limpia).

## Commits previstos

1. `docs: registra etapa 5 de torneos multi-día en planificación`
2. `feat: soporta jornadas por fase en dominio, precios y contexto de torneos`
3. `feat: añade calendario por fases y fechas en el bracket de torneo`
4. `feat: integra programación multi-día de torneos en reserva, voucher y pruebas`

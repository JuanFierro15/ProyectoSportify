
# Tarea: integración de torneos multi-día en vistas de reserva, voucher, confirmación y pruebas (`t3-integracion-vistas-y-tests`)

## Objetivo

Integrar el calendario de torneos por fases (`CalendarioTorneo`) en
`FormularioReserva.jsx`, actualizar `VoucherReserva.jsx`,
`ConfirmacionReserva.jsx` y `VistaCanchas.jsx` para mostrar el desglose de
jornadas (fechas, horarios y canchas efectivas por fase), y actualizar/ampliar
la suite de pruebas de integración `src/components/reservas/Torneo.test.jsx`
para cubrir todos los criterios de aceptación (`AC-001` a `AC-014`).

## Rutas

- Modificar:
  - `src/components/reservas/FormularioReserva.jsx`
  - `src/components/reservas/FormularioReserva.css`
  - `src/components/reservas/VoucherReserva.jsx`
  - `src/components/reservas/VoucherReserva.css`
  - `src/components/reservas/ConfirmacionReserva.jsx`
  - `src/components/reservas/ConfirmacionReserva.css`
  - `src/components/canchas/VistaCanchas.jsx`
  - `src/components/reservas/Torneo.test.jsx`
- Leer (sin modificar):
  - `src/components/reservas/useReserva.js`
  - `src/components/reservas/torneo/CalendarioTorneo.jsx`
  - `src/components/reservas/torneo/Bracket.jsx`
  - `src/lib/torneo.js`
  - `src/lib/precios.js`
- Prohibido modificar cualquier otro archivo fuera de la lista "Modificar".

## Diseño detallado

### 1. `src/components/reservas/FormularioReserva.jsx` y `FormularioReserva.css`

- Cuando `reserva.modo !== 'torneo'`, renderiza los `<fieldset>` globales de
  **Día** y **Horario** exactamente igual que hoy (para `cancha` y `cumpleanos`).
- Cuando `reserva.modo === 'torneo'`:
  - No muestra el `<fieldset>` global único de Día/Horario arriba, sino que
    dentro de `<fieldset className="formulario-reserva__campo formulario-reserva__torneo">`
    (después de elegir cantidad de equipos, duración por partido y
    emparejamiento de 1.ª ronda) incluye una sección **"Programación por fases (días y horarios)"** con `<CalendarioTorneo />`:
    - Pasa `fases={reserva.torneoPlan?.fases || []}`,
      `jornadas={reserva.torneoPlan?.jornadas || {}}`,
      `validacionesJornadas={reserva.torneoPlan?.validacionesJornadas || []}`,
      `sugerenciasPorFase={reserva.torneoPlan?.sugerenciasPorFase || {}}`,
      `dias={dias}`, `horasBase={reserva.horasBase}`, `canchas={canchas}`,
      `canchaIds={reserva.canchaIds}`,
      `onCambiarFechaFase={reserva.cambiarFechaFase}`,
      `onElegirHoraFase={reserva.elegirHoraFase}`,
      `esLibreFase={reserva.esLibreFase}`,
      `contarLibresFase={reserva.contarLibresFase}`.
  - En la sección de **Capacidad y tiempo estimado**, muestra el resumen de
    canchas seleccionadas, turnos totales y tiempo estimado total, además del
    detalle por fase (ej. Cuartos: 3 canchas, Semifinal: 2 canchas, Final: 1 cancha).
  - En **Torneos reservados (`torneosGuardados`)**, si `t.torneo?.jornadas`
    existe, muestra el resumen de las fechas y horarios de sus fases además del
    `<Bracket compacto />`.

### 2. `src/components/reservas/VoucherReserva.jsx` y `VoucherReserva.css`

- Si `torneo` está presente y tiene `torneo.fases` / `torneo.jornadas`:
  - En la sección `.voucher-reserva__meta`, muestra las jornadas configuradas
    por fase (por ejemplo, para cada fase con horas elegidas:
    `Cuartos de final: sáb 31 oct · 14:00 a 15:00 (3 canchas)`).
  - Para determinar `sinSeleccion`: en modo torneo, hay selección cuando
    `lineas.length > 0` (al menos una fase tiene cancha y horas elegidas).
  - En `.voucher-reserva__lineas`, usa `l.nHoras` de cada línea (`${l.nHoras} h × ${formatoPrecio.format(l.precioHoraFinal)}`) para que funcione tanto cuando todas las líneas tienen el mismo `n` como cuando cada fase tiene su propio número de horas.

### 3. `src/components/reservas/ConfirmacionReserva.jsx` y `ConfirmacionReserva.css`

- Si `torneo?.jornadas` es un arreglo no vacío, muestra dentro de
  `.confirmacion-reserva__torneo` la lista de fases programadas con su fecha,
  horario y cantidad de canchas efectivas antes del `<Bracket compacto />`.

### 4. `src/components/canchas/VistaCanchas.jsx`

- Verifica que todas las props pasadas a `VoucherReserva`, `FormularioReserva`
  y `ConfirmacionReserva` funcionen con el modo torneo multi-día sin advertencias
  ni regresiones visuales.

### 5. `src/components/reservas/Torneo.test.jsx`

Actualiza y amplía las pruebas de integración para el flujo por fases:

1. **Configuración inicial, fases con canchas efectivas y bracket (`FR-002`, `FR-007`, `FR-008`, `AC-009`):**
   - Verifica botones de 4, 8 y 16 equipos, desempate por deporte, tarjetas de fase en `CalendarioTorneo` y que con 8 equipos y 3 canchas se indique que Cuartos usa 3 canchas, Semifinal 2 canchas y Final 1 cancha.
2. **Alerta de insuficiencia de tiempo en una fase y bloqueo (`AC-002`, `FR-006`):**
   - Con 8 equipos y 3 canchas, Cuartos de final requiere 60 min (1 h). Si se elige duración de 30 min por partido (`minutosTurno = 40`, Cuartos requiere `2 turnos * 40 = 80 min`) y solo se selecciona 1 hora (`14:00`) en Cuartos de final, aparece la alerta de déficit (`faltan 20 min`) y el botón `Confirmar reserva` permanece `disabled`.
3. **Validación de orden cronológico entre fases (`AC-010`, `AC-011`, `FR-011`):**
   - Verifica que si Semifinal se programa en un día anterior a Cuartos de final (o el mismo día pero en una hora anterior o solapada con Cuartos), se muestra la alerta de orden cronológico y se bloquea `Confirmar reserva`; y que al mover Semifinal a una hora posterior o a un día posterior se desbloquea.
4. **Emparejamiento manual y validación de equipos repetidos (`AC-006`, `FR-004`):**
   - Verifica que asignar el mismo equipo en dos posiciones muestra `'Hay equipos repetidos en los cruces.'` y bloquea la confirmación.
5. **Confirmación exitosa multi-día, cobro de canchas efectivas y persistencia (`AC-001`, `AC-012`, `AC-013`, `AC-014`):**
   - Programa Cuartos en el día 1 (`14:00`), Semifinal en el día 2 (`15:00`) y Final en el día 3 (`16:00`) con 3 canchas de fútbol (`$90.000/h`).
   - Verifica que el precio total en el voucher corresponde a `3 + 2 + 1 = 6` horas-cancha (`$540.000`) en vez de cobrar las 3 canchas en todas las fases.
   - Confirma la reserva y verifica que en `localStorage` se guardan los 3 bloques en distintos días, que en `ocupados` solo se bloquean 3 canchas el día 1, 2 canchas el día 2 y 1 cancha el día 3, y que al recargar se restaura el torneo con sus jornadas y bracket.

## Verificación al terminar

- Ejecuta `npx vitest run` y verifica que las 13 suites de prueba pasen al 100%.
- Ejecuta `npm run lint` y verifica 0 errores y 0 warnings.
- Ejecuta `npm run build` y verifica que el build de producción termine sin errores.
- **Bitácora del bloque:** Al terminar, agrega una sección `### Bloque t3-integracion-vistas-y-tests` y la sección final `## Verificación` en `planificacion/etapas/5-torneo-multidia/REPORTE.md` (está permitido editar este archivo además de los de tu bloque) detallando los cambios integrados en las vistas y el resultado de `npx vitest run`, `npm run lint` y `npm run build`.

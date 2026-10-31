# Reporte — Etapa 5 (Torneos multi-día por fases)

Fecha: 30-10-2026.

## Qué se hizo

Sincronización con `origin/main` (`d3d1646`) verificando el Modo Torneo en la
nueva interfaz de página individual (`VistaCanchas.jsx` en `/reservar/<deporte>`),
y extensión del Modo Torneo para programar las fases de eliminación directa
(**Octavos de final**, **Cuartos de final**, **Semifinal** y **Final**) en
distintos días y horarios dentro de la ventana de 7 días, cobrando y bloqueando
únicamente las canchas efectivas de cada fase y validando el orden cronológico
estricto entre fases.

## Bloques ejecutados

### Bloque t1-dominio-jornadas

- **Responsable:** Ingeniero de dominio, pruebas unitarias de lógica pura, persistencia en contexto y hook de estado (`useReserva`).
- **Archivos modificados:**
  - `src/lib/torneo.js`: Se añadieron las funciones `fasesDelTorneo`, `validarJornadas`, `sugerenciasTiempoFase`, y se extendieron `programarTorneo` y `armarTorneo` con soporte para el objeto `jornadas` por fase.
  - `src/lib/torneo.test.js`: Se incorporaron pruebas unitarias completas para `fasesDelTorneo` (`AC-009`), `validarJornadas` (`AC-010`, `AC-011`), `sugerenciasTiempoFase` y programación de torneos con `jornadas`.
  - `src/lib/precios.js`: Se añadió `calcularPrecioJornadas` (`AC-013`) para computar el costo exacto basado en las canchas efectivas por fase y aplicar el descuento de horas seguidas por bloque.
  - `src/lib/precios.test.js`: Se añadieron pruebas unitarias para `calcularPrecioJornadas` verificando el cobro por canchas efectivas (`3 + 2 + 1` en torneo de 8 equipos con 3 canchas) y los beneficios de agua y descuento.
  - `src/lib/codigoReserva.js`: Se extendió `textoQr` para incorporar el desglose detallado de cada jornada y franja horaria en reservas de torneos multi-fase.
  - `src/lib/codigoReserva.test.js`: Se añadieron pruebas unitarias verificando la inclusión de las líneas de fase en el texto del QR.
  - `src/context/ReservasContext.jsx`: Se actualizó `horaDeEvento` para contemplar reservas con `bloques` de jornadas; se adaptaron `RESERVAR_EVENTO` y `reservarEvento` para validar atómicamente la disponibilidad de todas las celdas multi-día y registrar la ocupación todo-o-nada.
  - `src/components/reservas/useReserva.js`: Se añadió el estado `jornadas` sincronizado por fase; se implementaron los métodos auxiliares `cambiarFechaFase`, `elegirHoraFase`, `esLibreFase`, `contarLibresFase`; se actualizaron `torneoPlan` (con `fases`, `validacionesJornadas`, `sugerenciasPorFase` y `bloques`), `precio` y `motivoBloqueo`, conservando compatibilidad para reservas de bloque único.
- **Resultado de pruebas:**
  - `npx vitest run src/lib/torneo.test.js src/lib/precios.test.js src/lib/codigoReserva.test.js`: 57 pruebas pasadas (3 archivos).
  - `npx vitest run src/lib/`: 165 pruebas pasadas (11 archivos).
- **Resultado de linter:**
  - `npm run lint`: 0 errores y 0 warnings.

### Bloque t2-calendario-y-bracket

- **Responsable:** Desarrollador de componentes visuales del Modo Torneo en `src/components/reservas/torneo/`.
- **Archivos creados:**
  - `src/components/reservas/torneo/CalendarioTorneo.jsx`: Nuevo componente de interfaz para programar cada fase del torneo multi-día (`Octavos de final`, `Cuartos de final`, `Semifinal`, `Final`), con selección de día (`SelectorDia`), selección de franja horaria (`horasBase`), desglose de canchas efectivas con nombres legibles (`tituloCancha`), tiempo requerido y alertas en vivo de suficiencia (`AlertaTiempo`) y orden cronológico estricto (`.calendario-torneo__alerta-orden`). Animado con GSAP respetando `prefers-reduced-motion`.
- **Archivos modificados:**
  - `src/components/reservas/torneo/Bracket.jsx`: Integración de fecha por ronda en `gruposRondas` (`fecha: lista[0]?.fecha || null`), formateo con fecha corta (`fechaCorta`), indicador visual de fecha con ícono `Calendar` (`.bracket-torneo__ronda-fecha`) en la cabecera de columna manteniendo el encabezado `<h4>` limpio para accesibilidad y tests, y animaciones de partidos con GSAP.
  - `src/components/reservas/torneo/Bracket.css`: Estilos de `.calendario-torneo`, `.calendario-torneo__fase`, `.calendario-torneo__cabecera`, `.calendario-torneo__titulo`, `.calendario-torneo__badges`, `.calendario-torneo__badge`, `.calendario-torneo__campo`, `.calendario-torneo__etiqueta`, `.calendario-torneo__alerta-orden` y `.bracket-torneo__ronda-fecha`, adaptados a los tokens `--accent`, `--accent-soft` del deporte activo y soporte de `prefers-reduced-motion: reduce`.
- **Resultado de linter:**
  - `npm run lint`: 0 errores y 0 warnings.

### Bloque t3-integracion-vistas-y-tests

- **Responsable:** Desarrollador de integración en vistas de reserva (`FormularioReserva.jsx/.css`, `VoucherReserva.jsx/.css`, `ConfirmacionReserva.jsx/.css`, `VistaCanchas.jsx/.css`) y pruebas de integración (`Torneo.test.jsx`).
- **Archivos modificados:**
  - `src/components/reservas/FormularioReserva.jsx`: Se condicionó la visualización del bloque global de día y horario (`fieldset` Día y Horario) exclusivamente a cuando `reserva.modo !== 'torneo'`; se integró `<CalendarioTorneo />` en la subsección "Programación por fases (días y horarios)"; se añadió el desglose de canchas efectivas por fase en la tarjeta de capacidad y tiempo estimado (`Cuartos: 3 canchas`, `Semifinal: 2 canchas`, `Final: 1 cancha`); se incorporó el resumen de jornadas de torneos confirmados en la sección inferior antes del bracket compacto.
  - `src/components/reservas/FormularioReserva.css`: Se agregaron clases para el desglose de fases en la tarjeta de capacidad (`.formulario-reserva__fases-detalle`, `.formulario-reserva__fases-titulo`, `.formulario-reserva__fases-pills`, `.formulario-reserva__fase-pill`), y para el resumen de jornadas en torneos guardados (`.formulario-reserva__torneo-guardado-jornadas`, `.formulario-reserva__torneo-guardado-jornada-item`).
  - `src/components/reservas/VoucherReserva.jsx`: Se adaptó la validación de `sinSeleccion` en Modo Torneo (`lineas.length === 0`); se añadió en los metadatos de cabecera (`.voucher-reserva__meta`) la lista de fases configuradas con su fecha corta, franja horaria y número de canchas efectivas (`Cuartos de final: sáb 31 oct · 14:00 a 15:00 (3 canchas)`); se adaptó el cálculo de cada línea del voucher para usar `l.nHoras` cuando esté disponible; y se conectó la persistencia de canchas efectivas y precio.
  - `src/components/reservas/VoucherReserva.css`: Se agregaron clases para la lista de fases en cabecera (`.voucher-reserva__jornadas`, `.voucher-reserva__fila--fase`, `.voucher-reserva__fase-item`, `.voucher-reserva__fase-bullet`).
  - `src/components/reservas/ConfirmacionReserva.jsx`: Se añadió el desglose ordenado de jornadas programadas con fecha, franja horaria y canchas efectivas antes del bracket compacto dentro de `.confirmacion-reserva__torneo`.
  - `src/components/reservas/ConfirmacionReserva.css`: Se definieron estilos para `.confirmacion-reserva__torneo-jornadas`, `.confirmacion-reserva__torneo-jornadas-titulo`, `.confirmacion-reserva__torneo-jornadas-lista` e ítems con ícono de calendario.
  - `src/components/canchas/VistaCanchas.jsx`: Verificado y validado; el cableado de props del hook `useReserva` y la propagación a `FormularioReserva`, `VoucherReserva` y `ConfirmacionReserva` garantizan la operación integral multi-día.
  - `src/components/reservas/Torneo.test.jsx`: Suite completa de 5 pruebas de integración cubriendo de forma exhaustiva los criterios de aceptación `AC-001` a `AC-014` y los requerimientos funcionales `FR-001` a `FR-012`:
    1. Configuración inicial, fases con canchas efectivas y bracket (`FR-002`, `FR-007`, `FR-008`, `AC-009`).
    2. Alerta de insuficiencia de tiempo en una fase y bloqueo (`AC-002`, `FR-006`).
    3. Validación de orden cronológico entre fases (`AC-010`, `AC-011`, `FR-011`).
    4. Emparejamiento manual y validación de equipos repetidos (`AC-006`, `FR-004`).
    5. Confirmación exitosa multi-día, cobro de canchas efectivas y persistencia (`AC-001`, `AC-012`, `AC-013`, `AC-014`).

## Verificación

- **Pruebas automáticas (`npx vitest run`):** 13 archivos de prueba ejecutados y 172 pruebas pasadas con 100% de éxito (incluyendo los 5 tests de integración de `Torneo.test.jsx` y las 43 pruebas de `torneo.test.js`).
- **Linter (`npm run lint`):** 0 errores y 0 advertencias (`eslint .` completado limpiamente).
- **Compilación de producción (`npm run build`):** Compilación Vite satisfactoria (`dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js` generados en 2.24s sin errores).

## Commits

1. `5c5c5e0`: `feat: soporta jornadas por fase en dominio, precios y contexto de torneos`
2. `a97d9f4`: `feat: añade calendario por fases y fechas en el bracket de torneo`
3. `7d85c28`: `feat: integra programación multi-día de torneos en reserva, voucher y pruebas`



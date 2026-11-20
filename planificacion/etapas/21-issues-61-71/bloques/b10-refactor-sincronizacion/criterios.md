# Criterios de aceptación del bloque b10 (issue #64)

- C1: Sin cambios de comportamiento: `npm test` completo pasa y el diff de los archivos de prueba solo cambia `C10` (de `conservarReservasSinGuardar` a `conciliarReservasSinGuardar(...).guardado`, con las mismas aserciones) y los imports que se quitan. Ninguna otra aserción cambió.
  Cómo comprobarlo: `git diff -- '*.test.*'`.
- C2: La secuencia de sincronización (pendientes de alta y de cancelación, `conciliarLecturaExterna`, reasignar los dos registros, `registrarConflictos` y actualizar `ultimoRawStorageRef`) está en una sola función, y la usan `renovarSiCambioElDia`, el listener `storage`, `leerEstadoFresco` y la rama de clave borrada. Ya no hay copias de esa secuencia.
- C3: La rama de clave borrada no reimplementa el filtro de `conciliarLecturaExterna`; sigue vaciando las cancelaciones pendientes y conservando las altas pendientes sobre la semilla (D1).
- C4: `aplicarCancelacion` llama a `quitarReservasDeEstado` después de `verificarCancelable` y ya no repite el filtro de horas (`!horas.includes(h) || usadas.has(h)`).
- C5: Queda una sola función para filtrar registros de ids (en lugar de `quitarIdsPresentes`, `filtrarIdsEnMemoria` y `filtrarCanceladosPresentes`), y su comentario dice si muta o no.
- C6: En un mismo evento `storage` o cambio de día, el JSON leído se parsea una sola vez (`idsDeRawStorage` recibe datos ya parseados o el parseo se reutiliza).
  Cómo comprobarlo: leer el código; opcional, espiar `JSON.parse` en una prueba propia.
- C7: `conservarReservasSinGuardar` no existe; `horasUsadasEnCelda` no se exporta; `registrarConflictos` no tiene el id de respaldo y sus avisos siguen trayendo `id`, `mensaje` y `codigo`.
- C8: Siguen pasando, sin cambios, las pruebas de #62 (sonda S13 y choque contra celdas guardadas), #63 (lo último guardado ilegible), #61 (confirmación descartada) y #66 (casos de riesgo).
- C9: `docs/agentes/reservas.md` ya no nombra `conservarReservasSinGuardar` y describe la función única de sincronización.
- C10: `npm test` completo y `npm run lint` terminan con código 0 (lint sin avisos).

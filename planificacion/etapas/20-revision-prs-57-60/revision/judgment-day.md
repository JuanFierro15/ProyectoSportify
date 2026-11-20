# Judgment Day sobre `d2a64c8..cffe519` (F7)

- **Objetivo congelado:** diff de producción `d2a64c8..cffe519`
  (`ReservasContext.jsx`, `cancelacion.js`, `AvisoConflictoReserva.jsx`,
  `App.jsx`, `App.css`), con las pruebas, `AGENTS.md` y
  `docs/agentes/reservas.md` de `cffe519`. Se materializó en archivos porque
  los jueces no tienen git (la primera corrida volvió vacía por eso y se
  descartó: no fue un resultado limpio).
- **Jueces:** `jd-judge-a` y `jd-judge-b`, ciegos, mismo alcance.
- **Rondas de corrección:** ninguna. La revisión es de solo lectura (plan
  aprobado) y ningún hallazgo es CRITICAL.

## Confirmados por los dos jueces

| Id | Gravedad | Hallazgo | Dónde |
| --- | --- | --- | --- |
| JD1 | WARNING (los dos) | Si `ultimoRawStorageRef` queda en `null` o con un texto que no se puede leer, `idsDeRawStorage` devuelve un conjunto vacío y **todas** las reservas en memoria pasan a "pendientes de guardar" (y se apaga la detección de cancelaciones pendientes). Una reserva que otra pestaña canceló reaparece y se vuelve a guardar. Camino concreto: `renovarSiCambioElDia` asigna `ultimoRaw` aunque lo leído no se pueda parsear y en ese caso no actualiza los registros. Lo introduce #57 (y #58 lo extiende). | `ReservasContext.jsx:1141-1198`, `:391-407`, `:437-458` |
| JD2 | WARNING (B) / SUGGESTION (A) | Las pruebas no fijan: cancelar y volver a reservar la misma celda con una cancelación pendiente (orden `quitarReservasDeEstado` → conciliación), choque de un evento con `bloques` contra una individual, cancelación pendiente al borrar la clave, `ultimoRaw` nulo o corrupto. Solo hay choques individual contra individual. | `ReservasContext.test.jsx:2837-3510`, `AvisoConflictoReserva.test.jsx` |
| JD3 | SUGGESTION | `conservarReservasSinGuardar` quedó como envoltorio sin uso en producción (solo lo usan las pruebas, y `C10` fija el envoltorio, no `conciliarReservasSinGuardar`). | `ReservasContext.jsx:343-359` |
| JD4 | SUGGESTION | La secuencia "pendientes de alta + pendientes de cancelación + `conciliarLecturaExterna` + reasignar registros + `registrarConflictos`" está copiada en `renovarSiCambioElDia`, el listener `storage` y `leerEstadoFresco`; la rama de clave borrada reimplementa el filtro de `conciliarLecturaExterna`. Además `idsDeRawStorage` vuelve a parsear el JSON entero dos veces por evento. | `ReservasContext.jsx:1144-1198`, `:1225-1268`, `:1276-1303`, `:1320-1354` |
| JD5 | SUGGESTION | Regiones vivas anidadas: `aria-live="assertive"` en el contenedor y `role="alert"` en cada aviso; algunos lectores pueden anunciar dos veces. | `AvisoConflictoReserva.jsx` |

## Señalados por un solo juez (sospecha)

| Id | Juez | Hallazgo | Comprobación |
| --- | --- | --- | --- |
| JS1 | A, WARNING | El choque solo se busca en `ocupados` de la base: si falta la fecha (camino de cambio de día, que usa los `ocupados` crudos), no se detecta y quedan dos reservas en la misma celda. | Sonda S13 de `v2` |
| JS2 | B, WARNING, ya existía | Un evento `storage` viejo que llega después de una escritura propia más nueva hace perder la reserva propia (último que escribe gana). No lo introduce la cadena. | Limitación conocida "sin bloqueo real" |
| JS3 | B, SUGGESTION | El id de respaldo `conflicto-${Date.now()}-${idx}` de `registrarConflictos` es inalcanzable (los conflictos siempre traen `id`). | Lectura: confirmado por el coordinador |

## Caminos revisados sin defecto (los dos jueces)

Orden cancelar → reservar dentro de `conciliarLecturaExterna` (sin falso
choque), horas compartidas en `quitarReservasDeEstado` y `aplicarCancelacion`,
rama de clave borrada de #54 (conserva y reintenta), y bucles de escritura
entre pestañas (los registros se vacían al guardar bien).

## Veredicto

Sin hallazgos CRITICAL confirmados: no hay rondas de corrección. JD1 y JS1
pasan a las sondas S13 y S14 para comprobarlos con valores; su gravedad final
la decide el resultado de esas sondas.

`JUDGMENT: APPROVED ✅` (sin CRITICAL; los WARNING quedan como hallazgos del
reporte, sin autoridad de entrega).

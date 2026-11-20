# Tarea del bloque b10: una sola secuencia de sincronización y sin código muerto (issue #64)

## Objetivo

Después de las PR #57 a #60 quedó lógica repetida y código sin uso en la
sincronización de reservas. Es un **refactor sin cambios de comportamiento**:
toda la suite debe seguir pasando sin editar las aserciones. Lee
`gh issue view 64` y `docs/agentes/reservas.md`.

Este bloque corre después de los arreglos #62 (choque contra las celdas de las
reservas guardadas y base completa en el cambio de día), #63 (lo último
guardado ilegible) y #61 (el aviso trae `codigo`), que ya están en esta rama.
El refactor debe conservar esos comportamientos: sus pruebas son la red.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx`,
  `src/lib/cancelacion.js`, `src/context/ReservasContext.test.jsx` (solo para
  pasar `C10` de `conservarReservasSinGuardar` a `conciliarReservasSinGuardar`
  y quitar ese import), `src/lib/cancelacion.test.js` (solo si importa algo
  que se quita) y `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
- No hagas commits, ni push, ni cambies de rama.

## Cambios

**Duplicación**

1. La secuencia "pendientes de alta + pendientes de cancelación +
   `conciliarLecturaExterna` + reasignar `idsSinGuardarRef` e
   `idsCanceladosSinGuardarRef` + `registrarConflictos`" está copiada en
   `renovarSiCambioElDia`, el listener `storage` y `leerEstadoFresco`. Extrae
   una sola función dentro del provider (por ejemplo
   `sincronizarConLeido({ raw, datos, base, actual })`) que haga la secuencia
   completa y actualice `ultimoRawStorageRef` en un solo orden, y úsala en los
   tres caminos y en la rama de clave borrada (#60), que hoy reimplementa a
   mano el filtro de `conciliarLecturaExterna`. Cada camino conserva lo que le
   es propio (la base con o sin semilla, `syncDesdeStorageRef`, el
   `despachar` que hace, y en la clave borrada vaciar las cancelaciones
   pendientes).
2. `aplicarCancelacion` (`src/lib/cancelacion.js`) delega en
   `quitarReservasDeEstado` para quitar la reserva y liberar sus horas,
   después de `verificarCancelable`.
3. `quitarIdsPresentes`, `filtrarIdsEnMemoria` y `filtrarCanceladosPresentes`
   son casi la misma función: deja una sola forma (que no mute sus
   argumentos, o que mute de forma explícita y documentada) y úsala donde
   estaban las tres.
4. `idsDeRawStorage` no vuelve a parsear el JSON que ya se parseó en el mismo
   evento: pásale los datos ya parseados.

**Código muerto**

5. Quita `conservarReservasSinGuardar` y pasa `C10` a
   `conciliarReservasSinGuardar(...).guardado` (mismas aserciones).
6. Quita el `export` de `horasUsadasEnCelda` (sigue como función interna de
   `cancelacion.js`).
7. Quita el id de respaldo `` `conflicto-${Date.now()}-${idx}` `` de
   `registrarConflictos`: los conflictos siempre traen `id`. Conserva el
   `codigo` que agregó #61.

Actualiza `docs/agentes/reservas.md` (quita el alias
`conservarReservasSinGuardar` y nombra la función nueva).

## Comandos

- `npm test` (toda la suite)
- `npm run lint` (0 errores y 0 avisos)

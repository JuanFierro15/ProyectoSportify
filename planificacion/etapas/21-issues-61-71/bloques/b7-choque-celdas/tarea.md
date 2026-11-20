# Tarea del bloque b7: el choque al sincronizar también mira las reservas guardadas (issue #62)

## Objetivo

`conciliarReservasSinGuardar` (`src/context/ReservasContext.jsx`) decide si
una reserva sin guardar choca con lo guardado mirando **solo**
`ocupados[canchaId][fecha]`. Si a lo leído le falta la clave de esa fecha,
`choca` da `false`: la pendiente se acepta y quedan **dos reservas en la misma
cancha, fecha y hora**, sin aviso. Además, al aceptarla, sus horas no se
agregan a `ocupados` porque la fecha no existe. Lee `gh issue view 62`,
`docs/agentes/reservas.md` y la sonda S13 de
`planificacion/etapas/20-revision-prs-57-60/revision/v2-sondas.test.jsx.txt`
(la variante sin la clave de la fecha falla hoy).

El camino que llega ahí es `renovarSiCambioElDia` (cambio de día por `focus`
o `visibilitychange`): usa `desdeStorage.ocupadosCrudos` como base sin
fusionar con la semilla, a diferencia del listener `storage` y de
`leerEstadoFresco`, que pasan la base por `fusionarConSemilla`.

Es código de alto riesgo (datos guardados y orden entre pestañas): cambia lo
mínimo y no toques el comportamiento de los otros caminos.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx`,
  `src/context/ReservasContext.test.jsx` y `docs/agentes/reservas.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
  No cambies `src/lib/cancelacion.js`.
- No hagas commits, ni push, ni cambies de rama.

## Diseño

1. **Choque contra las reservas guardadas.** En `conciliarReservasSinGuardar`,
   una candidata choca si alguna de sus celdas (`celdasDeReserva`, ya
   importada de `src/lib/cancelacion.js`) comparte cancha, fecha y hora con
   `ocupados` (como hoy) **o** con alguna celda de `guardado.reservas` (o de
   una candidata ya aceptada antes en el mismo recorrido). Usa
   `celdasDeReserva`, **no** `horasUsadasEnCelda`: otro bloque le va a quitar
   el `export` a esa función.
2. **Base completa en el cambio de día.** En `renovarSiCambioElDia`, cuando
   hay cambio externo, arma la base de `conciliarLecturaExterna` con los
   `ocupados` de lo leído completados con la semilla de la ventana nueva
   (`ventanaDias()` y `ocupadosSemilla`), igual que el listener `storage`,
   **sin perder** las fechas de lo leído que quedan fuera de esa ventana (las
   pruebas de #41 sobre el día `+6` y las fechas futuras deben seguir
   pasando). Así, si se acepta una pendiente, sus horas quedan en `ocupados`.
3. **Pruebas primero (RED).** Antes de cambiar el código, agrega a
   `ReservasContext.test.jsx` la sonda S13 completa (los dos subcasos) y
   comprueba que el subcaso sin la clave falla. Agrega también:
   - un evento con `bloques` (torneo o cumpleaños) pendiente cuya celda del
     **último** bloque coincide con una reserva guardada que no está en
     `ocupados`: se descarta entero, con un aviso con su código;
   - una pendiente que **no** choca, con la fecha ausente de `ocupados` en lo
     leído: se acepta y su hora queda ocupada en `disponibilidad` después del
     cambio de día, y las demás horas de ese día conservan la semilla;
   - repetir el `focus` no duplica reservas ni avisos.
4. Actualiza `docs/agentes/reservas.md` (la frase sobre cómo se detecta el
   choque y la base de `renovarSiCambioElDia`).

## Comandos

- `npm test -- src/context src/components src/lib`
- `npm run lint` (0 errores y 0 avisos)

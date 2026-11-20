# Judgment Day sobre las correcciones de #80

Objetivo congelado: `git diff d57e955 cd3486a` de
`src/context/ReservasContext.jsx`, `src/components/reservas/useReserva.js` y
`src/lib/cancelacion.js`, más los tres archivos completos en `cd3486a` y
`docs/agentes/reservas.md`. Dos jueces ciegos (`jd-judge-a`, `jd-judge-b`),
mismo alcance y criterios, en paralelo, solo lectura.

## Veredicto

**JUDGMENT: APPROVED.** Ningún hallazgo grave. Ronda 0, sin correcciones.

| Conteo | Valor |
| --- | --- |
| Confirmados graves | 0 |
| Sospechosos (un solo juez) | 0 graves |
| Contradicciones | 0 |
| Info (SUGGESTION) | 1, coincidente en los dos jueces |

## Hallazgo informativo (los dos jueces)

**J1 (`cancelacion.js:129-142`, SUGGESTION).** El filtro nuevo de
`quitarReservasDeEstado` (descarta `null`, no objeto, arreglo o sin `id`) solo
se aplica si se quita al menos una reserva: con `eliminadas.length === 0` se
devuelve `guardado` sin tocar, con la basura dentro. El juez B agrega que,
cuando sí la descarta, las horas que esa entrada ya había puesto en `ocupados`
(vía `aplicarHorasDeReservas`, que no exige `id`) no se liberan: quedan horas
ocupadas sin reserva dueña. Solo con datos guardados corruptos.

## Lo que los jueces comprobaron sin hallar defecto

- Las reservas canceladas se borran de `reservas`, así que la reparación no
  puede volver a ocupar su hora.
- Con una cancelación pendiente, la reparación corre sobre `base` antes de
  `conciliarLecturaExterna`, que luego quita la reserva y libera la hora.
- `aplicarHorasDeReservas` es idempotente (unión con `Set`, orden) y devuelve
  la misma referencia si no falta nada.
- El cambio de día sigue reparado: pasa por `sincronizarConLeido`.
- n2: `confirmado` está en las dependencias; `elegirOtroHorario` quita los
  choques en su propio `setJornadas`, y `reiniciar()` limpia `jornadas` y
  `confirmado` juntos tras una confirmación exitosa.
- Ya existía antes (no lo introduce el cambio): el evento `storage` con
  `datos = null` y la rama sin cambios externos de `renovarSiCambioElDia` no
  reparan.

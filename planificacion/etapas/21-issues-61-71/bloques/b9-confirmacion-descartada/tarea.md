# Tarea del bloque b9: la confirmación no sigue visible si la reserva se descarta por un choque (issue #61)

## Objetivo

Si una pestaña no pudo guardar una reserva y otra pestaña guarda la misma
cancha, fecha y hora, al sincronizar se descarta la reserva sin guardar y
aparece el aviso global "Tu reserva SPF-… no pudo completarse porque ese
horario ya fue ocupado." (decisión D2, confirmada por Juan el 20-11-2026). Pero
si eso pasa en la pestaña que acaba de reservar, la página de reserva sigue
mostrando "Reserva confirmada" con el mismo código y su QR: dos mensajes que se
contradicen y el QR de una reserva que ya no existe. Lee `gh issue view 61`,
`docs/agentes/reservas.md` y `docs/agentes/pagina-reserva.md`, y mira la
captura `planificacion/etapas/20-revision-prs-57-60/revision/v3/R6-aviso-1440.png`.

Hoy: `reservar()` y `reservarEvento()` devuelven `{ ok, codigo }`; `useReserva`
guarda la confirmación en `confirmado` (`{ codigo, textoQr, resumen }`), y
`VistaCanchas` muestra `ConfirmacionReserva` cuando `reserva.confirmado` existe.
Los avisos (`avisosConflicto` de `useReservas()`) tienen `{ id, mensaje }`,
donde `id` es el id interno de la reserva, no su código.

Este bloque cruza el contexto, `useReserva` y `VistaCanchas` (estado
compartido): cambia lo mínimo en cada uno.

## Archivos

- Puedes editar solo: `src/context/ReservasContext.jsx` (solo
  `registrarConflictos`), `src/components/reservas/useReserva.js`,
  `src/components/canchas/VistaCanchas.jsx`,
  `src/components/canchas/VistaCanchas.css`,
  `src/components/canchas/VistaCanchas.test.jsx`,
  `src/components/shared/AvisoConflictoReserva.test.jsx`,
  `docs/agentes/reservas.md` y `docs/agentes/pagina-reserva.md`.
- No toques `src/verificacion/` (es del verificador) ni ningún otro archivo.
  No cambies `ConfirmacionReserva.jsx` ni el chat.
- No hagas commits, ni push, ni cambies de rama.
- No levantes servidores: la revisión en el navegador la hace el coordinador
  al final.

## Diseño

1. **El aviso trae el código.** En `registrarConflictos`, cada aviso agrega
   `codigo: reserva.codigo` (sin cambiar `id` ni `mensaje`).
2. **Estado "descartada" que no se deshace.** En `useReserva`, cuando
   `avisosConflicto` trae un aviso cuyo `codigo` es el de `confirmado.codigo`,
   marca la confirmación como descartada (por ejemplo
   `confirmado.descartada = true`). La marca se queda aunque el usuario cierre
   el aviso: cerrar el aviso no hace volver el QR. Un aviso con otro código no
   cambia nada.
3. **Pantalla de "no se pudo completar".** En `VistaCanchas`, si la
   confirmación está descartada, en lugar de `ConfirmacionReserva` (sin código
   grande ni QR) muestra un bloque con un título como "Tu reserva no pudo
   completarse", una frase que diga que otra persona ocupó ese horario antes
   de que tu reserva quedara registrada (sin detalles de implementación: nada
   de "guardar", "pestaña", "almacenamiento" ni nombres técnicos; con tuteo) y
   un botón "Elegir otro horario". El título recibe el foco al aparecer.
   Usa los tokens de la página de reserva de `src/App.css`
   (`--reserva-*`); nada de colores sueltos.
4. **"Elegir otro horario"** vuelve al formulario con la misma modalidad,
   cancha, fecha, nombre y teléfono; las horas que ya no están libres no
   quedan seleccionadas. Desde ahí, reservar otra hora libre funciona y
   muestra la confirmación normal con un código nuevo. Agrega en `useReserva`
   la función que haga esto (por ejemplo `elegirOtroHorario`) y devuélvela
   junto a lo que ya devuelve.
5. **Pruebas** (en `VistaCanchas.test.jsx`, o en
   `AvisoConflictoReserva.test.jsx` si ahí es más simple montar el escenario
   con el provider): con `setItem` fallando, reservar una hora `H`, despachar
   un evento `storage` de otra pestaña con otra reserva en la misma celda, y
   comprobar que desaparecen el código grande y el QR, aparece el bloque de
   "no se pudo completar" y el aviso global. Cubre también: un aviso con otro
   código no cambia la confirmación; cerrar el aviso no hace volver el QR;
   "Elegir otro horario" y una segunda reserva en otra hora se confirman con
   un código nuevo; y un evento (cumpleaños o torneo) descartado también
   cambia a "no se pudo completar".
6. **El chat:** revisa si el comprobante del chat (`Chatbot.jsx`, que también
   usa `ConfirmacionReserva`) tiene la misma contradicción. No lo arregles:
   descríbelo en tu resumen (qué pasa y dónde) para abrir una issue aparte.
7. Actualiza `docs/agentes/reservas.md` (el aviso trae `codigo`) y
   `docs/agentes/pagina-reserva.md` (la pantalla de "no se pudo completar").

## Comandos

- `npm test -- src/components src/context`
- `npm run lint` (0 errores y 0 avisos)

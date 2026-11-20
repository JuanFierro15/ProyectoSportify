# Criterios de aceptación del bloque b9 (issue #61)

- C1: Cada aviso de `avisosConflicto` trae `codigo` igual al código de la reserva descartada, y conserva `id` y `mensaje` como antes.
- C2: Con `setItem` fallando, reservar una hora `H` en la página de reserva y recibir un `storage` de otra pestaña con otra reserva en la misma celda: desaparecen el código grande y el QR de esa reserva, aparece el bloque de "no se pudo completar" con el botón "Elegir otro horario", y el aviso global sigue visible.
  Cómo comprobarlo: prueba de interfaz con el provider real y un evento `storage`; buscar el QR (`canvas`) y el código por su texto.
- C3: El título del bloque "no se pudo completar" recibe el foco al aparecer.
- C4: Un aviso con **otro** código (una reserva distinta descartada) no cambia la confirmación visible: el QR y el código siguen.
- C5: Cerrar el aviso global no hace volver el QR ni el código: el bloque de "no se pudo completar" se mantiene.
- C6: "Elegir otro horario" vuelve al formulario con la misma modalidad, cancha, fecha, nombre y teléfono, sin la hora ocupada seleccionada; reservar después otra hora libre muestra la confirmación normal con un código distinto del descartado.
- C7: Un evento (cumpleaños o torneo) cuya reserva se descarta por un choque también cambia a "no se pudo completar".
- C8: El texto del bloque usa tuteo y no menciona detalles de implementación ("guardar", "pestaña", "almacenamiento", `localStorage`, nombres de componentes). Sus estilos usan tokens `--reserva-*` y no tienen colores literales.
- C9: Solo cambió `registrarConflictos` en `ReservasContext.jsx`; `ConfirmacionReserva.jsx` y el chat no cambiaron. Las pruebas existentes de `src/components` y `src/context` pasan sin cambiar sus aserciones.
- C10: El resumen del implementador dice si el comprobante del chat tiene la misma contradicción y dónde.
- C11: `docs/agentes/reservas.md` y `docs/agentes/pagina-reserva.md` describen el `codigo` del aviso y la pantalla de "no se pudo completar".
- C12: `npm test` completo y `npm run lint` terminan con código 0 (lint sin avisos).

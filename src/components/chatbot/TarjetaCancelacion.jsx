import React from 'react';
import { fechaCompleta } from '../../lib/fechas';
import { rangoHoras, precioTexto } from '../../lib/chat';

// Tarjeta para confirmar la cancelación de una reserva encontrada por el chat.
// Muestra la copia de los datos guardada en el mensaje; la cancelación real
// (cancelar() del contexto) vuelve a validar el plazo al confirmar.
function TarjetaCancelacion({ mensaje, onConfirmar, onCancelar }) {
  const { canchaNombre, fecha, horas = [], codigo, total = 0 } = mensaje?.tarjeta || {};

  const textoRango = rangoHoras(horas);
  const horarioFormateado = textoRango
    ? textoRango[0].toUpperCase() + textoRango.slice(1)
    : '';

  const esPendiente = mensaje?.estado === 'pendiente';

  let estadoTexto = null;
  if (!esPendiente) {
    if (mensaje?.estado === 'confirmada') estadoTexto = 'Reserva cancelada';
    else if (mensaje?.estado === 'cancelada') estadoTexto = 'Se conservó la reserva';
    else if (mensaje?.estado === 'descartada') estadoTexto = 'Sin confirmar';
    else if (mensaje?.estado === 'fallida') estadoTexto = 'No se pudo cancelar';
  }

  return (
    <div className="chatbot__tarjeta">
      <dl className="chatbot__tarjeta-datos">
        <dt>Cancha</dt>
        <dd>{canchaNombre}</dd>
        <dt>Fecha</dt>
        <dd>{fechaCompleta(fecha)}</dd>
        <dt>Horario</dt>
        <dd>{horarioFormateado}</dd>
        <dt>Código</dt>
        <dd>{codigo}</dd>
        <dt>Total</dt>
        <dd>{precioTexto(total)}</dd>
      </dl>

      <div className="chatbot__tarjeta-acciones">
        <button
          type="button"
          className="chatbot__boton-peligro"
          onClick={onConfirmar}
          disabled={!esPendiente}
        >
          Cancelar reserva
        </button>
        <button
          type="button"
          className="chatbot__boton-secundario"
          onClick={onCancelar}
          disabled={!esPendiente}
        >
          No, conservarla
        </button>
      </div>

      {estadoTexto && (
        <p className="chatbot__tarjeta-estado">{estadoTexto}</p>
      )}
    </div>
  );
}

export default TarjetaCancelacion;

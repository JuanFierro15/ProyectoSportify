import React from 'react';
import { useReservas } from '../../context/ReservasContext';
import { calcularPrecio } from '../../lib/precios';
import { fechaCompleta } from '../../lib/fechas';
import { rangoHoras, precioTexto } from '../../lib/chat';
import { formatoTelefono } from '../../lib/negocio';

// Tarjeta de la reserva propuesta por el chat (CONFIRMAR_RESERVA). El total
// usa calcularPrecio, igual que el formulario y lo que guarda RESERVAR. Nada
// se reserva hasta tocar "Confirmar" (o responder "sí").
function TarjetaReserva({ mensaje, onConfirmar, onCancelar }) {
  const { canchas } = useReservas();

  const { canchaId, fecha, horas = [], nombre, telefono } = mensaje?.accion || {};
  const cancha = canchas.find((c) => c.id === canchaId);
  const canchaNombre = cancha ? cancha.nombre : canchaId;
  const precioHora = cancha ? cancha.precioHora : 0;
  const precio = calcularPrecio(precioHora, horas.length);

  const textoRango = rangoHoras(horas);
  const horarioFormateado = textoRango
    ? textoRango[0].toUpperCase() + textoRango.slice(1)
    : '';

  const esPendiente = mensaje?.estado === 'pendiente';

  let estadoTexto = null;
  if (!esPendiente) {
    if (mensaje?.estado === 'confirmada') estadoTexto = 'Reserva confirmada';
    else if (mensaje?.estado === 'cancelada') estadoTexto = 'No se reservó';
    else if (mensaje?.estado === 'descartada') estadoTexto = 'Sin confirmar';
    else if (mensaje?.estado === 'fallida') estadoTexto = 'No se pudo reservar';
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
        <dt>A nombre de</dt>
        <dd>{nombre}</dd>
        <dt>Teléfono</dt>
        <dd>{formatoTelefono(telefono)}</dd>
        <dt>Total</dt>
        <dd>{precioTexto(precio.total)}</dd>
      </dl>

      {precio.aguaGratis && (
        <p className="chatbot__tarjeta-nota">
          {`Incluye ${precioTexto(precio.descuentoHora)} menos por hora y un pack de agua`}
        </p>
      )}

      <div className="chatbot__tarjeta-acciones">
        <button
          type="button"
          className="chatbot__boton-primario"
          onClick={onConfirmar}
          disabled={!esPendiente}
        >
          Confirmar
        </button>
        <button
          type="button"
          className="chatbot__boton-secundario"
          onClick={onCancelar}
          disabled={!esPendiente}
        >
          Cancelar
        </button>
      </div>

      {estadoTexto && (
        <p className="chatbot__tarjeta-estado">{estadoTexto}</p>
      )}
    </div>
  );
}

export default TarjetaReserva;

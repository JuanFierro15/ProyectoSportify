import React from 'react';
import AccionSeccion from './AccionSeccion';
import TarjetaReserva from './TarjetaReserva';
import TarjetaCancelacion from './TarjetaCancelacion';
import OpcionesCancelacion from './OpcionesCancelacion';

// Un mensaje del chat como texto plano (los saltos de línea los resuelve el
// CSS). ABRIR_SECCION agrega su botón; tarjetas de reserva, cancelación y
// opciones permiten interactuar directamente desde el chat.
function MensajeChat({
  mensaje,
  onAccion,
  onConfirmarTarjeta,
  onRechazarTarjeta,
  onElegirReserva,
  onVerComprobante,
}) {
  const esUsuario = mensaje.rol === 'usuario';
  const tieneTarjeta =
    mensaje.accion?.tipo === 'CONFIRMAR_RESERVA' ||
    mensaje.tarjeta?.tipo === 'cancelacion';

  return (
    <li
      className={`chatbot__mensaje chatbot__mensaje--${mensaje.rol}${
        mensaje.error ? ' chatbot__mensaje--error' : ''
      }${tieneTarjeta ? ' chatbot__mensaje--con-tarjeta' : ''}`}
    >
      <span className="show-for-sr">{esUsuario ? 'Tú: ' : 'Asistente: '}</span>
      <p className="chatbot__texto">{mensaje.texto}</p>
      {mensaje.accion?.tipo === 'CONFIRMAR_RESERVA' && (
        <TarjetaReserva
          mensaje={mensaje}
          onConfirmar={() => onConfirmarTarjeta?.(mensaje.id)}
          onCancelar={() => onRechazarTarjeta?.(mensaje.id)}
        />
      )}
      {mensaje.tarjeta?.tipo === 'cancelacion' && (
        <TarjetaCancelacion
          mensaje={mensaje}
          onConfirmar={() => onConfirmarTarjeta?.(mensaje.id)}
          onCancelar={() => onRechazarTarjeta?.(mensaje.id)}
        />
      )}
      {Array.isArray(mensaje.opciones) && mensaje.opciones.length > 0 && (
        <OpcionesCancelacion
          mensaje={mensaje}
          onElegir={(reservaId) => onElegirReserva?.(mensaje.id, reservaId)}
        />
      )}
      {mensaje.comprobante && (
        <div className="chatbot__acciones">
          <button
            type="button"
            className="chatbot__accion"
            onClick={() => onVerComprobante?.(mensaje.comprobante)}
          >
            Ver comprobante
          </button>
        </div>
      )}
      {mensaje.accion?.tipo === 'ABRIR_SECCION' && (
        <AccionSeccion accion={mensaje.accion} onAccion={onAccion} />
      )}
    </li>
  );
}

export default MensajeChat;

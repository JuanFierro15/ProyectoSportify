import React from 'react';
import AccionSeccion from './AccionSeccion';

// Un mensaje del chat como texto plano (los saltos de línea los resuelve el
// CSS). ABRIR_SECCION agrega su botón; CONFIRMAR_RESERVA y BUSCAR_CANCELACION
// por ahora solo muestran el texto (ejecutarlas es la parte 6.3).
function MensajeChat({ mensaje, onAccion }) {
  const esUsuario = mensaje.rol === 'usuario';

  return (
    <li
      className={`chatbot__mensaje chatbot__mensaje--${mensaje.rol}${
        mensaje.error ? ' chatbot__mensaje--error' : ''
      }`}
    >
      <span className="show-for-sr">{esUsuario ? 'Tú: ' : 'Asistente: '}</span>
      <p className="chatbot__texto">{mensaje.texto}</p>
      {mensaje.accion?.tipo === 'ABRIR_SECCION' && (
        <AccionSeccion accion={mensaje.accion} onAccion={onAccion} />
      )}
    </li>
  );
}

export default MensajeChat;

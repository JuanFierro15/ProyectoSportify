import React from 'react';

// Varias reservas coinciden: el usuario elige cuál cancelar y aparece su
// tarjeta. Resuelta la lista, los botones quedan deshabilitados.
function OpcionesCancelacion({ mensaje, onElegir }) {
  const opciones = Array.isArray(mensaje?.opciones) ? mensaje.opciones : [];
  const esPendiente = mensaje?.estado === 'pendiente';

  return (
    <ul className="chatbot__opciones">
      {opciones.map((opcion) => {
        const esElegida = mensaje?.elegida === opcion.reservaId;
        return (
          <li key={opcion.reservaId}>
            <button
              type="button"
              className={`chatbot__opcion${esElegida ? ' chatbot__opcion--elegida' : ''}`}
              aria-pressed={esElegida}
              disabled={!esPendiente}
              onClick={() => onElegir?.(opcion.reservaId)}
            >
              {opcion.etiqueta}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default OpcionesCancelacion;

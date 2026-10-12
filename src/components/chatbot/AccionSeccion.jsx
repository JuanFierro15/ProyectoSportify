import React from 'react';
import useAccionesChat from './useAccionesChat';
import { DEPORTES, deportePorSlug } from '../../data/deportes';

// Botones de la acción ABRIR_SECCION. Si no llegó deporte para "canchas", un
// botón por deporte. La navegación es la del sitio (useAccionesChat).
function AccionSeccion({ accion, onAccion }) {
  const { irACanchas, irAEventos, irAUbicacion } = useAccionesChat();

  if (!accion || accion.tipo !== 'ABRIR_SECCION') {
    return null;
  }

  const manejarClick = async (fn) => {
    await fn();
    onAccion?.();
  };

  if (accion.seccion === 'canchas') {
    const deporteValido = accion.deporte ? deportePorSlug(accion.deporte) : null;

    if (deporteValido) {
      return (
        <div className="chatbot__acciones">
          <button
            type="button"
            className="chatbot__accion"
            onClick={() => manejarClick(() => irACanchas(deporteValido.slug))}
          >
            Ver canchas de {deporteValido.nombre.toLowerCase()}
          </button>
        </div>
      );
    }

    return (
      <div className="chatbot__acciones">
        <span className="chatbot__acciones-titulo">Ver canchas de:</span>
        {DEPORTES.map((d) => (
          <button
            key={d.slug}
            type="button"
            className="chatbot__accion"
            onClick={() => manejarClick(() => irACanchas(d.slug))}
          >
            {d.nombre}
          </button>
        ))}
      </div>
    );
  }

  if (accion.seccion === 'eventos') {
    return (
      <div className="chatbot__acciones">
        <button
          type="button"
          className="chatbot__accion"
          onClick={() => manejarClick(irAEventos)}
        >
          Reservar un evento
        </button>
      </div>
    );
  }

  if (accion.seccion === 'ubicacion') {
    return (
      <div className="chatbot__acciones">
        <button
          type="button"
          className="chatbot__accion"
          onClick={() => manejarClick(irAUbicacion)}
        >
          Ver ubicación
        </button>
      </div>
    );
  }

  return null;
}

export default AccionSeccion;

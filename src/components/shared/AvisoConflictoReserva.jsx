import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';

/**
 * Muestra los avisos globales cuando una reserva pendiente choca con otro
 * horario ya ocupado al sincronizar, permitiendo cerrarlos individualmente.
 */
function AvisoConflictoReserva() {
  const { avisosConflicto, descartarAvisoConflicto } = useReservas();

  if (!Array.isArray(avisosConflicto) || avisosConflicto.length === 0) {
    return null;
  }

  return (
    <div className="avisos-conflicto" aria-live="assertive">
      {avisosConflicto.map((aviso) => (
        <div
          key={aviso.id}
          className="callout warning avisos-conflicto__item"
          role="alert"
        >
          <AlertTriangle
            size={18}
            className="avisos-conflicto__icono"
            aria-hidden="true"
          />
          <span className="avisos-conflicto__texto">{aviso.mensaje}</span>
          <button
            type="button"
            className="avisos-conflicto__cerrar"
            onClick={() => descartarAvisoConflicto(aviso.id)}
            aria-label="Cerrar aviso"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default AvisoConflictoReserva;

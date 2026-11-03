import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { OPCIONES_DURACION } from '../../../lib/torneo';

export function AlertaTiempo({
  equipos,
  canchasCount,
  minutosRequeridos,
  disponibles,
  deficit,
  sugerencias = [],
  duracionPartido,
  onCambiarDuracion,
}) {
  if (!deficit || deficit <= 0) {
    return null;
  }

  const textoCanchas = canchasCount === 1 ? 'cancha' : 'canchas';

  return (
    <div className="callout warning alerta-tiempo" role="alert">
      <div className="alerta-tiempo__header">
        <AlertTriangle size={18} aria-hidden="true" className="alerta-tiempo__icono" />
        <strong className="alerta-tiempo__titulo">
          {`Con ${equipos} equipos y ${canchasCount} ${textoCanchas}, el torneo tomará ~${minutosRequeridos} min en el peor caso.`}
        </strong>
      </div>
      <p className="alerta-tiempo__detalle">
        {`Reservaste ${disponibles} min: faltan ${deficit} min para completar todas las rondas (incluyendo desempates y transición).`}
      </p>
      {sugerencias && sugerencias.length > 0 && (
        <ul className="alerta-tiempo__sugerencias">
          {sugerencias.map((sug, idx) => (
            <li key={idx}>{sug}</li>
          ))}
        </ul>
      )}
      {onCambiarDuracion && Number(duracionPartido) > OPCIONES_DURACION[0] && (
        <button
          type="button"
          className="button small hollow alerta-tiempo__accion"
          onClick={() => onCambiarDuracion(OPCIONES_DURACION[0])}
        >
          {`Cambiar a ${OPCIONES_DURACION[0]} min por partido`}
        </button>
      )}
    </div>
  );
}

export default AlertaTiempo;

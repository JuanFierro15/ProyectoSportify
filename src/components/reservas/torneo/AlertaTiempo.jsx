import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function AlertaTiempo({
  equipos,
  canchasCount,
  minutosRequeridos,
  disponibles,
  deficit,
  sugerencias = [],
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
    </div>
  );
}

export default AlertaTiempo;

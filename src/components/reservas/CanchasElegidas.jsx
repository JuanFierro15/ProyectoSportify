import React from 'react';
import { deportePorSlug } from '../../data/deportes';
import { estiloAcento } from '../../lib/canchas';
import './CanchasElegidas.css';

/**
 * Chips de canchas seleccionadas para eventos (torneos y cumpleaños).
 *
 * @param {Object} props
 * @param {Array} props.canchas Lista de canchas elegidas
 * @param {Object|null} props.deporte Deporte de la pestaña activa o null
 * @param {string[]} props.idsDeporte IDs de las canchas del deporte activo
 * @param {Function} props.onQuitar Callback para quitar una cancha por ID
 * @param {Function} props.onAlternarDeporte Callback para alternar todas las canchas de un deporte
 * @returns {React.ReactElement}
 */
function CanchasElegidas({
  canchas = [],
  deporte = null,
  idsDeporte = [],
  onQuitar,
  onAlternarDeporte,
}) {
  const todas =
    idsDeporte.length > 0 &&
    idsDeporte.every((id) => canchas.some((c) => c.id === id));

  return (
    <div className="canchas-elegidas" aria-live="polite">
      {canchas.length === 0 ? (
        <p className="canchas-elegidas__nota">
          Aún no has elegido canchas.
        </p>
      ) : (
        canchas.map((c) => {
          const d = deportePorSlug(c.deporte);
          return (
            <span
              key={c.id}
              className="canchas-elegidas__chip"
              style={estiloAcento(d ? d.colorAcento : undefined)}
            >
              {c.nombre}
              <button
                type="button"
                className="canchas-elegidas__quitar"
                aria-label={`Quitar ${c.nombre}`}
                onClick={() => onQuitar(c.id)}
              >
                ×
              </button>
            </span>
          );
        })
      )}
      {deporte && (
        <button
          type="button"
          className="canchas-elegidas__todas"
          onClick={() => onAlternarDeporte(deporte.slug)}
        >
          {todas
            ? `Quitar todas de ${deporte.nombre}`
            : `Elegir todas de ${deporte.nombre}`}
        </button>
      )}
    </div>
  );
}

export default CanchasElegidas;

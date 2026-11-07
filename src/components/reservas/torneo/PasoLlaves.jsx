import React from 'react';
import { Shuffle } from 'lucide-react';
import AsignacionManual from './AsignacionManual';

/**
 * Bloque de emparejamiento de llaves del torneo: selección de modo
 * aleatorio o manual, botón de volver a sortear y asignación manual.
 *
 * @param {Object} props
 * @param {Object} props.reserva Objeto de estado y acciones devuelto por useReserva
 * @returns {React.ReactElement}
 */
function PasoLlaves({ reserva }) {
  return (
    <div className="formulario-reserva__seccion-torneo">
      <span className="formulario-reserva__subtitulo">
        Emparejamiento de 1.ª ronda
      </span>
      <div className="formulario-reserva__emparejamiento-controles">
        <div
          className="formulario-reserva__pills"
          role="group"
          aria-label="Tipo de emparejamiento"
        >
          <button
            type="button"
            className={
              'button small formulario-reserva__pill' +
              (reserva.emparejamiento === 'aleatorio'
                ? ' formulario-reserva__pill--activo'
                : ' hollow')
            }
            aria-pressed={reserva.emparejamiento === 'aleatorio'}
            onClick={() => reserva.cambiarEmparejamiento('aleatorio')}
          >
            Aleatorio
          </button>
          <button
            type="button"
            className={
              'button small formulario-reserva__pill' +
              (reserva.emparejamiento === 'manual'
                ? ' formulario-reserva__pill--activo'
                : ' hollow')
            }
            aria-pressed={reserva.emparejamiento === 'manual'}
            onClick={() => reserva.cambiarEmparejamiento('manual')}
          >
            Manual
          </button>
        </div>

        {reserva.emparejamiento === 'aleatorio' && (
          <button
            type="button"
            className="button small hollow formulario-reserva__sortear"
            onClick={reserva.resortearTorneo}
          >
            <Shuffle size={14} aria-hidden="true" />
            Volver a sortear llaves
          </button>
        )}
      </div>

      {reserva.emparejamiento === 'manual' && (
        <AsignacionManual
          equipos={Number(reserva.equipos)}
          orden={reserva.ordenEquipos}
          error={reserva.torneoPlan?.errorCruces || ''}
          onCambiarPosicion={reserva.cambiarCruceManual}
        />
      )}
    </div>
  );
}

export default PasoLlaves;

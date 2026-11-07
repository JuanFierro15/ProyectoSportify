import React from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  OPCIONES_EQUIPOS,
  OPCIONES_DURACION,
  TRANSICION_MIN,
} from '../../../lib/torneo';

/**
 * Bloque de formato del torneo: aviso de canchas, cantidad de equipos,
 * duración por partido con su nota y regla de desempate.
 *
 * @param {Object} props
 * @param {Object} props.reserva Objeto de estado y acciones devuelto por useReserva
 * @returns {React.ReactElement}
 */
function PasoFormato({ reserva }) {
  return (
    <>
      {reserva.torneoPlan?.errorCanchas && reserva.canchaIds.length > 0 && (
        <div className="callout alert" role="alert">
          {reserva.torneoPlan.errorCanchas}
        </div>
      )}

      <div className="formulario-reserva__seccion-torneo">
        <span className="formulario-reserva__subtitulo">
          Cantidad de equipos (Eliminación directa)
        </span>
        <div
          className="formulario-reserva__pills"
          role="group"
          aria-label="Cantidad de equipos"
        >
          {OPCIONES_EQUIPOS.map((n) => (
            <button
              key={n}
              type="button"
              className={
                'button small formulario-reserva__pill' +
                (Number(reserva.equipos) === n
                  ? ' formulario-reserva__pill--activo'
                  : ' hollow')
              }
              aria-pressed={Number(reserva.equipos) === n}
              onClick={() => reserva.cambiarEquiposTorneo(n)}
            >
              {n} equipos ({n - 1} partidos)
            </button>
          ))}
        </div>
      </div>

      <div className="formulario-reserva__seccion-torneo">
        <span className="formulario-reserva__subtitulo">
          Duración por partido
        </span>
        <div
          className="formulario-reserva__pills"
          role="group"
          aria-label="Duración por partido"
        >
          {OPCIONES_DURACION.map((min) => (
            <button
              key={min}
              type="button"
              className={
                'button small formulario-reserva__pill' +
                (Number(reserva.duracionPartido) === min
                  ? ' formulario-reserva__pill--activo'
                  : ' hollow')
              }
              aria-pressed={Number(reserva.duracionPartido) === min}
              onClick={() => reserva.setDuracionPartido(min)}
            >
              {min} min
            </button>
          ))}
        </div>
        <p className="formulario-reserva__nota-torneo">
          {`Cada turno suma ${reserva.duracionPartido} min de partido + ${reserva.torneoPlan?.desempate?.minutos ?? 5} min de desempate + ${TRANSICION_MIN} min de transición = ${reserva.torneoPlan?.minutosTurno ?? 30} min por turno.`}
        </p>
      </div>

      {reserva.torneoPlan?.desempate && (
        <div className="formulario-reserva__desempate">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>
            <strong>
              Desempate ({reserva.torneoPlan.desempate.etiqueta || reserva.torneoPlan.desempate.metodo}):
            </strong>{' '}
            {reserva.torneoPlan.desempate.descripcion}
          </span>
        </div>
      )}
    </>
  );
}

export default PasoFormato;

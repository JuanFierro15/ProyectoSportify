import React from 'react';
import AlertaTiempo from './AlertaTiempo';

/**
 * Bloque de capacidad y tiempo estimado: métricas de canchas, turnos,
 * desglose por fases y alerta de franja insuficiente.
 *
 * @param {Object} props
 * @param {Object} props.reserva Objeto de estado y acciones devuelto por useReserva
 * @returns {React.ReactElement}
 */
function PasoCapacidad({ reserva }) {
  return (
    <div className="formulario-reserva__seccion-torneo">
      <span className="formulario-reserva__subtitulo">
        Capacidad y tiempo estimado
      </span>
      <div className="formulario-reserva__metricas">
        <span className="formulario-reserva__metrica">
          {`Canchas seleccionadas: ${reserva.canchaIds.length || 1} (hasta ${(reserva.canchaIds.length || 1) * 2} equipos simultáneos)`}
        </span>
        <span className="formulario-reserva__metrica">
          {`Turnos requeridos: ${reserva.torneoPlan?.turnosTotales ?? 0}`}
        </span>
        <span className="formulario-reserva__metrica">
          {`Tiempo estimado (peor caso): ${reserva.torneoPlan?.minutosRequeridos ?? 0} min`}
        </span>
      </div>

      {reserva.torneoPlan?.fases && reserva.torneoPlan.fases.length > 0 && (
        <div className="formulario-reserva__fases-detalle">
          <span className="formulario-reserva__fases-titulo">
            Canchas efectivas por fase:
          </span>
          <div className="formulario-reserva__fases-pills">
            {reserva.torneoPlan.fases.map((fase) => {
              const nombreCorto = fase.nombreRonda.replace(/ de final$/i, '');
              return (
                <span key={fase.ronda} className="formulario-reserva__metrica">
                  {`${nombreCorto}: ${fase.canchasEfectivas} ${fase.canchasEfectivas === 1 ? 'cancha' : 'canchas'}`}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {reserva.horasSel.length > 0 &&
        reserva.torneoPlan?.validacionFranja &&
        !reserva.torneoPlan.validacionFranja.alcanza && (
          <AlertaTiempo
            equipos={Number(reserva.equipos)}
            canchasCount={Math.max(1, reserva.canchaIds.length)}
            minutosRequeridos={reserva.torneoPlan.minutosRequeridos}
            disponibles={reserva.torneoPlan.validacionFranja.disponibles}
            deficit={reserva.torneoPlan.validacionFranja.deficit}
            sugerencias={reserva.torneoPlan.sugerencias}
            duracionPartido={reserva.duracionPartido}
            onCambiarDuracion={reserva.setDuracionPartido}
          />
        )}
    </div>
  );
}

export default PasoCapacidad;

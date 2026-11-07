import React from 'react';
import CalendarioTorneo from './CalendarioTorneo';

/**
 * Bloque de programación por fases: calendario de días y horarios por cada fase.
 *
 * @param {Object} props
 * @param {Object} props.reserva Objeto de estado y acciones devuelto por useReserva
 * @param {string[]} props.dias Lista de fechas ISO para el selector de día
 * @param {Array} [props.canchas] Catálogo completo de canchas
 * @returns {React.ReactElement}
 */
function PasoFechas({ reserva, dias, canchas = [] }) {
  return (
    <fieldset className="formulario-reserva__campo formulario-reserva__campo--fases">
      <legend>Programación por fases (días y horarios)</legend>
      <CalendarioTorneo
        fases={reserva.torneoPlan?.fases || []}
        jornadas={reserva.torneoPlan?.jornadas || {}}
        validacionesJornadas={reserva.torneoPlan?.validacionesJornadas || []}
        sugerenciasPorFase={reserva.torneoPlan?.sugerenciasPorFase || {}}
        dias={dias}
        horasBase={reserva.horasBase}
        canchas={canchas}
        canchaIds={reserva.canchaIds}
        duracionPartido={reserva.duracionPartido}
        onCambiarDuracion={reserva.setDuracionPartido}
        onCambiarFechaFase={reserva.cambiarFechaFase}
        onElegirHoraFase={reserva.elegirHoraFase}
        esLibreFase={reserva.esLibreFase}
        contarLibresFase={reserva.contarLibresFase}
        esDiaBloqueadoFase={reserva.esDiaBloqueadoFase}
      />
    </fieldset>
  );
}

export default PasoFechas;

import React from 'react';
import { fechaCompleta } from '../../../lib/fechas';
import { finDeFranja } from '../../../lib/precios';
import Bracket from './Bracket';

function rangoHoras(horas) {
  if (!Array.isArray(horas) || horas.length === 0) {
    return '';
  }
  return `${horas[0]} a ${finDeFranja(horas[horas.length - 1])}`;
}

/**
 * Bloque de historial de torneos reservados confirmados con desglose
 * de jornadas y bracket compacto.
 *
 * @param {Object} props
 * @param {Array} [props.torneosGuardados] Lista de reservas de tipo evento torneo
 * @param {Array} [props.canchas] Catálogo completo de canchas
 * @returns {React.ReactElement|null}
 */
function PasoGuardados({ torneosGuardados = [], canchas = [] }) {
  if (!torneosGuardados || torneosGuardados.length === 0) {
    return null;
  }

  return (
    <details className="formulario-reserva__torneos-guardados">
      <summary>Torneos reservados ({torneosGuardados.length})</summary>
      <div className="formulario-reserva__torneos-lista">
        {torneosGuardados.map((t) => {
          const desempateTexto =
            t.torneo?.desempate?.descripcion ||
            t.torneo?.desempate?.etiqueta ||
            t.torneo?.desempate?.metodo ||
            '';
          const jornadasRaw =
            t.torneo?.jornadas &&
            (Array.isArray(t.torneo.jornadas)
              ? t.torneo.jornadas
              : Object.values(t.torneo.jornadas));
          const bloquesRaw = Array.isArray(t.bloques) ? t.bloques : [];
          const nFases = Math.max(
            Array.isArray(jornadasRaw) ? jornadasRaw.length : 0,
            bloquesRaw.length
          );
          const listaJornadas = Array.from({ length: nFases }, (_, idx) => {
            const b = bloquesRaw[idx] || {};
            const j = (Array.isArray(jornadasRaw) && jornadasRaw[idx]) || {};
            return {
              ...b,
              ...j,
              fecha: j.fecha || b.fecha,
              horas:
                Array.isArray(j.horas) && j.horas.length > 0
                  ? j.horas
                  : Array.isArray(b.horas)
                  ? b.horas
                  : [],
              canchaIds:
                Array.isArray(j.canchaIds) && j.canchaIds.length > 0
                  ? j.canchaIds
                  : Array.isArray(b.canchaIds)
                  ? b.canchaIds
                  : [],
            };
          });

          const resumenFechasHoras =
            listaJornadas.length > 0
              ? listaJornadas
                  .map((j) =>
                    [j.fecha ? fechaCompleta(j.fecha) : '', rangoHoras(j.horas)]
                      .filter(Boolean)
                      .join(' · ')
                  )
                  .filter(Boolean)
                  .join(' · ')
              : [t.fecha ? fechaCompleta(t.fecha) : '', rangoHoras(t.horas)]
                  .filter(Boolean)
                  .join(' · ');

          return (
            <div
              key={t.codigo || t.id}
              className="formulario-reserva__torneo-guardado"
            >
              <div className="formulario-reserva__torneo-guardado-info">
                <strong className="formulario-reserva__torneo-guardado-codigo">
                  Código: {t.codigo}
                </strong>
                <span className="formulario-reserva__torneo-guardado-meta">
                  {resumenFechasHoras}
                  {` · ${t.torneo?.equipos ?? t.equipos} equipos`}
                  {desempateTexto && ` · Desempate: ${desempateTexto}`}
                </span>
              </div>
              {listaJornadas.length > 0 && (
                <div className="formulario-reserva__torneo-guardado-jornadas">
                  {listaJornadas.map((j, idx) => {
                    const horasTxt = rangoHoras(j.horas);
                    const numC =
                      j.canchasEfectivas ||
                      (Array.isArray(j.canchaIds) ? j.canchaIds.length : null);
                    return (
                      <span
                        key={j.ronda || idx}
                        className="formulario-reserva__torneo-guardado-jornada-item"
                      >
                        <strong>{j.nombreRonda || `Fase ${j.ronda || idx + 1}`}:</strong>{' '}
                        {j.fecha ? fechaCompleta(j.fecha) : ''}
                        {horasTxt && ` · ${horasTxt}`}
                        {numC && ` (${numC} ${numC === 1 ? 'cancha' : 'canchas'})`}
                      </span>
                    );
                  })}
                </div>
              )}
              {t.torneo?.partidos && (
                <Bracket
                  partidos={t.torneo.partidos}
                  canchas={canchas}
                  compacto
                />
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

export default PasoGuardados;

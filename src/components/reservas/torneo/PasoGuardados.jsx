import React from 'react';
import { finDeFranja } from '../../../lib/precios';
import Bracket, { fechaCorta } from './Bracket';

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
          const horarioTexto =
            t.horario ||
            (t.horas && t.horas.length > 0
              ? `${t.horas[0]} a ${t.horas[t.horas.length - 1]}`
              : '');
          const desempateTexto =
            t.torneo?.desempate?.descripcion ||
            t.torneo?.desempate?.etiqueta ||
            t.torneo?.desempate?.metodo ||
            '';
          const tieneJornadas =
            t.torneo?.jornadas &&
            (Array.isArray(t.torneo.jornadas)
              ? t.torneo.jornadas.length > 0
              : Object.keys(t.torneo.jornadas).length > 0);
          const listaJornadas = tieneJornadas
            ? Array.isArray(t.torneo.jornadas)
              ? t.torneo.jornadas
              : Object.values(t.torneo.jornadas)
            : [];

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
                  {t.fechaTexto || t.fecha}
                  {horarioTexto && ` · ${horarioTexto}`}
                  {` · ${t.torneo?.equipos} equipos`}
                  {desempateTexto && ` · Desempate: ${desempateTexto}`}
                </span>
              </div>
              {listaJornadas.length > 0 && (
                <div className="formulario-reserva__torneo-guardado-jornadas">
                  {listaJornadas.map((j, idx) => {
                    const horasTxt =
                      Array.isArray(j.horas) && j.horas.length > 0
                        ? `${j.horas[0]} a ${finDeFranja(j.horas[j.horas.length - 1])}`
                        : '';
                    const numC =
                      j.canchasEfectivas ||
                      (Array.isArray(j.canchaIds) ? j.canchaIds.length : null);
                    return (
                      <span
                        key={j.ronda || idx}
                        className="formulario-reserva__torneo-guardado-jornada-item"
                      >
                        <strong>{j.nombreRonda || `Fase ${j.ronda || idx + 1}`}:</strong>{' '}
                        {fechaCorta(j.fecha)}
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

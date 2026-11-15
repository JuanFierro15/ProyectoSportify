import React from 'react';
import { fechaCompleta } from '../../../lib/fechas';
import Bracket from './Bracket';
import {
  extraerJornadasDeReserva,
  formatearHorasDeJornada,
  rangoHorasSeguidas,
} from './formatoJornadas';

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
          const listaJornadas = extraerJornadasDeReserva(t);
          const canchasDeReserva =
            Array.isArray(t.canchaIds) && Array.isArray(t.canchaNombres)
              ? t.canchaIds
                  .map((id, i) => ({ id, nombre: t.canchaNombres[i] }))
                  .filter((c) => c.id && c.nombre)
              : [];
          const canchasRef = [
            ...canchasDeReserva,
            ...(Array.isArray(canchas)
              ? canchas.filter(
                  (c) => c && c.id && !canchasDeReserva.some((x) => x.id === c.id)
                )
              : []),
          ];

          const resumenFechasHoras =
            listaJornadas.length > 0
              ? listaJornadas
                  .map((j) => {
                    const detalle = formatearHorasDeJornada(j, canchasRef);
                    return [
                      j.fecha ? fechaCompleta(j.fecha) : '',
                      detalle && detalle !== 'Horario por definir' ? detalle : '',
                    ]
                      .filter(Boolean)
                      .join(' · ');
                  })
                  .filter(Boolean)
                  .join(' · ')
              : [
                  t.fecha ? fechaCompleta(t.fecha) : '',
                  rangoHorasSeguidas(t.horas),
                ]
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
                    const detalleTxt = formatearHorasDeJornada(
                      j,
                      canchasRef,
                      'cancha',
                      'canchas'
                    );
                    return (
                      <span
                        key={j.ronda || idx}
                        className="formulario-reserva__torneo-guardado-jornada-item"
                      >
                        <strong>{j.nombreRonda || `Fase ${j.ronda || idx + 1}`}:</strong>{' '}
                        {j.fecha ? fechaCompleta(j.fecha) : ''}
                        {detalleTxt &&
                          detalleTxt !== 'Horario por definir' &&
                          ` · ${detalleTxt}`}
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

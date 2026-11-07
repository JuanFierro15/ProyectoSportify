import React from 'react';
import { Check } from 'lucide-react';
import './IndicadorPasos.css';

export function IndicadorPasos({ reserva }) {
  if (!reserva || reserva.modo !== 'torneo') return null;

  const canchasCompleto = Boolean(
    reserva.canchaIds &&
      reserva.canchaIds.length > 0 &&
      !reserva.torneoPlan?.errorCanchas
  );

  const formatoCompleto = Boolean(
    [4, 8, 16].includes(Number(reserva.equipos)) && reserva.duracionPartido
  );

  const fases = reserva.torneoPlan?.fases || [];
  const jornadas = reserva.torneoPlan?.jornadas || reserva.jornadas || {};
  const validaciones = reserva.torneoPlan?.validacionesJornadas || [];
  const todasFasesConHoras =
    fases.length > 0 &&
    fases.every((f) => {
      const j = jornadas[f.ronda];
      return Array.isArray(j?.horas) && j.horas.length > 0;
    });
  const sinErroresJornadas = !validaciones.some((v) => Boolean(v?.error));
  const fechasCompleto = todasFasesConHoras && sinErroresJornadas;

  const llavesCompleto = Boolean(
    reserva.torneoPlan?.partidos &&
      reserva.torneoPlan.partidos.length > 0 &&
      !reserva.torneoPlan?.errorCruces
  );

  const datosCompleto = Boolean(
    !reserva.errNombre &&
      !reserva.errTelefono &&
      reserva.nombre &&
      reserva.nombre.trim().length > 0
  );

  const pasos = [
    { id: 'canchas', etiqueta: 'Canchas', completo: canchasCompleto },
    { id: 'formato', etiqueta: 'Formato', completo: formatoCompleto },
    { id: 'fechas', etiqueta: 'Fechas por fase', completo: fechasCompleto },
    { id: 'llaves', etiqueta: 'Llaves', completo: llavesCompleto },
    { id: 'datos', etiqueta: 'Tus datos', completo: datosCompleto },
  ];

  const primerIncompletoIdx = pasos.findIndex((p) => !p.completo);

  return (
    <ol className="indicador-pasos" aria-label="Pasos del torneo">
      {pasos.map((paso, idx) => {
        const esActual = idx === primerIncompletoIdx;
        let estadoClase = 'indicador-pasos__paso--incompleto';
        if (paso.completo) {
          estadoClase = 'indicador-pasos__paso--completo';
        } else if (esActual) {
          estadoClase = 'indicador-pasos__paso--actual';
        }

        return (
          <li
            key={paso.id}
            className={`indicador-pasos__paso ${estadoClase}`}
            aria-current={esActual ? 'step' : undefined}
          >
            <span className="indicador-pasos__icono" aria-hidden="true">
              {paso.completo ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                idx + 1
              )}
            </span>
            <span className="indicador-pasos__etiqueta">{paso.etiqueta}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default IndicadorPasos;

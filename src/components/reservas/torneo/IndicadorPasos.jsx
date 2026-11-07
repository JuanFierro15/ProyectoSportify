import React from 'react';
import { Check } from 'lucide-react';
import { estadoPasosTorneo, pasosAlcanzables as obtenerPasosAlcanzables } from '../../../lib/pasosTorneo';
import './IndicadorPasos.css';

/**
 * Indicador de progreso de los pasos del torneo.
 *
 * En escritorio muestra 5 pasos informativos (sin resumen).
 * En móvil (modo interactivo) puede mostrar los 6 pasos y permitir salto a pasos alcanzables.
 *
 * @param {Object} props
 * @param {Object} props.reserva - Objeto devuelto por useReserva.
 * @param {string} [props.pasoActual] - ID del paso activo en el asistente.
 * @param {Function} [props.onSeleccionarPaso] - Callback al pulsar un paso alcanzable.
 * @param {string[]} [props.pasosAlcanzables] - Lista de IDs de pasos alcanzables.
 * @param {boolean} [props.seisPasos=false] - Mostrar los 6 pasos (incluyendo resumen).
 */
export function IndicadorPasos({
  reserva,
  pasoActual,
  onSeleccionarPaso,
  pasosAlcanzables,
  seisPasos = false,
}) {
  if (!reserva || reserva.modo !== 'torneo') return null;

  const estados = estadoPasosTorneo(reserva);
  const pasos = seisPasos ? estados : estados.slice(0, 5);
  const primerIncompletoIdx = pasos.findIndex((p) => !p.completo);
  const alcanzables = pasosAlcanzables || obtenerPasosAlcanzables(estados);

  return (
    <ol className="indicador-pasos" aria-label="Pasos del torneo">
      {pasos.map((paso, idx) => {
        const esActual = pasoActual !== undefined ? paso.id === pasoActual : idx === primerIncompletoIdx;
        const esAlcanzable = alcanzables.includes(paso.id);

        let estadoClase = 'indicador-pasos__paso--incompleto';
        if (paso.completo) {
          estadoClase = 'indicador-pasos__paso--completo';
        } else if (esActual) {
          estadoClase = 'indicador-pasos__paso--actual';
        }

        const interactivo = Boolean(onSeleccionarPaso);
        const claseInteractivo = interactivo ? ' indicador-pasos__paso--interactivo' : '';
        const claseAlcanzable = interactivo && esAlcanzable ? ' indicador-pasos__paso--alcanzable' : '';

        return (
          <li
            key={paso.id}
            className={`indicador-pasos__paso ${estadoClase}${claseInteractivo}${claseAlcanzable}`}
            aria-current={esActual ? 'step' : undefined}
          >
            {interactivo ? (
              <button
                type="button"
                className="indicador-pasos__boton"
                onClick={() => esAlcanzable && onSeleccionarPaso(paso.id)}
                disabled={!esAlcanzable}
                aria-label={`${paso.etiqueta}${!esAlcanzable ? ' (bloqueado)' : ''}`}
              >
                <span className="indicador-pasos__icono" aria-hidden="true">
                  {paso.completo ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="indicador-pasos__etiqueta">{paso.etiqueta}</span>
              </button>
            ) : (
              <>
                <span className="indicador-pasos__icono" aria-hidden="true">
                  {paso.completo ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="indicador-pasos__etiqueta">{paso.etiqueta}</span>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default IndicadorPasos;

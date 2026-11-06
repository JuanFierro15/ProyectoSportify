import React from 'react';
import { Cake, LandPlot, Trophy } from 'lucide-react';
import { MODOS } from './useReserva';
import './SelectorModo.css';

const ICONOS_MODO = {
  cancha: LandPlot,
  torneo: Trophy,
  cumpleanos: Cake,
};

/**
 * Selector de modo de reserva (cancha individual, torneo o cumpleaños).
 *
 * @param {Object} props
 * @param {string} props.modo Modo seleccionado actualmente
 * @param {Function} props.onCambiar Callback al seleccionar un modo
 * @returns {React.ReactElement}
 */
function SelectorModo({ modo, onCambiar }) {
  return (
    <div
      className="selector-modo"
      role="group"
      aria-label="Tipo de reserva"
    >
      {MODOS.map((m) => {
        const Icono = ICONOS_MODO[m.valor];
        const esActivo = modo === m.valor;
        return (
          <button
            key={m.valor}
            type="button"
            className={
              'selector-modo__boton' +
              (esActivo ? ' selector-modo__boton--activo' : '')
            }
            aria-pressed={esActivo}
            onClick={() => onCambiar(m.valor)}
          >
            {Icono && <Icono size={18} aria-hidden="true" className="selector-modo__icono" />}
            <span>{m.etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SelectorModo;

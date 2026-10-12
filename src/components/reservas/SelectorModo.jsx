import React from 'react';
import { MODOS } from './useReserva';
import './SelectorModo.css';

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
      {MODOS.map((m) => (
        <button
          key={m.valor}
          type="button"
          className={
            'selector-modo__boton' +
            (modo === m.valor ? ' selector-modo__boton--activo' : '')
          }
          aria-pressed={modo === m.valor}
          onClick={() => onCambiar(m.valor)}
        >
          {m.etiqueta}
        </button>
      ))}
    </div>
  );
}

export default SelectorModo;

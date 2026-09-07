import React from 'react';
import { aDate, etiquetaDia, MES_CORTO } from '../../lib/fechas';
import './SelectorDia.css';

/**
 * SelectorDia — tira de 7 días (hoy + 6) hecha a mano con botones de Foundation.
 * Compartido por el modal de reserva individual y el de evento especial.
 *
 * Props:
 *  - dias         {string[]}  fechas ISO (las mismas del ReservasContext)
 *  - valor        {string}    fecha ISO seleccionada
 *  - onChange     {(iso) => void}
 *  - contarLibres {(iso) => number}  opcional; si se pasa, muestra "N libres" /
 *                 "completo" bajo cada día
 */
function SelectorDia({ dias, valor, onChange, contarLibres }) {
  return (
    <div className="selector-dia" role="group" aria-label="Elegí el día">
      {dias.map((iso) => {
        const d = aDate(iso);
        const sel = valor === iso;
        const libres = contarLibres ? contarLibres(iso) : null;
        const lleno = libres === 0;
        return (
          <button
            key={iso}
            type="button"
            className={
              'selector-dia__opcion' +
              (sel ? ' selector-dia__opcion--sel' : '') +
              (lleno ? ' selector-dia__opcion--lleno' : '')
            }
            aria-pressed={sel}
            onClick={() => onChange(iso)}
          >
            <span className="selector-dia__sem">{etiquetaDia(iso, dias)}</span>
            <span className="selector-dia__num">{d.getDate()}</span>
            <span className="selector-dia__mes">{MES_CORTO[d.getMonth()]}</span>
            {libres != null && (
              <span className="selector-dia__libres">
                {lleno ? 'completo' : `${libres} libres`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SelectorDia;

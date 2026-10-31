import React from 'react';
import { aDate, etiquetaDia, MES_CORTO } from '../../lib/fechas';
import './SelectorDia.css';

/**
 * SelectorDia — tira de 7 días (hoy + 6) hecha a mano con botones de Foundation.
 * Lo usa el formulario de reserva (FormularioReserva) en sus tres modos.
 *
 * Props:
 *  - dias           {string[]}  fechas ISO (las mismas del ReservasContext)
 *  - valor          {string}    fecha ISO seleccionada
 *  - onChange       {(iso) => void}
 *  - contarLibres   {(iso) => number}  opcional; si se pasa, muestra "N libres" /
 *                   "completo" bajo cada día
 *  - esDiaBloqueado {(iso) => boolean} opcional; si retorna true para un día,
 *                   lo deshabilita y muestra "bloqueado"
 */
function SelectorDia({ dias, valor, onChange, contarLibres, esDiaBloqueado }) {
  return (
    <div className="selector-dia" role="group" aria-label="Elige el día">
      {dias.map((iso) => {
        const d = aDate(iso);
        const sel = valor === iso;
        const bloqueado = esDiaBloqueado ? Boolean(esDiaBloqueado(iso)) : false;
        const libres = contarLibres ? contarLibres(iso) : null;
        const lleno = libres === 0;
        return (
          <button
            key={iso}
            type="button"
            disabled={bloqueado}
            className={
              'selector-dia__opcion' +
              (sel ? ' selector-dia__opcion--sel' : '') +
              (lleno ? ' selector-dia__opcion--lleno' : '') +
              (bloqueado ? ' selector-dia__opcion--bloqueado' : '')
            }
            aria-pressed={sel}
            onClick={() => !bloqueado && onChange(iso)}
          >
            <span className="selector-dia__sem">{etiquetaDia(iso, dias)}</span>
            <span className="selector-dia__num">{d.getDate()}</span>
            <span className="selector-dia__mes">{MES_CORTO[d.getMonth()]}</span>
            {(bloqueado || libres != null) && (
              <span className="selector-dia__libres">
                {bloqueado ? 'bloqueado' : lleno ? 'completo' : `${libres} libres`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SelectorDia;

import React from 'react';
import { Check, Tag } from 'lucide-react';
import { estiloAcento, imagenPlaceholderCancha, tituloCancha } from '../../lib/canchas';

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// Dimensiones reales de las fotos (720x893): evitan el salto de layout.
const ANCHO_IMAGEN = 720;
const ALTO_IMAGEN = 893;

/**
 * CanchaEventoCard — tarjeta seleccionable de una cancha dentro del modal de
 * evento. Es un <label> con un checkbox real (oculto visualmente, no con
 * display:none) para conservar teclado y lectores de pantalla.
 *
 * Props:
 *  - cancha        {object}  cancha del ReservasContext
 *  - acento        {string}  colorAcento del deporte (única fuente: deportes.js)
 *  - marcada       {bool}
 *  - onToggle      {fn}
 *  - libresDia     {number}  horarios libres de la cancha en el día elegido
 *  - totalDia      {number}  total de horarios del día
 */
function CanchaEventoCard({ cancha, acento, marcada, onToggle, libresDia, totalDia }) {
  const placeholder = imagenPlaceholderCancha(acento);

  return (
    <label
      className={'evento-cancha' + (marcada ? ' evento-cancha--sel' : '')}
      style={estiloAcento(acento)}
    >
      <input
        type="checkbox"
        className="evento-cancha__input"
        checked={marcada}
        onChange={onToggle}
      />

      <span className="evento-cancha__foto">
        <img
          src={cancha.imagen || placeholder}
          alt={`${tituloCancha(cancha)}`}
          width={ANCHO_IMAGEN}
          height={ALTO_IMAGEN}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder;
          }}
        />
        <span className="evento-cancha__check" aria-hidden="true">
          <Check size={16} />
        </span>
      </span>

      <span className="evento-cancha__cuerpo">
        <span className="evento-cancha__nombre">{tituloCancha(cancha)}</span>

        {cancha.caracteristicas.length > 0 && (
          <span className="evento-cancha__badges">
            {cancha.caracteristicas.map((c) => (
              <span key={c} className="evento-cancha__badge">
                {c}
              </span>
            ))}
          </span>
        )}

        {cancha.descripcion && (
          <span className="evento-cancha__descripcion">{cancha.descripcion}</span>
        )}

        <span className="evento-cancha__pie">
          <span className="evento-cancha__precio">
            <Tag size={13} aria-hidden="true" />
            {formatoPrecio.format(cancha.precioHora)}
            <span className="evento-cancha__unidad"> / hora</span>
          </span>
          <span className="evento-cancha__disp">
            {libresDia === 0
              ? 'Sin horarios libres ese día'
              : `${libresDia} de ${totalDia} horarios libres`}
          </span>
        </span>
      </span>
    </label>
  );
}

export default CanchaEventoCard;

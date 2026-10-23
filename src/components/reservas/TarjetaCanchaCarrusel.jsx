import React from 'react';
import { Check, Tag } from 'lucide-react';
import { estiloAcento, tituloCancha } from '../../lib/canchas';
import { formatoPrecio } from '../../lib/precios';
import './TarjetaCanchaCarrusel.css';

// Contenido superpuesto en cada tarjeta del carrusel de la página de reserva
// (VistaCanchas, vía `renderOverlay` de DepthCarousel): deporte, nombre y, en
// la tarjeta activa, precio, disponibilidad del día, la acción y —cuando el
// deporte lo indica con `detalleEnTarjeta`— hasta tres características y la
// descripción. El detalle completo de cualquier cancha sigue en el visor.
function TarjetaCanchaCarrusel({
  cancha,
  deporte,
  modo,
  activa,
  marcada,
  libresDia,
  totalDia,
  onAlternar,
}) {
  if (!cancha) return null;

  const textoDisponibilidad =
    libresDia === 0
      ? 'Sin horarios libres ese día'
      : `${libresDia} de ${totalDia} horarios libres`;

  return (
    <div
      className={`tarjeta-cancha${activa ? ' tarjeta-cancha--activa' : ''}${marcada ? ' tarjeta-cancha--marcada' : ''}`}
      style={estiloAcento(deporte ? deporte.colorAcento : undefined)}
    >
      <div className="tarjeta-cancha__cabecera">
        {deporte?.nombre && (
          <span className="tarjeta-cancha__deporte">{deporte.nombre}</span>
        )}
        {modo === 'evento' && marcada && (
          <span className="tarjeta-cancha__check" aria-hidden="true">
            <Check size={16} />
          </span>
        )}
      </div>

      <div className="tarjeta-cancha__cuerpo">
        <h3 className="tarjeta-cancha__nombre">{tituloCancha(cancha)}</h3>

        {activa && (
          <>
            {deporte?.detalleEnTarjeta && (
              <>
                {cancha.caracteristicas?.length > 0 && (
                  <div className="tarjeta-cancha__badges">
                    {cancha.caracteristicas.slice(0, 3).map((item) => (
                      <span key={item} className="tarjeta-cancha__badge">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {cancha.descripcion && (
                  <p className="tarjeta-cancha__descripcion">{cancha.descripcion}</p>
                )}
              </>
            )}

            <div className="tarjeta-cancha__pie">
              <span className="tarjeta-cancha__precio">
                <Tag size={13} aria-hidden="true" />
                {formatoPrecio.format(cancha.precioHora)}
                <span className="tarjeta-cancha__unidad"> / hora</span>
              </span>
              <span className="tarjeta-cancha__disp">{textoDisponibilidad}</span>
            </div>

            {modo === 'evento' ? (
              <button
                type="button"
                className={`tarjeta-cancha__boton${marcada ? ' tarjeta-cancha__boton--marcada' : ''}`}
                aria-pressed={marcada}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onAlternar?.();
                }}
              >
                {marcada ? 'Quitar del evento' : 'Agregar al evento'}
              </button>
            ) : (
              <span className="tarjeta-cancha__elegida">
                <Check size={16} aria-hidden="true" />
                Cancha elegida
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TarjetaCanchaCarrusel;

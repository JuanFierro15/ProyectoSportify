import React, { useState } from 'react';
import ReservaModal from '../reservas/ReservaModal';
import { useReservas } from '../../context/ReservasContext';
import { deportePorSlug } from '../../data/deportes';
import './CanchaCard.css';

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/**
 * CanchaCard (Bloque 3, rediseñada en el pase de calidad) — tarjeta de una
 * cancha del catálogo.
 *
 * Jerarquía: deporte (etiqueta con el color de acento) · nombre (título) ·
 * precio · disponibilidad de hoy (texto explícito + mini-grid con leyenda).
 * Altura pareja entre cards (flex column + CTA con margin-top:auto).
 *
 * Disponibilidad leída del ReservasContext. El botón "Reservar" abre el modal
 * (que permite elegir cualquiera de los próximos 7 días).
 */
function CanchaCard({ cancha }) {
  const { deporte, nombre, precioHora } = cancha;
  const { disponibilidad, dias, esHorarioDeEvento } = useReservas();
  const [modalAbierto, setModalAbierto] = useState(false);

  const info = deportePorSlug(deporte);
  const acento = info ? info.colorAcento : '#1779ba';
  const nombreDeporte = info ? info.nombre : deporte;

  // En la card basta con "Cancha N": el deporte ya se ve arriba con su color.
  const numeroCancha = (cancha.id.match(/(\d+)$/) || [])[1];
  const tituloCard = numeroCancha ? `Cancha ${numeroCancha}` : nombre;

  const horariosHoy = disponibilidad(cancha.id, dias[0]).map((h) => ({
    ...h,
    evento: !h.disponible && esHorarioDeEvento(cancha.id, dias[0], h.hora),
  }));
  const libresHoy = horariosHoy.filter((h) => h.disponible).length;
  const totalHoras = horariosHoy.length;
  const hayEventoHoy = horariosHoy.some((h) => h.evento);

  // Habilitar el botón si hay algún cupo en cualquiera de los 7 días.
  const hayCuposSemana = dias.some((d) =>
    disponibilidad(cancha.id, d).some((h) => h.disponible)
  );

  return (
    <article className="card cancha-card" style={{ '--acento': acento }}>
      <div className="card-section cancha-card__cuerpo">
        <p className="cancha-card__deporte">{nombreDeporte}</p>
        <h3 className="cancha-card__nombre">{tituloCard}</h3>

        <p className="cancha-card__precio">
          {formatoPrecio.format(precioHora)}
          <span className="cancha-card__precio-unidad"> / hora</span>
        </p>

        <div className="cancha-card__disponibilidad">
          <p className="cancha-card__disp-texto">
            {libresHoy === 0 ? (
              'Sin horarios disponibles hoy'
            ) : (
              <>
                <strong>{libresHoy}</strong> de {totalHoras} horarios
                disponibles hoy
              </>
            )}
          </p>

          <ul
            className="cancha-card__grid"
            aria-label={`Horarios de hoy en ${tituloCard} de ${nombreDeporte}`}
          >
            {horariosHoy.map((h) => {
              const estado = h.disponible
                ? 'disponible'
                : h.evento
                ? 'reservado para un evento'
                : 'reservado';
              return (
                <li
                  key={h.hora}
                  className={
                    'cancha-card__slot ' +
                    (h.disponible
                      ? 'cancha-card__slot--libre'
                      : 'cancha-card__slot--ocupado') +
                    (h.evento ? ' cancha-card__slot--evento' : '')
                  }
                  title={`${h.hora} · ${estado}`}
                >
                  {h.hora.slice(0, 2)}
                  <span className="show-for-sr"> {estado}</span>
                </li>
              );
            })}
          </ul>

          <p className="cancha-card__leyenda">
            <span className="cancha-card__leyenda-item">
              <span className="cancha-card__leyenda-muestra cancha-card__leyenda-muestra--libre" />
              Disponible
            </span>
            <span className="cancha-card__leyenda-item">
              <span className="cancha-card__leyenda-muestra cancha-card__leyenda-muestra--ocupado" />
              Reservado
            </span>
            {hayEventoHoy && (
              <span className="cancha-card__leyenda-item">
                <span className="cancha-card__leyenda-muestra cancha-card__leyenda-muestra--evento" />
                Evento
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="card-section cancha-card__pie">
        <button
          type="button"
          className="button expanded cancha-card__cta"
          onClick={() => setModalAbierto(true)}
          disabled={!hayCuposSemana}
        >
          {hayCuposSemana ? 'Reservar' : 'Sin disponibilidad'}
        </button>
      </div>

      <ReservaModal
        cancha={cancha}
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
      />
    </article>
  );
}

export default CanchaCard;

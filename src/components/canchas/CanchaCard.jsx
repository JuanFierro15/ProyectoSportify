import React, { useState } from 'react';
import ReservaModal from '../reservas/ReservaModal';
import './CanchaCard.css';

// Slug de deporte -> nombre visible.
const NOMBRE_DEPORTE = {
  'voley-playa': 'Voley Playa',
  padel: 'Pádel',
  futbol: 'Fútbol',
};

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/**
 * CanchaCard (Bloque 3) — tarjeta de una cancha del catálogo.
 *
 * Muestra nombre, deporte, precio por hora y un resumen de disponibilidad
 * (conteo de horarios libres + mini-grid de puntos verde/rojo por horario).
 *
 * La `cancha` que recibe viene del ReservasContext (vía Catalogo), así que la
 * disponibilidad se refleja en vivo. El botón "Reservar" abre el ReservaModal
 * (Bloque 4).
 */
function CanchaCard({ cancha }) {
  const { deporte, nombre, precioHora, horarios } = cancha;
  const [modalAbierto, setModalAbierto] = useState(false);

  const libres = horarios.filter((h) => h.disponible).length;
  const total = horarios.length;

  return (
    <article className="card cancha-card">
      <div className="card-divider cancha-card__cabecera">
        <h3 className="cancha-card__nombre">{nombre}</h3>
        <span className="cancha-card__deporte">
          {NOMBRE_DEPORTE[deporte] || deporte}
        </span>
      </div>

      <div className="card-section cancha-card__cuerpo">
        <p className="cancha-card__precio">
          {formatoPrecio.format(precioHora)}
          <span className="cancha-card__precio-unidad"> / hora</span>
        </p>

        <p className="cancha-card__resumen">
          <strong>{libres}</strong> de {total} horarios libres hoy
        </p>

        <ul
          className="cancha-card__grid"
          aria-label={`Disponibilidad de ${nombre}`}
        >
          {horarios.map((h) => (
            <li
              key={h.hora}
              className={
                'cancha-card__slot ' +
                (h.disponible
                  ? 'cancha-card__slot--libre'
                  : 'cancha-card__slot--ocupado')
              }
              title={`${h.hora} · ${h.disponible ? 'libre' : 'ocupado'}`}
            >
              <span className="show-for-sr">
                {h.hora} {h.disponible ? 'libre' : 'ocupado'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-section cancha-card__pie">
        <button
          type="button"
          className="button expanded cancha-card__cta"
          onClick={() => setModalAbierto(true)}
          disabled={libres === 0}
        >
          {libres === 0 ? 'Sin horarios hoy' : 'Reservar'}
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

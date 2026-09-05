import React from 'react';

/**
 * Pie de página.
 * Maquetado con el grid de Foundation (`grid-container`, `grid-x`, `grid-padding-x`, `cell`).
 * Bloque 1: contenido informativo estático, sin lógica.
 */
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="grid-container full" id="main-footer">
      <div className="grid-x grid-padding-x">
        <div className="cell medium-6">
          <h5>Reservas Deportivas</h5>
          <p>
            Reserva canchas de voley playa, pádel y fútbol. Organizamos torneos,
            cumpleaños y eventos especiales.
          </p>
        </div>
        <div className="cell medium-3">
          <h6>Navegación</h6>
          <ul className="menu vertical">
            <li>
              <a href="#hero-placeholder">Inicio</a>
            </li>
            <li>
              <a href="#canchas-placeholder">Canchas</a>
            </li>
            <li>
              <a href="#reservas-placeholder">Reservar</a>
            </li>
          </ul>
        </div>
        <div className="cell medium-3">
          <h6>Horario</h6>
          <p>Lunes a domingo</p>
          <p>8:00 - 22:00</p>
        </div>
      </div>

      <div className="grid-x grid-padding-x">
        <div className="cell">
          <p className="text-center">
            &copy; {year} Reservas Deportivas &middot; Proyecto universitario
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

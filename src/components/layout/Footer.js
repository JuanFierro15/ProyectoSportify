import React from 'react';
import { ArrowUp, Clock, Compass } from 'lucide-react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import './Footer.css';

/**
 * Pie de página.
 * Maquetado con el grid de Foundation (`grid-container`, `grid-x`, `grid-padding-x`, `cell`).
 */
function Footer() {
  const year = new Date().getFullYear();
  const { abrirVista } = useVistaCanchas();

  return (
    <footer className="footer" id="main-footer">
      <div className="grid-container">
        <div className="grid-x grid-padding-x footer__cuerpo">
          <div className="cell medium-6 footer__col">
            <p className="footer__marca">Reservas Deportivas</p>
            <p className="footer__bajada">
              Reserva canchas de voley playa, pádel y fútbol. Organizamos
              torneos, cumpleaños y eventos especiales.
            </p>
          </div>

          <div className="cell medium-3 footer__col footer__col--separado">
            <p className="footer__col-titulo">
              <Compass size={15} aria-hidden="true" />
              Navegación
            </p>
            <ul className="footer__nav">
              <li>
                <a href="#hero-placeholder">Inicio</a>
              </li>
              <li>
                <a
                  href="#canchas-placeholder"
                  onClick={(e) => {
                    e.preventDefault();
                    abrirVista('voley-playa');
                  }}
                >
                  Canchas
                </a>
              </li>
              <li>
                <a href="#reservas-placeholder">Eventos especiales</a>
              </li>
            </ul>
          </div>

          <div className="cell medium-3 footer__col footer__col--separado">
            <p className="footer__col-titulo">
              <Clock size={15} aria-hidden="true" />
              Horario
            </p>
            <div className="footer__horario">
              <p className="footer__horario-dias">Lunes a domingo</p>
              <p>8:00 - 22:00</p>
            </div>
          </div>
        </div>

        <div className="footer__inferior">
          <div className="footer__inferior-fila">
            <p className="footer__copy">
              &copy; {year} Reservas Deportivas &middot; Proyecto universitario
            </p>
            <a className="footer__volver" href="#hero-placeholder">
              Volver arriba
              <ArrowUp size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

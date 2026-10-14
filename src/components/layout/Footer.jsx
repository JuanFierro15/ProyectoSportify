import React from 'react';
import { ArrowUp, Clock, Compass, Phone } from 'lucide-react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import negocio from '../../data/negocio.json';
import canchasData from '../../data/canchas.json';
import { enlaceTelefono, formatoTelefono, textoHorario } from '../../lib/negocio';
import './Footer.css';

/**
 * Pie de página.
 * Maquetado con el grid de Foundation (`grid-container`, `grid-x`, `grid-padding-x`, `cell`).
 */
function Footer() {
  const year = new Date().getFullYear();
  const { abrirVista } = useVistaCanchas();
  const { direccion, zona, ciudad, telefono } = negocio;

  return (
    <footer className="footer" id="main-footer">
      <div className="grid-container">
        <div className="grid-x grid-padding-x footer__cuerpo">
          <div className="cell small-12 large-4 footer__col">
            <p className="footer__marca">Reservas Deportivas</p>
            <p className="footer__bajada">
              Reserva canchas de voley playa, pádel y fútbol. Organizamos
              torneos, cumpleaños y eventos especiales.
            </p>
          </div>

          <div className="cell small-12 medium-4 large-2 footer__col footer__col--separado">
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
                <a href="#eventos">Eventos especiales</a>
              </li>
              <li>
                <a href="#ubicacion">Ubicación</a>
              </li>
            </ul>
          </div>

          <div className="cell small-12 medium-4 large-3 footer__col footer__col--separado">
            <p className="footer__col-titulo">
              <Clock size={15} aria-hidden="true" />
              Horario
            </p>
            <div className="footer__horario">
              <p className="footer__horario-dias">{negocio.dias}</p>
              <p>{textoHorario(canchasData.horas)}</p>
            </div>
          </div>

          <div className="cell small-12 medium-4 large-3 footer__col footer__col--separado">
            <p className="footer__col-titulo">
              <Phone size={15} aria-hidden="true" />
              Contacto
            </p>
            <div className="footer__contacto">
              <p>{direccion}</p>
              <p>{zona}, {ciudad}</p>
              <p>
                <a href={enlaceTelefono(telefono)}>{formatoTelefono(telefono)}</a>
              </p>
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

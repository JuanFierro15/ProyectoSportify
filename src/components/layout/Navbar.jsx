import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, Trophy } from 'lucide-react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { DEPORTES } from '../../data/deportes';
import { esClicNormal, rutaReserva } from '../../lib/rutas';
import MisReservas from './MisReservas';
import useIrACanchas from './useIrACanchas';
import './Navbar.css';

/**
 * Barra de navegación superior interactiva.
 *
 * Características:
 * - Al cargar la página de inicio o presionar "Inicio", la barra se visualiza en su
 *   estado inicial transparente (fondo invisible, solo letras legibles y destacadas
 *   sobre el video), permitiendo ir directamente a Canchas o Eventos sin necesidad de
 *   ver todos los videos.
 * - Al hacer scroll hacia abajo, la barra se oculta inmediatamente.
 * - Al hacer scroll hacia arriba o mover el cursor hacia el borde superior, la barra
 *   se vuelve a desplegar suavemente.
 * - Adapta automáticamente su contraste: transparente con letras blancas flotantes sobre
 *   el hero video, y superficie clara con letras oscuras al desplazarse más allá de los
 *   heros o en la página de reserva (que no tiene heros).
 * - Desde la página de reserva, "Inicio", "Eventos" y "Ubicación" vuelven al inicio
 *   y bajan a esa sección (`irASeccion`); "Canchas" sube al tope de la misma página.
 */
function Navbar() {
  const { deporteAbierto, irASeccion } = useVistaCanchas();
  const irACanchas = useIrACanchas();
  const [visible, setVisible] = useState(true);
  const [sobreHero, setSobreHero] = useState(() => !deporteAbierto);
  const [misReservasAbierto, setMisReservasAbierto] = useState(false);
  const botonMisReservasRef = useRef(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const checkHero = () => {
      const heros = document.getElementById('hero-placeholder');
      if (!heros) return false;
      const rect = heros.getBoundingClientRect();
      return rect.bottom > 80;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const enHero = checkHero();
      setSobreHero(enHero);

      if (currentScrollY <= 25) {
        // Estado inicial o tope de página: siempre visible
        setVisible(true);
      } else if (currentScrollY > lastScrollY + 5) {
        // Al scrollear hacia abajo: ocultar inmediatamente
        setVisible(false);
      } else if (currentScrollY < lastScrollY - 5) {
        // Al scrollear hacia arriba: desplegar inmediatamente
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    const handleMouseMove = (e) => {
      // Si el cursor se acerca al borde superior (< 80px)
      // o se desplaza hacia arriba con intención en la zona superior
      if (e.clientY <= 80 || (e.movementY < -3 && e.clientY < 260)) {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Sincronizar el estado al montar y al cambiar de página (inicio <-> reserva)
    setVisible(true);
    setSobreHero(checkHero());

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [deporteAbierto]);

  const irAInicio = (e) => {
    setVisible(true);
    setSobreHero(true);
    if (deporteAbierto && esClicNormal(e)) {
      e.preventDefault();
      irASeccion('hero-placeholder');
    }
  };

  const manejarSeccion = (id) => (e) => {
    if (deporteAbierto && esClicNormal(e)) {
      e.preventDefault();
      irASeccion(id);
    }
  };

  return (
    <header
      className={`site-header ${
        visible ? 'site-header--visible' : 'site-header--hidden'
      } ${sobreHero ? 'site-header--transparent' : 'site-header--scrolled'}${
        deporteAbierto ? ' site-header--reserva' : ''
      }`}
    >
      <div className="top-bar" id="main-navbar">
        <div className="top-bar-left">
          <a
            href="#hero-placeholder"
            className="site-header__brand"
            onClick={irAInicio}
          >
            <span className="site-header__brand-icon" aria-hidden="true">
              <Trophy size={22} />
            </span>
            <span className="site-header__brand-text">Sportify</span>
          </a>
        </div>
        <div className="top-bar-right">
          <ul className="menu">
            <li>
              <a href="#hero-placeholder" onClick={irAInicio}>
                Inicio
              </a>
            </li>
            <li>
              <a
                href={rutaReserva(DEPORTES[0].slug)}
                aria-current={deporteAbierto ? 'page' : undefined}
                onClick={irACanchas}
              >
                Canchas
              </a>
            </li>
            <li>
              {/* En móvil se acorta a "Eventos" para que los enlaces
                  quepan en una sola fila. */}
              <a href="#eventos" onClick={manejarSeccion('eventos')}>
                <span className="show-for-medium">Eventos especiales</span>
                <span className="hide-for-medium">Eventos</span>
              </a>
            </li>
            <li>
              <a href="#ubicacion" onClick={manejarSeccion('ubicacion')}>
                Ubicación
              </a>
            </li>
            <li>
              <button
                type="button"
                ref={botonMisReservasRef}
                className="site-header__btn-mis-reservas"
                onClick={() => setMisReservasAbierto(true)}
                aria-label="Mis reservas"
              >
                <Ticket size={18} aria-hidden="true" />
                <span className="show-for-medium">Mis reservas</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <MisReservas
            abierto={misReservasAbierto}
            onCerrar={() => setMisReservasAbierto(false)}
            botonDisparadorRef={botonMisReservasRef}
          />,
          document.body
        )}
    </header>
  );
}

export default Navbar;

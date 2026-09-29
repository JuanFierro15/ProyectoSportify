import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import './Navbar.css';

/**
 * Barra de navegación superior interactiva.
 *
 * Características:
 * - Al cargar la página o presionar "Inicio", la barra se visualiza en su estado
 *   inicial transparente (fondo invisible, solo letras legibles y destacadas sobre el video),
 *   permitiendo ir directamente a Canchas o Eventos sin necesidad de ver todos los videos.
 * - Al hacer scroll hacia abajo, la barra se oculta inmediatamente.
 * - Al hacer scroll hacia arriba o mover el cursor hacia el borde superior, la barra
 *   se vuelve a desplegar suavemente.
 * - Adapta automáticamente su contraste: transparente con letras blancas flotantes sobre
 *   el hero video, y superficie clara con letras oscuras al desplazarse más allá de los heros.
 */
function Navbar() {
  const [visible, setVisible] = useState(true);
  const [sobreHero, setSobreHero] = useState(true);
  const { abrirVista } = useVistaCanchas();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const checkHero = () => {
      const heros = document.getElementById('hero-placeholder');
      if (!heros) return true;
      const rect = heros.getBoundingClientRect();
      return rect.bottom > 80;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const enHero = checkHero();
      setSobreHero(enHero);

      if (currentScrollY <= 25) {
        // Estado inicial o tope de página: siempre visible y transparente
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

    // Sincronizar estado inicial al montar
    setSobreHero(checkHero());

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const irAInicio = () => {
    setVisible(true);
    setSobreHero(true);
  };

  return (
    <header
      className={`site-header ${
        visible ? 'site-header--visible' : 'site-header--hidden'
      } ${sobreHero ? 'site-header--transparent' : 'site-header--scrolled'}`}
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
            <span className="site-header__brand-text">Reservas Deportivas</span>
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
      </div>
    </header>
  );
}

export default Navbar;

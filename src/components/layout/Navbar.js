import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import './Navbar.css';

/**
 * Barra de navegación superior.
 *
 * Comportamiento:
 * - Durante la sección de placeholders / hero videos (#hero-placeholder),
 *   la navbar permanece COMPLETAMENTE OCULTA para dar protagonismo total
 *   al video y la animación en pantalla completa (100vh).
 * - Una vez que el usuario sale de los placeholders (al llegar a la sección
 *   de transición y catálogo), la barra se activa.
 * - En las secciones posteriores:
 *     - Al hacer scroll hacia abajo -> se oculta.
 *     - Al hacer scroll hacia arriba o mover el cursor hacia arriba -> se despliega.
 *     - Si se regresa al tope (#hero-placeholder) -> se oculta de inmediato.
 */
function Navbar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const estaEnPlaceholder = () => {
      const transicion = document.querySelector('.transicion-catalogo');
      if (!transicion) return true;
      const rect = transicion.getBoundingClientRect();
      // Si la sección de transición aún no ha llegado a la parte superior del viewport
      return rect.top > 60;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (estaEnPlaceholder()) {
        // En los heroes / placeholders: siempre oculta
        setVisible(false);
      } else {
        // Fuera de los placeholders:
        if (currentScrollY < lastScrollY - 4) {
          // Scroll hacia arriba -> mostrar
          setVisible(true);
        } else if (currentScrollY > lastScrollY + 4) {
          // Scroll hacia abajo -> ocultar
          setVisible(false);
        }
      }

      lastScrollY = currentScrollY;
    };

    const handleMouseMove = (e) => {
      // Si está en el hero placeholder, no se despliega nunca
      if (estaEnPlaceholder()) {
        setVisible(false);
        return;
      }

      // Fuera del hero: si el cursor se acerca al borde superior (< 80px)
      // o se desplaza con dirección hacia arriba en el tercio superior de la pantalla
      if (e.clientY <= 80 || (e.movementY < -3 && e.clientY < 260)) {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Comprobación inicial al montar
    if (estaEnPlaceholder()) {
      setVisible(false);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <header
      className={`site-header ${
        visible ? 'site-header--visible' : 'site-header--hidden'
      }`}
      aria-hidden={!visible}
    >
      <div className="top-bar" id="main-navbar">
        <div className="top-bar-left">
          <a href="#hero-placeholder" className="site-header__brand">
            <span className="site-header__brand-icon" aria-hidden="true">
              <Trophy size={20} />
            </span>
            <span className="site-header__brand-text">Reservas Deportivas</span>
          </a>
        </div>
        <div className="top-bar-right">
          <ul className="menu">
            <li>
              <a href="#hero-placeholder">Inicio</a>
            </li>
            <li>
              <a href="#canchas-placeholder">Canchas</a>
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

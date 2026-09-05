import React from 'react';

/**
 * Barra de navegación superior.
 * Usa el componente `top-bar` de Foundation junto con `menu`.
 * Bloque 1: solo estructura y enlaces ancla a los placeholders.
 */
function Navbar() {
  return (
    <header>
      <div className="top-bar" id="main-navbar">
        <div className="top-bar-left">
          <ul className="menu">
            <li className="menu-text">Reservas Deportivas</li>
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
        <div className="top-bar-right">
          <ul className="menu">
            <li>
              <a className="button" href="#reservas-placeholder">
                Reservar ahora
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

import React from 'react';
import { COLORES_LOGO, LOGO_SPORTIFY } from '../../data/logoSportify';

/**
 * Logo vectorial de Sportify ("S" bicolor + palabra "SPORTIFY").
 * La palabra usa `currentColor` para adaptarse al color del navbar.
 */
function LogoSportify({ className = '' }) {
  const clases = className ? `logo-sportify ${className}` : 'logo-sportify';

  return (
    <svg
      className={clases}
      viewBox={LOGO_SPORTIFY.viewBox}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={LOGO_SPORTIFY.naranja}
        fill={COLORES_LOGO.naranja}
        fillRule="evenodd"
      />
      <path
        d={LOGO_SPORTIFY.verde}
        fill={COLORES_LOGO.verde}
        fillRule="evenodd"
      />
      <path
        d={LOGO_SPORTIFY.palabra}
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export default LogoSportify;

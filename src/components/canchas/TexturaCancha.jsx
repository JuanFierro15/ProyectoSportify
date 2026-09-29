import React from 'react';

/**
 * TexturaCancha — trazos decorativos de fondo del escenario de VistaCanchas,
 * distintos por deporte (red + líneas de arena / líneas de servicio y
 * paredes / círculo central y áreas). Puramente decorativo: opacidad muy
 * baja, hereda `stroke` de `var(--accent)` por CSS (ver VistaCanchas.css),
 * no captura eventos ni se anuncia a lectores de pantalla.
 */
function TexturaCancha({ deporte }) {
  return (
    <svg
      className="vista-canchas__textura"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {deporte === 'voley-playa' && (
        <g fill="none" strokeWidth="2">
          <line x1="0" y1="150" x2="400" y2="150" />
          <line x1="60" y1="130" x2="60" y2="170" />
          <line x1="340" y1="130" x2="340" y2="170" />
          <path d="M -20 320 Q 100 290 200 320 T 420 320" />
          <path d="M -20 360 Q 100 335 200 360 T 420 360" />
        </g>
      )}

      {deporte === 'padel' && (
        <g fill="none" strokeWidth="2">
          <rect x="40" y="30" width="320" height="340" />
          <line x1="40" y1="200" x2="360" y2="200" />
          <line x1="200" y1="200" x2="200" y2="370" />
          <line x1="40" y1="120" x2="360" y2="120" strokeDasharray="6 8" />
        </g>
      )}

      {deporte === 'futbol' && (
        <g fill="none" strokeWidth="2">
          <line x1="0" y1="200" x2="400" y2="200" />
          <circle cx="200" cy="200" r="70" />
          <circle cx="200" cy="200" r="4" fill="currentColor" stroke="none" />
          <rect x="110" y="0" width="180" height="70" />
          <rect x="110" y="330" width="180" height="70" />
        </g>
      )}
    </svg>
  );
}

export default TexturaCancha;

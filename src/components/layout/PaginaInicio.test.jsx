import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReservasProvider } from '../../context/ReservasContext';
import { VistaCanchasProvider } from '../../context/VistaCanchasContext';
import PaginaInicio from './PaginaInicio';

const POSICIONES_ESPERADAS = [
  ['voley-playa', 'arriba-izquierda'],
  ['padel', 'izquierda'],
  ['futbol', 'abajo-derecha'],
];

describe('PaginaInicio', () => {
  it('pasa posicionTexto a cada DeporteHero según su deporte', () => {
    const { container } = render(
      <ReservasProvider>
        <VistaCanchasProvider>
          <PaginaInicio />
        </VistaCanchasProvider>
      </ReservasProvider>
    );

    for (const [slug, posicion] of POSICIONES_ESPERADAS) {
      const seccion = container.querySelector(
        `section.deporte-hero[data-sport="${slug}"]`
      );
      expect(seccion).not.toBeNull();
      expect(seccion).toHaveClass(`deporte-hero--texto-${posicion}`);
    }
  });
});

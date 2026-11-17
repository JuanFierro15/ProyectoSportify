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

  it('configura cada DeporteHero con fuente 1080p (-lg.mp4) desde 64em y 720p (.mp4) de respaldo en los tres deportes', () => {
    const { container } = render(
      <ReservasProvider>
        <VistaCanchasProvider>
          <PaginaInicio />
        </VistaCanchasProvider>
      </ReservasProvider>
    );

    const deportes = [
      ['voley-playa', 'hero_voleyplaya'],
      ['padel', 'hero_padel'],
      ['futbol', 'hero_futbol'],
    ];

    for (const [slug, archivo] of deportes) {
      const seccion = container.querySelector(
        `section.deporte-hero[data-sport="${slug}"]`
      );
      expect(seccion).not.toBeNull();
      const video = seccion.querySelector('video');
      expect(video).not.toBeNull();
      expect(video).not.toHaveAttribute('src');

      const sources = video.querySelectorAll('source');
      expect(sources).toHaveLength(2);
      expect(sources[0]).toHaveAttribute('src', `/media/${archivo}-lg.mp4`);
      expect(sources[0]).toHaveAttribute('media', '(min-width: 64em)');
      expect(sources[0]).toHaveAttribute('type', 'video/mp4');
      expect(sources[1]).toHaveAttribute('src', `/media/${archivo}.mp4`);
      expect(sources[1]).toHaveAttribute('type', 'video/mp4');
      expect(sources[1]).not.toHaveAttribute('media');
    }
  });
});

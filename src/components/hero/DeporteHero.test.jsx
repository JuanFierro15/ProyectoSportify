import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import DeporteHero from './DeporteHero';

const PROPS_VALIDAS = {
  nombre: 'Voley Playa',
  slug: 'voley-playa',
  videoSrc: '/media/hero_voleyplaya.mp4',
  posterSrc: '/media/hero_voleyplaya-poster.webp',
  tituloCTA: 'Ver canchas de voley playa',
  colorAcento: '#f6a94b',
  eyebrow: 'Arena de nivel profesional',
  descripcion: 'Siente la arena fina bajo tus pies en canchas reglamentarias.',
};

function simularMatchMedia(queryActiva) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === queryActiva,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

describe('DeporteHero - pausa del video en el cleanup', () => {
  let matchMediaOriginal;

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    vi.restoreAllMocks();
  });

  it('llama a video.pause() al desmontar con prefers-reduced-motion: no-preference', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const spyPause = vi.spyOn(window.HTMLMediaElement.prototype, 'pause');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );
    expect(spyPause).not.toHaveBeenCalled();

    unmount();
    expect(spyPause).toHaveBeenCalled();
  });

  it('llama a video.pause() al desmontar con prefers-reduced-motion: reduce', () => {
    simularMatchMedia('(prefers-reduced-motion: reduce)');
    const spyPause = vi.spyOn(window.HTMLMediaElement.prototype, 'pause');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );
    expect(spyPause).not.toHaveBeenCalled();

    unmount();
    expect(spyPause).toHaveBeenCalledTimes(1);
  });
});

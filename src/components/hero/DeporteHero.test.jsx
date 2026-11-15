import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
    expect(spyPause).toHaveBeenCalledTimes(2);
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

describe('DeporteHero - modo snap por URL', () => {
  let matchMediaOriginal;
  let urlOriginal;

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia;
    urlOriginal = window.location.href;
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    window.history.replaceState(null, '', urlOriginal);
    ScrollTrigger.getAll().forEach((t) => t.kill());
    vi.restoreAllMocks();
  });

  it('agrega snap direccional en ScrollTrigger cuando ?hero=snap está presente', () => {
    window.history.replaceState(null, '', '/?hero=snap');
    simularMatchMedia('(prefers-reduced-motion: no-preference)');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    const triggers = ScrollTrigger.getAll();
    expect(triggers.length).toBeGreaterThan(0);
    const triggerConSnap = triggers.find((t) => t.vars?.snap !== undefined);
    expect(triggerConSnap).toBeDefined();
    expect(triggerConSnap.vars.snap).toEqual({
      snapTo: [0, 0.15, 1],
      directional: true,
      inertia: false,
      delay: 0.05,
      duration: { min: 0.8, max: 2.2 },
      ease: 'power1.inOut',
    });

    unmount();
  });

  it('mantiene vars.snap como undefined cuando no hay parámetro ?hero=snap', () => {
    window.history.replaceState(null, '', '/');
    simularMatchMedia('(prefers-reduced-motion: no-preference)');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    const triggers = ScrollTrigger.getAll();
    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers[0].vars.snap).toBeUndefined();

    unmount();
  });
});

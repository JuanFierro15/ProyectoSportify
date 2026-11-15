import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import DeporteHero from './DeporteHero';
import { registrarHeroSnap } from './controladorSnapHero';

vi.mock('./controladorSnapHero', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    registrarHeroSnap: vi.fn((params) =>
      vi.fn(original.registrarHeroSnap(params))
    ),
  };
});

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

describe('DeporteHero - controlador snap', () => {
  let matchMediaOriginal;

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia;
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    ScrollTrigger.getAll().forEach((t) => t.kill());
    vi.restoreAllMocks();
  });

  it('con no-preference no define vars.snap y registra el hero en el controlador snap', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const spyAdd = vi.spyOn(ScrollTrigger, 'addEventListener');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    const triggers = ScrollTrigger.getAll();
    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers[0].vars.snap).toBeUndefined();

    expect(registrarHeroSnap).toHaveBeenCalledTimes(1);
    expect(registrarHeroSnap).toHaveBeenCalledWith({
      seccion: expect.any(HTMLElement),
      video: expect.any(HTMLVideoElement),
      st: triggers[0],
      progresoObjetivo: expect.any(Function),
    });

    const llamadaScrollEnd = spyAdd.mock.calls.find(
      ([evento]) => evento === 'scrollEnd'
    );
    expect(llamadaScrollEnd).toBeDefined();

    unmount();
  });

  it('con prefers-reduced-motion: reduce no registra el hero en el controlador snap ni escucha scrollEnd', () => {
    simularMatchMedia('(prefers-reduced-motion: reduce)');
    const spyAdd = vi.spyOn(ScrollTrigger, 'addEventListener');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    expect(ScrollTrigger.getAll()).toHaveLength(0);
    expect(registrarHeroSnap).not.toHaveBeenCalled();
    const llamadasScrollEnd = spyAdd.mock.calls.filter(
      ([evento]) => evento === 'scrollEnd'
    );
    expect(llamadasScrollEnd).toHaveLength(0);

    unmount();
  });

  it('al desmontar con no-preference se desregistra del controlador y quita scrollEnd', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const spyAdd = vi.spyOn(ScrollTrigger, 'addEventListener');
    const spyRemove = vi.spyOn(ScrollTrigger, 'removeEventListener');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    const desregistrar = registrarHeroSnap.mock.results[0].value;
    expect(desregistrar).not.toHaveBeenCalled();

    const llamadaScrollEnd = spyAdd.mock.calls.find(
      ([evento]) => evento === 'scrollEnd'
    );
    expect(llamadaScrollEnd).toBeDefined();
    const handler = llamadaScrollEnd[1];

    unmount();

    expect(desregistrar).toHaveBeenCalledTimes(1);
    expect(spyRemove).toHaveBeenCalledWith('scrollEnd', handler);
  });
});

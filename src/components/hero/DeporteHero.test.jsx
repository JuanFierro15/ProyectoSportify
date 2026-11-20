import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import DeporteHero from './DeporteHero';
import { registrarHeroSnap } from './controladorSnapHero';
import {
  DURACION_FADE_CONTENIDO,
  MEDIA_VIDEO_GRANDE,
} from '../../lib/modoHero';

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
  let intersectionObserverOriginal;

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia;
    intersectionObserverOriginal = window.IntersectionObserver;
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    window.IntersectionObserver = intersectionObserverOriginal;
    ScrollTrigger.getAll().forEach((t) => t.kill());
    vi.restoreAllMocks();
  });

  it('con no-preference registra el hero en el controlador snap y escucha scrollEnd', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const spyAdd = vi.spyOn(ScrollTrigger, 'addEventListener');

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    const triggers = ScrollTrigger.getAll();
    expect(triggers.length).toBeGreaterThan(0);

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

  it("crea IntersectionObserver con rootMargin '0px' para la precarga del video", () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const spyObserver = vi.fn(function (callback, options) {
      return new intersectionObserverOriginal(callback, options);
    });
    window.IntersectionObserver = spyObserver;

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    expect(spyObserver).toHaveBeenCalledTimes(1);
    expect(spyObserver).toHaveBeenCalledWith(expect.any(Function), {
      rootMargin: '0px',
    });

    unmount();
  });

  it('cuando IntersectionObserver reporta isIntersecting: true, cambia video.preload a auto y llama a disconnect', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    let callbackObserver = null;
    const instanciaObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    window.IntersectionObserver = vi.fn(function (callback) {
      callbackObserver = callback;
      return instanciaObserver;
    });

    const { container, unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    const seccion = container.querySelector('section');
    const video = container.querySelector('video');
    expect(instanciaObserver.observe).toHaveBeenCalledWith(seccion);
    expect(video.preload).toBe('metadata');
    expect(instanciaObserver.disconnect).not.toHaveBeenCalled();

    callbackObserver([{ isIntersecting: true }]);

    expect(video.preload).toBe('auto');
    expect(instanciaObserver.disconnect).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('al desmontar sin intersección previa llama a disconnect del IntersectionObserver', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const instanciaObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    window.IntersectionObserver = vi.fn(function () {
      return instanciaObserver;
    });

    const { unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    expect(instanciaObserver.observe).toHaveBeenCalledTimes(1);
    expect(instanciaObserver.disconnect).not.toHaveBeenCalled();

    unmount();

    expect(instanciaObserver.disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('DeporteHero - posicionTexto', () => {
  it('agrega la clase deporte-hero--texto-arriba-izquierda cuando posicionTexto es "arriba-izquierda"', () => {
    const { container } = render(
      <DeporteHero {...PROPS_VALIDAS} posicionTexto="arriba-izquierda" />
    );

    const seccion = container.querySelector('section');
    expect(seccion).toHaveClass('deporte-hero--texto-arriba-izquierda');
  });

  it('agrega la clase deporte-hero--texto-abajo-derecha cuando posicionTexto es "abajo-derecha"', () => {
    const { container } = render(
      <DeporteHero {...PROPS_VALIDAS} posicionTexto="abajo-derecha" />
    );

    const seccion = container.querySelector('section');
    expect(seccion).toHaveClass('deporte-hero--texto-abajo-derecha');
  });

  it('agrega la clase deporte-hero--texto-abajo-izquierda cuando posicionTexto es "abajo-izquierda"', () => {
    const { container } = render(
      <DeporteHero {...PROPS_VALIDAS} posicionTexto="abajo-izquierda" />
    );

    const seccion = container.querySelector('section');
    expect(seccion).toHaveClass('deporte-hero--texto-abajo-izquierda');
  });

  it('usa deporte-hero--texto-izquierda por defecto cuando falta posicionTexto', () => {
    const { container } = render(<DeporteHero {...PROPS_VALIDAS} />);

    const seccion = container.querySelector('section');
    expect(seccion).toHaveClass('deporte-hero--texto-izquierda');
  });

  it('usa deporte-hero--texto-izquierda cuando posicionTexto es inválido', () => {
    const { container } = render(
      <DeporteHero {...PROPS_VALIDAS} posicionTexto="arriba-centro" />
    );

    const seccion = container.querySelector('section');
    expect(seccion).toHaveClass('deporte-hero--texto-izquierda');
  });
});

describe('DeporteHero - animación del bloque de texto', () => {
  let matchMediaOriginal;

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    ScrollTrigger.getAll().forEach((t) => t.kill());
    vi.restoreAllMocks();
  });

  it('anima fade y escala sobre .deporte-hero__bloque y los limpia al desmontar', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');

    const { container, unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} />
      </div>
    );

    const contenido = container.querySelector('.deporte-hero__contenido');
    const bloque = container.querySelector('.deporte-hero__bloque');

    expect(gsap.getTweensOf(contenido)).toHaveLength(0);

    const tweensBloque = gsap.getTweensOf(bloque);
    expect(tweensBloque).toHaveLength(2);
    expect(tweensBloque[0].vars.scale).toBe(1);
    expect(tweensBloque[0].vars.autoAlpha).toBe(1);
    expect(tweensBloque[1].vars.scale).toBe(1.06);
    expect(tweensBloque[1].vars.autoAlpha).toBe(0);

    unmount();

    expect(gsap.getTweensOf(bloque)).toHaveLength(0);
    expect(ScrollTrigger.getAll()).toHaveLength(0);
  });

  it('con textoVisibleAlInicio arranca visible en progreso 0, mantiene el tween de salida, vuelve a ser visible al regresar a 0 y limpia al desmontar', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');

    const { container, unmount } = render(
      <div>
        <DeporteHero {...PROPS_VALIDAS} textoVisibleAlInicio />
      </div>
    );

    const bloque = container.querySelector('.deporte-hero__bloque');
    const tweensBloque = gsap.getTweensOf(bloque);

    expect(tweensBloque).toHaveLength(1);
    const tweenSalida = tweensBloque[0];
    expect(tweenSalida.vars.autoAlpha).toBe(0);
    expect(tweenSalida.vars.scale).toBe(1.06);
    expect(tweenSalida.vars.y).toBe(-14);
    expect(tweenSalida.startTime()).toBeCloseTo(1 - DURACION_FADE_CONTENIDO, 5);

    const tl = ScrollTrigger.getAll()[0].animation;
    expect(tweenSalida.parent).toBe(tl);
    tl.progress(0);
    expect(getComputedStyle(bloque).opacity).toBe('1');
    expect(getComputedStyle(bloque).visibility).not.toBe('hidden');
    expect(gsap.getProperty(bloque, 'scale')).toBe(1);
    expect(gsap.getProperty(bloque, 'y')).toBe(0);

    tl.progress(1);
    expect(getComputedStyle(bloque).opacity).toBe('0');
    expect(getComputedStyle(bloque).visibility).toBe('hidden');
    expect(gsap.getProperty(bloque, 'scale')).toBe(1.06);
    expect(gsap.getProperty(bloque, 'y')).toBe(-14);

    tl.progress(0);
    expect(getComputedStyle(bloque).opacity).toBe('1');
    expect(getComputedStyle(bloque).visibility).not.toBe('hidden');
    expect(gsap.getProperty(bloque, 'scale')).toBe(1);
    expect(gsap.getProperty(bloque, 'y')).toBe(0);

    unmount();

    expect(gsap.getTweensOf(bloque)).toHaveLength(0);
    expect(ScrollTrigger.getAll()).toHaveLength(0);
  });

  it('con prefers-reduced-motion: reduce no crea tweens sobre el bloque con ni sin textoVisibleAlInicio', () => {
    simularMatchMedia('(prefers-reduced-motion: reduce)');

    for (const textoVisibleAlInicio of [false, true]) {
      const { container, unmount } = render(
        <div>
          <DeporteHero
            {...PROPS_VALIDAS}
            textoVisibleAlInicio={textoVisibleAlInicio}
          />
        </div>
      );

      const bloque = container.querySelector('.deporte-hero__bloque');
      expect(gsap.getTweensOf(bloque)).toHaveLength(0);
      expect(ScrollTrigger.getAll()).toHaveLength(0);

      unmount();
    }
  });
});

describe('DeporteHero - fuentes de video responsivas', () => {
  it('usa src directo en <video> y no renderiza <source> cuando no se pasa videoSrcLg', () => {
    const { container } = render(<DeporteHero {...PROPS_VALIDAS} />);

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('src', '/media/hero_voleyplaya.mp4');
    expect(video.querySelectorAll('source')).toHaveLength(0);
  });

  it('usa src directo en <video> cuando videoSrcLg es cadena vacía', () => {
    const { container } = render(
      <DeporteHero {...PROPS_VALIDAS} videoSrcLg="" />
    );

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('src', '/media/hero_voleyplaya.mp4');
    expect(video.querySelectorAll('source')).toHaveLength(0);
  });

  it('renderiza dos <source> en orden (1080p con min-width: 64em y 720p de respaldo) y omite src en <video> cuando recibe videoSrcLg', () => {
    const { container } = render(
      <DeporteHero
        {...PROPS_VALIDAS}
        videoSrcLg="/media/hero_voleyplaya-lg.mp4"
      />
    );

    const video = container.querySelector('video');
    expect(video).not.toHaveAttribute('src');

    const sources = video.querySelectorAll('source');
    expect(sources).toHaveLength(2);
    expect(sources[0]).toHaveAttribute('src', '/media/hero_voleyplaya-lg.mp4');
    expect(sources[0]).toHaveAttribute('media', MEDIA_VIDEO_GRANDE);
    expect(sources[0]).toHaveAttribute('type', 'video/mp4');
    expect(sources[1]).toHaveAttribute('src', '/media/hero_voleyplaya.mp4');
    expect(sources[1]).toHaveAttribute('type', 'video/mp4');
    expect(sources[1]).not.toHaveAttribute('media');
  });
});

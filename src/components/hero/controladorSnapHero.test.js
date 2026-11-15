import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  heroEstaReproduciendo,
  registrarHeroSnap,
} from './controladorSnapHero';

function crearVideoMock({ duration = 10, currentTime = 0, ended = false } = {}) {
  const video = new EventTarget();
  video.duration = duration;
  video.currentTime = currentTime;
  video.ended = ended;
  video.play = vi.fn(() => Promise.resolve());
  video.pause = vi.fn();
  return video;
}

function fijarScrollY(valor) {
  Object.defineProperty(window, 'scrollY', {
    value: valor,
    configurable: true,
    writable: true,
  });
}

describe('controladorSnapHero', () => {
  let scrollYOriginal;
  let spyWinAdd;
  let spyWinRemove;
  let spySTAdd;
  let spySTRemove;
  let tweens;
  let desregistradores;

  function registrar(hero) {
    const desregistrar = registrarHeroSnap(hero);
    desregistradores.push(desregistrar);
    return desregistrar;
  }

  function obtenerScrollEndActivos() {
    const activos = new Set();
    for (const [evento, fn] of spySTAdd.mock.calls) {
      if (evento === 'scrollEnd') activos.add(fn);
    }
    for (const [evento, fn] of spySTRemove.mock.calls) {
      if (evento === 'scrollEnd') activos.delete(fn);
    }
    return [...activos];
  }

  function dispararScrollEnd() {
    for (const fn of obtenerScrollEndActivos()) {
      fn();
    }
  }

  function simularGestoAbajo(y) {
    window.dispatchEvent(new Event('wheel'));
    fijarScrollY(y);
    window.dispatchEvent(new Event('scroll'));
  }

  beforeEach(() => {
    scrollYOriginal = Object.getOwnPropertyDescriptor(window, 'scrollY');
    fijarScrollY(0);
    tweens = [];
    desregistradores = [];

    spyWinAdd = vi.spyOn(window, 'addEventListener');
    spyWinRemove = vi.spyOn(window, 'removeEventListener');
    spySTAdd = vi.spyOn(ScrollTrigger, 'addEventListener');
    spySTRemove = vi.spyOn(ScrollTrigger, 'removeEventListener');

    vi.spyOn(window, 'scrollTo').mockImplementation((_x, y) => {
      if (typeof y === 'number') {
        fijarScrollY(y);
      }
    });

    vi.spyOn(gsap, 'to').mockImplementation((target, vars) => {
      const tweenMock = {
        target,
        vars,
        kill: vi.fn(),
      };
      tweens.push(tweenMock);
      return tweenMock;
    });
  });

  afterEach(() => {
    desregistradores.splice(0).forEach((d) => d());
    document.getElementById('eventos')?.remove();
    if (scrollYOriginal) {
      Object.defineProperty(window, 'scrollY', scrollYOriginal);
    } else {
      delete window.scrollY;
    }
    vi.restoreAllMocks();
  });

  it('registra los listeners globales una sola vez con 2 heros y los quita solo al desregistrar el último', () => {
    const d1 = registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock(),
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0,
    });
    const d2 = registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock(),
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });

    const addWheel = spyWinAdd.mock.calls.filter(([ev]) => ev === 'wheel');
    const addScrollEnd = spySTAdd.mock.calls.filter(([ev]) => ev === 'scrollEnd');
    expect(addWheel).toHaveLength(1);
    expect(addScrollEnd).toHaveLength(1);

    d1();

    expect(
      spyWinRemove.mock.calls.filter(([ev]) => ev === 'wheel')
    ).toHaveLength(0);
    expect(
      spySTRemove.mock.calls.filter(([ev]) => ev === 'scrollEnd')
    ).toHaveLength(0);

    d2();

    const removeWheel = spyWinRemove.mock.calls.filter(([ev]) => ev === 'wheel');
    const removeScrollEnd = spySTRemove.mock.calls.filter(
      ([ev]) => ev === 'scrollEnd'
    );
    expect(removeWheel).toHaveLength(1);
    expect(removeWheel[0][1]).toBe(addWheel[0][1]);
    expect(removeScrollEnd).toHaveLength(1);
    expect(removeScrollEnd[0][1]).toBe(addScrollEnd[0][1]);
  });

  it('inicia reproducción nativa tras un gesto hacia abajo y parada en progreso 0.5', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();

    expect(video.play).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(true);
  });

  it('después de finAuto, un scrollEnd sin entrada nueva del usuario no hace nada', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    let progreso = 0.05;
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => progreso,
    });

    simularGestoAbajo(50);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);

    // Simula el final del deslizamiento automático; aunque y esté en zona de
    // reproducción, sin una entrada nueva del usuario scrollEnd no debe actuar.
    fijarScrollY(500);
    progreso = 0.5;
    tweens[0].vars.onComplete();

    dispararScrollEnd();

    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video.play).not.toHaveBeenCalled();
  });

  it('cancela con touchstart durante la reproducción y el scrollEnd siguiente no vuelve a llamar a play', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();
    expect(video.play).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('touchstart'));

    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);

    dispararScrollEnd();

    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('al terminar el video (ended) desliza al reposo del hero siguiente aunque se registrara antes', () => {
    const start2 = 2000;
    const end2 = 3000;
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: start2, end: end2 },
      progresoObjetivo: () => 0,
    });

    const video1 = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();
    expect(video1.play).toHaveBeenCalledTimes(1);

    video1.dispatchEvent(new Event('ended'));

    expect(window.scrollTo).toHaveBeenCalledWith(0, 1000);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo).toEqual({
      y: start2 + 0.15 * (end2 - start2),
      autoKill: false,
    });
    expect(tweens[0].vars.duration).toBe(0.9);
  });

  it('en el último hero con #eventos desliza a top - 80 y allí scrollEnd no hace nada aun con entrada nueva', () => {
    const eventos = document.createElement('div');
    eventos.id = 'eventos';
    eventos.style.scrollMarginTop = '80px';
    const topAbsoluto = 1800;
    eventos.getBoundingClientRect = () => ({
      top: topAbsoluto - window.scrollY,
    });
    document.body.appendChild(eventos);

    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();
    video.dispatchEvent(new Event('ended'));

    const destinoEsperado = topAbsoluto - 80;
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo).toEqual({
      y: destinoEsperado,
      autoKill: false,
    });

    fijarScrollY(destinoEsperado);
    tweens[0].vars.onComplete();

    // Nueva entrada del usuario hacia abajo estando ya en el destino de #eventos.
    simularGestoAbajo(destinoEsperado);
    dispararScrollEnd();

    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('hace seek a progreso * dur antes de play cuando el video está ended', () => {
    const dur = 10;
    const video = crearVideoMock({
      duration: dur,
      currentTime: dur,
      ended: true,
    });
    let tiempoAntesDePlay = null;
    video.play.mockImplementation(() => {
      tiempoAntesDePlay = video.currentTime;
      return Promise.resolve();
    });

    registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();

    expect(video.play).toHaveBeenCalledTimes(1);
    expect(tiempoAntesDePlay).toBe(0.5 * dur);
    expect(video.currentTime).toBe(0.5 * dur);
  });

  it('con progreso >= 1 - 0.05 / dur no llama a play y desliza al siguiente hero', () => {
    const dur = 10;
    const progresoLimite = 1 - 0.05 / dur;
    const video1 = crearVideoMock({ duration: dur });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => progresoLimite,
    });
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: dur }),
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });

    simularGestoAbajo(progresoLimite * 1000);
    dispararScrollEnd();

    expect(video1.play).not.toHaveBeenCalled();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo).toEqual({
      y: 2000 + 0.15 * 1000,
      autoKill: false,
    });
  });

  it('desregistrar el hero que reproduce cancela sin llamar a pause extra', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    const desregistrar = registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    desregistrar();

    expect(heroEstaReproduciendo(seccion)).toBe(false);
    expect(video.pause).not.toHaveBeenCalled();
  });

  it('cancela si video.play() devuelve una promesa rechazada', async () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    video.play.mockImplementation(() =>
      Promise.reject(new Error('Autoplay bloqueado'))
    );

    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();

    await Promise.resolve();

    expect(heroEstaReproduciendo(seccion)).toBe(false);
    expect(video.pause).toHaveBeenCalledTimes(1);
  });
});

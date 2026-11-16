import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  heroEstaReproduciendo,
  registrarHeroSnap,
} from './controladorSnapHero';

function crearVideoMock({
  duration = 10,
  currentTime = 0,
  ended = false,
  preload = 'metadata',
} = {}) {
  const video = new EventTarget();
  video.duration = duration;
  video.currentTime = currentTime;
  video.ended = ended;
  video.preload = preload;
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
    vi.useRealTimers();
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
    const addClick = spyWinAdd.mock.calls.filter(([ev]) => ev === 'click');
    const addScrollEnd = spySTAdd.mock.calls.filter(([ev]) => ev === 'scrollEnd');
    expect(addWheel).toHaveLength(1);
    expect(addClick).toHaveLength(1);
    expect(addClick[0][2]).toEqual({ capture: true, passive: true });
    expect(addScrollEnd).toHaveLength(1);

    d1();

    expect(
      spyWinRemove.mock.calls.filter(([ev]) => ev === 'wheel')
    ).toHaveLength(0);
    expect(
      spyWinRemove.mock.calls.filter(([ev]) => ev === 'click')
    ).toHaveLength(0);
    expect(
      spySTRemove.mock.calls.filter(([ev]) => ev === 'scrollEnd')
    ).toHaveLength(0);

    d2();

    const removeWheel = spyWinRemove.mock.calls.filter(([ev]) => ev === 'wheel');
    const removeClick = spyWinRemove.mock.calls.filter(([ev]) => ev === 'click');
    const removeScrollEnd = spySTRemove.mock.calls.filter(
      ([ev]) => ev === 'scrollEnd'
    );
    expect(removeWheel).toHaveLength(1);
    expect(removeWheel[0][1]).toBe(addWheel[0][1]);
    expect(removeClick).toHaveLength(1);
    expect(removeClick[0][1]).toBe(addClick[0][1]);
    expect(removeClick[0][2]).toEqual({ capture: true });
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
      autoKill: true,
      onAutoKill: expect.any(Function),
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
      autoKill: true,
      onAutoKill: expect.any(Function),
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
      autoKill: true,
      onAutoKill: expect.any(Function),
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

  it('cancela con wheel durante la reproducción y el scrollEnd siguiente no vuelve a llamar a play', () => {
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

    window.dispatchEvent(new Event('wheel'));

    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);

    dispararScrollEnd();

    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('cancela con tecla ArrowDown durante la reproducción y el scrollEnd siguiente no vuelve a llamar a play', () => {
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

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);

    dispararScrollEnd();

    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('un keydown de espacio cuyo target es un <input>, <textarea>, <select> o contentEditable NO cancela', () => {
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

    const editable = document.createElement('div');
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    const campos = [
      document.createElement('input'),
      document.createElement('textarea'),
      document.createElement('select'),
      editable,
    ];

    for (const campo of campos) {
      document.body.appendChild(campo);
      campo.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      );
      campo.remove();
    }

    expect(video.pause).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(true);
  });

  it('scroll externo durante la reproducción (> 4 px) cancela y no vuelve a llamar a scrollTo', () => {
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
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    video.currentTime = 5.5;
    gsap.ticker.tick();
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 550);

    window.scrollTo.mockClear();
    video.currentTime = 6;
    fijarScrollY(555);
    gsap.ticker.tick();

    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('con exactamente 4 px de diferencia respecto a lo escrito NO cancela', () => {
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

    video.currentTime = 5.5;
    gsap.ticker.tick();
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 550);

    window.scrollTo.mockClear();
    video.currentTime = 6;
    fijarScrollY(554);
    gsap.ticker.tick();

    expect(video.pause).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(true);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 600);
  });

  it('pointerdown durante la reproducción cancela y sin avance no marca entrada', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    // pointerdown en reposo no habilita scrollEnd posterior.
    fijarScrollY(500);
    window.dispatchEvent(new Event('pointerdown'));
    dispararScrollEnd();
    expect(video.play).not.toHaveBeenCalled();

    simularGestoAbajo(500);
    dispararScrollEnd();
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    window.dispatchEvent(new Event('pointerdown'));
    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);

    dispararScrollEnd();
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('pointerdown durante el deslizamiento (deslizarA) mata el tween y limpia el estado', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.05,
    });

    simularGestoAbajo(50);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('pointerdown'));
    expect(tweens[0].kill).toHaveBeenCalledTimes(1);

    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video.pause).not.toHaveBeenCalled();
  });

  it('click sobre un enlace durante la reproducción cancela (pause) y un scrollEnd siguiente no llama a play', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    const enlace = document.createElement('a');
    enlace.href = '#ubicacion';
    document.body.appendChild(enlace);

    simularGestoAbajo(500);
    dispararScrollEnd();
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    enlace.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);

    dispararScrollEnd();
    expect(video.play).toHaveBeenCalledTimes(1);

    enlace.remove();
  });

  it('click sobre un enlace durante un deslizamiento (deslizarA) mata el tween una vez', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.05,
    });

    const enlace = document.createElement('a');
    enlace.href = '#ubicacion';
    document.body.appendChild(enlace);

    simularGestoAbajo(50);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);

    enlace.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(tweens[0].kill).toHaveBeenCalledTimes(1);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video.pause).not.toHaveBeenCalled();

    enlace.remove();
  });

  it('click sobre un enlace en reposo, sin avance, seguido de scrollEnd NO llama a play', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    const enlace = document.createElement('a');
    enlace.href = '#ubicacion';
    document.body.appendChild(enlace);

    fijarScrollY(500);
    enlace.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    dispararScrollEnd();

    expect(video.play).not.toHaveBeenCalled();
    expect(gsap.to).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(false);

    enlace.remove();
  });

  it('deslizarA pasa autoKill: true y al invocar onAutoKill deja el estado limpio', () => {
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
    expect(tweens[0].vars.scrollTo.autoKill).toBe(true);
    expect(typeof tweens[0].vars.scrollTo.onAutoKill).toBe('function');

    fijarScrollY(500);
    progreso = 0.5;
    tweens[0].vars.scrollTo.onAutoKill();

    expect(video.pause).not.toHaveBeenCalled();
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video.play).not.toHaveBeenCalled();
  });

  it('estado inicial: un scrollEnd sin entrada previa del usuario a mitad de un hero NO llama a play', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    fijarScrollY(500);
    window.dispatchEvent(new Event('scroll'));
    dispararScrollEnd();

    expect(video.play).not.toHaveBeenCalled();
    expect(gsap.to).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(false);
  });

  it('con dedoAbajo (touchstart sin touchend), scrollEnd no actúa; tras touchend y 200 ms sin inercia sí actúa', () => {
    vi.useFakeTimers();
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    window.dispatchEvent(new Event('touchstart'));
    window.dispatchEvent(new Event('touchmove'));
    fijarScrollY(500);
    window.dispatchEvent(new Event('scroll'));

    dispararScrollEnd();
    expect(video.play).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('touchend'));
    vi.advanceTimersByTime(199);
    expect(video.play).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    vi.useRealTimers();
  });

  it('tras touchend, si scrollY cambia por inercia antes de 200 ms, el timeout no actúa', () => {
    vi.useFakeTimers();
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    window.dispatchEvent(new Event('touchstart'));
    window.dispatchEvent(new Event('touchmove'));
    fijarScrollY(500);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('touchend'));

    // La inercia mueve scrollY antes de que venzan los 200 ms.
    fijarScrollY(560);
    vi.advanceTimersByTime(200);
    expect(video.play).not.toHaveBeenCalled();

    // El nuevo touchstart también limpia cualquier timeout previo y touchcancel libera dedoAbajo.
    window.dispatchEvent(new Event('touchstart'));
    window.dispatchEvent(new Event('touchcancel'));
    dispararScrollEnd();
    expect(video.play).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('al reproducir el hero 1 con 3 heros registrados pone preload = "auto" en el hero 2 y deja el 3 en "metadata"', () => {
    const video1 = crearVideoMock({ duration: 10, preload: 'metadata' });
    const video2 = crearVideoMock({ duration: 10, preload: 'metadata' });
    const video3 = crearVideoMock({ duration: 10, preload: 'metadata' });

    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video3,
      st: { start: 4000, end: 5000 },
      progresoObjetivo: () => 0,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();

    expect(video1.play).toHaveBeenCalledTimes(1);
    expect(video2.preload).toBe('auto');
    expect(video3.preload).toBe('metadata');
    expect(video1.preload).toBe('metadata');
  });

  it('al reproducir el último hero no cambia el preload de ningún otro hero', () => {
    const video1 = crearVideoMock({ duration: 10, preload: 'metadata' });
    const video2 = crearVideoMock({ duration: 10, preload: 'metadata' });
    const video3 = crearVideoMock({ duration: 10, preload: 'metadata' });

    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video3,
      st: { start: 4000, end: 5000 },
      progresoObjetivo: () => 0.5,
    });

    simularGestoAbajo(4500);
    dispararScrollEnd();

    expect(video3.play).toHaveBeenCalledTimes(1);
    expect(video1.preload).toBe('metadata');
    expect(video2.preload).toBe('metadata');
    expect(video3.preload).toBe('metadata');
  });

  it('antes de reproducir (solo registrar y scrollEnd sin entrada) ningún preload cambia', () => {
    const video1 = crearVideoMock({ duration: 10, preload: 'metadata' });
    const video2 = crearVideoMock({ duration: 10, preload: 'metadata' });
    const video3 = crearVideoMock({ duration: 10, preload: 'metadata' });

    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video3,
      st: { start: 4000, end: 5000 },
      progresoObjetivo: () => 0,
    });

    fijarScrollY(500);
    window.dispatchEvent(new Event('scroll'));
    dispararScrollEnd();

    expect(video1.play).not.toHaveBeenCalled();
    expect(video1.preload).toBe('metadata');
    expect(video2.preload).toBe('metadata');
    expect(video3.preload).toBe('metadata');
  });

  it('si reproducir sale antes por progreso al final (irAlSiguiente sin play) no precarga ningún hero extra', () => {
    const dur = 10;
    const progresoLimite = 1 - 0.05 / dur;
    const video1 = crearVideoMock({ duration: dur, preload: 'metadata' });
    const video2 = crearVideoMock({ duration: dur, preload: 'metadata' });
    const video3 = crearVideoMock({ duration: dur, preload: 'metadata' });

    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => progresoLimite,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video3,
      st: { start: 4000, end: 5000 },
      progresoObjetivo: () => 0,
    });

    simularGestoAbajo(progresoLimite * 1000);
    dispararScrollEnd();

    expect(video1.play).not.toHaveBeenCalled();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video1.preload).toBe('metadata');
    expect(video2.preload).toBe('metadata');
    expect(video3.preload).toBe('metadata');
  });

  it.each([NaN, 0, Infinity])(
    'con video.duration = %s, un gesto y scrollEnd a mitad del hero no llaman a play',
    (duracion) => {
      const seccion = document.createElement('section');
      const video = crearVideoMock({ duration: duracion });
      registrar({
        seccion,
        video,
        st: { start: 0, end: 1000 },
        progresoObjetivo: () => 0.5,
      });

      simularGestoAbajo(500);
      dispararScrollEnd();

      expect(video.play).not.toHaveBeenCalled();
      expect(heroEstaReproduciendo(seccion)).toBe(false);
    }
  );

  it('en el último hero sin #eventos en el DOM, ended no llama a gsap.to y scrollEnd sin entrada nueva no hace nada', () => {
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

    video.dispatchEvent(new Event('ended'));

    expect(gsap.to).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(false);

    dispararScrollEnd();

    expect(gsap.to).not.toHaveBeenCalled();
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('al desregistrar el último hero llama a gsap.ticker.remove con la función pasada a gsap.ticker.add', () => {
    const spyTickerAdd = vi.spyOn(gsap.ticker, 'add');
    const spyTickerRemove = vi.spyOn(gsap.ticker, 'remove');

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

    expect(spyTickerAdd).toHaveBeenCalledTimes(1);
    const fnTicker = spyTickerAdd.mock.calls[0][0];
    // gsap.ticker.add llama internamente a remove() para evitar duplicados.
    spyTickerRemove.mockClear();

    d1();
    expect(spyTickerRemove).not.toHaveBeenCalled();

    d2();
    expect(spyTickerRemove).toHaveBeenCalledTimes(1);
    expect(spyTickerRemove).toHaveBeenCalledWith(fnTicker);
  });

  it('al desregistrar el último hero a mitad del deslizamiento llama a kill en el tween', () => {
    const desregistrar = registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.05,
    });

    simularGestoAbajo(50);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].kill).not.toHaveBeenCalled();

    desregistrar();

    expect(tweens[0].kill).toHaveBeenCalledTimes(1);
  });

  it('al desregistrar el último hero, un timeout de touchend pendiente ya no actúa', () => {
    vi.useFakeTimers();
    const video = crearVideoMock({ duration: 10 });
    const desregistrar = registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    window.dispatchEvent(new Event('touchstart'));
    window.dispatchEvent(new Event('touchmove'));
    fijarScrollY(500);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('touchend'));

    desregistrar();
    vi.advanceTimersByTime(200);

    expect(video.play).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('un ended despachado después de desregistrar el hero que reproducía no llama a gsap.to', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    const desregistrar = registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });

    simularGestoAbajo(500);
    dispararScrollEnd();
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    desregistrar();
    video.dispatchEvent(new Event('ended'));

    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('con progreso apenas menor que 1 - 0.05 / dur (0.994 con dur = 10) sí llama a play', () => {
    const dur = 10;
    const progreso = 0.994;
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: dur });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => progreso,
    });
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: dur }),
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0,
    });

    simularGestoAbajo(progreso * 1000);
    dispararScrollEnd();

    expect(video.play).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(true);
    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('touchcancel sin inercia reevalúa la parada a los 200 ms (no a los 199 ms)', () => {
    vi.useFakeTimers();
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.5,
    });

    window.dispatchEvent(new Event('touchstart'));
    window.dispatchEvent(new Event('touchmove'));
    fijarScrollY(500);
    window.dispatchEvent(new Event('scroll'));

    dispararScrollEnd();
    expect(video.play).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('touchcancel'));
    vi.advanceTimersByTime(199);
    expect(video.play).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    vi.useRealTimers();
  });
});

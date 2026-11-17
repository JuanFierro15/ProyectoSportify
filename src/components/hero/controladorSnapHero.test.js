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
    fijarScrollY(y);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 120, cancelable: true })
    );
  }

  function crearEventoWheel(deltaY, extra = {}) {
    return new WheelEvent('wheel', {
      deltaY,
      cancelable: true,
      bubbles: true,
      ...extra,
    });
  }

  function crearEventoTouch(tipo, clientY) {
    const evento = new Event(tipo, { cancelable: true, bubbles: true });
    if (Array.isArray(clientY)) {
      evento.touches = clientY.map((y) => ({ clientY: y }));
    } else {
      evento.touches = clientY !== undefined ? [{ clientY }] : [];
    }
    return evento;
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
    const addTouchMove = spyWinAdd.mock.calls.filter(
      ([ev]) => ev === 'touchmove'
    );
    const addClick = spyWinAdd.mock.calls.filter(([ev]) => ev === 'click');
    const addScrollEnd = spySTAdd.mock.calls.filter(([ev]) => ev === 'scrollEnd');
    expect(addWheel).toHaveLength(1);
    expect(addWheel[0][2]).toEqual({ passive: false });
    expect(addTouchMove).toHaveLength(1);
    expect(addTouchMove[0][2]).toEqual({ passive: false });
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
    const removeTouchMove = spyWinRemove.mock.calls.filter(
      ([ev]) => ev === 'touchmove'
    );
    const removeClick = spyWinRemove.mock.calls.filter(([ev]) => ev === 'click');
    const removeScrollEnd = spySTRemove.mock.calls.filter(
      ([ev]) => ev === 'scrollEnd'
    );
    expect(removeWheel).toHaveLength(1);
    expect(removeWheel[0][1]).toBe(addWheel[0][1]);
    expect(removeWheel[0][2]).toEqual({ passive: false });
    expect(removeTouchMove).toHaveLength(1);
    expect(removeTouchMove[0][1]).toBe(addTouchMove[0][1]);
    expect(removeTouchMove[0][2]).toEqual({ passive: false });
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

  it('después de finAuto en reposo, un scrollEnd no vuelve a deslizar ni reproduce', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    let progreso = 0.05;
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => progreso,
    });

    fijarScrollY(50);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);

    // Al terminar el deslizamiento en el punto de reposo (150), scrollEnd no dispara otro tween.
    fijarScrollY(150);
    progreso = 0.15;
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

  it('al terminar el video (ended) desliza (~0.8 s) al inicio del hero siguiente con su video en pausa', () => {
    const start2 = 2000;
    const end2 = 3000;
    const video2 = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: start2, end: end2 },
      progresoObjetivo: () => 0,
    });

    const video1 = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    expect(video1.play).toHaveBeenCalledTimes(1);

    video1.dispatchEvent(new Event('ended'));

    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(start2 + 0.15 * (end2 - start2));
    expect(tweens[0].vars.duration).toBeCloseTo(0.8, 1);
    expect(tweens[0].vars.ease).toBe('power2.inOut');

    fijarScrollY(start2 + 0.15 * (end2 - start2));
    tweens[0].vars.onComplete();

    expect(video2.pause).toHaveBeenCalled();
    expect(video2.play).not.toHaveBeenCalled();
    expect(video2.currentTime).toBe(0.15 * 10);
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
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    video.dispatchEvent(new Event('ended'));

    const destinoEsperado = topAbsoluto - 80;
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(destinoEsperado);
    fijarScrollY(destinoEsperado);
    tweens[0].vars.onComplete();
    expect(window.scrollY).toBe(destinoEsperado);

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

  it('con progreso >= 1 - 0.05 / dur no llama a play y desliza al inicio del siguiente hero', () => {
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

    fijarScrollY(progresoLimite * 1000);
    window.dispatchEvent(crearEventoWheel(120));

    expect(video1.play).not.toHaveBeenCalled();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(2000 + 0.15 * 1000);
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

  it('wheel hacia abajo durante la reproducción NO cancela; wheel hacia arriba sí cancela y vuelve al reposo', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    // Gesto hacia abajo mientras reproduce: no cancela.
    window.dispatchEvent(crearEventoWheel(120));
    expect(video.pause).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    // Gesto hacia arriba mientras reproduce: cancela y desliza al reposo.
    fijarScrollY(500);
    window.dispatchEvent(crearEventoWheel(-120));

    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);
  });

  it('tecla ArrowDown durante la reproducción NO cancela; ArrowUp sí cancela y vuelve al reposo', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    expect(video.play).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(video.pause).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    fijarScrollY(500);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(video.pause).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(false);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);
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
    fijarScrollY(150);
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

    fijarScrollY(50);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('pointerdown'));
    expect(tweens[0].kill).toHaveBeenCalledTimes(1);

    // Si quedó fuera de reposo, scrollEnd acomoda al reposo y nunca reproduce.
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(150);
    expect(video.play).not.toHaveBeenCalled();
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

    fijarScrollY(50);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);

    enlace.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(tweens[0].kill).toHaveBeenCalledTimes(1);
    fijarScrollY(150);
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
      progresoObjetivo: () => 0.15,
    });

    const enlace = document.createElement('a');
    enlace.href = '#ubicacion';
    document.body.appendChild(enlace);

    fijarScrollY(150);
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

    fijarScrollY(50);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.autoKill).toBe(true);
    expect(typeof tweens[0].vars.scrollTo.onAutoKill).toBe('function');

    fijarScrollY(500);
    progreso = 0.5;
    tweens[0].vars.scrollTo.onAutoKill();

    expect(video.pause).not.toHaveBeenCalled();
    // Con el estado limpio (autoActivo = false), scrollEnd acomoda al reposo sin reproducir.
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(150);
    expect(video.play).not.toHaveBeenCalled();
  });

  it('estado inicial: un scrollEnd sin entrada previa del usuario a mitad de un hero acomoda al reposo y NO llama a play', () => {
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
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);
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
    expect(gsap.to).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('touchend'));
    vi.advanceTimersByTime(199);
    expect(gsap.to).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);

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
    expect(gsap.to).not.toHaveBeenCalled();

    // El nuevo touchstart también limpia cualquier timeout previo y touchcancel libera dedoAbajo.
    window.dispatchEvent(new Event('touchstart'));
    window.dispatchEvent(new Event('touchcancel'));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);

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

    fijarScrollY(progresoLimite * 1000);
    window.dispatchEvent(crearEventoWheel(120));

    expect(video1.play).not.toHaveBeenCalled();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video1.preload).toBe('metadata');
    expect(video2.preload).toBe('metadata');
    expect(video3.preload).toBe('metadata');
  });

  it.each([NaN, 0, Infinity])(
    'con video.duration = %s, un gesto hacia abajo no llama a play y desliza al siguiente punto',
    (duracion) => {
      const seccion = document.createElement('section');
      const video = crearVideoMock({ duration: duracion });
      registrar({
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

      expect(video.play).not.toHaveBeenCalled();
      expect(heroEstaReproduciendo(seccion)).toBe(false);
      expect(gsap.to).toHaveBeenCalledTimes(1);
      expect(tweens[0].vars.scrollTo.y).toBe(2150);
    }
  );

  it('en el último hero sin #eventos en el DOM, ended no llama a gsap.to y scrollEnd en reposo no hace nada', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    simularGestoAbajo(150);
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

    fijarScrollY(50);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
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

  it('con progreso apenas menor que 1 - 0.05 / dur (0.974 con dur = 2) sí llama a play', () => {
    const dur = 2;
    const progreso = 0.974;
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
    expect(gsap.to).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('touchcancel'));
    vi.advanceTimersByTime(199);
    expect(gsap.to).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);

    vi.useRealTimers();
  });

  it('wheel hacia abajo en reposo inicia play de inmediato sin scrollEnd, llama preventDefault y no hace seek si la diferencia es <= 0.25 s', () => {
    const seccion = document.createElement('section');
    // Objetivo: 0.15 * 10 = 1.5 s. currentTime en 1.25 s (diferencia exacta 0.25 s <= 0.25 s).
    const video = crearVideoMock({ duration: 10, currentTime: 1.25 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    const ev = crearEventoWheel(120);
    window.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(heroEstaReproduciendo(seccion)).toBe(true);
    expect(video.currentTime).toBe(1.25);
  });

  it('wheel hacia abajo sí hace seek cuando el cuadro difiere en > 0.25 s', () => {
    const seccion = document.createElement('section');
    // Objetivo: 0.15 * 10 = 1.5 s. currentTime en 1.24 s (diferencia 0.26 s > 0.25 s).
    const video = crearVideoMock({ duration: 10, currentTime: 1.24 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));

    expect(video.play).toHaveBeenCalledTimes(1);
    expect(video.currentTime).toBe(1.5);
  });

  it('un flick fuerte dispara una sola acción y la ventana de wheel agrupa hasta 250 ms y separa desde 251 ms', () => {
    vi.useFakeTimers();
    const video1 = crearVideoMock({ duration: 10, currentTime: 1.5 });
    const video2 = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0.15,
    });

    // En inicio del hero 2, ráfaga de 6 wheel hacia arriba: solo un deslizamiento al final del hero 1 (1000).
    fijarScrollY(2150);
    for (let i = 0; i < 6; i++) {
      if (i > 0) vi.advanceTimersByTime(30);
      const ev = crearEventoWheel(-120);
      window.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
    }

    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(1000);
    fijarScrollY(1000);
    tweens[0].vars.onComplete();

    // Tras 251 ms desde el último wheel, un gesto hacia abajo desde final del hero 1 desliza al inicio del hero 2.
    vi.advanceTimersByTime(251);
    window.dispatchEvent(crearEventoWheel(120));
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(2150);
    fijarScrollY(2150);
    tweens[1].vars.onComplete();

    // A los 250 ms exactos en la misma dirección sigue siendo el mismo gesto: no reproduce.
    vi.advanceTimersByTime(250);
    const ev250 = crearEventoWheel(120);
    window.dispatchEvent(ev250);
    expect(ev250.defaultPrevented).toBe(true);
    expect(video2.play).not.toHaveBeenCalled();

    // A los 251 ms desde el evento previo ya es un gesto nuevo: inicia reproducción.
    vi.advanceTimersByTime(251);
    const ev251 = crearEventoWheel(120);
    window.dispatchEvent(ev251);
    expect(ev251.defaultPrevented).toBe(true);
    expect(video2.play).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('touchmove > 30 px hacia abajo en la zona inicia play de inmediato (30 px no decide, 31 px sí) y llama preventDefault', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoTouch('touchstart', 300));
    const evMoveCorto = crearEventoTouch('touchmove', 270); // 30 px <= 30 px
    window.dispatchEvent(evMoveCorto);
    expect(evMoveCorto.defaultPrevented).toBe(true);
    expect(video.play).not.toHaveBeenCalled();

    const evMoveLargo = crearEventoTouch('touchmove', 269); // 31 px > 30 px
    window.dispatchEvent(evMoveLargo);
    expect(evMoveLargo.defaultPrevented).toBe(true);
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('wheel hacia arriba en inicio va al final del hero anterior sin seek al cuadro de reposo; en el primer hero no llama preventDefault', () => {
    const video1 = crearVideoMock({ duration: 10, currentTime: 9.8 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: 1000, end: 2000 },
      progresoObjetivo: () => 0.15,
    });

    // En el primer hero en inicio, hacia arriba no previene el comportamiento normal.
    fijarScrollY(150);
    const evPrimero = crearEventoWheel(-120);
    window.dispatchEvent(evPrimero);
    expect(evPrimero.defaultPrevented).toBe(false);
    expect(gsap.to).not.toHaveBeenCalled();

    // En el segundo hero en inicio, hacia arriba desliza al final (st.end = 1000) del primero.
    fijarScrollY(1150);
    const evSegundo = crearEventoWheel(-120);
    window.dispatchEvent(evSegundo);
    expect(evSegundo.defaultPrevented).toBe(true);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(1000);
    expect(tweens[0].vars.duration).toBeCloseTo(0.8, 1);

    fijarScrollY(1000);
    tweens[0].vars.onComplete();
    expect(video1.pause).toHaveBeenCalled();
    expect(video1.currentTime).toBe(9.8);
  });

  it('al detenerse entre dos puntos estables (scrollEnd tras entrada real) acomoda al punto estable más cercano con límite en el punto medio', () => {
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: 1000, end: 2000 },
      progresoObjetivo: () => 0.15,
    });

    // Hero 1 inicio = 150, Hero 1 final = 1000; punto medio = 575. Justo antes (574) va a 150.
    fijarScrollY(574);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);
    tweens[0].vars.onComplete();

    // En el punto medio exacto (575) va a 1000 (final del hero 1).
    fijarScrollY(575);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(1000);
  });

  it('gesto hacia arriba desde #eventos que entra en la zona desliza al final del último hero', () => {
    const eventos = document.createElement('div');
    eventos.id = 'eventos';
    eventos.style.scrollMarginTop = '0px';
    const topAbsoluto = 2000;
    eventos.getBoundingClientRect = () => ({
      top: topAbsoluto - window.scrollY,
    });
    document.body.appendChild(eventos);

    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });
    const video2 = crearVideoMock({ duration: 10, currentTime: 9.9 });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 1000, end: 2000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(2040);
    const ev = crearEventoWheel(-120); // 2040 - 120 = 1920 < 2000 (entra en la zona)
    window.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(2000);
    fijarScrollY(2000);
    tweens[0].vars.onComplete();
    expect(video2.pause).toHaveBeenCalled();
    expect(video2.currentTime).toBe(9.9);
  });

  it('wheel dentro de un campo editable o fuera de la zona nunca llama preventDefault', () => {
    const eventos = document.createElement('div');
    eventos.id = 'eventos';
    eventos.style.scrollMarginTop = '0px';
    eventos.getBoundingClientRect = () => ({
      top: 1000 - window.scrollY,
    });
    document.body.appendChild(eventos);

    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    // Dentro de un campo editable en la zona de heros: no previene ni reproduce.
    fijarScrollY(150);
    const input = document.createElement('input');
    document.body.appendChild(input);
    const evInput = crearEventoWheel(120);
    input.dispatchEvent(evInput);
    expect(evInput.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();
    input.remove();

    // Fuera de la zona (muy abajo en #eventos / #ubicacion): no previene.
    fijarScrollY(1500);
    const evFuera = crearEventoWheel(-120);
    window.dispatchEvent(evFuera);
    expect(evFuera.defaultPrevented).toBe(false);
  });

  it('wheel y touchmove dentro de un elemento desplazable que puede desplazarse en esa dirección no se previenen ni reproducen; al llegar al extremo sí se interceptan', () => {
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    const caja = document.createElement('div');
    caja.style.overflowY = 'auto';
    Object.defineProperty(caja, 'scrollHeight', { value: 400, configurable: true });
    Object.defineProperty(caja, 'clientHeight', { value: 200, configurable: true });
    caja.scrollTop = 50;
    const hijo = document.createElement('p');
    caja.appendChild(hijo);
    document.body.appendChild(caja);

    fijarScrollY(150);

    // Puede bajar (50 + 200 < 400): no intercepta wheel.
    const evWheelAbajo = crearEventoWheel(120);
    hijo.dispatchEvent(evWheelAbajo);
    expect(evWheelAbajo.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    // Puede bajar: no intercepta touchmove.
    hijo.dispatchEvent(crearEventoTouch('touchstart', 300));
    const evTouchAbajo = crearEventoTouch('touchmove', 250);
    hijo.dispatchEvent(evTouchAbajo);
    expect(evTouchAbajo.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('touchend'));

    // Al llegar al fondo (scrollTop = 200), wheel hacia abajo sí intercepta.
    caja.scrollTop = 200;
    const evWheelFondo = crearEventoWheel(120);
    hijo.dispatchEvent(evWheelFondo);
    expect(evWheelFondo.defaultPrevented).toBe(true);
    expect(video.play).toHaveBeenCalledTimes(1);

    caja.remove();
  });

  it('wheel y touchmove dentro de .chatbot o dialog[open] nunca se interceptan aunque estén en el extremo de scroll', () => {
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    const chatbot = document.createElement('div');
    chatbot.className = 'chatbot';
    const mensajes = document.createElement('div');
    mensajes.style.overflowY = 'auto';
    Object.defineProperty(mensajes, 'scrollHeight', { value: 400, configurable: true });
    Object.defineProperty(mensajes, 'clientHeight', { value: 200, configurable: true });
    mensajes.scrollTop = 200; // Ya al final.
    chatbot.appendChild(mensajes);
    document.body.appendChild(chatbot);

    fijarScrollY(150);

    const evWheelChat = crearEventoWheel(120);
    mensajes.dispatchEvent(evWheelChat);
    expect(evWheelChat.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    mensajes.dispatchEvent(crearEventoTouch('touchstart', 300));
    const evTouchChat = crearEventoTouch('touchmove', 250);
    mensajes.dispatchEvent(evTouchChat);
    expect(evTouchChat.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('touchend'));
    chatbot.remove();

    const dialogo = document.createElement('dialog');
    dialogo.setAttribute('open', '');
    document.body.appendChild(dialogo);
    const evWheelDialog = crearEventoWheel(120);
    dialogo.dispatchEvent(evWheelDialog);
    expect(evWheelDialog.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();
    dialogo.remove();
  });

  it('scrollEnd detenido en el hueco entre dos heros sin entrada previa acomoda al punto estable más cercano (N.final vs N+1.inicio) y no reproduce', () => {
    const video1 = crearVideoMock({ duration: 10 });
    const video2 = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 600 },
      progresoObjetivo: () => 0.15,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 1500, end: 2100 },
      progresoObjetivo: () => 0.15,
    });

    // 1.final = 600, 2.inicio = 1590; punto medio exacto = 1095.
    // Más cerca de 1.final (790 -> 600):
    fijarScrollY(790);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(600);
    tweens[0].vars.onComplete();

    // En el punto medio exacto (1095) pasa al siguiente punto estable (2.inicio = 1590):
    fijarScrollY(1095);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(1590);
    tweens[1].vars.onComplete();

    // Más cerca de 2.inicio (1200 -> 1590):
    fijarScrollY(1200);
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(3);
    expect(tweens[2].vars.scrollTo.y).toBe(1590);

    expect(video1.play).not.toHaveBeenCalled();
    expect(video2.play).not.toHaveBeenCalled();
  });

  it('hacia abajo en final desliza directo al inicio del siguiente hero sin reproducir; en el último hero en final desliza a #eventos', () => {
    const eventos = document.createElement('div');
    eventos.id = 'eventos';
    eventos.style.scrollMarginTop = '0px';
    const topEventos = 3200;
    eventos.getBoundingClientRect = () => ({
      top: topEventos - window.scrollY,
    });
    document.body.appendChild(eventos);

    const video1 = crearVideoMock({ duration: 10, currentTime: 9.8 });
    const video2 = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 1,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 1,
    });

    // Hero 1 en final (1000) + wheel hacia abajo -> desliza a hero 2 inicio (2150) sin play().
    fijarScrollY(1000);
    const ev1 = crearEventoWheel(120);
    window.dispatchEvent(ev1);
    expect(ev1.defaultPrevented).toBe(true);
    expect(video1.play).not.toHaveBeenCalled();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(2150);
    expect(tweens[0].vars.duration).toBeCloseTo(0.8, 1);
    tweens[0].vars.onComplete();
    expect(video2.pause).toHaveBeenCalled();
    expect(video2.currentTime).toBe(1.5);

    // Último hero en final (3000) + tecla ArrowDown -> desliza a #eventos (3200) sin play().
    fijarScrollY(3000);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(video2.play).not.toHaveBeenCalled();
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(topEventos);
  });

  it('hacia arriba en final rebobina hasta el inicio del mismo hero en 1.0-1.2 s y queda pausado en el cuadro de reposo', () => {
    const video = crearVideoMock({ duration: 10, currentTime: 9.9 });
    registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 1,
    });

    fijarScrollY(1000);
    const ev = crearEventoWheel(-120);
    window.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);
    expect(tweens[0].vars.duration).toBeGreaterThanOrEqual(1.0);
    expect(tweens[0].vars.duration).toBeLessThanOrEqual(1.2);
    expect(tweens[0].vars.ease).toBe('power2.inOut');

    fijarScrollY(150);
    tweens[0].vars.onComplete();
    expect(video.pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(1.5);
  });

  it('los gestos mientras corre cualquier tween (deslizamiento o rebobinado) se ignoran pero siguen llamando preventDefault dentro de la zona', () => {
    vi.useFakeTimers();
    const video1 = crearVideoMock({ duration: 10 });
    const video2 = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 1,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0.15,
    });

    // Inicia tween hacia hero 2 inicio.
    fijarScrollY(1000);
    window.dispatchEvent(crearEventoWheel(120));
    expect(gsap.to).toHaveBeenCalledTimes(1);

    // Pasados 300 ms (> ventana de 250 ms) con el tween aún activo: wheel y tecla se ignoran pero previenen default.
    vi.advanceTimersByTime(300);
    fijarScrollY(2050);
    const evWheel = crearEventoWheel(-120);
    window.dispatchEvent(evWheel);
    expect(evWheel.defaultPrevented).toBe(true);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].kill).not.toHaveBeenCalled();

    const evTecla = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      cancelable: true,
    });
    window.dispatchEvent(evTecla);
    expect(evTecla.defaultPrevented).toBe(true);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video2.play).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('con prefers-reduced-motion: reduce salta directo con window.scrollTo y ScrollTrigger.update() sin crear tween', () => {
    const matchMediaOriginal = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    const spySTUpdate = vi.spyOn(ScrollTrigger, 'update').mockImplementation(() => {});
    const video1 = crearVideoMock({ duration: 10 });
    const video2 = crearVideoMock({ duration: 10 });
    registrar({
      seccion: document.createElement('section'),
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 1,
    });
    registrar({
      seccion: document.createElement('section'),
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0.15,
    });

    try {
      fijarScrollY(1000);
      window.dispatchEvent(crearEventoWheel(120));

      expect(gsap.to).not.toHaveBeenCalled();
      expect(window.scrollTo).toHaveBeenCalledWith(0, 2150);
      expect(spySTUpdate).toHaveBeenCalledTimes(1);
      expect(video2.pause).toHaveBeenCalled();
      expect(video2.currentTime).toBe(1.5);
    } finally {
      window.matchMedia = matchMediaOriginal;
    }
  });

  it('Espacio sobre un button o controles interactivos (role=tab, etc.) no previene default, no reproduce ni cancela; ArrowDown en body sigue funcionando', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);

    const boton = document.createElement('button');
    const icono = document.createElement('span');
    boton.appendChild(icono);
    const tab = document.createElement('button');
    tab.setAttribute('role', 'tab');
    document.body.append(boton, tab);

    try {
      for (const objetivo of [boton, icono, tab]) {
        const ev = new KeyboardEvent('keydown', {
          key: ' ',
          cancelable: true,
          bubbles: true,
        });
        objetivo.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(false);
        expect(video.play).not.toHaveBeenCalled();
      }

      // Con el foco en body, ArrowDown sigue funcionando e inicia la reproducción.
      const evBody = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        cancelable: true,
        bubbles: true,
      });
      document.body.dispatchEvent(evBody);
      expect(evBody.defaultPrevented).toBe(true);
      expect(video.play).toHaveBeenCalledTimes(1);
      expect(heroEstaReproduciendo(seccion)).toBe(true);

      // Espacio sobre el botón mientras reproduce tampoco previene ni cancela.
      const evDurantePlay = new KeyboardEvent('keydown', {
        key: ' ',
        cancelable: true,
        bubbles: true,
      });
      boton.dispatchEvent(evDurantePlay);
      expect(evDurantePlay.defaultPrevented).toBe(false);
      expect(video.pause).not.toHaveBeenCalled();
      expect(heroEstaReproduciendo(seccion)).toBe(true);
    } finally {
      boton.remove();
      tab.remove();
    }
  });

  it('Espacio sobre un enlace (a[href]) en reposo previene default y avanza el hero', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);

    const enlace = document.createElement('a');
    enlace.href = '#ubicacion';
    document.body.appendChild(enlace);

    try {
      const ev = new KeyboardEvent('keydown', {
        key: ' ',
        cancelable: true,
        bubbles: true,
      });
      enlace.dispatchEvent(ev);

      expect(ev.defaultPrevented).toBe(true);
      expect(video.play).toHaveBeenCalledTimes(1);
      expect(heroEstaReproduciendo(seccion)).toBe(true);
    } finally {
      enlace.remove();
    }
  });

  it('Espacio sobre un enlace con role="button" sigue exento: no previene default ni reproduce', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);

    const enlace = document.createElement('a');
    enlace.href = '#x';
    enlace.setAttribute('role', 'button');
    document.body.appendChild(enlace);

    try {
      const ev = new KeyboardEvent('keydown', {
        key: ' ',
        cancelable: true,
        bubbles: true,
      });
      enlace.dispatchEvent(ev);

      expect(ev.defaultPrevented).toBe(false);
      expect(video.play).not.toHaveBeenCalled();
    } finally {
      enlace.remove();
    }
  });

  it('teclas de scroll dentro de dialog[open], [role="dialog"] o .chatbot no previenen default, no reproducen ni cancelan', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    const dialogoNativo = document.createElement('dialog');
    dialogoNativo.setAttribute('open', '');
    const btnDialogo = document.createElement('button');
    dialogoNativo.appendChild(btnDialogo);

    const dialogoAria = document.createElement('section');
    dialogoAria.setAttribute('role', 'dialog');
    const divAria = document.createElement('div');
    dialogoAria.appendChild(divAria);

    const chatbot = document.createElement('div');
    chatbot.className = 'chatbot';
    const btnChat = document.createElement('button');
    chatbot.appendChild(btnChat);

    document.body.append(dialogoNativo, dialogoAria, chatbot);

    try {
      fijarScrollY(150);
      for (const objetivo of [btnDialogo, divAria, btnChat]) {
        const evAbajo = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          cancelable: true,
          bubbles: true,
        });
        objetivo.dispatchEvent(evAbajo);
        expect(evAbajo.defaultPrevented).toBe(false);
        expect(video.play).not.toHaveBeenCalled();
      }

      // Incluso con el video reproduciendo, teclas (incluida Home) dentro de diálogos o .chatbot no cancelan.
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true })
      );
      expect(heroEstaReproduciendo(seccion)).toBe(true);

      for (const objetivo of [btnDialogo, divAria, btnChat]) {
        const evArriba = new KeyboardEvent('keydown', {
          key: 'ArrowUp',
          cancelable: true,
          bubbles: true,
        });
        objetivo.dispatchEvent(evArriba);
        expect(evArriba.defaultPrevented).toBe(false);

        const evHome = new KeyboardEvent('keydown', {
          key: 'Home',
          cancelable: true,
          bubbles: true,
        });
        objetivo.dispatchEvent(evHome);
        expect(evHome.defaultPrevented).toBe(false);
      }

      expect(video.pause).not.toHaveBeenCalled();
      expect(heroEstaReproduciendo(seccion)).toBe(true);
    } finally {
      dialogoNativo.remove();
      dialogoAria.remove();
      chatbot.remove();
    }
  });

  it('Alt+ArrowDown (y otros modificadores) y eventos con defaultPrevented ya en true no se interceptan ni cancelan', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);

    const evAlt = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      altKey: true,
      cancelable: true,
      bubbles: true,
    });
    document.body.dispatchEvent(evAlt);
    expect(evAlt.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    const evCtrl = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      ctrlKey: true,
      cancelable: true,
      bubbles: true,
    });
    document.body.dispatchEvent(evCtrl);
    expect(evCtrl.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    const evMeta = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      metaKey: true,
      cancelable: true,
      bubbles: true,
    });
    document.body.dispatchEvent(evMeta);
    expect(evMeta.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    const evYaPrevenido = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      cancelable: true,
      bubbles: true,
    });
    evYaPrevenido.preventDefault();
    document.body.dispatchEvent(evYaPrevenido);
    expect(video.play).not.toHaveBeenCalled();

    // Arrancamos reproducción normal y comprobamos que Alt+ArrowUp o defaultPrevented no cancelan.
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true })
    );
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    const evAltArriba = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      altKey: true,
      cancelable: true,
      bubbles: true,
    });
    document.body.dispatchEvent(evAltArriba);
    expect(evAltArriba.defaultPrevented).toBe(false);

    const evHomePrevenido = new KeyboardEvent('keydown', {
      key: 'Home',
      cancelable: true,
      bubbles: true,
    });
    evHomePrevenido.preventDefault();
    document.body.dispatchEvent(evHomePrevenido);

    expect(video.pause).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(true);
  });

  it('si video.play() se rechaza, cancela y desliza al siguiente hero o a #eventos', async () => {
    const eventos = document.createElement('div');
    eventos.id = 'eventos';
    eventos.style.scrollMarginTop = '0px';
    eventos.getBoundingClientRect = () => ({
      top: 3200 - window.scrollY,
    });
    document.body.appendChild(eventos);

    const seccion1 = document.createElement('section');
    const video1 = crearVideoMock({ duration: 10, currentTime: 1.5 });
    video1.play.mockImplementation(() =>
      Promise.reject(new Error('Autoplay bloqueado'))
    );
    const seccion2 = document.createElement('section');
    const video2 = crearVideoMock({ duration: 10, currentTime: 1.5 });
    video2.play.mockImplementation(() =>
      Promise.reject(new Error('Autoplay bloqueado'))
    );

    registrar({
      seccion: seccion1,
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });
    registrar({
      seccion: seccion2,
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    await Promise.resolve();

    expect(heroEstaReproduciendo(seccion1)).toBe(false);
    expect(video1.pause).toHaveBeenCalledTimes(1);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(2150);
    fijarScrollY(2150);
    tweens[0].vars.onComplete();

    // En el último hero, un rechazo de play() desliza a #eventos.
    vi.useFakeTimers();
    vi.advanceTimersByTime(251);
    window.dispatchEvent(crearEventoWheel(120));
    await Promise.resolve();

    expect(heroEstaReproduciendo(seccion2)).toBe(false);
    expect(video2.pause).toHaveBeenCalled();
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(3200);
    vi.useRealTimers();
  });

  it('un evento error del video durante la reproducción cancela y desliza al siguiente; el listener se quita al terminar o cancelar', () => {
    const seccion1 = document.createElement('section');
    const video1 = crearVideoMock({ duration: 10, currentTime: 1.5 });
    const seccion2 = document.createElement('section');
    const video2 = crearVideoMock({ duration: 10, currentTime: 1.5 });

    registrar({
      seccion: seccion1,
      video: video1,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });
    registrar({
      seccion: seccion2,
      video: video2,
      st: { start: 2000, end: 3000 },
      progresoObjetivo: () => 0.15,
    });

    // Error mientras reproduce hero 1 -> pausa y desliza a hero 2 inicio (2150).
    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    expect(heroEstaReproduciendo(seccion1)).toBe(true);

    video1.dispatchEvent(new Event('error'));
    expect(heroEstaReproduciendo(seccion1)).toBe(false);
    expect(video1.pause).toHaveBeenCalledTimes(1);
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(2150);

    // Completamos el deslizamiento al hero 2 y verificamos que cancelar (pointerdown) quita el listener de error.
    fijarScrollY(2150);
    tweens[0].vars.onComplete();

    vi.useFakeTimers();
    vi.advanceTimersByTime(251);
    window.dispatchEvent(crearEventoWheel(120));
    expect(heroEstaReproduciendo(seccion2)).toBe(true);

    window.dispatchEvent(new Event('pointerdown'));
    expect(heroEstaReproduciendo(seccion2)).toBe(false);

    // Un error posterior a cancelar no debe provocar ningún deslizamiento ni pause extra.
    const pausesTrasCancelar = video2.pause.mock.calls.length;
    video2.dispatchEvent(new Event('error'));
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(video2.pause).toHaveBeenCalledTimes(pausesTrasCancelar);

    // Arrancamos hero 1 de nuevo y al terminar (ended) también se quita el listener de error.
    vi.advanceTimersByTime(251);
    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    video1.dispatchEvent(new Event('ended'));
    expect(gsap.to).toHaveBeenCalledTimes(2);
    tweens[1].vars.onComplete();

    const pausesTrasEnded = video1.pause.mock.calls.length;
    video1.dispatchEvent(new Event('error'));
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(video1.pause).toHaveBeenCalledTimes(pausesTrasEnded);
    vi.useRealTimers();
  });

  it('wheel con ctrlKey (Ctrl+rueda o pellizco de trackpad) no se intercepta ni previene default', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);
    const evZoom = crearEventoWheel(120, { ctrlKey: true });
    window.dispatchEvent(evZoom);
    expect(evZoom.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    // Tampoco si está reproduciendo cancela ni previene.
    window.dispatchEvent(crearEventoWheel(120));
    expect(heroEstaReproduciendo(seccion)).toBe(true);

    const evZoomArriba = crearEventoWheel(-120, { ctrlKey: true });
    window.dispatchEvent(evZoomArriba);
    expect(evZoomArriba.defaultPrevented).toBe(false);
    expect(video.pause).not.toHaveBeenCalled();
    expect(heroEstaReproduciendo(seccion)).toBe(true);
  });

  it('gestos táctiles con más de un dedo (pellizco) no previenen default, reinician el toque y no reproducen', () => {
    const seccion = document.createElement('section');
    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion,
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(150);

    // 1 dedo seguido de un 2.º dedo (touchstart multi-touch) y touchmove con 2 dedos:
    window.dispatchEvent(crearEventoTouch('touchstart', [300]));
    window.dispatchEvent(crearEventoTouch('touchstart', [300, 350]));
    const evMoveDos = crearEventoTouch('touchmove', [200, 450]);
    window.dispatchEvent(evMoveDos);
    expect(evMoveDos.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    // Un touchmove residual con 1 dedo del mismo pellizco tampoco actúa porque toqueInicioY quedó en null.
    const evResidual = crearEventoTouch('touchmove', [200]);
    window.dispatchEvent(evResidual);
    expect(evResidual.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();
    window.dispatchEvent(crearEventoTouch('touchend'));

    // También si un touchmove multi-touch llega directamente tras touchstart de 1 dedo:
    window.dispatchEvent(crearEventoTouch('touchstart', [300]));
    const evMoveMulti = crearEventoTouch('touchmove', [220, 420]);
    window.dispatchEvent(evMoveMulti);
    expect(evMoveMulti.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();

    const evResidual2 = crearEventoTouch('touchmove', [220]);
    window.dispatchEvent(evResidual2);
    expect(evResidual2.defaultPrevented).toBe(false);
    expect(video.play).not.toHaveBeenCalled();
  });

  it('fuera de la zona no inspecciona ancestros y dentro solo lee geometría si overflowY es auto o scroll', () => {
    const eventos = document.createElement('div');
    eventos.id = 'eventos';
    eventos.style.scrollMarginTop = '0px';
    eventos.getBoundingClientRect = () => ({
      top: 1000 - window.scrollY,
    });
    document.body.appendChild(eventos);

    const video = crearVideoMock({ duration: 10, currentTime: 1.5 });
    registrar({
      seccion: document.createElement('section'),
      video,
      st: { start: 0, end: 1000 },
      progresoObjetivo: () => 0.15,
    });

    const cajaVisible = document.createElement('div');
    cajaVisible.style.overflowY = 'visible';
    const leerScrollTop = vi.fn(() => 0);
    const leerScrollHeight = vi.fn(() => 400);
    const leerClientHeight = vi.fn(() => 200);
    Object.defineProperty(cajaVisible, 'scrollTop', {
      get: leerScrollTop,
      configurable: true,
    });
    Object.defineProperty(cajaVisible, 'scrollHeight', {
      get: leerScrollHeight,
      configurable: true,
    });
    Object.defineProperty(cajaVisible, 'clientHeight', {
      get: leerClientHeight,
      configurable: true,
    });
    const hijo = document.createElement('p');
    cajaVisible.appendChild(hijo);
    document.body.appendChild(cajaVisible);

    const spyComputed = vi.spyOn(window, 'getComputedStyle');

    try {
      // Fuera de la zona (debajo de #eventos y sin entrar): wheel y touchmove no llaman getComputedStyle sobre hijo/cajaVisible.
      fijarScrollY(1500);
      spyComputed.mockClear();
      hijo.dispatchEvent(crearEventoWheel(120));
      hijo.dispatchEvent(crearEventoTouch('touchstart', 300));
      hijo.dispatchEvent(crearEventoTouch('touchmove', 240));
      window.dispatchEvent(crearEventoTouch('touchend'));

      expect(
        spyComputed.mock.calls.some(
          ([el]) => el === hijo || el === cajaVisible
        )
      ).toBe(false);
      expect(leerScrollTop).not.toHaveBeenCalled();
      expect(leerScrollHeight).not.toHaveBeenCalled();
      expect(leerClientHeight).not.toHaveBeenCalled();

      // Dentro de la zona con overflowY visible: tampoco lee scrollTop/scrollHeight/clientHeight.
      fijarScrollY(150);
      hijo.dispatchEvent(crearEventoWheel(120));
      expect(leerScrollTop).not.toHaveBeenCalled();
      expect(leerScrollHeight).not.toHaveBeenCalled();
      expect(leerClientHeight).not.toHaveBeenCalled();
      expect(video.play).toHaveBeenCalledTimes(1);
    } finally {
      cajaVisible.remove();
    }
  });
});

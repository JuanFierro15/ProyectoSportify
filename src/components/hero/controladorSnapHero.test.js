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
    evento.touches = clientY !== undefined ? [{ clientY }] : [];
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

    const overlays = document.querySelectorAll('.deporte-hero__transicion');
    expect(overlays).toHaveLength(1);
    expect(overlays[0].getAttribute('aria-hidden')).toBe('true');

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
    expect(document.querySelectorAll('.deporte-hero__transicion')).toHaveLength(
      1
    );

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
    expect(document.querySelectorAll('.deporte-hero__transicion')).toHaveLength(
      0
    );
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

  it('al terminar el video (ended) hace la transición al reposo del hero siguiente con su video en pausa', () => {
    const spyTimeline = vi.spyOn(gsap, 'timeline');
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

    expect(spyTimeline).toHaveBeenCalledTimes(1);
    const tl = spyTimeline.mock.results[0].value;
    tl.progress(1);

    expect(window.scrollTo).toHaveBeenCalledWith(
      0,
      start2 + 0.15 * (end2 - start2)
    );
    expect(video2.pause).toHaveBeenCalled();
    expect(video2.play).not.toHaveBeenCalled();
    expect(video2.currentTime).toBe(0.15 * 10);
  });

  it('en el último hero con #eventos transiciona a top - 80 y allí scrollEnd no hace nada aun con entrada nueva', () => {
    const spyTimeline = vi.spyOn(gsap, 'timeline');
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
    expect(spyTimeline).toHaveBeenCalledTimes(1);
    spyTimeline.mock.results[0].value.progress(1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, destinoEsperado);
    expect(window.scrollY).toBe(destinoEsperado);

    // Nueva entrada del usuario hacia abajo estando ya en el destino de #eventos.
    simularGestoAbajo(destinoEsperado);
    dispararScrollEnd();

    expect(gsap.to).not.toHaveBeenCalled();
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

  it('con progreso >= 1 - 0.05 / dur no llama a play y transiciona al siguiente hero', () => {
    const spyTimeline = vi.spyOn(gsap, 'timeline');
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
    expect(spyTimeline).toHaveBeenCalledTimes(1);
    spyTimeline.mock.results[0].value.progress(1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 2000 + 0.15 * 1000);
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
    const spyTimeline = vi.spyOn(gsap, 'timeline');
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
    expect(spyTimeline).toHaveBeenCalledTimes(1);
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
    // Objetivo: 0.15 * 10 = 1.5 s. currentTime en 1.3 s (diferencia 0.20 s <= 0.25 s).
    const video = crearVideoMock({ duration: 10, currentTime: 1.3 });
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
    expect(video.currentTime).toBe(1.3);
  });

  it('wheel hacia abajo sí hace seek cuando el cuadro difiere en > 0.25 s', () => {
    const seccion = document.createElement('section');
    // Objetivo: 0.15 * 10 = 1.5 s. currentTime en 1.0 s (diferencia 0.5 s > 0.25 s).
    const video = crearVideoMock({ duration: 10, currentTime: 1.0 });
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

  it('un flick fuerte (varios wheel seguidos) dispara exactamente una sola acción', () => {
    vi.useFakeTimers();
    const spyTimeline = vi.spyOn(gsap, 'timeline');
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
      st: { start: 1000, end: 2000 },
      progresoObjetivo: () => 0.15,
    });

    // En reposo del hero 2, ráfaga de 6 wheel hacia arriba: solo una transición al hero 1.
    fijarScrollY(1150);
    for (let i = 0; i < 6; i++) {
      const ev = crearEventoWheel(-120);
      window.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      vi.advanceTimersByTime(30);
    }

    expect(spyTimeline).toHaveBeenCalledTimes(1);
    spyTimeline.mock.results[0].value.progress(1);
    expect(window.scrollY).toBe(150);

    // Tras 251 ms sin eventos, un nuevo gesto sí actúa.
    vi.advanceTimersByTime(251);
    window.dispatchEvent(crearEventoWheel(120));
    expect(video1.play).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('touchmove > 30 px hacia abajo en la zona inicia play de inmediato y llama preventDefault', () => {
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
    const evMoveCorto = crearEventoTouch('touchmove', 280); // 20 px <= 30 px
    window.dispatchEvent(evMoveCorto);
    expect(evMoveCorto.defaultPrevented).toBe(true);
    expect(video.play).not.toHaveBeenCalled();

    const evMoveLargo = crearEventoTouch('touchmove', 260); // 40 px > 30 px
    window.dispatchEvent(evMoveLargo);
    expect(evMoveLargo.defaultPrevented).toBe(true);
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('wheel hacia arriba en reposo va al reposo del hero anterior; en el primer hero no llama preventDefault', () => {
    const spyTimeline = vi.spyOn(gsap, 'timeline');
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

    // En el primer hero en reposo, hacia arriba no previene el comportamiento normal.
    fijarScrollY(150);
    const evPrimero = crearEventoWheel(-120);
    window.dispatchEvent(evPrimero);
    expect(evPrimero.defaultPrevented).toBe(false);
    expect(spyTimeline).not.toHaveBeenCalled();

    // En el segundo hero en reposo, hacia arriba transiciona al reposo del primero.
    fijarScrollY(1150);
    const evSegundo = crearEventoWheel(-120);
    window.dispatchEvent(evSegundo);
    expect(evSegundo.defaultPrevented).toBe(true);
    expect(spyTimeline).toHaveBeenCalledTimes(1);
    spyTimeline.mock.results[0].value.progress(1);
    expect(window.scrollY).toBe(150);
  });

  it('al detenerse entre dos heros (scrollEnd tras entrada real) acomoda al reposo más cercano con límite en el punto medio', () => {
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

    // Reposos en 150 y 1150; punto medio = 650. Justo antes (649) va a 150.
    fijarScrollY(649);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(150);
    tweens[0].vars.onComplete();

    // En el punto medio exacto (650) va a 1150.
    fijarScrollY(650);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    dispararScrollEnd();
    expect(gsap.to).toHaveBeenCalledTimes(2);
    expect(tweens[1].vars.scrollTo.y).toBe(1150);
  });

  it('gesto hacia arriba desde #eventos que entra en la zona transiciona al reposo del último hero', () => {
    const spyTimeline = vi.spyOn(gsap, 'timeline');
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
    registrar({
      seccion: document.createElement('section'),
      video: crearVideoMock({ duration: 10 }),
      st: { start: 1000, end: 2000 },
      progresoObjetivo: () => 0.15,
    });

    fijarScrollY(2040);
    const ev = crearEventoWheel(-120); // 2040 - 120 = 1920 < 2000 (entra en la zona)
    window.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(spyTimeline).toHaveBeenCalledTimes(1);
    spyTimeline.mock.results[0].value.progress(1);
    expect(window.scrollY).toBe(1150);
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

  it('scrollEnd detenido en el hueco entre dos heros sin entrada previa de wheel/touch/tecla acomoda al reposo más cercano y no reproduce', () => {
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

    fijarScrollY(790);
    dispararScrollEnd();

    expect(gsap.to).toHaveBeenCalledTimes(1);
    expect(tweens[0].vars.scrollTo.y).toBe(1500 + 0.15 * 600);
    expect(video1.play).not.toHaveBeenCalled();
    expect(video2.play).not.toHaveBeenCalled();
  });

  it('transicionarA llama ScrollTrigger.update() después del salto y el fade-out no empieza en el mismo tick', () => {
    const spyTimeline = vi.spyOn(gsap, 'timeline');
    const spySTUpdate = vi.spyOn(ScrollTrigger, 'update').mockImplementation(() => {});
    const video1 = crearVideoMock({ duration: 10, currentTime: 1.5 });
    const video2 = crearVideoMock({ duration: 10 });
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
      progresoObjetivo: () => 0,
    });

    fijarScrollY(150);
    window.dispatchEvent(crearEventoWheel(120));
    video1.dispatchEvent(new Event('ended'));

    expect(spyTimeline).toHaveBeenCalledTimes(1);
    const tl = spyTimeline.mock.results[0].value;
    const overlay = document.querySelector('.deporte-hero__transicion');

    // Al llegar al salto (0.15 s): ejecuta scrollTo y luego ScrollTrigger.update(), con cortina opaca.
    tl.time(0.15);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 2150);
    expect(spySTUpdate).toHaveBeenCalledTimes(1);
    expect(spySTUpdate.mock.invocationCallOrder[0]).toBeGreaterThan(
      window.scrollTo.mock.invocationCallOrder.at(-1)
    );
    expect(overlay.style.opacity).toBe('1');

    // Un instante después del salto (0.17 s), la cortina sigue completamente opaca antes del fade-out.
    tl.time(0.17);
    expect(overlay.style.opacity).toBe('1');

    // Al completar la transición, la cortina queda en 0.
    tl.progress(1);
    expect(overlay.style.opacity).toBe('0');
  });
});

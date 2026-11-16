import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { decidirAccionHero, REPOSO_HERO } from '../../lib/modoHero';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const TOLERANCIA_SCROLL_EXTERNO = 4;
const MARGEN_FIN_VIDEO = 0.05;
const UMBRAL_SEEK = 0.05;
const DEMORA_FIN_TOQUE_MS = 200;

const TECLAS_SCROLL = new Set([
  'ArrowDown',
  'ArrowUp',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  ' ',
]);

const registros = [];
let listenersActivos = false;

let reproduciendo = null;
let tween = null;
let heroDestino = null;
let limpiarEnded = null;
let direccion = 1;
let ultimaY = 0;
let ultimaYEscrita = 0;
let autoActivo = false;
let entradaDesdeFinAuto = false;
let dedoAbajo = false;
let timeoutTouchEnd = null;

function herosOrdenados() {
  return [...registros].sort((a, b) => a.st.start - b.st.start);
}

function reposo(hero) {
  return hero.st.start + REPOSO_HERO * (hero.st.end - hero.st.start);
}

function yDeVideo(hero) {
  const { video, st } = hero;
  const dur = video?.duration;
  if (!Number.isFinite(dur) || dur <= 0 || !st) return null;
  return st.start + (video.currentTime / dur) * (st.end - st.start);
}

function esCampoEditable(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName?.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function limpiarTimeoutTouchEnd() {
  if (timeoutTouchEnd !== null) {
    clearTimeout(timeoutTouchEnd);
    timeoutTouchEnd = null;
  }
}

function destinoEventos() {
  const el = document.getElementById('eventos');
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const margen = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return top - margen;
}

function finAuto() {
  tween = null;
  heroDestino = null;
  autoActivo = false;
  entradaDesdeFinAuto = false;
  ultimaY = window.scrollY;
  ultimaYEscrita = 0;
}

function cancelar({ pausar = true } = {}) {
  limpiarTimeoutTouchEnd();
  if (tween) {
    tween.kill();
    tween = null;
  }
  if (limpiarEnded) {
    limpiarEnded();
  }
  if (pausar && reproduciendo) {
    reproduciendo.video?.pause();
  }
  reproduciendo = null;
  finAuto();
}

function reiniciarEstado({ y = 0 } = {}) {
  cancelar({ pausar: false });
  direccion = 1;
  dedoAbajo = false;
  ultimaY = y;
}

function deslizarA(y, duracion, destino = null) {
  if (tween) {
    tween.kill();
    tween = null;
  }
  autoActivo = true;
  heroDestino = destino;
  tween = gsap.to(window, {
    scrollTo: { y, autoKill: true, onAutoKill: cancelar },
    duration: duracion,
    ease: 'power2.inOut',
    onComplete: finAuto,
  });
}

function irAlSiguiente(hero) {
  const ordenados = herosOrdenados();
  const indice = ordenados.indexOf(hero);
  const siguiente = indice >= 0 ? ordenados[indice + 1] : null;
  const destino = siguiente ? reposo(siguiente) : destinoEventos();

  if (destino === null) {
    finAuto();
    return;
  }

  deslizarA(destino, 0.9, siguiente || null);
}

function alTerminar(hero) {
  if (reproduciendo !== hero) return;
  reproduciendo = null;
  window.scrollTo(0, hero.st.end);
  irAlSiguiente(hero);
}

function reproducir(hero) {
  const { video } = hero;
  const dur = video?.duration;
  if (!Number.isFinite(dur) || dur <= 0) return;

  const t = hero.progresoObjetivo() * dur;
  if (t >= dur - MARGEN_FIN_VIDEO) {
    irAlSiguiente(hero);
    return;
  }

  if (video.ended || Math.abs(video.currentTime - t) > UMBRAL_SEEK) {
    video.currentTime = t;
  }

  if (limpiarEnded) {
    limpiarEnded();
  }

  autoActivo = true;
  reproduciendo = hero;
  // Partimos de window.scrollY porque el seek no se ejecuta si la diferencia es
  // <= UMBRAL_SEEK (0.05 s = 7.5 px a 150 px/s > TOLERANCIA_SCROLL_EXTERNO).
  ultimaYEscrita = window.scrollY;

  const alAcabar = () => {
    limpiarEnded = null;
    alTerminar(hero);
  };
  video.addEventListener('ended', alAcabar, { once: true });
  limpiarEnded = () => {
    video.removeEventListener('ended', alAcabar);
    limpiarEnded = null;
  };

  const promesa = video.play();
  if (promesa && typeof promesa.catch === 'function') {
    promesa.catch(() => {
      if (reproduciendo === hero) {
        cancelar();
      }
    });
  }
}

function alTick() {
  if (!reproduciendo) return;
  if (Math.abs(window.scrollY - ultimaYEscrita) > TOLERANCIA_SCROLL_EXTERNO) {
    cancelar();
    return;
  }
  const y = yDeVideo(reproduciendo);
  if (y === null) return;
  ultimaYEscrita = y;
  window.scrollTo(0, y);
}

function alHacerScroll() {
  if (autoActivo) return;
  const y = window.scrollY;
  if (y > ultimaY) direccion = 1;
  else if (y < ultimaY) direccion = -1;
  ultimaY = y;
}

function alEntrarUsuario() {
  if (reproduciendo || tween) {
    cancelar();
  } else {
    entradaDesdeFinAuto = true;
  }
}

function cancelarSiActivo() {
  if (reproduciendo || tween) {
    cancelar();
  }
}

function alPointerDown() {
  cancelarSiActivo();
}

function alClic() {
  cancelarSiActivo();
}

function alTouchStart() {
  dedoAbajo = true;
  limpiarTimeoutTouchEnd();
  if (reproduciendo || tween) {
    cancelar();
  }
}

function alTouchEnd() {
  dedoAbajo = false;
  if (reproduciendo || tween) return;
  limpiarTimeoutTouchEnd();
  const y = window.scrollY;
  timeoutTouchEnd = setTimeout(() => {
    timeoutTouchEnd = null;
    if (window.scrollY === y) {
      alDetenerse();
    }
  }, DEMORA_FIN_TOQUE_MS);
}

function alTouchCancel() {
  dedoAbajo = false;
}

function alPresionarTecla(e) {
  if (esCampoEditable(e.target)) return;
  if (TECLAS_SCROLL.has(e.key)) {
    alEntrarUsuario();
  }
}

function alDetenerse() {
  if (autoActivo || !entradaDesdeFinAuto || dedoAbajo) return;

  const ordenados = herosOrdenados();
  if (ordenados.length === 0) return;

  const y = window.scrollY;
  const eventosY = destinoEventos();

  const hero = ordenados.find((h, i) => {
    const siguiente = ordenados[i + 1];
    const limite = siguiente
      ? siguiente.st.start
      : eventosY !== null
        ? eventosY
        : h.st.end;
    return y >= h.st.start && y < limite;
  });

  if (!hero) return;

  const tramo = hero.st.end - hero.st.start;
  if (!(tramo > 0)) return;

  const progreso = (y - hero.st.start) / tramo;
  const accion = decidirAccionHero({ progreso, direccion });

  if (accion === 'reposar') {
    deslizarA(reposo(hero), 0.6, hero);
  } else if (accion === 'reproducir') {
    reproducir(hero);
  } else if (accion === 'siguiente') {
    irAlSiguiente(hero);
  }
}

function instalarListeners() {
  if (listenersActivos) return;
  listenersActivos = true;
  reiniciarEstado({ y: window.scrollY });
  window.addEventListener('scroll', alHacerScroll, { passive: true });
  window.addEventListener('wheel', alEntrarUsuario, { passive: true });
  window.addEventListener('pointerdown', alPointerDown, { passive: true });
  window.addEventListener('click', alClic, { capture: true, passive: true });
  window.addEventListener('touchstart', alTouchStart, { passive: true });
  window.addEventListener('touchmove', alEntrarUsuario, { passive: true });
  window.addEventListener('touchend', alTouchEnd, { passive: true });
  window.addEventListener('touchcancel', alTouchCancel, { passive: true });
  window.addEventListener('keydown', alPresionarTecla);
  ScrollTrigger.addEventListener('scrollEnd', alDetenerse);
  gsap.ticker.add(alTick);
}

function quitarListeners() {
  if (!listenersActivos) return;
  listenersActivos = false;
  window.removeEventListener('scroll', alHacerScroll);
  window.removeEventListener('wheel', alEntrarUsuario);
  window.removeEventListener('pointerdown', alPointerDown);
  window.removeEventListener('click', alClic, { capture: true });
  window.removeEventListener('touchstart', alTouchStart);
  window.removeEventListener('touchmove', alEntrarUsuario);
  window.removeEventListener('touchend', alTouchEnd);
  window.removeEventListener('touchcancel', alTouchCancel);
  window.removeEventListener('keydown', alPresionarTecla);
  ScrollTrigger.removeEventListener('scrollEnd', alDetenerse);
  gsap.ticker.remove(alTick);
}

/**
 * Registra un hero en el controlador compartido del modo snap.
 * Devuelve la función para desregistrarlo en el cleanup.
 */
export function registrarHeroSnap({ seccion, video, st, progresoObjetivo }) {
  const registro = { seccion, video, st, progresoObjetivo };
  registros.push(registro);
  if (registros.length === 1) {
    instalarListeners();
  }

  let desregistrado = false;
  return () => {
    if (desregistrado) return;
    desregistrado = true;

    if (reproduciendo === registro || heroDestino === registro) {
      cancelar({ pausar: false });
    }

    const indice = registros.indexOf(registro);
    if (indice !== -1) {
      registros.splice(indice, 1);
    }

    if (registros.length === 0) {
      quitarListeners();
      reiniciarEstado();
    }
  };
}

/** Indica si el hero de `seccion` se está reproduciendo en el controlador snap. */
export function heroEstaReproduciendo(seccion) {
  return Boolean(seccion && reproduciendo?.seccion === seccion);
}

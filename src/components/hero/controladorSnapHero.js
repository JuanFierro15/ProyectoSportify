import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  REPOSO_HERO,
  TOLERANCIA_REPOSO,
  accionPorGesto,
  enReposoDeTramo,
  indiceHeroEnZona,
  puedeDesplazarAncestro,
  reposoDeTramo,
  reposoMasCercano,
} from '../../lib/modoHero';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const TOLERANCIA_SCROLL_EXTERNO = 4;
const MARGEN_FIN_VIDEO = 0.05;
const UMBRAL_SEEK = 0.25;
const DEMORA_FIN_TOQUE_MS = 200;
const UMBRAL_TOQUE_PX = 30;
const VENTANA_GESTO_WHEEL_MS = 250;
const DURACION_REPOSAR = 0.4;
const DURACION_TRANSICION_MITAD = 0.15;

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

let overlayTransicion = null;
let reproduciendo = null;
let tween = null;
let transicionTl = null;
let heroDestino = null;
let limpiarEnded = null;
let ultimaYEscrita = 0;
let autoActivo = false;
let dedoAbajo = false;
let toqueInicioY = null;
let toqueDecidido = false;
let timeoutTouchEnd = null;
let ultimoWheelMs = 0;
let ultimaDireccionWheel = 0;

function herosOrdenados() {
  return [...registros].sort((a, b) => a.st.start - b.st.start);
}

function esCampoEditable(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName?.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function debeIgnorarObjetivo(target, dir) {
  const el =
    target && typeof target === 'object'
      ? target.nodeType === 1
        ? target
        : target.parentElement
      : null;
  if (!el || typeof el.closest !== 'function') return false;
  if (el.closest('.chatbot, dialog[open]')) return true;

  const ancestros = [];
  let nodo = el;
  while (nodo && nodo !== document.body && nodo !== document.documentElement) {
    if (nodo.nodeType === 1) {
      ancestros.push({
        overflowY: getComputedStyle(nodo).overflowY,
        scrollTop: nodo.scrollTop,
        scrollHeight: nodo.scrollHeight,
        clientHeight: nodo.clientHeight,
      });
    }
    nodo = nodo.parentElement;
  }
  return puedeDesplazarAncestro(ancestros, dir);
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

function contextoZona() {
  const ordenados = herosOrdenados();
  if (ordenados.length === 0) {
    return { ordenados, tramos: [], eventosY: null, zonaFin: null };
  }
  const tramos = ordenados.map((h) => h.st);
  const eventosY = destinoEventos();
  const zonaFin =
    eventosY !== null ? eventosY : tramos[tramos.length - 1].end;
  return { ordenados, tramos, eventosY, zonaFin };
}

function crearOverlayTransicion() {
  if (overlayTransicion || typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'deporte-hero__transicion';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  overlayTransicion = el;
}

function quitarOverlayTransicion() {
  if (!overlayTransicion) return;
  overlayTransicion.remove();
  overlayTransicion = null;
}

function finAuto() {
  tween = null;
  transicionTl = null;
  heroDestino = null;
  autoActivo = false;
  ultimaYEscrita = 0;
}

function cancelar({ pausar = true } = {}) {
  limpiarTimeoutTouchEnd();
  if (tween) {
    tween.kill();
    tween = null;
  }
  if (transicionTl) {
    transicionTl.kill();
    transicionTl = null;
  }
  if (overlayTransicion) {
    overlayTransicion.style.opacity = '0';
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

function reiniciarEstado() {
  cancelar({ pausar: false });
  dedoAbajo = false;
  toqueInicioY = null;
  toqueDecidido = false;
  ultimoWheelMs = 0;
  ultimaDireccionWheel = 0;
}

function deslizarA(y, duracion, destino = null) {
  if (tween) {
    tween.kill();
    tween = null;
  }
  if (transicionTl) {
    transicionTl.kill();
    transicionTl = null;
    if (overlayTransicion) {
      overlayTransicion.style.opacity = '0';
    }
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

function pausarEnReposo(hero) {
  const video = hero?.video;
  if (!video) return;
  video.pause();
  const dur = video.duration;
  if (Number.isFinite(dur) && dur > 0) {
    const t = REPOSO_HERO * dur;
    if (Math.abs(video.currentTime - t) > UMBRAL_SEEK) {
      video.currentTime = t;
    }
  }
}

function transicionarA(y, destino = null) {
  if (tween) {
    tween.kill();
    tween = null;
  }
  if (transicionTl) {
    transicionTl.kill();
    transicionTl = null;
  }

  autoActivo = true;
  heroDestino = destino;

  const reducir =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducir || !overlayTransicion) {
    ultimaYEscrita = y;
    window.scrollTo(0, y);
    ScrollTrigger.update();
    pausarEnReposo(destino);
    finAuto();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      if (transicionTl === tl) {
        transicionTl = null;
        finAuto();
      }
    },
  });
  transicionTl = tl;

  tl.to(overlayTransicion, {
    opacity: 1,
    duration: DURACION_TRANSICION_MITAD,
    ease: 'power2.in',
  })
    .call(() => {
      if (transicionTl !== tl) return;
      ultimaYEscrita = y;
      window.scrollTo(0, y);
      ScrollTrigger.update();
      pausarEnReposo(destino);
    })
    .to(
      overlayTransicion,
      {
        opacity: 0,
        duration: DURACION_TRANSICION_MITAD,
        ease: 'power2.out',
      },
      '+=0.05'
    );
}

function heroSiguiente(hero) {
  const ordenados = herosOrdenados();
  const indice = ordenados.indexOf(hero);
  return indice >= 0 ? (ordenados[indice + 1] ?? null) : null;
}

function precargarSiguiente(hero) {
  const siguiente = heroSiguiente(hero);
  if (siguiente?.video && siguiente.video.preload !== 'auto') {
    siguiente.video.preload = 'auto';
  }
}

function irAlSiguiente(hero) {
  const siguiente = heroSiguiente(hero);
  const destino = siguiente ? reposoDeTramo(siguiente.st) : destinoEventos();

  if (destino === null) {
    finAuto();
    return;
  }

  transicionarA(destino, siguiente);
}

function alTerminar(hero) {
  if (reproduciendo !== hero) return;
  reproduciendo = null;
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
  precargarSiguiente(hero);
  if (promesa && typeof promesa.catch === 'function') {
    promesa.catch(() => {
      if (reproduciendo === hero) {
        cancelar();
      }
    });
  }
}

function accionParaHeroEnY(dir, ordenados, indiceHero, y) {
  const hero = ordenados[indiceHero];
  const enReposo = enReposoDeTramo(y, hero.st);
  const reposoY = reposoDeTramo(hero.st);
  const largo = hero.st.end - hero.st.start;
  const pasadoReposo =
    reposoY !== null && largo > 0 && y > reposoY + TOLERANCIA_REPOSO * largo;

  return accionPorGesto({
    direccion: dir,
    enReposo,
    pasadoReposo,
    reproduciendo: Boolean(reproduciendo || transicionTl),
    indiceHero,
    totalHeros: ordenados.length,
  });
}

function ejecutarAccion(accion, ordenados, indiceHero) {
  const hero = ordenados[indiceHero];
  if (accion === 'reproducir') {
    reproducir(hero);
  } else if (accion === 'cancelar_y_reposar') {
    cancelar();
    const reposoY = reposoDeTramo(hero.st);
    if (reposoY !== null) {
      deslizarA(reposoY, DURACION_REPOSAR, hero);
    }
  } else if (accion === 'reposar') {
    const reposoY = reposoDeTramo(hero.st);
    if (reposoY !== null) {
      deslizarA(reposoY, DURACION_REPOSAR, hero);
    }
  } else if (accion === 'anterior') {
    const anterior = ordenados[indiceHero - 1];
    const reposoPrev = anterior ? reposoDeTramo(anterior.st) : null;
    if (reposoPrev !== null) {
      transicionarA(reposoPrev, anterior);
    }
  }
}

function esMismoGestoWheel(dir) {
  const ahora = Date.now();
  if (
    ultimoWheelMs > 0 &&
    ahora - ultimoWheelMs <= VENTANA_GESTO_WHEEL_MS &&
    dir === ultimaDireccionWheel
  ) {
    ultimoWheelMs = ahora;
    return true;
  }
  ultimoWheelMs = ahora;
  ultimaDireccionWheel = dir;
  return false;
}

function alTick() {
  if (!reproduciendo) return;
  if (Math.abs(window.scrollY - ultimaYEscrita) > TOLERANCIA_SCROLL_EXTERNO) {
    cancelar();
    return;
  }
  const { video, st } = reproduciendo;
  const dur = video?.duration;
  if (!Number.isFinite(dur) || dur <= 0 || !st) return;
  const y = st.start + (video.currentTime / dur) * (st.end - st.start);
  ultimaYEscrita = y;
  window.scrollTo(0, y);
}

function cancelarSiActivo() {
  if (reproduciendo || tween || transicionTl) {
    cancelar();
  }
}

function alWheel(e) {
  if (esCampoEditable(e.target)) return;

  const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
  if (dir === 0) return;
  if (debeIgnorarObjetivo(e.target, dir)) return;

  const { ordenados, tramos, eventosY, zonaFin } = contextoZona();
  if (ordenados.length === 0) return;

  const y = window.scrollY;
  const indiceHero = indiceHeroEnZona(y, tramos, zonaFin);

  if (indiceHero >= 0) {
    const accion = accionParaHeroEnY(dir, ordenados, indiceHero, y);
    if (accion === null) return;

    e.preventDefault();
    if (esMismoGestoWheel(dir)) return;
    ejecutarAccion(accion, ordenados, indiceHero);
    return;
  }

  if (dir === -1 && eventosY !== null && y >= zonaFin) {
    const deltaPx =
      e.deltaMode === 1
        ? e.deltaY * 40
        : e.deltaMode === 2
          ? e.deltaY * window.innerHeight
          : e.deltaY;

    if (y === zonaFin || y + deltaPx < zonaFin) {
      e.preventDefault();
      if (esMismoGestoWheel(dir)) return;
      const ultimo = ordenados[ordenados.length - 1];
      transicionarA(reposoDeTramo(ultimo.st), ultimo);
    }
  }
}

function alTouchStart(e) {
  dedoAbajo = true;
  limpiarTimeoutTouchEnd();
  toqueInicioY = e.touches?.[0]?.clientY ?? null;
  toqueDecidido = false;
  if (reproduciendo || tween || transicionTl) {
    cancelar();
  }
}

function alTouchMove(e) {
  if (esCampoEditable(e.target)) return;

  const clientY = e.touches?.[0]?.clientY;
  if (typeof clientY !== 'number' || toqueInicioY === null) return;

  const deltaY = toqueInicioY - clientY;
  const dir = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;
  if (debeIgnorarObjetivo(e.target, dir)) return;

  const { ordenados, tramos, eventosY, zonaFin } = contextoZona();
  if (ordenados.length === 0) return;

  const y = window.scrollY;
  const indiceHero = indiceHeroEnZona(y, tramos, zonaFin);

  if (indiceHero >= 0) {
    const accion =
      dir !== 0 ? accionParaHeroEnY(dir, ordenados, indiceHero, y) : 'ignorar';
    if (accion === null) return;

    e.preventDefault();
    if (!toqueDecidido && dir !== 0 && Math.abs(deltaY) > UMBRAL_TOQUE_PX) {
      toqueDecidido = true;
      ejecutarAccion(accion, ordenados, indiceHero);
    }
    return;
  }

  if (
    dir === -1 &&
    eventosY !== null &&
    y >= zonaFin &&
    (y === zonaFin || y - Math.abs(deltaY) < zonaFin)
  ) {
    e.preventDefault();
    if (!toqueDecidido && Math.abs(deltaY) > UMBRAL_TOQUE_PX) {
      toqueDecidido = true;
      const ultimo = ordenados[ordenados.length - 1];
      transicionarA(reposoDeTramo(ultimo.st), ultimo);
    }
  }
}

function alTouchEnd() {
  dedoAbajo = false;
  toqueInicioY = null;
  if (reproduciendo || tween || transicionTl) return;
  limpiarTimeoutTouchEnd();
  const y = window.scrollY;
  timeoutTouchEnd = setTimeout(() => {
    timeoutTouchEnd = null;
    if (window.scrollY === y) {
      alDetenerse();
    }
  }, DEMORA_FIN_TOQUE_MS);
}

function direccionDeTecla(e) {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') return 1;
  if (e.key === 'ArrowUp' || e.key === 'PageUp') return -1;
  if (e.key === ' ') return e.shiftKey ? -1 : 1;
  return 0;
}

function alPresionarTecla(e) {
  if (esCampoEditable(e.target)) return;
  if (!TECLAS_SCROLL.has(e.key)) return;

  const dir = direccionDeTecla(e);
  if (dir === 0) {
    if (reproduciendo || tween || transicionTl) {
      cancelar();
    }
    return;
  }

  const { ordenados, tramos, eventosY, zonaFin } = contextoZona();
  if (ordenados.length === 0) return;

  const y = window.scrollY;
  const indiceHero = indiceHeroEnZona(y, tramos, zonaFin);

  if (indiceHero >= 0) {
    const accion = accionParaHeroEnY(dir, ordenados, indiceHero, y);
    if (accion === null) return;

    e.preventDefault();
    ejecutarAccion(accion, ordenados, indiceHero);
    return;
  }

  if (
    dir === -1 &&
    eventosY !== null &&
    y >= zonaFin &&
    (y === zonaFin ||
      (e.key === 'PageUp' && y - (window.innerHeight || 0) < zonaFin))
  ) {
    e.preventDefault();
    const ultimo = ordenados[ordenados.length - 1];
    transicionarA(reposoDeTramo(ultimo.st), ultimo);
    return;
  }

  if (reproduciendo || tween || transicionTl) {
    cancelar();
  }
}

function alDetenerse() {
  if (autoActivo || dedoAbajo) return;

  const { ordenados, tramos, zonaFin } = contextoZona();
  if (ordenados.length === 0) return;

  const y = window.scrollY;
  if (y < tramos[0].start || y >= zonaFin) return;

  const cercano = reposoMasCercano(y, tramos);
  if (!cercano) return;

  const heroCercano = ordenados[cercano.indice];
  if (enReposoDeTramo(y, heroCercano.st)) return;

  deslizarA(cercano.y, DURACION_REPOSAR, heroCercano);
}

function instalarListeners() {
  if (listenersActivos) return;
  listenersActivos = true;
  reiniciarEstado();
  crearOverlayTransicion();
  window.addEventListener('wheel', alWheel, { passive: false });
  window.addEventListener('pointerdown', cancelarSiActivo, { passive: true });
  window.addEventListener('click', cancelarSiActivo, {
    capture: true,
    passive: true,
  });
  window.addEventListener('touchstart', alTouchStart, { passive: true });
  window.addEventListener('touchmove', alTouchMove, { passive: false });
  window.addEventListener('touchend', alTouchEnd, { passive: true });
  window.addEventListener('touchcancel', alTouchEnd, { passive: true });
  window.addEventListener('keydown', alPresionarTecla);
  ScrollTrigger.addEventListener('scrollEnd', alDetenerse);
  gsap.ticker.add(alTick);
}

function quitarListeners() {
  if (!listenersActivos) return;
  listenersActivos = false;
  window.removeEventListener('wheel', alWheel, { passive: false });
  window.removeEventListener('pointerdown', cancelarSiActivo);
  window.removeEventListener('click', cancelarSiActivo, { capture: true });
  window.removeEventListener('touchstart', alTouchStart);
  window.removeEventListener('touchmove', alTouchMove, { passive: false });
  window.removeEventListener('touchend', alTouchEnd);
  window.removeEventListener('touchcancel', alTouchEnd);
  window.removeEventListener('keydown', alPresionarTecla);
  ScrollTrigger.removeEventListener('scrollEnd', alDetenerse);
  gsap.ticker.remove(alTick);
  quitarOverlayTransicion();
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

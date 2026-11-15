import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { decidirAccionHero, REPOSO_HERO } from '../../lib/modoHero';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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
let autoActivo = false;
let entradaDesdeFinAuto = true;

function herosOrdenados() {
  return [...registros].sort((a, b) => a.st.start - b.st.start);
}

function reposo(hero) {
  return hero.st.start + REPOSO_HERO * (hero.st.end - hero.st.start);
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
}

function cancelar({ pausar = true } = {}) {
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

function deslizarA(y, duracion, destino = null) {
  if (tween) {
    tween.kill();
    tween = null;
  }
  autoActivo = true;
  heroDestino = destino;
  tween = gsap.to(window, {
    scrollTo: { y, autoKill: false },
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
  if (t >= dur - 0.05) {
    irAlSiguiente(hero);
    return;
  }

  if (video.ended || Math.abs(video.currentTime - t) > 0.05) {
    video.currentTime = t;
  }

  if (limpiarEnded) {
    limpiarEnded();
  }

  autoActivo = true;
  reproduciendo = hero;

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
  const { video, st } = reproduciendo;
  const dur = video?.duration;
  if (!Number.isFinite(dur) || dur <= 0 || !st) return;
  window.scrollTo(0, st.start + (video.currentTime / dur) * (st.end - st.start));
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

function alTouchStart() {
  if (reproduciendo || tween) {
    cancelar();
  }
}

function alPresionarTecla(e) {
  if (TECLAS_SCROLL.has(e.key)) {
    alEntrarUsuario();
  }
}

function alDetenerse() {
  if (autoActivo || !entradaDesdeFinAuto) return;

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
  ultimaY = window.scrollY;
  direccion = 1;
  autoActivo = false;
  entradaDesdeFinAuto = true;
  window.addEventListener('scroll', alHacerScroll, { passive: true });
  window.addEventListener('wheel', alEntrarUsuario, { passive: true });
  window.addEventListener('touchstart', alTouchStart, { passive: true });
  window.addEventListener('touchmove', alEntrarUsuario, { passive: true });
  window.addEventListener('keydown', alPresionarTecla);
  ScrollTrigger.addEventListener('scrollEnd', alDetenerse);
  gsap.ticker.add(alTick);
}

function quitarListeners() {
  if (!listenersActivos) return;
  listenersActivos = false;
  window.removeEventListener('scroll', alHacerScroll);
  window.removeEventListener('wheel', alEntrarUsuario);
  window.removeEventListener('touchstart', alTouchStart);
  window.removeEventListener('touchmove', alEntrarUsuario);
  window.removeEventListener('keydown', alPresionarTecla);
  ScrollTrigger.removeEventListener('scrollEnd', alDetenerse);
  gsap.ticker.remove(alTick);
}

function reiniciarEstado() {
  if (tween) {
    tween.kill();
    tween = null;
  }
  heroDestino = null;
  if (limpiarEnded) {
    limpiarEnded();
  }
  reproduciendo = null;
  direccion = 1;
  ultimaY = 0;
  autoActivo = false;
  entradaDesdeFinAuto = true;
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

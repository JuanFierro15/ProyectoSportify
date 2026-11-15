// Conmutador temporal para comparar variantes de scroll del hero (?hero=snap vs scrub).

export const MODOS_HERO = ['scrub', 'snap'];
export const REPOSO_HERO = 0.15;
export const TOLERANCIA_REPOSO = 0.01;

/**
 * Lee el parámetro `hero` de la URL para elegir el modo de scroll del hero.
 * Devuelve `'snap'` si es `'snap'` (ignorando mayúsculas y espacios); en cualquier
 * otro caso devuelve `'scrub'`.
 */
export function modoScrollHero(search) {
  if (typeof search !== 'string' || !search) return 'scrub';
  const params = new URLSearchParams(search);
  const valor = params.get('hero');
  if (valor && valor.trim().toLowerCase() === 'snap') {
    return 'snap';
  }
  return 'scrub';
}

/**
 * Qué hacer cuando el scroll se detiene dentro del tramo de un hero (modo snap).
 * progreso: (scrollY - start) / (end - start) del ScrollTrigger del hero. Puede
 *   ser > 1 en el hueco entre el final del pin y el inicio del siguiente hero.
 * direccion: 1 si el último movimiento fue hacia abajo, -1 si fue hacia arriba.
 * Devuelve 'reposar' | 'reproducir' | 'siguiente' | null.
 */
export function decidirAccionHero({ progreso, direccion } = {}) {
  if (!Number.isFinite(progreso)) return null;
  if (direccion !== 1) return null;
  if (progreso < 0) return null;
  if (progreso < REPOSO_HERO - TOLERANCIA_REPOSO) return 'reposar';
  if (progreso <= REPOSO_HERO + TOLERANCIA_REPOSO) return null;
  if (progreso < 1) return 'reproducir';
  return 'siguiente';
}

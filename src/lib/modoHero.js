// Conmutador temporal para comparar variantes de scroll del hero (?hero=snap vs scrub).

export const MODOS_HERO = ['scrub', 'snap'];
export const REPOSO_HERO = 0.15;
export const PUNTOS_SNAP_HERO = [0, REPOSO_HERO, 1];

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

// Reglas del avance por gestos del hero.

export const REPOSO_HERO = 0.15;
export const TOLERANCIA_REPOSO = 0.01;

/**
 * Qué hacer cuando el scroll se detiene dentro del tramo de un hero.
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

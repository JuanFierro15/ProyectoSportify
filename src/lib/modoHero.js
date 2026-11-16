// Reglas puras de la navegación por secciones del hero.

// Fracción del tramo para el fade de entrada y salida del texto/CTA.
// `REPOSO_HERO` debe ser >= `DURACION_FADE_CONTENIDO` para que el CTA quede visible.
export const DURACION_FADE_CONTENIDO = 0.15;
export const REPOSO_HERO = 0.15;
export const TOLERANCIA_REPOSO = 0.01;

/** Devuelve la posición `scrollY` de reposo para un tramo `{ start, end }`. */
export function reposoDeTramo(tramo) {
  if (!tramo || !Number.isFinite(tramo.start) || !Number.isFinite(tramo.end)) {
    return null;
  }
  return tramo.start + REPOSO_HERO * (tramo.end - tramo.start);
}

/** Indica si `y` está dentro de la ventana de reposo (`REPOSO_HERO ± TOLERANCIA_REPOSO`). */
export function enReposoDeTramo(y, tramo) {
  if (!Number.isFinite(y) || !tramo) return false;
  const largo = tramo.end - tramo.start;
  if (!Number.isFinite(largo) || largo <= 0) return false;
  const progreso = (y - tramo.start) / largo;
  return Math.abs(progreso - REPOSO_HERO) <= TOLERANCIA_REPOSO + 1e-9;
}

/**
 * Devuelve el índice del hero que contiene `y` dentro de la zona `[tramos[0].start, limiteZona)`,
 * o `-1` si `y` está fuera de la zona.
 */
export function indiceHeroEnZona(y, tramos, limiteZona) {
  if (!Number.isFinite(y) || !Array.isArray(tramos) || tramos.length === 0) {
    return -1;
  }
  const inicioZona = tramos[0].start;
  const finZona = Number.isFinite(limiteZona)
    ? limiteZona
    : tramos[tramos.length - 1].end;

  if (y < inicioZona || y >= finZona) return -1;

  for (let i = 0; i < tramos.length; i++) {
    const limite = i + 1 < tramos.length ? tramos[i + 1].start : finZona;
    if (y >= tramos[i].start && y < limite) {
      return i;
    }
  }
  return -1;
}

/**
 * Encuentra el punto de reposo más cercano a `y` entre `tramos` (ordenados por `start`).
 * El hueco posterior a `tramo.end` y anterior al `start` del siguiente pertenece al siguiente hero.
 * En empate exacto de distancia, elige el tramo siguiente.
 */
export function reposoMasCercano(y, tramos) {
  if (!Number.isFinite(y) || !Array.isArray(tramos) || tramos.length === 0) {
    return null;
  }

  for (let i = 0; i < tramos.length - 1; i++) {
    if (y > tramos[i].end && y < tramos[i + 1].start) {
      const reposoSiguiente = reposoDeTramo(tramos[i + 1]);
      return reposoSiguiente !== null
        ? { indice: i + 1, y: reposoSiguiente }
        : null;
    }
  }

  let mejorIndice = -1;
  let mejorReposo = null;
  let mejorDist = Infinity;

  for (let i = 0; i < tramos.length; i++) {
    const r = reposoDeTramo(tramos[i]);
    if (r === null) continue;
    const dist = Math.abs(y - r);
    if (dist <= mejorDist) {
      mejorDist = dist;
      mejorIndice = i;
      mejorReposo = r;
    }
  }

  return mejorIndice >= 0 ? { indice: mejorIndice, y: mejorReposo } : null;
}

/**
 * Decide qué acción tomar ante un gesto direccional dentro de la zona de heros.
 * Devuelve 'reproducir' | 'ignorar' | 'cancelar_y_reposar' | 'reposar' | 'anterior' | null.
 */
export function accionPorGesto({
  direccion,
  enReposo,
  reproduciendo,
  indiceHero,
  totalHeros,
  pasadoReposo = false,
} = {}) {
  if (direccion !== 1 && direccion !== -1) return null;
  if (
    !Number.isInteger(indiceHero) ||
    !Number.isInteger(totalHeros) ||
    indiceHero < 0 ||
    indiceHero >= totalHeros
  ) {
    return null;
  }

  if (direccion === 1) {
    return reproduciendo ? 'ignorar' : 'reproducir';
  }

  if (reproduciendo) {
    return 'cancelar_y_reposar';
  }

  if (!enReposo && pasadoReposo) {
    return 'reposar';
  }

  return indiceHero > 0 ? 'anterior' : null;
}

/**
 * Indica si algún ancestro (de abajo hacia arriba, sin incluir al documento)
 * tiene desplazamiento vertical habilitado y aún puede desplazarse en `direccion` (`1` o `-1`).
 */
export function puedeDesplazarAncestro(ancestros, direccion) {
  if ((direccion !== 1 && direccion !== -1) || !Array.isArray(ancestros)) {
    return false;
  }

  for (const el of ancestros) {
    if (!el) continue;
    const { overflowY, scrollTop, scrollHeight, clientHeight } = el;
    if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
    if (!Number.isFinite(scrollHeight) || !Number.isFinite(clientHeight)) {
      continue;
    }
    if (scrollHeight <= clientHeight) continue;

    if (direccion === 1 && scrollTop + clientHeight < scrollHeight) {
      return true;
    }
    if (direccion === -1 && scrollTop > 0) {
      return true;
    }
  }

  return false;
}

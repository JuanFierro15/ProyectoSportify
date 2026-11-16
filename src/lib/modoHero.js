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

/** Devuelve la posición `scrollY` final para un tramo `{ start, end }`. */
export function finalDeTramo(tramo) {
  if (!tramo || !Number.isFinite(tramo.start) || !Number.isFinite(tramo.end)) {
    return null;
  }
  return tramo.end;
}

/** Indica si `y` está dentro de la ventana del punto final (`1 ± TOLERANCIA_REPOSO`). */
export function enFinalDeTramo(y, tramo) {
  if (!Number.isFinite(y) || !tramo) return false;
  const largo = tramo.end - tramo.start;
  if (!Number.isFinite(largo) || largo <= 0) return false;
  const progreso = (y - tramo.start) / largo;
  return Math.abs(progreso - 1) <= TOLERANCIA_REPOSO + 1e-9;
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
 * Encuentra el punto estable más cercano a `y` entre los puntos `inicio` y `final`
 * de cada tramo en `tramos` (ordenados por `start`).
 * En empate exacto de distancia, elige el siguiente punto estable hacia adelante.
 */
export function puntoEstableMasCercano(y, tramos) {
  if (!Number.isFinite(y) || !Array.isArray(tramos) || tramos.length === 0) {
    return null;
  }

  let mejor = null;
  let mejorDist = Infinity;

  for (let i = 0; i < tramos.length; i++) {
    const puntos = [
      { punto: 'inicio', y: reposoDeTramo(tramos[i]) },
      { punto: 'final', y: finalDeTramo(tramos[i]) },
    ];
    for (const candidato of puntos) {
      if (candidato.y === null) continue;
      const dist = Math.abs(y - candidato.y);
      if (dist <= mejorDist) {
        mejorDist = dist;
        mejor = { indice: i, punto: candidato.punto, y: candidato.y };
      }
    }
  }

  return mejor;
}

/**
 * Decide qué acción tomar ante un gesto direccional dentro de la zona de heros.
 * Devuelve:
 * - 'reproducir'
 * - 'siguiente_inicio'
 * - 'anterior_final'
 * - 'rebobinar'
 * - 'cancelar_y_reposar'
 * - 'reposar'
 * - 'ignorar'
 * - null
 */
export function accionPorGesto({
  direccion,
  punto,
  reproduciendo,
  animando = false,
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

  if (animando) {
    return 'ignorar';
  }

  if (direccion === 1) {
    if (reproduciendo) return 'ignorar';
    return punto === 'final' ? 'siguiente_inicio' : 'reproducir';
  }

  if (reproduciendo) {
    return 'cancelar_y_reposar';
  }

  if (punto === 'final') {
    return 'rebobinar';
  }

  if (punto === 'otro' && pasadoReposo) {
    return 'reposar';
  }

  return indiceHero > 0 ? 'anterior_final' : null;
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

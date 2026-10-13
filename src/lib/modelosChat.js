// Respaldo de modelo del asistente (lógica pura, sin el SDK): qué modelos
// probar y en qué orden, cuánto tiempo darle a cada intento y qué responder
// si fallan todos. La usa api/chat.js.

export const MODELO_PRINCIPAL = 'gemini-3.5-flash-lite';
export const MODELOS_RESPALDO = ['gemini-3.1-flash-lite', 'gemini-3.6-flash'];
export const MAX_MODELOS = 3;
export const PRESUPUESTO_MS = 17000; // total por mensaje (el widget espera 20 s)
export const TIEMPO_PRINCIPAL_MS = 7000; // tope del primer intento
export const TIEMPO_RESPALDO_MS = 6000; // tope de cada intento siguiente
export const TIEMPO_MINIMO_MS = 2500; // con menos tiempo restante no se intenta
export const ENFRIAMIENTO_MS = 60000; // un modelo que falló se deja de lado 60 s

export function listaModelos(env = {}) {
  const envPrincipal = String(env?.GEMINI_MODEL ?? '').trim();
  const principal = envPrincipal || MODELO_PRINCIPAL;

  let respaldo;
  if (env?.GEMINI_MODELOS_RESPALDO === undefined) {
    respaldo = MODELOS_RESPALDO;
  } else {
    respaldo = String(env.GEMINI_MODELOS_RESPALDO)
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
  }

  const modelos = [principal, ...respaldo];
  const resultado = [];
  for (const modelo of modelos) {
    if (!resultado.includes(modelo)) {
      resultado.push(modelo);
      if (resultado.length === MAX_MODELOS) {
        break;
      }
    }
  }

  return resultado;
}

export function esTiempoAgotado(error) {
  return error?.name === 'TimeoutError' || error?.name === 'AbortError';
}

const ESTADOS_REINTENTABLES = [404, 429, 500, 503, 504];

export function esReintentable(error) {
  if (esTiempoAgotado(error)) {
    return true;
  }
  const status = Number(error?.status);
  return ESTADOS_REINTENTABLES.includes(status);
}

export function ordenarPorDisponibilidad(modelos, fallas, ahora) {
  const lista = Array.isArray(modelos) ? modelos : [];
  const disponibles = [];
  const enEnfriamiento = [];

  for (const modelo of lista) {
    const enCooldown =
      Boolean(fallas?.has(modelo)) && ahora - fallas.get(modelo) < ENFRIAMIENTO_MS;

    if (enCooldown) {
      enEnfriamiento.push(modelo);
    } else {
      disponibles.push(modelo);
    }
  }

  return [...disponibles, ...enEnfriamiento];
}

export function registrarFalla(fallas, modelo, ahora) {
  fallas.set(modelo, ahora);
  return fallas;
}

export function registrarExito(fallas, modelo) {
  fallas.delete(modelo);
  return fallas;
}

export function tiempoIntento(indice, restanteMs) {
  const tope = indice === 0 ? TIEMPO_PRINCIPAL_MS : TIEMPO_RESPALDO_MS;
  const t = Math.min(tope, restanteMs);
  return t >= TIEMPO_MINIMO_MS ? t : 0;
}

export function respuestaFinal(errores) {
  if (
    Array.isArray(errores) &&
    errores.length > 0 &&
    errores.every((e) => Number(e?.status) === 429)
  ) {
    return { status: 429, clave: 'limite' };
  }

  if (Array.isArray(errores) && errores.some(esTiempoAgotado)) {
    return { status: 504, clave: 'generico' };
  }

  return { status: 502, clave: 'generico' };
}

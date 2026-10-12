/**
 * Lógica pura del widget de chat (sin React ni APIs del navegador): contexto
 * que se envía a /api/chat, recorte del historial, validación de la
 * respuesta y de la conversación guardada en sessionStorage.
 */

export const MAX_TURNOS = 20;
export const MAX_MENSAJE = 500;
export const CLAVE_SESION = 'sportify_chat_v1';
export const TEXTO_ERROR_CHAT = 'No pude responder ahora. Intenta de nuevo en un momento.';
export const SUGERENCIAS_INICIALES = [
  '¿Qué horarios hay libres hoy?',
  '¿Cuánto cuesta una hora?',
  '¿Dónde quedan?',
];

export function mensajeBienvenida() {
  return {
    id: 'bienvenida',
    rol: 'bot',
    texto: 'Hola, soy el asistente de Sportify. ¿En qué te ayudo?',
    sugerencias: [...SUGERENCIAS_INICIALES],
    accion: null,
    bienvenida: true,
  };
}

export function crearId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function horaLocal(fecha = new Date()) {
  const h = String(fecha.getHours()).padStart(2, '0');
  const m = String(fecha.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function contextoChat({ dias = [], canchas = [], disponibilidad, ahora = new Date() }) {
  const fechaHoy = dias[0] || '';
  const horaActual = horaLocal(ahora);

  const canchasFiltradas = canchas.map(({ id, nombre, deporte, precioHora }) => ({
    id,
    nombre,
    deporte,
    precioHora,
  }));

  const disponibilidadTotal = [];
  for (const c of canchas) {
    for (const fecha of dias) {
      const franjas = typeof disponibilidad === 'function' ? disponibilidad(c.id, fecha) : [];
      const franjasLibres = Array.isArray(franjas)
        ? franjas.filter((h) => h && h.disponible).map((h) => h.hora)
        : [];
      disponibilidadTotal.push({
        canchaId: c.id,
        fecha,
        franjasLibres,
      });
    }
  }

  return {
    fechaHoy,
    horaActual,
    canchas: canchasFiltradas,
    disponibilidad: disponibilidadTotal,
  };
}

export function historialParaEnviar(mensajes, max = MAX_TURNOS) {
  if (!Array.isArray(mensajes)) {
    return [];
  }
  return mensajes
    .filter(
      (m) =>
        m &&
        (m.rol === 'usuario' || m.rol === 'bot') &&
        typeof m.texto === 'string' &&
        m.texto.trim() !== '' &&
        !m.bienvenida &&
        !m.error
    )
    .slice(-max)
    .map((m) => ({
      rol: m.rol,
      texto: m.texto.slice(0, 1500),
    }));
}

export function normalizarRespuesta(json) {
  if (!json || typeof json !== 'object' || typeof json.respuesta !== 'string') {
    return null;
  }

  const respuesta = json.respuesta.trim();
  if (respuesta === '') {
    return null;
  }

  const sugerencias = Array.isArray(json.sugerencias)
    ? json.sugerencias
        .filter((s) => typeof s === 'string' && s.trim() !== '')
        .map((s) => s.trim())
        .slice(0, 3)
    : [];

  let accion = null;
  if (
    json.accion &&
    typeof json.accion === 'object' &&
    typeof json.accion.tipo === 'string' &&
    json.accion.tipo.trim() !== ''
  ) {
    accion = { ...json.accion };
  }

  return {
    respuesta,
    sugerencias,
    accion,
  };
}

export function parsearConversacion(texto) {
  if (typeof texto !== 'string') {
    return null;
  }
  try {
    const datos = JSON.parse(texto);
    if (!Array.isArray(datos) || datos.length === 0) {
      return null;
    }
    const valido = datos.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.trim() !== '' &&
        (item.rol === 'usuario' || item.rol === 'bot') &&
        typeof item.texto === 'string'
    );
    return valido ? datos : null;
  } catch {
    return null;
  }
}

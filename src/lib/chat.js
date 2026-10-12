/**
 * Lógica pura del widget de chat (sin React ni APIs del navegador): contexto
 * que se envía a /api/chat, recorte del historial, validación de la
 * respuesta y de la conversación guardada en sessionStorage.
 */

import negocio from '../data/negocio.json';
import { formatoPrecio, finDeFranja } from './precios';
import { horaAmPm, fechaCompleta } from './fechas';
import { formatoTelefono } from './negocio';

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

  // El modelo a veces cierra una hora con otro punto ("9:00 p. m.."): dos
  // puntos exactos pasan a uno (los puntos suspensivos se respetan).
  // (Sin lookbehind: Safari < 16.4 no lo soporta y rompería el bundle.)
  const respuesta = json.respuesta
    .trim()
    .replace(/\.{2,}/g, (puntos) => (puntos.length === 2 ? '.' : puntos));
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

// --- Reservas y cancelaciones desde el chat (parte 6.3) ---------------------
// Textos fijos que agrega el navegador (no el modelo). Son mensajes del bot
// normales: entran al historial para que el modelo sepa qué pasó.

// '$ 45.000' (con espacio de no separación) -> '$45.000', como en el chat.
export function precioTexto(valor) {
  return formatoPrecio.format(valor).replace(/\s/g, '');
}

export function fechaEnFrase(fecha) {
  const str = fechaCompleta(fecha);
  if (!str) {
    return '';
  }
  return str[0].toLowerCase() + str.slice(1);
}

export function rangoHoras(horas) {
  if (!Array.isArray(horas) || horas.length === 0) {
    return '';
  }
  return `de ${horaAmPm(horas[0])} a ${horaAmPm(finDeFranja(horas[horas.length - 1]))}`;
}

const RESPUESTAS_SI = new Set([
  'si',
  'confirmo',
  'dale',
  'listo',
  'ok',
  'okay',
  'claro',
  'de acuerdo',
  'si confirmo',
  'si por favor',
  'si dale',
  'confirmar',
  'correcto',
]);

const RESPUESTAS_NO = new Set([
  'no',
  'cancela',
  'cancelar',
  'no gracias',
  'mejor no',
  'no quiero',
  'no por favor',
]);

// Respuesta a una tarjeta pendiente: compara el mensaje COMPLETO normalizado
// (sin tildes ni signos). "sí, pero a las 10" no es un sí: devuelve null.
export function detectarSiNo(texto) {
  if (texto == null) {
    return null;
  }
  const normalizado = String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalizado) {
    return null;
  }
  if (RESPUESTAS_SI.has(normalizado)) {
    return 'si';
  }
  if (RESPUESTAS_NO.has(normalizado)) {
    return 'no';
  }
  return null;
}

// Cierra una frase con punto, salvo que ya termine en uno ("4:00 p. m." no
// debe quedar "4:00 p. m..").
export function cerrarFrase(texto) {
  const str = String(texto ?? '');
  return str.endsWith('.') ? str : `${str}.`;
}

export function mensajeReservaHecha({ canchaNombre, fecha, horas, codigo, total }) {
  const pct = negocio.pagos.abonoPorcentaje;
  const plazo = negocio.pagos.abonoPlazoHoras;
  const medios = negocio.pagos.abonoMedios;
  const tel = formatoTelefono(negocio.telefono);
  const abono = Math.round((total * pct) / 100);

  return `${cerrarFrase(`Listo, tu reserva quedó confirmada: ${canchaNombre}, ${fechaEnFrase(fecha)}, ${rangoHoras(horas)}`)} Código: ${codigo}. Total: ${precioTexto(total)}. Para asegurarla, envía un abono del ${pct} % (${precioTexto(abono)}) por ${medios.join(' o ')} en las próximas ${plazo} horas; escríbenos al ${tel} para recibir los datos de pago.`;
}

export function mensajeChoque({ canchaNombre, fecha, libres }) {
  if (Array.isArray(libres) && libres.length > 0) {
    return cerrarFrase(`Esa franja ya no está libre, así que no hice la reserva. ${canchaNombre} tiene libres ${fechaEnFrase(fecha)}: ${libres.map(horaAmPm).join(', ')}`);
  }
  return `Esa franja ya no está libre, así que no hice la reserva. ${canchaNombre} ya no tiene franjas libres ${fechaEnFrase(fecha)}.`;
}

export const MENSAJE_RESERVA_NO_HECHA = 'Listo, no hice la reserva. ¿Te ayudo con algo más?';

export function mensajeSinCoincidencias() {
  const tel = formatoTelefono(negocio.telefono);
  return `No encontré reservas próximas con ese nombre y teléfono. Si la hiciste sin teléfono o necesitas ayuda, comunícate con el local al ${tel}.`;
}

export const TEXTO_TARJETA_CANCELACION = 'Encontré esta reserva. ¿Quieres cancelarla?';

export const TEXTO_OPCIONES_CANCELACION = 'Encontré varias reservas con esos datos. ¿Cuál quieres cancelar?';

export function mensajeCancelacionHecha({ canchaNombre, fecha, horas }) {
  return `${cerrarFrase(`Listo, cancelé tu reserva de ${canchaNombre}, ${fechaEnFrase(fecha)}, ${rangoHoras(horas)}`)} La franja quedó libre.`;
}

export const MENSAJE_CANCELACION_NO_HECHA = 'Listo, no cancelé la reserva. ¿Te ayudo con algo más?';

export function etiquetaReserva(reserva) {
  if (!reserva) {
    return '';
  }
  const horas =
    Array.isArray(reserva.horas) && reserva.horas.length > 0
      ? reserva.horas
      : reserva.hora
      ? [reserva.hora]
      : [];
  return `${reserva.canchaNombre}, ${fechaEnFrase(reserva.fecha)}, ${rangoHoras(horas)}`;
}


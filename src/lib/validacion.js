/**
 * Validaciones del formulario de contacto, usadas por el formulario de
 * reserva. El nombre es obligatorio (errorNombreObligatorio) y el teléfono
 * opcional (vacío es válido); si se escribe algo, debe cumplir el formato.
 *
 * También las usa el chatbot, en el navegador y en la función /api/chat:
 * normalización de lo que llega del chat, contacto con teléfono obligatorio
 * y validación de una reserva propuesta. Debe seguir siendo JS puro (sin JSX
 * ni APIs del navegador).
 */

import { finDeFranja, MAX_HORAS_SEGUIDAS } from './precios';
import { horaAmPm } from './fechas';

// Letras (con tildes, ñ, ü...) separadas por un solo espacio. Sin números ni
// símbolos. `\p{L}` cubre cualquier letra Unicode.
export const REGEX_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u;

// Celular colombiano: 10 dígitos que empiezan por 3.
export const REGEX_TELEFONO = /^3\d{9}$/;

export const MENSAJE_NOMBRE_VACIO = 'Escribe tu nombre.';
export const MENSAJE_NOMBRE = 'Usa solo letras y espacios, sin números ni símbolos.';
export const MENSAJE_TELEFONO = 'Debe empezar por 3 y tener 10 dígitos.';

// Limpia mientras se escribe: el nombre solo conserva letras y espacios; el
// teléfono, solo dígitos (máx. 10). Así ni siquiera se pueden teclear
// caracteres inválidos, y pegar "300 123 4567" queda como "3001234567".
export function limpiarNombre(valor) {
  return valor.replace(/[^\p{L} ]/gu, '').replace(/ {2,}/g, ' ').replace(/^ /, '');
}

export function limpiarTelefono(valor) {
  return valor.replace(/\D/g, '').slice(0, 10);
}

// Devuelve el mensaje de error, o '' si es válido (o está vacío).
export function errorNombre(valor) {
  const v = valor.trim();
  return v === '' || REGEX_NOMBRE.test(v) ? '' : MENSAJE_NOMBRE;
}

export function errorNombreObligatorio(valor) {
  if (valor.trim() === '') {
    return MENSAJE_NOMBRE_VACIO;
  }
  return errorNombre(valor);
}

export function errorTelefono(valor) {
  return valor === '' || REGEX_TELEFONO.test(valor) ? '' : MENSAJE_TELEFONO;
}

// El primer dígito ya es incorrecto: se puede avisar mientras se escribe, sin
// esperar a que el usuario salga del campo (la longitud, en cambio, solo se
// reclama al salir, porque mientras escribe es normal que esté incompleto).
export function empiezaMalTelefono(valor) {
  return valor !== '' && valor[0] !== '3';
}

// --- Chatbot ---------------------------------------------------------------

// Lo que llega del chat se normaliza antes de validar: "  Juan   Pérez " ->
// "Juan Pérez"; "+57 300-123.4567" -> "3001234567".
export function normalizarNombre(valor) {
  return String(valor ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizarTelefono(valor) {
  const str = String(valor ?? '').trim().replace(/[\s\-().]/g, '');
  return str.startsWith('+57') ? str.slice(3) : str;
}

// Mensajes fijos que el servidor responde sin volver a llamar al modelo.
export const MENSAJES_CHAT = Object.freeze({
  cancha: 'No encontré esa cancha. Dime el deporte y el número de la cancha.',
  fecha: 'Solo puedo reservar desde hoy y hasta dentro de 6 días.',
  horasVacias: 'Dime qué hora quieres reservar.',
  horasMax: `Puedes reservar de 1 a ${MAX_HORAS_SEGUIDAS} horas seguidas.`,
  horasSeguidas: 'Las horas deben ser seguidas, por ejemplo 9:00 a. m. y 10:00 a. m.',
  nombreVacio: 'Necesito tu nombre para la reserva.',
  nombre: 'Tu nombre solo puede tener letras y espacios, sin números ni símbolos.',
  telefonoVacio: 'Necesito tu teléfono para la reserva.',
  telefono: 'Tu teléfono debe empezar por 3 y tener 10 dígitos.',
});

export function mensajeHoraOcupada(hora) {
  return `La franja de las ${horaAmPm(hora)} no está libre en esa cancha ese día. Elige otra hora.`;
}

// Hoy y los días siguientes en 'YYYY-MM-DD'. Con Date.UTC para que el
// resultado no dependa de la zona horaria del servidor.
export function fechasVentana(fechaHoy, dias = 7) {
  if (typeof fechaHoy !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaHoy)) {
    return [];
  }
  const [y, m, d] = fechaHoy.split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return [];
  }
  const resultado = [];
  for (let i = 0; i < dias; i++) {
    resultado.push(new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
  }
  return resultado;
}

// En el chat el teléfono es obligatorio (en el formulario no). Recibe valores
// ya normalizados. Devuelve { ok, error } con un mensaje listo para mostrar.
export function validarContactoChat(nombre, telefono) {
  const nom = String(nombre ?? '').trim();
  const tel = String(telefono ?? '').trim();
  if (nom === '') {
    return { ok: false, error: MENSAJES_CHAT.nombreVacio };
  }
  if (!REGEX_NOMBRE.test(nom)) {
    return { ok: false, error: MENSAJES_CHAT.nombre };
  }
  if (tel === '') {
    return { ok: false, error: MENSAJES_CHAT.telefonoVacio };
  }
  if (!REGEX_TELEFONO.test(tel)) {
    return { ok: false, error: MENSAJES_CHAT.telefono };
  }
  return { ok: true, error: null };
}

// Reserva propuesta desde el chat. Revisa, en orden, que la cancha exista, que
// la fecha esté en la ventana de 7 días, que las horas sean de 1 a
// MAX_HORAS_SEGUIDAS, seguidas y libres según el contexto, y el contacto.
// Devuelve el primer error como { ok: false, error }, o { ok: true, error: null }.
export function validarPropuestaReserva(propuesta, contexto) {
  const prop = propuesta ?? {};
  const ctx = contexto ?? {};

  const canchas = Array.isArray(ctx.canchas) ? ctx.canchas : [];
  if (!prop.canchaId || !canchas.some((c) => c && c.id === prop.canchaId)) {
    return { ok: false, error: MENSAJES_CHAT.cancha };
  }

  const ventana = fechasVentana(ctx.fechaHoy);
  if (!prop.fecha || !ventana.includes(prop.fecha)) {
    return { ok: false, error: MENSAJES_CHAT.fecha };
  }

  if (
    !Array.isArray(prop.horas) ||
    prop.horas.length === 0 ||
    !prop.horas.every((h) => typeof h === 'string' && /^\d{2}:\d{2}$/.test(h))
  ) {
    return { ok: false, error: MENSAJES_CHAT.horasVacias };
  }

  if (prop.horas.length > MAX_HORAS_SEGUIDAS) {
    return { ok: false, error: MENSAJES_CHAT.horasMax };
  }

  if (new Set(prop.horas).size !== prop.horas.length) {
    return { ok: false, error: MENSAJES_CHAT.horasSeguidas };
  }
  const horasOrdenadas = [...prop.horas].sort();
  for (let i = 1; i < horasOrdenadas.length; i++) {
    if (finDeFranja(horasOrdenadas[i - 1]) !== horasOrdenadas[i]) {
      return { ok: false, error: MENSAJES_CHAT.horasSeguidas };
    }
  }

  const dispLista = Array.isArray(ctx.disponibilidad) ? ctx.disponibilidad : [];
  const entradaDisp = dispLista.find(
    (d) => d && d.canchaId === prop.canchaId && d.fecha === prop.fecha
  );
  const franjasLibres =
    entradaDisp && Array.isArray(entradaDisp.franjasLibres)
      ? entradaDisp.franjasLibres
      : [];

  for (const hora of horasOrdenadas) {
    if (!franjasLibres.includes(hora)) {
      return { ok: false, error: mensajeHoraOcupada(hora) };
    }
  }

  const contacto = validarContactoChat(prop.nombre, prop.telefono);
  if (!contacto.ok) {
    return contacto;
  }

  return { ok: true, error: null };
}

/**
 * Validaciones del formulario de contacto, compartidas por ReservaModal y
 * EventoModal. Ambos campos son opcionales: vacío es válido; si se escribe
 * algo, debe cumplir el formato.
 */

// Letras (con tildes, ñ, ü...) separadas por un solo espacio. Sin números ni
// símbolos. `\p{L}` cubre cualquier letra Unicode.
export const REGEX_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u;

// Celular colombiano: 10 dígitos que empiezan por 3.
export const REGEX_TELEFONO = /^3\d{9}$/;

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

export function errorTelefono(valor) {
  return valor === '' || REGEX_TELEFONO.test(valor) ? '' : MENSAJE_TELEFONO;
}

// El primer dígito ya es incorrecto: se puede avisar mientras se escribe, sin
// esperar a que el usuario salga del campo (la longitud, en cambio, solo se
// reclama al salir, porque mientras escribe es normal que esté incompleto).
export function empiezaMalTelefono(valor) {
  return valor !== '' && valor[0] !== '3';
}

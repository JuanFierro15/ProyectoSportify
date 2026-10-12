/**
 * Helpers de fechas compartidos por el selector de día y la reserva
 * (FormularioReserva, VoucherReserva y el QR). Todo trabaja con fechas ISO
 * `YYYY-MM-DD` en hora local.
 */

export const DIA_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const DIA_LARGO = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
];

export const MES_CORTO = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

export const MES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function aDate(iso) {
  return new Date(`${iso}T00:00:00`);
}

// Etiqueta corta para el selector: "Hoy" / "Mañana" / abreviatura del día.
export function etiquetaDia(iso, dias) {
  if (dias && iso === dias[0]) return 'Hoy';
  if (dias && iso === dias[1]) return 'Mañana';
  return DIA_SEMANA[aDate(iso).getDay()];
}

// Fecha absoluta: "Martes 13 de octubre". La usan el voucher, la
// confirmación y el QR, que no pueden decir "mañana": el QR se escanea el día
// de la reserva, cuando "mañana" ya no es cierto.
export function fechaCompleta(iso) {
  const d = aDate(iso);
  const dia = DIA_LARGO[d.getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${d.getDate()} de ${MES_LARGO[d.getMonth()]}`;
}

// Fecha de hoy en hora local, como ISO `YYYY-MM-DD`.
function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// ¿Esa franja ("HH:MM") de esa fecha ISO ya empezó? Solo aplica a hoy: las
// demás fechas nunca están "pasadas".
export function esHoraPasada(fecha, hora) {
  if (fecha !== hoyISO()) return false;
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const [hh, mm] = hora.split(':').map(Number);
  return hh * 60 + mm < minutosAhora;
}

// Formato de 12 horas del chat: '09:00' -> '9:00 a. m.', '12:00' -> '12:00 m.',
// '13:00' -> '1:00 p. m.'. Si no es 'HH:MM', devuelve el valor tal cual.
export function horaAmPm(hora) {
  if (typeof hora !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return hora;
  }
  const [hhStr, mm] = hora.split(':');
  const hh = parseInt(hhStr, 10);
  if (hh === 0) {
    return `12:${mm} a. m.`;
  }
  if (hh === 12) {
    return `12:${mm} m.`;
  }
  if (hh < 12) {
    return `${hh}:${mm} a. m.`;
  }
  return `${hh - 12}:${mm} p. m.`;
}


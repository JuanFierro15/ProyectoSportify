/**
 * Helpers de fechas compartidos por el selector de día, el modal de reserva
 * y el modal de evento. Todo trabaja con fechas ISO `YYYY-MM-DD` en hora local.
 */

export const DIA_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

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

// Frase para confirmaciones: "hoy" / "mañana" / "el 10 de septiembre".
export function fechaLarga(iso, dias) {
  if (dias && iso === dias[0]) return 'hoy';
  if (dias && iso === dias[1]) return 'mañana';
  const d = aDate(iso);
  return `el ${d.getDate()} de ${MES_LARGO[d.getMonth()]}`;
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

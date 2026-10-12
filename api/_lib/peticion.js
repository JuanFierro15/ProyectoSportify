// Validación del cuerpo de POST /api/chat (tamaño, forma y longitudes) y
// preparación del contexto: el catálogo sale siempre de canchas.json; del
// cliente solo se usa la disponibilidad, filtrada a canchas, fechas y franjas
// válidas.
import canchasData from '../../src/data/canchas.json';
import { fechasVentana } from '../../src/lib/validacion.js';

export const LIMITE_BYTES = 48 * 1024;

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^\d{2}:\d{2}$/;

export function validarPeticion(cuerpoTexto) {
  if (typeof cuerpoTexto !== 'string' || Buffer.byteLength(cuerpoTexto, 'utf8') > LIMITE_BYTES) {
    return { ok: false };
  }

  let json;
  try {
    json = JSON.parse(cuerpoTexto);
  } catch {
    return { ok: false };
  }

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false };
  }

  if (typeof json.mensaje !== 'string') {
    return { ok: false };
  }
  const mensaje = json.mensaje.trim();
  if (mensaje.length < 1 || mensaje.length > 500) {
    return { ok: false };
  }

  let historial = [];
  if (json.historial !== undefined) {
    if (!Array.isArray(json.historial)) {
      return { ok: false };
    }
    for (const item of json.historial) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return { ok: false };
      }
      if (item.rol !== 'usuario' && item.rol !== 'bot') {
        return { ok: false };
      }
      if (typeof item.texto !== 'string') {
        return { ok: false };
      }
      const texto = item.texto.trim();
      if (texto.length === 0 || item.texto.length > 1500) {
        return { ok: false };
      }
    }
    historial = json.historial.slice(-20).map((h) => ({
      rol: h.rol,
      texto: h.texto.trim(),
    }));
  }

  const ctx = json.contexto;
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) {
    return { ok: false };
  }

  if (typeof ctx.fechaHoy !== 'string' || !REGEX_FECHA.test(ctx.fechaHoy)) {
    return { ok: false };
  }

  if (typeof ctx.horaActual !== 'string' || !REGEX_HORA.test(ctx.horaActual)) {
    return { ok: false };
  }

  if (!Array.isArray(ctx.canchas) || ctx.canchas.length > 30) {
    return { ok: false };
  }

  if (!Array.isArray(ctx.disponibilidad) || ctx.disponibilidad.length > 300) {
    return { ok: false };
  }

  for (const disp of ctx.disponibilidad) {
    if (!disp || typeof disp !== 'object' || Array.isArray(disp)) {
      return { ok: false };
    }
    if (typeof disp.canchaId !== 'string' || disp.canchaId.length > 40) {
      return { ok: false };
    }
    if (typeof disp.fecha !== 'string' || !REGEX_FECHA.test(disp.fecha)) {
      return { ok: false };
    }
    if (!Array.isArray(disp.franjasLibres) || disp.franjasLibres.length > 24) {
      return { ok: false };
    }
    for (const hora of disp.franjasLibres) {
      if (typeof hora !== 'string' || !REGEX_HORA.test(hora)) {
        return { ok: false };
      }
    }
  }

  return {
    ok: true,
    datos: {
      mensaje,
      historial,
      contexto: ctx,
    },
  };
}

export function prepararContexto(contexto) {
  const canchas = canchasData.canchas.map(({ id, nombre, deporte, precioHora }) => ({
    id,
    nombre,
    deporte,
    precioHora,
  }));

  const canchasPermitidas = new Set(canchas.map((c) => c.id));
  const ventanaFechas = new Set(fechasVentana(contexto.fechaHoy));
  const horasPermitidas = new Set(canchasData.horas);

  const disponibilidad = [];
  for (const entrada of contexto.disponibilidad) {
    if (canchasPermitidas.has(entrada.canchaId) && ventanaFechas.has(entrada.fecha)) {
      const horasFiltradas = entrada.franjasLibres.filter((h) => horasPermitidas.has(h));
      const franjasLibres = [...new Set(horasFiltradas)].sort();
      disponibilidad.push({
        canchaId: entrada.canchaId,
        fecha: entrada.fecha,
        franjasLibres,
      });
    }
  }

  return {
    fechaHoy: contexto.fechaHoy,
    horaActual: contexto.horaActual,
    canchas,
    disponibilidad,
  };
}

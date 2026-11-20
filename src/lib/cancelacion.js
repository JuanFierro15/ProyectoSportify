// Cancelación de reservas individuales (lógica pura): cuándo se puede cancelar,
// cómo queda el estado y búsqueda de las reservas de una persona. La usan
// ReservasContext (acción CANCELAR), el chat y Mis reservas.

import negocio from '../data/negocio.json';
import { formatoTelefono } from './negocio';
import { normalizarTelefono } from './validacion';

const tel = formatoTelefono(negocio.telefono);
const { horasMinimas, condicion } = negocio.cancelacion;

export const MENSAJES_CANCELACION = Object.freeze({
  noEncontrada: 'No encontré esa reserva. Puede que ya se haya cancelado.',
  evento: `Los torneos y cumpleaños no se cancelan desde aquí. Comunícate con el local al ${tel}.`,
  fueraDePlazo: `Esa reserva ya no se puede cancelar: se cancela sin costo hasta ${horasMinimas} horas antes de empezar. ${condicion} Si necesitas ayuda, comunícate con el local al ${tel}.`,
});

// 'José  PEÑA ' -> 'jose pena' (para comparar nombres sin tildes ni mayúsculas).
export function normalizarComparacion(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Normaliza el código de reserva (sin espacios, mayúsculas, antepone SPF- si falta).
export function normalizarCodigo(codigo) {
  if (typeof codigo !== 'string') return '';
  const limpio = codigo.toUpperCase().replace(/\s+/g, '');
  if (!limpio) return '';
  if (limpio.startsWith('SPF-')) {
    return limpio;
  }
  if (limpio.startsWith('SPF')) {
    return `SPF-${limpio.slice(3).replace(/^-+/, '')}`;
  }
  return `SPF-${limpio}`;
}

export function horasDeReserva(reserva) {
  if (!reserva) {
    return [];
  }
  if (Array.isArray(reserva.horas) && reserva.horas.length > 0) {
    return reserva.horas;
  }
  if (reserva.hora) {
    return [reserva.hora];
  }
  return [];
}

export function celdasDeReserva(reserva) {
  if (!reserva) {
    return [];
  }
  if (reserva.tipo === 'evento') {
    if (Array.isArray(reserva.bloques) && reserva.bloques.length > 0) {
      const celdas = [];
      reserva.bloques.forEach((b) => {
        if (
          b &&
          b.fecha &&
          Array.isArray(b.canchaIds) &&
          Array.isArray(b.horas)
        ) {
          b.canchaIds.forEach((cid) => {
            celdas.push({ canchaId: cid, fecha: b.fecha, horas: b.horas });
          });
        }
      });
      return celdas;
    }
    if (reserva.fecha && Array.isArray(reserva.canchaIds)) {
      const horas = horasDeReserva(reserva);
      return reserva.canchaIds.map((cid) => ({
        canchaId: cid,
        fecha: reserva.fecha,
        horas,
      }));
    }
    return [];
  }
  if (reserva.canchaId && reserva.fecha) {
    return [
      {
        canchaId: reserva.canchaId,
        fecha: reserva.fecha,
        horas: horasDeReserva(reserva),
      },
    ];
  }
  return [];
}

function horasUsadasEnCelda(reservas, canchaId, fecha) {
  const usadas = new Set();
  if (!Array.isArray(reservas)) {
    return usadas;
  }
  reservas.forEach((r) => {
    celdasDeReserva(r).forEach((celda) => {
      if (celda.canchaId === canchaId && celda.fecha === fecha) {
        celda.horas.forEach((h) => usadas.add(h));
      }
    });
  });
  return usadas;
}

// Quita de `guardado` ({ ocupados, reservas }) las reservas cuyos ids estén
// en `idsAQuitar` y libera sus horas salvo que otra reserva restante las use.
export function quitarReservasDeEstado(guardado, idsAQuitar) {
  const conjuntoIds =
    idsAQuitar instanceof Set
      ? idsAQuitar
      : new Set(Array.isArray(idsAQuitar) ? idsAQuitar : []);
  if (conjuntoIds.size === 0 || !guardado) {
    return guardado;
  }

  const reservasOriginales = Array.isArray(guardado.reservas)
    ? guardado.reservas
    : [];
  const eliminadas = [];
  const reservas = [];
  reservasOriginales.forEach((r) => {
    if (r && r.id && conjuntoIds.has(r.id)) {
      eliminadas.push(r);
    } else {
      reservas.push(r);
    }
  });

  if (eliminadas.length === 0) {
    return guardado;
  }

  let ocupados = guardado.ocupados;
  const canchasClonadas = new Set();

  eliminadas.forEach((reserva) => {
    celdasDeReserva(reserva).forEach(({ canchaId, fecha, horas }) => {
      if (
        !ocupados ||
        !ocupados[canchaId] ||
        !Array.isArray(ocupados[canchaId][fecha]) ||
        !Array.isArray(horas) ||
        horas.length === 0
      ) {
        return;
      }
      const usadas = horasUsadasEnCelda(reservas, canchaId, fecha);
      const horasRestantes = ocupados[canchaId][fecha].filter(
        (h) => !horas.includes(h) || usadas.has(h)
      );
      if (horasRestantes.length === ocupados[canchaId][fecha].length) {
        return;
      }
      if (ocupados === guardado.ocupados) {
        ocupados = { ...guardado.ocupados };
      }
      if (!canchasClonadas.has(canchaId)) {
        ocupados[canchaId] = { ...ocupados[canchaId] };
        canchasClonadas.add(canchaId);
      }
      ocupados[canchaId][fecha] = horasRestantes;
    });
  });

  return { ocupados, reservas };
}

export function inicioReserva(reserva) {
  if (!reserva || typeof reserva.fecha !== 'string') {
    return null;
  }
  const horas = horasDeReserva(reserva);
  const primeraHora = horas[0];
  if (typeof primeraHora !== 'string') {
    return null;
  }

  const partesFecha = reserva.fecha.split('-').map(Number);
  const partesHora = primeraHora.split(':').map(Number);

  if (partesFecha.length !== 3 || partesHora.length !== 2) {
    return null;
  }

  const [y, m, d] = partesFecha;
  const [hh, mm] = partesHora;

  if (
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d) ||
    Number.isNaN(hh) ||
    Number.isNaN(mm)
  ) {
    return null;
  }

  const fecha = new Date(y, m - 1, d, hh, mm);
  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
}

// Se puede cancelar una reserva individual hasta `horasMinimas` antes de que
// empiece (exactamente en el límite, sí). Eventos e inexistentes, no.
export function verificarCancelable(
  reserva,
  ahora = new Date(),
  horasMinimas = negocio.cancelacion.horasMinimas
) {
  if (!reserva) {
    return { ok: false, error: MENSAJES_CANCELACION.noEncontrada };
  }
  if (reserva.tipo === 'evento') {
    return { ok: false, error: MENSAJES_CANCELACION.evento };
  }
  const inicio = inicioReserva(reserva);
  if (!inicio) {
    return { ok: false, error: MENSAJES_CANCELACION.noEncontrada };
  }

  const horasMinimasMs = horasMinimas * 60 * 60 * 1000;
  const diferenciaMs = inicio.getTime() - ahora.getTime();

  if (diferenciaMs < horasMinimasMs) {
    return { ok: false, error: MENSAJES_CANCELACION.fueraDePlazo };
  }

  return { ok: true, error: null };
}

// Estado tras cancelar: quita solo las horas de esa reserva (la ocupación
// semilla del mismo día se queda) y su registro. Sin mutar el estado.
export function aplicarCancelacion(
  state,
  reservaId,
  ahora = new Date(),
  horasMinimas = negocio.cancelacion.horasMinimas
) {
  const reservas = Array.isArray(state?.reservas) ? state.reservas : [];
  const reserva = reservas.find((r) => r && r.id === reservaId);
  const verificacion = verificarCancelable(reserva, ahora, horasMinimas);

  if (!verificacion.ok) {
    return { state, error: verificacion.error };
  }

  const { ocupados, reservas: nuevasReservas } = quitarReservasDeEstado(
    state,
    [reservaId]
  );

  return {
    state: {
      ...state,
      ocupados,
      reservas: nuevasReservas,
    },
    error: null,
  };
}

// Reservas futuras de una persona: mismo teléfono (normalizado) y mismo
// nombre (sin tildes ni mayúsculas). Las que no tienen teléfono nunca
// coinciden. `enVentana` = las que ya no se pueden cancelar por el plazo.
export function buscarReservasCancelables({
  reservas = [],
  nombre,
  telefono,
  canchaId = null,
  fecha = null,
  hora = null,
  ahora = new Date(),
  horasMinimas = negocio.cancelacion.horasMinimas,
} = {}) {
  const vacio = { cancelables: [], enVentana: [] };
  if (!nombre || !telefono) {
    return vacio;
  }

  const normNombre = normalizarComparacion(nombre);
  const normTel = normalizarTelefono(telefono);
  if (!normNombre || !normTel || !Array.isArray(reservas)) {
    return vacio;
  }

  const candidatas = [];

  for (const r of reservas) {
    if (!r || r.tipo !== 'individual') {
      continue;
    }
    if (!r.telefono) {
      continue;
    }
    if (normalizarTelefono(r.telefono) !== normTel) {
      continue;
    }
    if (normalizarComparacion(r.nombre) !== normNombre) {
      continue;
    }
    if (canchaId != null && r.canchaId !== canchaId) {
      continue;
    }
    if (fecha != null && r.fecha !== fecha) {
      continue;
    }
    if (hora != null && !horasDeReserva(r).includes(hora)) {
      continue;
    }

    const inicio = inicioReserva(r);
    if (!inicio || inicio.getTime() <= ahora.getTime()) {
      continue;
    }

    candidatas.push({ reserva: r, inicio });
  }

  candidatas.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  const cancelables = [];
  const enVentana = [];

  for (const { reserva } of candidatas) {
    const v = verificarCancelable(reserva, ahora, horasMinimas);
    if (v.ok) {
      cancelables.push(reserva);
    } else {
      enVentana.push(reserva);
    }
  }

  return { cancelables, enVentana };
}

// Búsqueda pura por código: normaliza el código (acepta spf-abc123, SPF ABC123 o
// ABC123 y antepone SPF- si falta) y devuelve la reserva con ese código o null.
// Sirve para ambos tipos (individual y evento).
export function buscarReservaPorCodigo(reservas, codigo) {
  if (!Array.isArray(reservas) || !codigo) {
    return null;
  }
  const codigoNorm = normalizarCodigo(codigo);
  if (!codigoNorm) {
    return null;
  }
  return reservas.find((r) => r && r.codigo === codigoNorm) || null;
}

// Reservas futuras de una persona (cualquier tipo: individual o evento): mismo
// teléfono normalizado y mismo nombre normalizado, ordenadas por inicio.
// Las reservas sin teléfono no coinciden.
export function buscarReservasDePersona({
  reservas = [],
  nombre,
  telefono,
  ahora = new Date(),
} = {}) {
  if (!nombre || !telefono || !Array.isArray(reservas)) {
    return [];
  }

  const normNombre = normalizarComparacion(nombre);
  const normTel = normalizarTelefono(telefono);
  if (!normNombre || !normTel) {
    return [];
  }

  const candidatas = [];

  for (const r of reservas) {
    if (!r || !r.telefono) {
      continue;
    }
    if (normalizarTelefono(r.telefono) !== normTel) {
      continue;
    }
    if (normalizarComparacion(r.nombre) !== normNombre) {
      continue;
    }

    const inicio = inicioReserva(r);
    if (!inicio || inicio.getTime() <= ahora.getTime()) {
      continue;
    }

    candidatas.push({ reserva: r, inicio });
  }

  candidatas.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  return candidatas.map((c) => c.reserva);
}

/**
 * Precio de una reserva individual de varias horas seguidas y eventos.
 *
 * Desde MIN_HORAS_BENEFICIO horas seguidas, cada hora baja DESCUENTO_POR_HORA
 * y se regala un pack de agua. Aplica igual a todos los deportes; estas reglas
 * aplican también a eventos (por cancha). Única fuente de estas reglas: el
 * modal, el panel de detalle y el contexto la reutilizan.
 */

export const MAX_HORAS_SEGUIDAS = 3;
export const MIN_HORAS_BENEFICIO = 2;
export const DESCUENTO_POR_HORA = 5000;

export const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function calcularPrecio(precioHora, nHoras) {
  const conBeneficio = nHoras >= MIN_HORAS_BENEFICIO;
  const descuentoHora = conBeneficio ? DESCUENTO_POR_HORA : 0;
  const precioHoraFinal = precioHora - descuentoHora;
  return {
    nHoras,
    precioHora,
    descuentoHora,
    precioHoraFinal,
    subtotal: precioHora * nHoras,
    total: precioHoraFinal * nHoras,
    ahorro: descuentoHora * nHoras,
    aguaGratis: conBeneficio,
  };
}

// El modal de reserva lo usa para el voucher en todos los modos (con una sola
// cancha en modo Cancha) y el contexto para guardar el total de los eventos.
export function calcularPrecioEvento(canchas, nHoras) {
  if (!canchas || canchas.length === 0 || !nHoras) {
    return {
      nHoras: nHoras || 0,
      lineas: [],
      subtotal: 0,
      total: 0,
      ahorro: 0,
      packsAgua: 0,
    };
  }

  const lineas = canchas.map((c) => ({
    canchaId: c.id,
    nombre: c.nombre,
    deporte: c.deporte,
    ...calcularPrecio(c.precioHora, nHoras),
  }));

  const subtotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  const total = lineas.reduce((acc, l) => acc + l.total, 0);
  const ahorro = lineas.reduce((acc, l) => acc + l.ahorro, 0);
  const packsAgua = lineas.filter((l) => l.aguaGratis).length;

  return {
    nHoras,
    lineas,
    subtotal,
    total,
    ahorro,
    packsAgua,
  };
}

export function calcularPrecioJornadas(bloques = [], canchasCatalogo = []) {
  if (!Array.isArray(bloques) || bloques.length === 0) {
    return {
      nHoras: 0,
      lineas: [],
      subtotal: 0,
      total: 0,
      ahorro: 0,
      packsAgua: 0,
    };
  }

  const lineas = [];
  let nHoras = 0;

  bloques.forEach((b) => {
    const horasBloque = Array.isArray(b.horas) ? b.horas : [];
    const nH = horasBloque.length;
    nHoras += nH;

    if (nH > 0 && Array.isArray(b.canchaIds)) {
      b.canchaIds.forEach((id) => {
        const c = Array.isArray(canchasCatalogo)
          ? canchasCatalogo.find((x) => x.id === id)
          : null;
        if (c) {
          const p = calcularPrecio(c.precioHora, nH);
          lineas.push({
            canchaId: b.ronda ? `R${b.ronda}-${c.id}` : `${b.fecha}-${c.id}`,
            ronda: b.ronda || null,
            nombreRonda: b.nombreRonda || null,
            fecha: b.fecha || null,
            nombre: b.nombreRonda ? `${b.nombreRonda} · ${c.nombre}` : c.nombre,
            deporte: c.deporte,
            ...p,
          });
        }
      });
    }
  });

  const subtotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);
  const total = lineas.reduce((acc, l) => acc + l.total, 0);
  const ahorro = lineas.reduce((acc, l) => acc + l.ahorro, 0);
  const packsAgua = lineas.filter((l) => l.aguaGratis).length;

  return {
    nHoras,
    lineas,
    subtotal,
    total,
    ahorro,
    packsAgua,
  };
}

// Hora en la que termina una franja de 1 h que empieza en `hora` ("20:00" ->
// "21:00").
export function finDeFranja(hora) {
  const h = parseInt(hora.slice(0, 2), 10) + 1;
  return `${String(h).padStart(2, '0')}:${hora.slice(3, 5)}`;
}

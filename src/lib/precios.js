/**
 * Precio de una reserva individual de varias horas seguidas y eventos.
 *
 * En individual y cumpleaños, desde MIN_HORAS_BENEFICIO horas seguidas cada
 * hora baja DESCUENTO_POR_HORA y se regala un pack de agua por cancha. En
 * torneos (calcularPrecioJornadas), cada hora de cada cancha baja
 * DESCUENTO_HORA_TORNEO desde 1 hora, aunque no sean seguidas (topado a
 * precioHora para no quedar negativo), y el pack de agua se regala desde
 * MIN_HORAS_BENEFICIO horas por cancha y fase.
 * Única fuente de estas reglas: la página de reserva, el panel de detalle y el
 * contexto la reutilizan.
 */

export const MAX_HORAS_SEGUIDAS = 3;
export const MIN_HORAS_BENEFICIO = 2;
export const DESCUENTO_POR_HORA = 5000;
export const DESCUENTO_HORA_TORNEO = 15000;

export const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// '$ 45.000' (con espacio de no separación) -> '$45.000', formato corto del chat.
export function formatoPrecioCorto(valor) {
  return formatoPrecio.format(valor).replace(/\s/g, '');
}

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

// La página de reserva lo usa para el voucher en todos los modos (con una sola
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

  const grupos = new Map();
  const horasPorFase = new Map();

  bloques.forEach((b, idx) => {
    if (!b) return;
    const horasBloque = Array.isArray(b.horas)
      ? b.horas.filter((h) => typeof h === 'string' && h.length > 0)
      : [];
    if (horasBloque.length === 0) return;

    const claveFase = b.ronda ? `R${b.ronda}` : `F${b.fecha || idx}`;
    if (!horasPorFase.has(claveFase)) {
      horasPorFase.set(claveFase, new Set());
    }
    const setFase = horasPorFase.get(claveFase);
    horasBloque.forEach((h) => setFase.add(h));

    if (Array.isArray(b.canchaIds)) {
      b.canchaIds.forEach((id) => {
        const c = Array.isArray(canchasCatalogo)
          ? canchasCatalogo.find((x) => x.id === id)
          : null;
        if (!c) return;

        const clave = b.ronda ? `R${b.ronda}-${c.id}` : `${b.fecha}-${c.id}`;
        if (!grupos.has(clave)) {
          grupos.set(clave, {
            canchaId: clave,
            ronda: b.ronda || null,
            nombreRonda: b.nombreRonda || null,
            fecha: b.fecha || null,
            cancha: c,
            horas: new Set(),
          });
        }
        const g = grupos.get(clave);
        if (!g.nombreRonda && b.nombreRonda) g.nombreRonda = b.nombreRonda;
        if (!g.fecha && b.fecha) g.fecha = b.fecha;
        horasBloque.forEach((h) => g.horas.add(h));
      });
    }
  });

  const lineas = Array.from(grupos.values()).map((g) => {
    const nHoras = g.horas.size;
    const precioHora = g.cancha.precioHora;
    const descuentoHora = nHoras > 0 ? Math.min(DESCUENTO_HORA_TORNEO, precioHora) : 0;
    const precioHoraFinal = precioHora - descuentoHora;
    const subtotal = precioHora * nHoras;
    const total = precioHoraFinal * nHoras;
    const ahorro = descuentoHora * nHoras;
    const aguaGratis = nHoras >= MIN_HORAS_BENEFICIO;

    return {
      canchaId: g.canchaId,
      ronda: g.ronda,
      nombreRonda: g.nombreRonda,
      fecha: g.fecha,
      nombre: g.nombreRonda
        ? `${g.nombreRonda} · ${g.cancha.nombre}`
        : g.cancha.nombre,
      deporte: g.cancha.deporte,
      nHoras,
      precioHora,
      descuentoHora,
      precioHoraFinal,
      subtotal,
      total,
      ahorro,
      aguaGratis,
    };
  });

  let nHoras = 0;
  horasPorFase.forEach((set) => {
    nHoras += set.size;
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

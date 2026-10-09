/**
 * Precio de una reserva individual de varias horas seguidas.
 *
 * Desde MIN_HORAS_BENEFICIO horas seguidas, cada hora baja DESCUENTO_POR_HORA
 * y se regala un pack de agua. Aplica igual a todos los deportes. Única fuente
 * de estas reglas: el modal, el panel de detalle y el contexto la reutilizan.
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

// Hora en la que termina una franja de 1 h que empieza en `hora` ("20:00" ->
// "21:00").
export function finDeFranja(hora) {
  const h = parseInt(hora.slice(0, 2), 10) + 1;
  return `${String(h).padStart(2, '0')}:${hora.slice(3, 5)}`;
}

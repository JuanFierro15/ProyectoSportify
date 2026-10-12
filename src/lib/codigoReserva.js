/**
 * Código corto de reserva y texto del QR de confirmación.
 *
 * Sin backend, el QR lleva los datos de la reserva en texto legible por
 * cualquier cámara.
 */

import { formatoPrecio } from './precios';

// Sin 0/O ni 1/I para que el código se pueda dictar sin confusiones.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const REGEX_CODIGO = /^SPF-[A-HJ-NP-Z2-9]{6}$/;

export function generarCodigo(aleatorio = Math.random) {
  let sufijo = '';
  for (let i = 0; i < 6; i += 1) {
    const indice = Math.floor(aleatorio() * ALFABETO.length);
    sufijo += ALFABETO[indice];
  }
  return `SPF-${sufijo}`;
}

export function textoQr({
  codigo,
  tipo,
  fecha,
  horario,
  canchas,
  nombre,
  telefono,
  total,
}) {
  const lineas = [
    'SPORTIFY · RESERVA',
    `Código: ${codigo}`,
    `Tipo: ${tipo}`,
    `Fecha: ${fecha}`,
    `Horario: ${horario}`,
    `Canchas: ${canchas.join(', ')}`,
    `A nombre de: ${nombre}`,
  ];

  if (telefono && telefono.trim() !== '') {
    lineas.push(`Teléfono: ${telefono.trim()}`);
  }

  lineas.push(`Total: ${formatoPrecio.format(total)}`);

  return lineas.join('\n');
}

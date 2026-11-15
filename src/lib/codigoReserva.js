/**
 * Código corto de reserva y texto del QR de confirmación.
 *
 * Sin backend, el QR lleva los datos de la reserva en texto legible por
 * cualquier cámara.
 */

import { formatoPrecio, finDeFranja } from './precios';

// Sin 0/O ni 1/I para que el código se pueda dictar sin confusiones.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
  torneo = null,
  nombresCanchas = {},
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

  if (torneo && torneo.equipos) {
    const numPartidos = torneo.partidos ? torneo.partidos.length : torneo.equipos - 1;
    lineas.push(
      `Torneo: ${torneo.equipos} equipos · ${numPartidos} partidos (${torneo.duracionPartido} min)`
    );
  }

  if (torneo && Array.isArray(torneo.jornadas) && torneo.jornadas.length > 0) {
    torneo.jornadas.forEach((j) => {
      if (!j || !j.fecha) return;
      const hpc =
        j.horasPorCancha && typeof j.horasPorCancha === 'object'
          ? j.horasPorCancha
          : null;
      if (hpc) {
        const ordenClaves = Array.isArray(j.canchaIds)
          ? [
              ...j.canchaIds,
              ...Object.keys(hpc).filter((id) => !j.canchaIds.includes(id)),
            ]
          : Object.keys(hpc);
        const partesCanchas = ordenClaves
          .filter((cid) => Array.isArray(hpc[cid]) && hpc[cid].length > 0)
          .map((cid) => {
            const horasOrdenadas = Array.from(new Set(hpc[cid])).sort();
            const etiqueta = (nombresCanchas && nombresCanchas[cid]) || cid;
            return `${etiqueta}: ${horasOrdenadas.join(', ')}`;
          });
        if (partesCanchas.length > 0) {
          lineas.push(
            `Fase ${j.nombreRonda}: ${j.fecha} · ${partesCanchas.join(' · ')}`
          );
          return;
        }
      }
      if (Array.isArray(j.horas) && j.horas.length > 0) {
        lineas.push(
          `Fase ${j.nombreRonda}: ${j.fecha} (${j.horas[0]} a ${finDeFranja(j.horas[j.horas.length - 1])})`
        );
      }
    });
  }

  lineas.push(`Total: ${formatoPrecio.format(total)}`);

  return lineas.join('\n');
}

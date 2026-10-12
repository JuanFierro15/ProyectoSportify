/**
 * Reglas de selección de horas del modal de reserva unificado.
 *
 * Funciones puras: `horas` es la lista base del día en orden (por ejemplo,
 * ['08:00', ..., '20:00']) y la selección siempre es un bloque contiguo
 * ordenado.
 */

import { MAX_HORAS_SEGUIDAS } from './precios';

export function alternarHoraIndividual(sel, hora, horas, max = MAX_HORAS_SEGUIDAS) {
  const pos = sel.indexOf(hora);
  if (pos >= 0) {
    let nuevaSel;
    if (pos === 0) {
      nuevaSel = sel.slice(1);
    } else if (pos === sel.length - 1) {
      nuevaSel = sel.slice(0, -1);
    } else {
      nuevaSel = sel.slice(0, pos);
    }
    return { sel: nuevaSel, error: null };
  }

  if (sel.length === 0) {
    return { sel: [hora], error: null };
  }

  const i = horas.indexOf(hora);
  const primero = horas.indexOf(sel[0]);
  const ultimo = horas.indexOf(sel[sel.length - 1]);
  if (i === ultimo + 1 || i === primero - 1) {
    if (sel.length >= max) {
      return { sel, error: `Puedes reservar hasta ${max} horas seguidas.` };
    }
    return {
      sel: i === ultimo + 1 ? [...sel, hora] : [hora, ...sel],
      error: null,
    };
  }

  return { sel: [hora], error: null };
}

export function seleccionarRango(sel, hora, horas, esLibre) {
  if (!esLibre(hora)) {
    return { sel, error: 'Esa hora no está libre en las canchas elegidas.' };
  }

  if (sel.length === 1 && sel[0] === hora) {
    return { sel: [], error: null };
  }

  if (sel.length === 1) {
    const i = horas.indexOf(sel[0]);
    const j = horas.indexOf(hora);
    const inicio = Math.min(i, j);
    const fin = Math.max(i, j);
    const rango = horas.slice(inicio, fin + 1);

    if (rango.every((h) => esLibre(h))) {
      return { sel: rango, error: null };
    }
    return {
      sel,
      error: 'Entre esas horas hay horarios ocupados en alguna de las canchas elegidas. Elige otro rango.',
    };
  }

  return { sel: [hora], error: null };
}

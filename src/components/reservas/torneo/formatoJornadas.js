import { tituloCancha } from '../../../lib/canchas';
import { finDeFranja } from '../../../lib/precios';

/**
 * Devuelve la etiqueta legible de una cancha a partir de su id y el catálogo.
 */
export function nombreCortoCancha(canchaId, canchas = []) {
  if (!canchaId) return '';
  if (Array.isArray(canchas)) {
    const encontrada = canchas.find((c) => c.id === canchaId);
    if (encontrada) {
      if (encontrada.nombre) {
        const sinPrefijo = encontrada.nombre.replace(/^Cancha\s+/i, '').trim();
        return sinPrefijo && !/^\d+$/.test(sinPrefijo)
          ? sinPrefijo
          : encontrada.nombre;
      }
      return tituloCancha(encontrada);
    }
  }
  return String(canchaId);
}

/**
 * Indica si las horas dadas son todas consecutivas (ej. 10:00, 11:00, 12:00).
 */
export function sonHorasSeguidas(horas = []) {
  if (!Array.isArray(horas) || horas.length === 0) return false;
  const ordenadas = [...new Set(horas)].sort();
  for (let i = 1; i < ordenadas.length; i += 1) {
    const anterior = Number.parseInt(String(ordenadas[i - 1]).split(':')[0], 10);
    const actual = Number.parseInt(String(ordenadas[i]).split(':')[0], 10);
    if (!Number.isFinite(anterior) || !Number.isFinite(actual) || actual - anterior !== 1) {
      return false;
    }
  }
  return true;
}

/**
 * Formatea una lista de horas como rango si son contiguas o separadas por coma si no.
 */
export function rangoHorasSeguidas(horas = []) {
  if (!Array.isArray(horas) || horas.length === 0) return '';
  const ordenadas = [...new Set(horas)].sort();
  if (ordenadas.length > 1 && sonHorasSeguidas(ordenadas)) {
    return `${ordenadas[0]} a ${finDeFranja(ordenadas[ordenadas.length - 1])}`;
  }
  return ordenadas.join(', ');
}

/**
 * Indica si una jornada define horarios individuales por cancha (`horasPorCancha`).
 */
export function tieneHorasPorCancha(jornada) {
  if (!jornada?.horasPorCancha || typeof jornada.horasPorCancha !== 'object') {
    return false;
  }
  return Object.values(jornada.horasPorCancha).some(
    (lista) => Array.isArray(lista) && lista.length > 0
  );
}

/**
 * Formatea un mapa `{ canchaId: string[] }` respetando el orden de `ordenCanchas`.
 */
export function formatearHorasPorCancha(horasPorCancha, ordenCanchas = [], canchas = []) {
  if (!horasPorCancha || typeof horasPorCancha !== 'object') return '';
  const vistas = new Set();
  const claves = [];

  for (const id of Array.isArray(ordenCanchas) ? ordenCanchas : []) {
    if (!vistas.has(id) && Object.prototype.hasOwnProperty.call(horasPorCancha, id)) {
      vistas.add(id);
      claves.push(id);
    }
  }
  for (const id of Object.keys(horasPorCancha)) {
    if (!vistas.has(id)) {
      vistas.add(id);
      claves.push(id);
    }
  }

  return claves
    .map((id) => {
      const lista = Array.isArray(horasPorCancha[id]) ? horasPorCancha[id] : [];
      if (lista.length === 0) return null;
      return `${nombreCortoCancha(id, canchas)}: ${rangoHorasSeguidas(lista)}`;
    })
    .filter(Boolean)
    .join(' · ');
}

/**
 * Formatea los horarios de una fase/jornada de torneo, ya sea por cancha o en formato legacy contiguo.
 */
export function formatearHorasDeJornada(
  jornada,
  canchas = [],
  singular = 'cancha',
  plural = 'canchas'
) {
  if (!jornada) return 'Horario por definir';

  if (tieneHorasPorCancha(jornada)) {
    const porCancha = formatearHorasPorCancha(
      jornada.horasPorCancha,
      jornada.canchaIds || [],
      canchas
    );
    return porCancha || 'Horario por definir';
  }

  const horas = Array.isArray(jornada.horas) ? jornada.horas : [];
  if (horas.length === 0) return 'Horario por definir';

  const franja = rangoHorasSeguidas(horas);
  const cCount =
    jornada.canchasEfectivas ||
    (Array.isArray(jornada.canchaIds) && jornada.canchaIds.length > 0
      ? jornada.canchaIds.length
      : 1);
  return `${franja} (${cCount} ${cCount === 1 ? singular : plural})`;
}

function normalizarListaJornadas(jornadasRaw) {
  if (!jornadasRaw) return [];
  if (Array.isArray(jornadasRaw)) {
    return jornadasRaw.map((j, idx) => ({
      ...j,
      ronda: j?.ronda ?? idx + 1,
    }));
  }
  if (typeof jornadasRaw === 'object') {
    return Object.entries(jornadasRaw).map(([clave, j]) => ({
      ...j,
      ronda: j?.ronda ?? (Number(clave) || clave),
    }));
  }
  return [];
}

/**
 * Reconstruye la lista ordenada de fases de una reserva de torneo agrupando `bloques` por ronda.
 */
export function extraerJornadasDeReserva(reserva) {
  if (!reserva) return [];
  const listaJornadas = normalizarListaJornadas(reserva.torneo?.jornadas);
  const bloquesRaw = Array.isArray(reserva.bloques) ? reserva.bloques : [];

  const porRonda = new Map();
  const asegurarEntrada = (ronda) => {
    const clave = Number(ronda) || ronda;
    if (!porRonda.has(clave)) {
      porRonda.set(clave, { ronda: clave, jornada: null, bloques: [] });
    }
    return porRonda.get(clave);
  };

  listaJornadas.forEach((j, idx) => {
    const ronda = j.ronda ?? idx + 1;
    asegurarEntrada(ronda).jornada = j;
  });

  bloquesRaw.forEach((b, idx) => {
    const ronda = b?.ronda ?? idx + 1;
    asegurarEntrada(ronda).bloques.push(b);
  });

  const rondasOrdenadas = [...porRonda.keys()].sort((a, b) => Number(a) - Number(b));

  return rondasOrdenadas.map((ronda) => {
    const { jornada: j, bloques } = porRonda.get(ronda);
    const canchaIds = [];
    const vistas = new Set();
    const agregarCanchas = (lista) => {
      if (!Array.isArray(lista)) return;
      for (const id of lista) {
        if (id && !vistas.has(id)) {
          vistas.add(id);
          canchaIds.push(id);
        }
      }
    };

    agregarCanchas(j?.canchaIds);
    bloques.forEach((b) => agregarCanchas(b?.canchaIds));

    let horasPorCancha = null;
    if (tieneHorasPorCancha(j)) {
      horasPorCancha = j.horasPorCancha;
    } else if (
      bloques.length > 1 ||
      (!j &&
        bloques.length === 1 &&
        Array.isArray(bloques[0]?.canchaIds) &&
        bloques[0].canchaIds.length === 1)
    ) {
      const mapa = {};
      for (const b of bloques) {
        if (!Array.isArray(b?.horas) || b.horas.length === 0) continue;
        for (const id of b.canchaIds || []) {
          mapa[id] = [...new Set([...(mapa[id] || []), ...b.horas])].sort();
        }
      }
      if (Object.keys(mapa).length > 0) {
        horasPorCancha = mapa;
      }
    }

    const horasDirectas =
      Array.isArray(j?.horas) && j.horas.length > 0
        ? j.horas
        : bloques.length === 1 && Array.isArray(bloques[0]?.horas)
        ? bloques[0].horas
        : [
            ...new Set(
              bloques.flatMap((b) => (Array.isArray(b?.horas) ? b.horas : []))
            ),
          ].sort();

    return {
      ...(bloques[0] || {}),
      ...(j || {}),
      ronda,
      nombreRonda:
        j?.nombreRonda || bloques[0]?.nombreRonda || `Fase ${ronda}`,
      fecha: j?.fecha || bloques[0]?.fecha || reserva.fecha,
      canchaIds,
      horasPorCancha,
      horas: horasDirectas,
    };
  });
}

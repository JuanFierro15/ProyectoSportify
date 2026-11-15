/**
 * Lógica pura del Modo Torneo: tiempos, cruces, fixture y validaciones.
 */

export const OPCIONES_EQUIPOS = [4, 8, 16];
export const OPCIONES_DURACION = [15, 20, 30];
export const TRANSICION_MIN = 5;
export const MAX_CANCHAS_TORNEO = 3;

export const DESEMPATES = {
  futbol: {
    metodo: 'penales',
    etiqueta: 'Penales',
    minutos: 5,
    descripcion: 'Penales: 3 por equipo y, si sigue el empate, muerte súbita.',
  },
  'voley-playa': {
    metodo: 'tie-break',
    etiqueta: 'Tie-break',
    minutos: 5,
    descripcion: 'Tie-break a 7 puntos con diferencia de 2; si se acaba el tiempo, punto de oro.',
  },
  padel: {
    metodo: 'super-tie-break',
    etiqueta: 'Super tie-break',
    minutos: 5,
    descripcion: 'Super tie-break a 10 puntos; si se acaba el tiempo, punto de oro.',
  },
};

export function desempateDe(deporte) {
  return DESEMPATES[deporte] || null;
}

export function minutosPorTurno(duracionPartido, deporte) {
  const minDesempate = desempateDe(deporte)?.minutos ?? 5;
  return Number(duracionPartido) + minDesempate + TRANSICION_MIN;
}

export function partidosPorRonda(equipos) {
  const n = Number(equipos);
  if (!OPCIONES_EQUIPOS.includes(n)) {
    return [];
  }
  const rondas = [];
  let p = n / 2;
  while (p >= 1) {
    rondas.push(p);
    p = Math.floor(p / 2);
  }
  return rondas;
}

export function maxCanchasTorneo(equipos) {
  const rondas = partidosPorRonda(equipos);
  if (rondas.length === 0) {
    return MAX_CANCHAS_TORNEO;
  }
  return Math.min(MAX_CANCHAS_TORNEO, Math.max(...rondas));
}

export function mensajeTopeCanchas(equipos, { recorte = false } = {}) {
  const n = Number(equipos);
  const tope = maxCanchasTorneo(n);
  const accion = recorte
    ? `se dejaron las primeras ${tope} canchas elegidas`
    : `elige hasta ${tope} canchas`;
  return `Con ${n} equipos se juegan como máximo ${tope} partidos a la vez: ${accion}.`;
}

const ARTICULOS_RONDA = {
  Final: { sujeto: 'La Final', verbo: 'es' },
  Semifinal: { sujeto: 'La Semifinal', verbo: 'es' },
  'Cuartos de final': { sujeto: 'Los Cuartos de final', verbo: 'son' },
  'Octavos de final': { sujeto: 'Los Octavos de final', verbo: 'son' },
};

function aMinutos(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
}

function compararCanchas(aId, bId, ordenIndex) {
  const posA = ordenIndex.has(aId) ? ordenIndex.get(aId) : Infinity;
  const posB = ordenIndex.has(bId) ? ordenIndex.get(bId) : Infinity;
  if (posA !== posB) {
    return posA - posB;
  }
  if (aId < bId) return -1;
  if (aId > bId) return 1;
  return 0;
}

function construirOrdenCanchas(ordenCanchas = []) {
  const ordenIndex = new Map();
  if (Array.isArray(ordenCanchas)) {
    ordenCanchas.forEach((id, idx) => {
      if (!ordenIndex.has(id)) {
        ordenIndex.set(id, idx);
      }
    });
  }
  return ordenIndex;
}

function resolverMinutosTurno(fase) {
  if (Number(fase?.minutosTurno) > 0) {
    return Number(fase.minutosTurno);
  }
  if (Number(fase?.minutosRequeridos) > 0 && Number(fase?.turnos) > 0) {
    return Number(fase.minutosRequeridos) / Number(fase.turnos);
  }
  return 30;
}

export function horasDeJornada(j) {
  if (!j || typeof j !== 'object' || !j.horasPorCancha || typeof j.horasPorCancha !== 'object') {
    return [];
  }
  const unicas = new Set();
  Object.values(j.horasPorCancha).forEach((lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    lista.forEach((h) => {
      if (typeof h === 'string' && h.length > 0) {
        unicas.add(h);
      }
    });
  });
  return Array.from(unicas).sort((a, b) => aMinutos(a) - aMinutos(b));
}

export function turnosDeCancha(horas, minutosTurno) {
  if (!Array.isArray(horas) || horas.length === 0) {
    return [];
  }
  const durTurno = Number(minutosTurno);
  if (!Number.isFinite(durTurno) || durTurno <= 0) {
    return [];
  }

  const unicas = Array.from(
    new Set(horas.filter((h) => typeof h === 'string' && h.length > 0))
  ).sort((a, b) => aMinutos(a) - aMinutos(b));

  if (unicas.length === 0) {
    return [];
  }

  const tramos = [];
  let tramoActual = [unicas[0]];
  for (let i = 1; i < unicas.length; i += 1) {
    if (unicas[i] === sumarMinutos(unicas[i - 1], 60)) {
      tramoActual.push(unicas[i]);
    } else {
      tramos.push(tramoActual);
      tramoActual = [unicas[i]];
    }
  }
  tramos.push(tramoActual);

  const turnos = [];
  tramos.forEach((tramo) => {
    const cantidad = Math.floor((tramo.length * 60) / durTurno);
    for (let k = 0; k < cantidad; k += 1) {
      turnos.push(sumarMinutos(tramo[0], k * durTurno));
    }
  });
  return turnos;
}

export function turnosDeFase(horasPorCancha, minutosTurno, ordenCanchas = []) {
  if (!horasPorCancha || typeof horasPorCancha !== 'object') {
    return [];
  }
  const ordenIndex = construirOrdenCanchas(ordenCanchas);
  const turnos = [];

  Object.entries(horasPorCancha).forEach(([canchaId, horas]) => {
    turnosDeCancha(horas, minutosTurno).forEach((inicio) => {
      turnos.push({ canchaId, inicio });
    });
  });

  turnos.sort((a, b) => {
    const diffHora = aMinutos(a.inicio) - aMinutos(b.inicio);
    if (diffHora !== 0) return diffHora;
    return compararCanchas(a.canchaId, b.canchaId, ordenIndex);
  });

  return turnos;
}

export function capacidadFase(horasPorCancha, minutosTurno) {
  return turnosDeFase(horasPorCancha, minutosTurno).length;
}

export function limpiarJornadasConChoque(jornadas = {}, esHoraLibre) {
  let huboChoque = false;
  const quitadas = [];
  const siguiente = {};
  const mapa = jornadas || {};

  Object.keys(mapa).forEach((rKey) => {
    const r = Number(rKey);
    const j = mapa[rKey] || {};
    const hpc =
      j.horasPorCancha && typeof j.horasPorCancha === 'object'
        ? j.horasPorCancha
        : {};
    const nuevasHorasPorCancha = {};

    Object.keys(hpc).forEach((canchaId) => {
      const lista = Array.isArray(hpc[canchaId]) ? hpc[canchaId] : [];
      const conservadas = [];
      lista.forEach((h) => {
        if (esHoraLibre(r, canchaId, h)) {
          conservadas.push(h);
        } else {
          huboChoque = true;
          quitadas.push({ ronda: r, canchaId, hora: h });
        }
      });
      nuevasHorasPorCancha[canchaId] = conservadas;
    });

    siguiente[rKey] = {
      ...j,
      horasPorCancha: nuevasHorasPorCancha,
    };
  });

  return { jornadas: siguiente, huboChoque, quitadas };
}

export function turnosPorRonda(equipos, canchas) {
  const c = Math.max(1, Number(canchas));
  return partidosPorRonda(equipos).map((p) => Math.ceil(p / c));
}

export function minutosRequeridos({ equipos, canchas, minutosTurno }) {
  const n = Number(equipos);
  const c = Number(canchas);
  if (!OPCIONES_EQUIPOS.includes(n) || c < 1) {
    return 0;
  }
  const turnos = turnosPorRonda(n, c);
  const totalTurnos = turnos.reduce((acc, t) => acc + t, 0);
  return totalTurnos * Number(minutosTurno);
}

export function fasesDelTorneo({ equipos, canchaIds = [], minutosTurno = 30 }) {
  const ids = Array.isArray(canchaIds) ? canchaIds : [];
  const rondas = partidosPorRonda(equipos);
  const minTurno = Number(minutosTurno);
  return rondas.map((partidos, idx) => {
    const ronda = idx + 1;
    const numCanchasFase = ids.length > 0 ? Math.min(ids.length, partidos) : 1;
    const turnos = Math.ceil(partidos / numCanchasFase);
    const minutos = turnos * minTurno;
    return {
      ronda,
      nombreRonda: nombreRonda(partidos),
      partidos,
      canchasEfectivas: numCanchasFase,
      canchaIds: [...ids],
      turnos,
      minutosTurno: minTurno,
      minutosRequeridos: minutos,
      horasMinimas: Math.ceil(minutos / 60),
    };
  });
}

export function validarJornadas(fases, jornadas = {}) {
  if (!Array.isArray(fases)) return [];
  let finPrevio = null;
  const jMap = jornadas || {};

  return fases.map((fase) => {
    const j = jMap[fase.ronda] || {};
    const fecha = j.fecha || null;
    const horas = horasDeJornada(j);
    const minutosTurno = resolverMinutosTurno(fase);
    const partidos = Number(fase.partidos) || 0;

    if (!fecha || horas.length === 0) {
      return {
        ronda: fase.ronda,
        nombreRonda: fase.nombreRonda,
        completa: false,
        alcanza: false,
        ordenValido: true,
        disponibles: 0,
        deficit:
          fase.minutosRequeridos != null
            ? fase.minutosRequeridos
            : partidos * minutosTurno,
        turnosDisponibles: 0,
        partidosSinUbicar: partidos,
        error: `Elige el día y el horario para ${fase.nombreRonda}.`,
      };
    }

    const turnosDisponibles = capacidadFase(j.horasPorCancha, minutosTurno);
    const partidosSinUbicar = Math.max(0, partidos - turnosDisponibles);
    const alcanza = partidosSinUbicar === 0;
    const disponibles = turnosDisponibles * minutosTurno;
    const deficit = partidosSinUbicar * minutosTurno;

    const horaInicio = horas[0];
    const horaFin = sumarMinutos(horas[horas.length - 1], 60);
    const ordenValido =
      !finPrevio ||
      fecha > finPrevio.fecha ||
      (fecha === finPrevio.fecha && aMinutos(horaInicio) >= aMinutos(finPrevio.horaFin));

    let error = null;
    if (!ordenValido) {
      error = `${fase.nombreRonda} debe jugarse después de que termine ${finPrevio.nombreRonda} (${finPrevio.fecha} a las ${finPrevio.horaFin}).`;
    } else if (!alcanza) {
      error = `Las horas de ${fase.nombreRonda} no alcanzan: faltan ${partidosSinUbicar} ${partidosSinUbicar === 1 ? 'partido' : 'partidos'} por ubicar.`;
    }

    finPrevio = { fecha, horaFin, nombreRonda: fase.nombreRonda };

    return {
      ronda: fase.ronda,
      nombreRonda: fase.nombreRonda,
      completa: true,
      alcanza,
      ordenValido,
      disponibles,
      deficit,
      turnosDisponibles,
      partidosSinUbicar,
      error,
    };
  });
}

export function sugerenciasTiempoFase({
  fase,
  canchasTotales,
  duracionPartido,
  deporte,
  horasPorCancha,
}) {
  if (!fase) return [];
  const minTurno =
    Number(fase.minutosTurno) > 0
      ? Number(fase.minutosTurno)
      : duracionPartido != null
      ? minutosPorTurno(duracionPartido, deporte)
      : resolverMinutosTurno(fase);
  const turnosDisponibles = capacidadFase(horasPorCancha, minTurno);
  const partidos = Number(fase.partidos) || 0;
  const faltan = Math.max(0, partidos - turnosDisponibles);
  if (faltan === 0) {
    return [];
  }

  const sugerencias = [];
  sugerencias.push(
    `Marca más horas en ${fase.nombreRonda}: faltan turnos para ${faltan} ${faltan === 1 ? 'partido' : 'partidos'}.`
  );

  const maxCanchas = Math.min(MAX_CANCHAS_TORNEO, partidos);
  if (Number(canchasTotales) < maxCanchas) {
    const minTurnoActual =
      duracionPartido != null
        ? minutosPorTurno(duracionPartido, deporte)
        : minTurno;
    const turnosConMax = Math.ceil(partidos / maxCanchas);
    const minConMax = turnosConMax * minTurnoActual;
    sugerencias.push(
      `Agrega más canchas del mismo deporte (con ${maxCanchas} canchas en paralelo tomaría ${minConMax} min).`
    );
  }

  if (Number(duracionPartido) > OPCIONES_DURACION[0]) {
    const minTurnoCorto = minutosPorTurno(OPCIONES_DURACION[0], deporte);
    const cEfectivas = Math.max(1, fase.canchasEfectivas || 1);
    const turnosCorto = Math.ceil(partidos / cEfectivas);
    const minCorto = turnosCorto * minTurnoCorto;
    sugerencias.push(
      `Reduce la duración por partido a ${OPCIONES_DURACION[0]} min (tomaría ${minCorto} min).`
    );
  }

  return sugerencias;
}

export function horasSinPartido(
  horasPorCancha,
  minutosTurno,
  partidos,
  ordenCanchas = []
) {
  if (!horasPorCancha || typeof horasPorCancha !== 'object') {
    return [];
  }
  const durTurno = Number(minutosTurno);
  if (!Number.isFinite(durTurno) || durTurno <= 0) {
    return [];
  }
  const numPartidos = Math.max(0, Number(partidos) || 0);
  const ordenIndex = construirOrdenCanchas(ordenCanchas);
  const turnosAsignados = turnosDeFase(
    horasPorCancha,
    durTurno,
    ordenCanchas
  ).slice(0, numPartidos);

  const resultado = [];
  Object.entries(horasPorCancha).forEach(([canchaId, listaHoras]) => {
    if (!Array.isArray(listaHoras) || listaHoras.length === 0) return;
    const turnosCancha = turnosAsignados.filter((t) => t.canchaId === canchaId);
    const horasUnicas = Array.from(
      new Set(listaHoras.filter((h) => typeof h === 'string' && h.length > 0))
    );
    horasUnicas.forEach((hora) => {
      const hMin = aMinutos(hora);
      const hFin = hMin + 60;
      const usada = turnosCancha.some((t) => {
        const ini = aMinutos(t.inicio);
        return ini < hFin && ini + durTurno > hMin;
      });
      if (!usada) {
        resultado.push({ canchaId, hora });
      }
    });
  });

  resultado.sort((a, b) => {
    const diffHora = aMinutos(a.hora) - aMinutos(b.hora);
    if (diffHora !== 0) return diffHora;
    return compararCanchas(a.canchaId, b.canchaId, ordenIndex);
  });

  return resultado;
}

export function mensajeHorasSinPartido({
  nombreRonda: nomRonda,
  partidos,
  duracionPartido,
  horasElegidas,
  sinPartido,
}) {
  const nSin = Number(sinPartido) || 0;
  if (nSin <= 0) {
    return '';
  }

  const infoRonda = ARTICULOS_RONDA[nomRonda] || {
    sujeto: nomRonda,
    verbo: String(nomRonda || '').startsWith('Los ') ? 'son' : 'es',
  };
  const nPartidos = Number(partidos) || 0;
  const nElegidas = Number(horasElegidas) || 0;
  const txtPartidos = `${nPartidos} ${nPartidos === 1 ? 'partido' : 'partidos'}`;
  const txtHoras = `${nElegidas} ${nElegidas === 1 ? 'hora' : 'horas'}`;
  const verboQuedar = nSin === 1 ? 'quedaría' : 'quedarían';

  return `${infoRonda.sujeto} ${infoRonda.verbo} ${txtPartidos} de ${Number(duracionPartido)} min. Marcaste ${txtHoras} y ${nSin} ${verboQuedar} sin partido.`;
}

export function validarCanchasTorneo(canchasElegidas, equipos) {
  if (!Array.isArray(canchasElegidas) || canchasElegidas.length === 0) {
    return 'Elige al menos una cancha.';
  }
  const maxCanchas = maxCanchasTorneo(equipos);
  if (canchasElegidas.length > maxCanchas) {
    if (maxCanchas < MAX_CANCHAS_TORNEO) {
      return mensajeTopeCanchas(equipos);
    }
    return `Elige máximo ${MAX_CANCHAS_TORNEO} canchas para el torneo.`;
  }
  if (new Set(canchasElegidas.map((c) => c.deporte)).size > 1) {
    return 'Todas las canchas del torneo deben ser del mismo deporte.';
  }
  return '';
}

export function sortearEquipos(n, rng = Math.random) {
  const arr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function validarCrucesManuales(orden, n) {
  if (
    !Array.isArray(orden) ||
    orden.length !== n ||
    orden.some(
      (x) =>
        x === null ||
        x === undefined ||
        x === '' ||
        !Number.isInteger(Number(x)) ||
        Number(x) < 1 ||
        Number(x) > n
    )
  ) {
    return 'Asigna un equipo en cada posición de la primera ronda.';
  }
  if (new Set(orden.map(Number)).size !== n) {
    return 'Hay equipos repetidos en los cruces.';
  }
  return '';
}

export function nombreRonda(partidos) {
  const nombres = {
    1: 'Final',
    2: 'Semifinal',
    4: 'Cuartos de final',
    8: 'Octavos de final',
  };
  return nombres[partidos] || `Ronda de ${partidos * 2}`;
}

export function sumarMinutos(hora, minutos) {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const hFinal = Math.floor(total / 60) % 24;
  const mFinal = total % 60;
  return `${String(hFinal).padStart(2, '0')}:${String(mFinal).padStart(2, '0')}`;
}

export function programarTorneo({
  orden,
  canchaIds = [],
  horaInicio = null,
  minutosTurno = 30,
  jornadas = null,
}) {
  const ids = Array.isArray(canchaIds) ? canchaIds : [];
  const c = Math.max(1, ids.length);
  const n =
    Array.isArray(orden) && OPCIONES_EQUIPOS.includes(orden.length)
      ? orden.length
      : 8;
  const rondas = partidosPorRonda(n);
  const partidos = [];
  let turnoBase = 0;
  let partidosPrevios = [];

  rondas.forEach((numPartidos, idxRonda) => {
    const ronda = idxRonda + 1;
    const nomRonda = nombreRonda(numPartidos);
    const partidosEstaRonda = [];

    const j = (jornadas && jornadas[ronda]) || {};
    const fechaFase = j.fecha || null;
    const turnosFase = jornadas
      ? turnosDeFase(j.horasPorCancha, minutosTurno, ids)
      : [];
    const iniciosDistintos = [];
    if (jornadas) {
      for (let k = 0; k < Math.min(numPartidos, turnosFase.length); k += 1) {
        const ini = turnosFase[k].inicio;
        if (!iniciosDistintos.includes(ini)) {
          iniciosDistintos.push(ini);
        }
      }
    }

    for (let i = 0; i < numPartidos; i += 1) {
      const id = `R${ronda}-P${i + 1}`;
      let canchaId;
      let inicio;
      let turno;

      if (jornadas) {
        const turnoObj = turnosFase[i] || null;
        canchaId = turnoObj ? turnoObj.canchaId : null;
        inicio = turnoObj ? turnoObj.inicio : null;
        turno = inicio !== null ? iniciosDistintos.indexOf(inicio) + 1 : null;
      } else {
        const turnoDentroDeRonda = Math.floor(i / c) + 1;
        turno = turnoBase + turnoDentroDeRonda;
        canchaId = ids.length > 0 ? ids[i % ids.length] : null;
        inicio = horaInicio
          ? sumarMinutos(horaInicio, (turno - 1) * minutosTurno)
          : null;
      }

      let local;
      let visitante;

      if (ronda === 1) {
        const eq1 = orden ? orden[i * 2] : null;
        const eq2 = orden ? orden[i * 2 + 1] : null;

        local =
          eq1 != null && eq1 !== '' && !Number.isNaN(Number(eq1)) && Number(eq1) >= 1
            ? `Equipo ${eq1}`
            : 'Por definir';
        visitante =
          eq2 != null && eq2 !== '' && !Number.isNaN(Number(eq2)) && Number(eq2) >= 1
            ? `Equipo ${eq2}`
            : 'Por definir';
      } else {
        const prevLocal = partidosPrevios[i * 2];
        const prevVisitante = partidosPrevios[i * 2 + 1];
        local = prevLocal ? `Ganador ${prevLocal.id}` : 'Por definir';
        visitante = prevVisitante ? `Ganador ${prevVisitante.id}` : 'Por definir';
      }

      const partido = {
        id,
        ronda,
        nombreRonda: nomRonda,
        local,
        visitante,
        canchaId,
        turno,
        inicio,
        ...(jornadas ? { fecha: fechaFase } : {}),
      };

      partidosEstaRonda.push(partido);
      partidos.push(partido);
    }

    const turnosEstaRonda = Math.ceil(numPartidos / c);
    turnoBase += turnosEstaRonda;
    partidosPrevios = partidosEstaRonda;
  });

  return partidos;
}

export function armarTorneo({
  deporte,
  equipos,
  duracionPartido,
  emparejamiento,
  orden,
  canchaIds = [],
  horaInicio = null,
  jornadas = null,
}) {
  const d = desempateDe(deporte);
  const minutosTurno = minutosPorTurno(duracionPartido, deporte);
  const ids = Array.isArray(canchaIds) ? canchaIds : [];

  let jornadasResumen = null;
  if (jornadas) {
    const fases = fasesDelTorneo({ equipos, canchaIds: ids, minutosTurno });
    jornadasResumen = fases.map((fase) => {
      const j = jornadas[fase.ronda] || {};
      const rawHpc =
        j.horasPorCancha && typeof j.horasPorCancha === 'object'
          ? j.horasPorCancha
          : {};
      const horasPorCancha = {};
      Object.entries(rawHpc).forEach(([cid, lista]) => {
        if (Array.isArray(lista) && lista.length > 0) {
          horasPorCancha[cid] = Array.from(
            new Set(lista.filter((h) => typeof h === 'string' && h.length > 0))
          ).sort((a, b) => aMinutos(a) - aMinutos(b));
        }
      });
      const horas = horasDeJornada({ horasPorCancha });
      const idsEnOrden = ids.filter(
        (cid) => Array.isArray(horasPorCancha[cid]) && horasPorCancha[cid].length > 0
      );
      const idsExtras = Object.keys(horasPorCancha).filter(
        (cid) => !ids.includes(cid)
      );
      return {
        ronda: fase.ronda,
        nombreRonda: fase.nombreRonda,
        fecha: j.fecha || null,
        horasPorCancha,
        horas,
        canchaIds: [...idsEnOrden, ...idsExtras],
        canchasEfectivas: fase.canchasEfectivas,
        partidos: fase.partidos,
        turnos: fase.turnos,
        minutosRequeridos: fase.minutosRequeridos,
      };
    });
  }

  const res = {
    deporte,
    equipos: Number(equipos),
    duracionPartido: Number(duracionPartido),
    transicion: TRANSICION_MIN,
    desempate: d
      ? {
          metodo: d.metodo,
          etiqueta: d.etiqueta,
          minutos: d.minutos,
          descripcion: d.descripcion,
        }
      : null,
    emparejamiento,
    minutosRequeridos: minutosRequeridos({
      equipos: Number(equipos),
      canchas: canchaIds.length,
      minutosTurno,
    }),
    partidos: programarTorneo({
      orden,
      canchaIds,
      horaInicio,
      minutosTurno,
      jornadas,
    }),
  };

  if (jornadasResumen) {
    res.jornadas = jornadasResumen;
  }

  return res;
}

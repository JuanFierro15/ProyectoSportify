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

export function validarFranja(requeridos, horasReservadas) {
  const disponibles = Math.max(0, Number(horasReservadas)) * 60;
  const deficit = Math.max(0, Number(requeridos) - disponibles);
  return {
    alcanza: deficit === 0,
    disponibles,
    deficit,
  };
}

export function sugerenciasTiempo({
  equipos,
  canchas,
  duracionPartido,
  deporte,
  horasReservadas,
}) {
  const c = Math.max(1, Number(canchas));
  const minutosTurno = minutosPorTurno(duracionPartido, deporte);
  const req = minutosRequeridos({
    equipos: Number(equipos),
    canchas: c,
    minutosTurno,
  });

  const validacion = validarFranja(req, horasReservadas);
  if (validacion.alcanza) {
    return [];
  }

  const sugerencias = [];

  const horasMin = Math.ceil(req / 60);
  sugerencias.push(
    `Amplía la franja horaria a al menos ${horasMin} ${horasMin === 1 ? 'hora' : 'horas'} (${horasMin * 60} min).`
  );

  if (c < MAX_CANCHAS_TORNEO) {
    const minMax = minutosRequeridos({
      equipos: Number(equipos),
      canchas: MAX_CANCHAS_TORNEO,
      minutosTurno,
    });
    sugerencias.push(
      `Agrega más canchas del mismo deporte (con ${MAX_CANCHAS_TORNEO} canchas en paralelo tomaría ${minMax} min).`
    );
  }

  if (Number(duracionPartido) > OPCIONES_DURACION[0]) {
    const minCorto = minutosRequeridos({
      equipos: Number(equipos),
      canchas: c,
      minutosTurno: minutosPorTurno(OPCIONES_DURACION[0], deporte),
    });
    sugerencias.push(
      `Reduce la duración por partido a ${OPCIONES_DURACION[0]} min (tomaría ${minCorto} min).`
    );
  }

  return sugerencias;
}

export function validarCanchasTorneo(canchasElegidas) {
  if (!Array.isArray(canchasElegidas) || canchasElegidas.length === 0) {
    return 'Elige al menos una cancha.';
  }
  if (canchasElegidas.length > MAX_CANCHAS_TORNEO) {
    return 'Elige máximo 3 canchas para el torneo.';
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

    for (let i = 0; i < numPartidos; i += 1) {
      const id = `R${ronda}-P${i + 1}`;
      const turnoDentroDeRonda = Math.floor(i / c) + 1;
      const turno = turnoBase + turnoDentroDeRonda;
      const canchaId = ids.length > 0 ? ids[i % ids.length] : null;
      const inicio = horaInicio
        ? sumarMinutos(horaInicio, (turno - 1) * minutosTurno)
        : null;

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
}) {
  const d = desempateDe(deporte);
  const minutosTurno = minutosPorTurno(duracionPartido, deporte);
  return {
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
    partidos: programarTorneo({ orden, canchaIds, horaInicio, minutosTurno }),
  };
}

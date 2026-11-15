import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReservas } from '../../context/ReservasContext';
import { fechaCompleta } from '../../lib/fechas';
import { alternarHoraIndividual, seleccionarRango } from '../../lib/horarios';
import {
  calcularPrecioEvento,
  calcularPrecioJornadas,
  finDeFranja,
} from '../../lib/precios';
import { textoQr } from '../../lib/codigoReserva';
import {
  empiezaMalTelefono,
  errorNombreObligatorio,
  errorTelefono,
  limpiarNombre,
  limpiarTelefono,
} from '../../lib/validacion';
import { canchasDelDeporte, tituloCancha } from '../../lib/canchas';
import { deportePorSlug } from '../../data/deportes';
import {
  OPCIONES_EQUIPOS,
  TRANSICION_MIN,
  MAX_CANCHAS_TORNEO,
  armarTorneo,
  desempateDe,
  fasesDelTorneo,
  horasDeJornada,
  horasSinPartido,
  limpiarJornadasConChoque,
  maxCanchasTorneo,
  mensajeHorasSinPartido,
  mensajeTopeCanchas,
  minutosPorTurno,
  minutosRequeridos,
  partidosPorRonda,
  programarTorneo,
  sortearEquipos,
  sugerenciasTiempoFase,
  turnosPorRonda,
  validarCanchasTorneo,
  validarCrucesManuales,
  validarJornadas,
} from '../../lib/torneo';

export const MODOS = [
  { valor: 'cancha', etiqueta: 'Cancha', titulo: 'Reserva tu cancha', tipoEtiqueta: 'Reserva de cancha' },
  { valor: 'torneo', etiqueta: 'Torneo', titulo: 'Reserva tu torneo', tipoEtiqueta: 'Torneo' },
  { valor: 'cumpleanos', etiqueta: 'Cumpleaños', titulo: 'Reserva tu cumpleaños', tipoEtiqueta: 'Cumpleaños' },
];

export const MAX_INVITADOS = 100;

function clonarHorasPorCancha(mapa) {
  const salida = {};
  if (!mapa || typeof mapa !== 'object') return salida;
  Object.keys(mapa).forEach((cid) => {
    if (Array.isArray(mapa[cid]) && mapa[cid].length > 0) {
      salida[cid] = [...mapa[cid]];
    }
  });
  return salida;
}

function quitarCanchasDeJornadas(jornadasActuales, idsPermitidas) {
  const permitidas = new Set(idsPermitidas);
  const siguiente = {};
  let cambio = false;
  Object.keys(jornadasActuales || {}).forEach((rKey) => {
    const j = jornadasActuales[rKey];
    const mapa = j?.horasPorCancha || {};
    const nuevoMapa = {};
    Object.keys(mapa).forEach((cid) => {
      if (permitidas.has(cid)) {
        if (Array.isArray(mapa[cid]) && mapa[cid].length > 0) {
          nuevoMapa[cid] = [...mapa[cid]];
        }
      } else if (Array.isArray(mapa[cid]) && mapa[cid].length > 0) {
        cambio = true;
      }
    });
    siguiente[rKey] = {
      ...j,
      horasPorCancha: nuevoMapa,
    };
  });
  return cambio ? siguiente : jornadasActuales;
}

function limpiarCanchasFueraDeFases(jornadasActuales, fasesList = []) {
  const siguiente = { ...jornadasActuales };
  let cambio = false;
  fasesList.forEach((fase) => {
    const j = siguiente[fase.ronda];
    if (!j || !j.horasPorCancha) return;
    const permitidas = new Set(fase.canchaIds || []);
    const nuevoMapa = {};
    let cambioFase = false;
    Object.keys(j.horasPorCancha).forEach((cid) => {
      const hrs = j.horasPorCancha[cid];
      if (permitidas.has(cid)) {
        if (Array.isArray(hrs) && hrs.length > 0) {
          nuevoMapa[cid] = [...hrs];
        }
      } else if (Array.isArray(hrs) && hrs.length > 0) {
        cambioFase = true;
      }
    });
    if (cambioFase) {
      cambio = true;
      siguiente[fase.ronda] = {
        ...j,
        horasPorCancha: nuevoMapa,
      };
    }
  });
  return cambio ? siguiente : jornadasActuales;
}

function inicializarJornadas(nEquipos, fechaPorDefecto, previas = {}) {
  const rondas = partidosPorRonda(nEquipos);
  const resultado = {};
  rondas.forEach((_, idx) => {
    const ronda = idx + 1;
    if (previas && previas[ronda]) {
      resultado[ronda] = {
        fecha: previas[ronda].fecha || fechaPorDefecto,
        horasPorCancha: clonarHorasPorCancha(previas[ronda].horasPorCancha),
      };
    } else {
      resultado[ronda] = {
        fecha: fechaPorDefecto,
        horasPorCancha: {},
      };
    }
  });
  return resultado;
}

function normalizarJornadasCascada(jornadasActuales, fases = [], dias = [], horasBase = []) {
  const copia = { ...jornadasActuales };
  let fechaMin = dias[0] || '';
  let horaFinEnFechaMin = null;

  fases.forEach((fase) => {
    const r = fase.ronda;
    const actual = copia[r] || { fecha: fechaMin, horasPorCancha: {} };
    let nuevaFecha = actual.fecha || fechaMin;
    let nuevasHorasPorCancha = clonarHorasPorCancha(actual.horasPorCancha);
    const horasActuales = horasDeJornada({ horasPorCancha: nuevasHorasPorCancha });

    if (
      (fechaMin && nuevaFecha < fechaMin) ||
      (dias.length > 0 && !dias.includes(nuevaFecha))
    ) {
      nuevaFecha = fechaMin;
      nuevasHorasPorCancha = {};
    }

    if (nuevaFecha === fechaMin && horaFinEnFechaMin != null) {
      const horasRestantes =
        Array.isArray(horasBase) && horasBase.length > 0
          ? horasBase.filter((h) => h >= horaFinEnFechaMin).length
          : Infinity;
      const minReqHoras = Math.max(1, Number(fase.horasMinimas) || 1);

      if (horasRestantes < minReqHoras) {
        const idxDia = Array.isArray(dias) ? dias.indexOf(fechaMin) : -1;
        if (idxDia >= 0 && idxDia + 1 < dias.length) {
          nuevaFecha = dias[idxDia + 1];
        }
        nuevasHorasPorCancha = {};
      } else if (horasActuales.length > 0 && horasActuales[0] < horaFinEnFechaMin) {
        nuevasHorasPorCancha = {};
      }
    }

    copia[r] = {
      fecha: nuevaFecha,
      horasPorCancha: nuevasHorasPorCancha,
    };

    const horasFinales = horasDeJornada(copia[r]);
    if (nuevaFecha > fechaMin) {
      fechaMin = nuevaFecha;
      horaFinEnFechaMin =
        horasFinales.length > 0
          ? finDeFranja(horasFinales[horasFinales.length - 1])
          : null;
    } else {
      fechaMin = nuevaFecha;
      if (horasFinales.length > 0) {
        const finActual = finDeFranja(horasFinales[horasFinales.length - 1]);
        if (!horaFinEnFechaMin || finActual > horaFinEnFechaMin) {
          horaFinEnFechaMin = finActual;
        }
      }
    }
  });

  return copia;
}

function moverFechaJornadas(jornadasActuales, iso) {
  const actualizadas = { ...jornadasActuales };
  Object.keys(actualizadas).forEach((rondaKey) => {
    const j = actualizadas[rondaKey];
    if (!j || horasDeJornada(j).length === 0 || Number(rondaKey) === 1) {
      actualizadas[rondaKey] = {
        ...j,
        fecha: iso,
      };
    }
  });
  return actualizadas;
}

function formatearAvisoChoqueJornadas(
  quitadas = [],
  canchasCatalogo = [],
  fasesCatalogo = []
) {
  if (!Array.isArray(quitadas) || quitadas.length === 0) return null;
  const nombreDeFase = (ronda) => {
    const f = fasesCatalogo.find((item) => item.ronda === Number(ronda));
    return f ? f.nombreRonda : `Fase ${ronda}`;
  };
  if (quitadas.length === 1) {
    const unica = quitadas[0];
    const cancha = canchasCatalogo.find((c) => c.id === unica.canchaId);
    const nombreCancha = cancha ? tituloCancha(cancha) : unica.canchaId;
    return `La hora de las ${unica.hora} en ${nombreCancha} (${nombreDeFase(unica.ronda)}) ya no está libre: la quitamos.`;
  }
  const fasesAfectadas = [];
  quitadas.forEach((item) => {
    const nombre = nombreDeFase(item.ronda);
    if (!fasesAfectadas.includes(nombre)) {
      fasesAfectadas.push(nombre);
    }
  });
  return `Algunas horas ya no están libres: las quitamos de ${fasesAfectadas.join(', ')}.`;
}

function calcularMotivoNoAgregable(id, modoActual, idsActuales, todasLasCanchas, equipos) {
  if (modoActual !== 'torneo' || idsActuales.includes(id)) {
    return null;
  }
  if (idsActuales.length > 0) {
    const primera = todasLasCanchas.find((c) => c.id === idsActuales[0]);
    const target = todasLasCanchas.find((c) => c.id === id);
    if (primera && target && target.deporte !== primera.deporte) {
      return `Solo canchas de ${deportePorSlug(primera.deporte)?.nombre}`;
    }
  }
  const topeCanchas = maxCanchasTorneo(equipos);
  if (idsActuales.length >= topeCanchas) {
    return topeCanchas < MAX_CANCHAS_TORNEO
      ? mensajeTopeCanchas(equipos)
      : `Máx. ${topeCanchas} canchas`;
  }
  return null;
}

/**
 * Hook de lógica de reserva (cancha individual, torneo y cumpleaños).
 *
 * @param {Object} [params]
 * @param {boolean} [params.activo]
 * @param {string} [params.modoInicial='cancha']
 * @param {Object|null} [params.canchaInicial=null]
 * @returns {Object} Estado, datos derivados y acciones de la reserva
 */
export default function useReserva({ activo, modoInicial = 'cancha', canchaInicial = null } = {}) {
  const { dias, canchas, disponibilidad, reservar, reservarEvento } = useReservas();

  const [modo, setModo] = useState(modoInicial);
  const [fecha, setFecha] = useState(dias[0]);
  const [canchaId, setCanchaId] = useState(canchaInicial ? canchaInicial.id : null);
  const [canchaIds, setCanchaIds] = useState([]);
  const [horasSel, setHorasSel] = useState([]);
  const [equipos, setEquiposState] = useState(8);
  const [duracionPartido, setDuracionPartidoState] = useState(20);
  const [emparejamiento, setEmparejamiento] = useState('aleatorio');
  const [ordenEquipos, setOrdenEquipos] = useState(() => sortearEquipos(8));
  const [jornadas, setJornadas] = useState(() => inicializarJornadas(8, dias[0]));
  const [invitados, setInvitados] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tocado, setTocado] = useState({ nombre: false, telefono: false });
  const [error, setError] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [avisoHorasDeMas, setAvisoHorasDeMas] = useState(false);
  const [faseARevisar, setFaseARevisar] = useState(null);
  const [marcaFaseARevisar, setMarcaFaseARevisar] = useState(0);

  const prevActivoRef = useRef(false);
  const confirmandoRef = useRef(false);
  const maxCanchas = maxCanchasTorneo(equipos);

  const reiniciar = useCallback(() => {
    confirmandoRef.current = false;
    setFecha(dias[0]);
    setCanchaId(canchaInicial ? canchaInicial.id : null);
    setCanchaIds([]);
    setHorasSel([]);
    setEquiposState(8);
    setDuracionPartidoState(20);
    setEmparejamiento('aleatorio');
    setOrdenEquipos(sortearEquipos(8));
    setJornadas(inicializarJornadas(8, dias[0]));
    setInvitados('');
    setNombre('');
    setTelefono('');
    setTocado({ nombre: false, telefono: false });
    setError(null);
    setConfirmado(null);
    setAvisoHorasDeMas(false);
    setFaseARevisar(null);
    setMarcaFaseARevisar(0);
  }, [dias, canchaInicial]);

  useEffect(() => {
    if (activo && !prevActivoRef.current) {
      reiniciar();
    }
    prevActivoRef.current = activo;
  }, [activo, reiniciar]);

  const esEvento = modo !== 'cancha';

  const modoInfo = useMemo(
    () => MODOS.find((m) => m.valor === modo) || MODOS[0],
    [modo]
  );

  const canchaSel = useMemo(
    () => canchas.find((c) => c.id === canchaId) || null,
    [canchas, canchaId]
  );

  const canchasElegidas = useMemo(
    () =>
      esEvento
        ? canchaIds.map((id) => canchas.find((c) => c.id === id)).filter(Boolean)
        : canchaSel
        ? [canchaSel]
        : [],
    [esEvento, canchaIds, canchas, canchaSel]
  );

  const horasBase = useMemo(
    () => (canchas[0] ? canchas[0].horas : []),
    [canchas]
  );

  const fases = useMemo(() => {
    const deporteTorneo = canchasElegidas[0]?.deporte || (canchaSel?.deporte ?? 'futbol');
    const minTurno = minutosPorTurno(duracionPartido, deporteTorneo);
    return fasesDelTorneo({
      equipos: Number(equipos),
      canchaIds,
      minutosTurno: minTurno,
    });
  }, [canchasElegidas, canchaSel, duracionPartido, equipos, canchaIds]);

  useEffect(() => {
    if (dias.length === 0) return;
    if (!dias.includes(fecha)) {
      setFecha(dias[0]);
      setHorasSel([]);
    }
    setJornadas((prev) => {
      const algunaFuera = Object.values(prev).some(
        (j) => j && j.fecha && !dias.includes(j.fecha)
      );
      if (!algunaFuera) return prev;
      return normalizarJornadasCascada(prev, fases, dias, horasBase);
    });
  }, [dias, fecha, fases, horasBase]);

  const esLibre = useCallback(
    (hora) => {
      if (!esEvento) {
        return (
          !!canchaSel &&
          disponibilidad(canchaSel.id, fecha).some(
            (h) => h.hora === hora && h.disponible
          )
        );
      }
      return (
        canchaIds.length > 0 &&
        canchaIds.every((id) =>
          disponibilidad(id, fecha).some(
            (h) => h.hora === hora && h.disponible
          )
        )
      );
    },
    [esEvento, canchaSel, disponibilidad, fecha, canchaIds]
  );

  const esLibreFase = useCallback(
    (ronda, canchaIdObjetivo, hora, jornadasBase = jornadas) => {
      const numRonda = Number(ronda);
      const fase = fases.find((f) => f.ronda === numRonda);
      if (!fase || !canchaIdObjetivo || !fase.canchaIds.includes(canchaIdObjetivo)) {
        return false;
      }

      const jActual = jornadasBase[numRonda];
      const fechaFase = (jActual && jActual.fecha) || fecha;
      if (!fechaFase) return false;

      const libreEnCancha = disponibilidad(canchaIdObjetivo, fechaFase).some(
        (h) => h.hora === hora && h.disponible
      );
      if (!libreEnCancha) return false;

      // Bloqueo cronológico preventivo: no permitir horas anteriores o iguales al fin
      // de una fase previa que se juegue el mismo día (ni fechas anteriores).
      for (let rPrev = 1; rPrev < numRonda; rPrev += 1) {
        const jPrevia = jornadasBase[rPrev];
        if (!jPrevia || !jPrevia.fecha) continue;
        if (fechaFase < jPrevia.fecha) {
          return false;
        }
        if (fechaFase === jPrevia.fecha) {
          const horasPrev = horasDeJornada(jPrevia);
          if (horasPrev.length > 0) {
            const horaFinPrevia = finDeFranja(horasPrev[horasPrev.length - 1]);
            if (hora < horaFinPrevia) {
              return false;
            }
          }
        }
      }

      const otraRondaSolapada = Object.keys(jornadasBase).some((rKey) => {
        const otraRonda = Number(rKey);
        if (otraRonda === numRonda) return false;
        const jOtra = jornadasBase[otraRonda];
        if (!jOtra || jOtra.fecha !== fechaFase) {
          return false;
        }
        const horasOtra = jOtra.horasPorCancha?.[canchaIdObjetivo];
        return Array.isArray(horasOtra) && horasOtra.includes(hora);
      });

      return !otraRondaSolapada;
    },
    [fases, jornadas, fecha, disponibilidad]
  );

  const esDiaBloqueadoFase = useCallback(
    (ronda) => {
      const numRonda = Number(ronda);
      if (numRonda <= 1) {
        return () => false;
      }

      const faseActual = fases.find((f) => f.ronda === numRonda);
      let fechaMin = '';
      let horaFinEnFechaMin = null;

      for (let rPrev = 1; rPrev < numRonda; rPrev += 1) {
        const jPrevia = jornadas[rPrev];
        const fPrev = (jPrevia && jPrevia.fecha) || fecha || '';
        if (!fPrev) continue;
        const horasPrev = horasDeJornada(jPrevia);

        if (!fechaMin || fPrev > fechaMin) {
          fechaMin = fPrev;
          horaFinEnFechaMin =
            horasPrev.length > 0 ? finDeFranja(horasPrev[horasPrev.length - 1]) : null;
        } else if (fPrev === fechaMin && horasPrev.length > 0) {
          const finPrev = finDeFranja(horasPrev[horasPrev.length - 1]);
          if (!horaFinEnFechaMin || finPrev > horaFinEnFechaMin) {
            horaFinEnFechaMin = finPrev;
          }
        }
      }

      const minReqHoras = Math.max(1, Number(faseActual?.horasMinimas) || 1);
      const mismoDiaAgotado =
        horaFinEnFechaMin != null &&
        Array.isArray(horasBase) &&
        horasBase.length > 0 &&
        horasBase.filter((h) => h >= horaFinEnFechaMin).length < minReqHoras;

      return (iso) => {
        if (!fechaMin) return false;
        if (iso < fechaMin) return true;
        if (iso === fechaMin && mismoDiaAgotado) return true;
        return false;
      };
    },
    [fases, jornadas, fecha, horasBase]
  );

  const contarLibresFase = useCallback(
    (ronda) => {
      const numRonda = Number(ronda);
      const fase = fases.find((f) => f.ronda === numRonda);
      if (!fase || fase.canchaIds.length === 0) {
        return undefined;
      }
      return (iso) =>
        horasBase.filter((hora) =>
          fase.canchaIds.some((cid) =>
            disponibilidad(cid, iso).some((h) => h.hora === hora && h.disponible)
          )
        ).length;
    },
    [fases, horasBase, disponibilidad]
  );

  const errNombre = errorNombreObligatorio(nombre);
  const errTelefono = errorTelefono(telefono);
  const verErrNombre = tocado.nombre && !!errNombre;
  const verErrTelefono = !!errTelefono && (tocado.telefono || empiezaMalTelefono(telefono));

  const cambiarEquiposTorneo = useCallback(
    (nuevoEquipos) => {
      const n = Number(nuevoEquipos);
      setEquiposState(n);
      setAvisoHorasDeMas(false);
      if (OPCIONES_EQUIPOS.includes(n)) {
        setOrdenEquipos(
          emparejamiento === 'aleatorio'
            ? sortearEquipos(n)
            : Array.from({ length: n }, (_, i) => i + 1)
        );
        const topeCanchas = maxCanchasTorneo(n);
        const idsFinales =
          modo === 'torneo' && canchaIds.length > topeCanchas
            ? canchaIds.slice(0, topeCanchas)
            : canchaIds;
        const deporteTorneo = canchasElegidas[0]?.deporte || (canchaSel?.deporte ?? 'futbol');
        const nuevasFases = fasesDelTorneo({
          equipos: n,
          canchaIds: idsFinales,
          minutosTurno: minutosPorTurno(duracionPartido, deporteTorneo),
        });
        setJornadas((prev) => {
          const ini = inicializarJornadas(n, fecha, prev);
          return normalizarJornadasCascada(
            limpiarCanchasFueraDeFases(ini, nuevasFases),
            nuevasFases,
            dias,
            horasBase
          );
        });
        if (modo === 'torneo' && canchaIds.length > topeCanchas) {
          setCanchaIds((prev) => prev.slice(0, topeCanchas));
          setError(mensajeTopeCanchas(n, { recorte: true }));
        }
      }
    },
    [
      emparejamiento,
      fecha,
      modo,
      canchaIds,
      canchasElegidas,
      canchaSel,
      duracionPartido,
      dias,
      horasBase,
    ]
  );

  const setDuracionPartido = useCallback((min) => {
    setDuracionPartidoState(Number(min));
    setAvisoHorasDeMas(false);
  }, []);

  const cambiarEmparejamiento = useCallback(
    (nuevoModo) => {
      setEmparejamiento(nuevoModo);
      if (nuevoModo === 'aleatorio') {
        setOrdenEquipos(sortearEquipos(Number(equipos)));
      }
    },
    [equipos]
  );

  const resortearTorneo = useCallback(() => {
    setOrdenEquipos(sortearEquipos(Number(equipos)));
  }, [equipos]);

  const cambiarCruceManual = useCallback((indice, valor) => {
    const num = valor === '' || valor == null ? null : Number(valor);
    setOrdenEquipos((prev) => {
      const copia = [...prev];
      if (num != null) {
        const idxPrevio = prev.findIndex((v, i) => i !== indice && Number(v) === num);
        if (idxPrevio !== -1) copia[idxPrevio] = prev[indice] ?? null; // intercambia o mueve
      }
      copia[indice] = num;
      return copia;
    });
  }, []);

  const cambiarFechaFase = useCallback(
    (ronda, iso) => {
      const numRonda = Number(ronda);
      setJornadas((prev) => {
        const jActual = prev[numRonda] || { fecha: iso, horasPorCancha: {} };
        const siguiente = {
          ...prev,
          [numRonda]: {
            ...jActual,
            fecha: iso,
            horasPorCancha: {},
          },
        };
        return normalizarJornadasCascada(siguiente, fases, dias, horasBase);
      });
      setError(null);
      setAvisoHorasDeMas(false);
    },
    [fases, dias, horasBase]
  );

  const elegirHoraFase = useCallback(
    (ronda, canchaIdObjetivo, hora) => {
      const numRonda = Number(ronda);
      if (!canchaIdObjetivo) return;

      const calcularEleccion = (baseJornadas) => {
        const jActual = baseJornadas[numRonda] || { fecha, horasPorCancha: {} };
        const mapaActual = clonarHorasPorCancha(jActual.horasPorCancha);
        const horasActuales = Array.isArray(mapaActual[canchaIdObjetivo])
          ? mapaActual[canchaIdObjetivo]
          : [];

        if (horasActuales.includes(hora)) {
          const filtradas = horasActuales.filter((h) => h !== hora);
          if (filtradas.length > 0) {
            mapaActual[canchaIdObjetivo] = filtradas;
          } else {
            delete mapaActual[canchaIdObjetivo];
          }
          return {
            jornadas: normalizarJornadasCascada(
              {
                ...baseJornadas,
                [numRonda]: {
                  ...jActual,
                  horasPorCancha: mapaActual,
                },
              },
              fases,
              dias,
              horasBase
            ),
            error: null,
          };
        }

        const libreEnCancha = esLibreFase(numRonda, canchaIdObjetivo, hora, baseJornadas);
        if (!libreEnCancha) {
          return {
            jornadas: baseJornadas,
            error: null,
          };
        }

        mapaActual[canchaIdObjetivo] = [...horasActuales, hora].sort((a, b) =>
          a.localeCompare(b)
        );

        return {
          jornadas: normalizarJornadasCascada(
            {
              ...baseJornadas,
              [numRonda]: {
                ...jActual,
                horasPorCancha: mapaActual,
              },
            },
            fases,
            dias,
            horasBase
          ),
          error: null,
        };
      };

      const precalculado = calcularEleccion(jornadas);
      setError(precalculado.error);
      setAvisoHorasDeMas(false);
      setJornadas((prev) =>
        prev === jornadas
          ? precalculado.jornadas
          : calcularEleccion(prev).jornadas
      );
    },
    [jornadas, fecha, horasBase, esLibreFase, fases, dias]
  );

  const torneoPlan = useMemo(() => {
    const deporteTorneo = canchasElegidas[0]?.deporte || (canchaSel?.deporte ?? 'futbol');
    const desempate = desempateDe(deporteTorneo);
    const minutosTurno = minutosPorTurno(duracionPartido, deporteTorneo);
    const numCanchas = Math.max(1, canchaIds.length);
    const turnosRonda = turnosPorRonda(Number(equipos), numCanchas);
    const turnosTotales = turnosRonda.reduce((a, b) => a + b, 0);
    const minRequeridos = minutosRequeridos({
      equipos: Number(equipos),
      canchas: numCanchas,
      minutosTurno,
    });
    const errorCanchas = validarCanchasTorneo(canchasElegidas, equipos);
    const errorCruces =
      emparejamiento === 'manual'
        ? validarCrucesManuales(ordenEquipos, Number(equipos))
        : '';

    const validacionesJornadas = validarJornadas(fases, jornadas);
    const sugerenciasPorFase = {};
    const horasSinPartidoPorFase = {};
    const fasesConHorasDeMas = [];

    fases.forEach((fase) => {
      const j = jornadas[fase.ronda] || {};
      const mapa = j.horasPorCancha || {};
      sugerenciasPorFase[fase.ronda] = sugerenciasTiempoFase({
        fase,
        canchasTotales: canchaIds.length,
        duracionPartido: Number(duracionPartido),
        deporte: deporteTorneo,
        horasPorCancha: mapa,
      });

      const horasElegidas = fase.canchaIds.reduce((acc, cid) => {
        const arr = Array.isArray(mapa[cid]) ? mapa[cid] : [];
        return acc + arr.length;
      }, 0);
      const listaSinPartido = horasSinPartido(
        mapa,
        minutosTurno,
        fase.partidos,
        fase.canchaIds
      );
      const mensajeSinPartido =
        listaSinPartido.length > 0
          ? mensajeHorasSinPartido({
              nombreRonda: fase.nombreRonda,
              partidos: fase.partidos,
              duracionPartido: Number(duracionPartido),
              horasElegidas,
              sinPartido: listaSinPartido.length,
            })
          : '';
      horasSinPartidoPorFase[fase.ronda] = {
        lista: listaSinPartido,
        mensaje: mensajeSinPartido,
      };
      if (listaSinPartido.length > 0) {
        fasesConHorasDeMas.push(fase.ronda);
      }
    });

    const bloques = [];
    fases.forEach((fase) => {
      const j = jornadas[fase.ronda];
      if (!j || !j.fecha) return;
      const mapa = j.horasPorCancha || {};
      fase.canchaIds.forEach((cid) => {
        const hrs = Array.isArray(mapa[cid]) ? mapa[cid] : [];
        if (hrs.length === 0) return;
        bloques.push({
          ronda: fase.ronda,
          nombreRonda: fase.nombreRonda,
          fecha: j.fecha,
          horas: [...hrs],
          canchaIds: [cid],
        });
      });
    });

    const partidos = programarTorneo({
      orden: ordenEquipos,
      canchaIds,
      horaInicio: null,
      minutosTurno,
      jornadas,
    });

    return {
      deporte: deporteTorneo,
      desempate,
      equipos: Number(equipos),
      duracionPartido: Number(duracionPartido),
      transicion: TRANSICION_MIN,
      minutosTurno,
      turnosTotales,
      minutosRequeridos: minRequeridos,
      errorCanchas,
      errorCruces,
      emparejamiento,
      ordenEquipos,
      partidos,
      fases,
      jornadas,
      validacionesJornadas,
      sugerenciasPorFase,
      horasSinPartidoPorFase,
      fasesConHorasDeMas,
      bloques,
    };
  }, [
    canchasElegidas,
    canchaSel,
    duracionPartido,
    canchaIds,
    equipos,
    emparejamiento,
    ordenEquipos,
    jornadas,
    fases,
  ]);

  const precio = useMemo(() => {
    if (modo === 'torneo') {
      return calcularPrecioJornadas(torneoPlan?.bloques || [], canchas);
    }
    return calcularPrecioEvento(canchasElegidas, horasSel.length);
  }, [modo, torneoPlan?.bloques, canchas, canchasElegidas, horasSel.length]);

  const motivoBloqueo = useMemo(() => {
    if (modo === 'torneo') {
      if (torneoPlan.errorCanchas) {
        return torneoPlan.errorCanchas;
      }
      if (!OPCIONES_EQUIPOS.includes(Number(equipos))) {
        return 'Elige 4, 8 o 16 equipos.';
      }
      if (torneoPlan.errorCruces) {
        return torneoPlan.errorCruces;
      }
      const valError = torneoPlan.validacionesJornadas?.find((v) => v.error);
      if (valError) {
        return valError.error;
      }
      if (errNombre) {
        return 'Escribe tu nombre para confirmar.';
      }
      if (errTelefono) {
        return 'Revisa el teléfono.';
      }
      return '';
    }

    if (esEvento ? canchaIds.length === 0 : !canchaSel) {
      return esEvento ? 'Elige al menos una cancha.' : 'Elige una cancha.';
    }
    if (horasSel.length === 0) {
      return 'Elige el horario.';
    }
    if (modo === 'cumpleanos') {
      if (!Number.isInteger(Number(invitados)) || Number(invitados) < 1) {
        return 'Indica cuántos invitados vienen.';
      }
      if (Number(invitados) > MAX_INVITADOS) {
        return `Máximo ${MAX_INVITADOS} invitados.`;
      }
    }
    if (errNombre) {
      return 'Escribe tu nombre para confirmar.';
    }
    if (errTelefono) {
      return 'Revisa el teléfono.';
    }
    return '';
  }, [
    modo,
    torneoPlan,
    equipos,
    errNombre,
    errTelefono,
    esEvento,
    canchaIds.length,
    canchaSel,
    horasSel.length,
    invitados,
  ]);

  const puedeConfirmar = motivoBloqueo === '' && !confirmado;

  useEffect(() => {
    if (horasSel.length === 0) return;
    if (esEvento && canchaIds.length === 0) {
      setHorasSel([]);
      return;
    }
    const algunaNoLibre = horasSel.some((h) => !esLibre(h));
    if (algunaNoLibre) {
      setHorasSel([]);
      setError('Ese horario ya no está libre en las canchas elegidas. Elige otro.');
    }
  }, [horasSel, esLibre, esEvento, canchaIds.length]);

  useEffect(() => {
    if (modo !== 'torneo') return;

    const tieneHorasFase = Object.values(jornadas).some(
      (j) => horasDeJornada(j).length > 0
    );
    if (!tieneHorasFase) return;

    if (canchaIds.length === 0) {
      setJornadas((prev) => limpiarJornadasConChoque(prev, () => false).jornadas);
      return;
    }

    const { jornadas: siguiente, huboChoque, quitadas } = limpiarJornadasConChoque(
      jornadas,
      (r, cid, h) => esLibreFase(r, cid, h, jornadas)
    );

    if (huboChoque) {
      setJornadas(normalizarJornadasCascada(siguiente, fases, dias, horasBase));
      setError(formatearAvisoChoqueJornadas(quitadas, canchas, fases));
    }
  }, [modo, jornadas, esLibreFase, canchaIds.length, fases, dias, horasBase, canchas]);

  const cambiarModo = useCallback(
    (nuevo) => {
      if (nuevo === modo) return;
      let avisoModo = null;
      if (nuevo === 'torneo') {
        if (modo === 'cancha') {
          const nuevasIds = canchaSel ? [canchaSel.id] : [];
          setCanchaIds(nuevasIds);
          setJornadas((prev) => quitarCanchasDeJornadas(prev, nuevasIds));
        } else if (modo === 'cumpleanos') {
          const recortarCanchas = (ids) => {
            if (ids.length === 0) return { ids: [], recortoPorTope: false };
            const canchasActuales = ids
              .map((id) => canchas.find((c) => c.id === id))
              .filter(Boolean);
            if (canchasActuales.length === 0) {
              return { ids: [], recortoPorTope: false };
            }
            const primerDeporte = canchasActuales[0].deporte;
            const delMismoDeporte = canchasActuales.filter(
              (c) => c.deporte === primerDeporte
            );
            return {
              ids: delMismoDeporte.slice(0, maxCanchas).map((c) => c.id),
              recortoPorTope: delMismoDeporte.length > maxCanchas,
            };
          };
          const precalculado = recortarCanchas(canchaIds);
          if (precalculado.recortoPorTope) {
            avisoModo = mensajeTopeCanchas(equipos, { recorte: true });
          }
          setCanchaIds((prevIds) =>
            prevIds === canchaIds ? precalculado.ids : recortarCanchas(prevIds).ids
          );
          setJornadas((prev) => quitarCanchasDeJornadas(prev, precalculado.ids));
        }
      } else if (modo === 'cancha' && nuevo !== 'cancha') {
        setCanchaIds(canchaSel ? [canchaSel.id] : []);
      } else if (modo !== 'cancha' && nuevo === 'cancha') {
        setCanchaId(canchaIds[0] || (canchaSel ? canchaSel.id : null));
      }
      setModo(nuevo);
      setHorasSel([]);
      setError(avisoModo);
      setAvisoHorasDeMas(false);
    },
    [modo, canchaSel, canchaIds, canchas, maxCanchas, equipos]
  );

  const elegirCancha = useCallback((id) => {
    setCanchaId(id);
    setHorasSel([]);
    setError(null);
  }, []);

  const motivoNoAgregable = useCallback(
    (id) => calcularMotivoNoAgregable(id, modo, canchaIds, canchas, equipos),
    [modo, canchaIds, canchas, equipos]
  );

  const deporteBloqueado = useCallback(
    (slug) => {
      if (modo !== 'torneo' || canchaIds.length === 0) return false;
      const primera = canchas.find((c) => c.id === canchaIds[0]);
      return Boolean(primera && primera.deporte !== slug);
    },
    [modo, canchaIds, canchas]
  );

  const alternarCancha = useCallback(
    (id) => {
      const quitando = canchaIds.includes(id);
      const motivoActual = !quitando
        ? calcularMotivoNoAgregable(id, modo, canchaIds, canchas, equipos)
        : null;
      setCanchaIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((x) => x !== id);
        }
        const motivo = calcularMotivoNoAgregable(id, modo, prev, canchas, equipos);
        if (motivo !== null) {
          return prev;
        }
        return [...prev, id];
      });
      if (modo === 'torneo' && quitando) {
        const restantes = canchaIds.filter((x) => x !== id);
        const deporteTorneo =
          canchas.find((c) => c.id === restantes[0])?.deporte ||
          canchaSel?.deporte ||
          'futbol';
        const nuevasFases = fasesDelTorneo({
          equipos: Number(equipos),
          canchaIds: restantes,
          minutosTurno: minutosPorTurno(duracionPartido, deporteTorneo),
        });
        setJornadas((prev) =>
          limpiarCanchasFueraDeFases(
            quitarCanchasDeJornadas(prev, restantes),
            nuevasFases
          )
        );
      }
      setAvisoHorasDeMas(false);
      setError(motivoActual);
    },
    [modo, canchaIds, canchas, equipos, canchaSel, duracionPartido]
  );

  const alternarDeporte = useCallback(
    (slug) => {
      const ids = canchasDelDeporte(canchas, slug).map((c) => c.id);
      const todasSeleccionadas = ids.every((id) => canchaIds.includes(id));
      setCanchaIds((prev) => {
        if (modo === 'torneo') {
          if (prev.length > 0) {
            const primera = canchas.find((c) => c.id === prev[0]);
            if (primera && primera.deporte !== slug) {
              return prev;
            }
          }
          if (ids.every((id) => prev.includes(id))) {
            return prev.filter((id) => !ids.includes(id));
          }
          const nuevos = ids.filter((id) => !prev.includes(id));
          const cupoDisponible = Math.max(0, maxCanchas - prev.length);
          return [...prev, ...nuevos.slice(0, cupoDisponible)];
        }
        return ids.every((id) => prev.includes(id))
          ? prev.filter((id) => !ids.includes(id))
          : [...prev, ...ids.filter((id) => !prev.includes(id))];
      });
      if (modo === 'torneo' && todasSeleccionadas) {
        const restantes = canchaIds.filter((id) => !ids.includes(id));
        setJornadas((prev) => quitarCanchasDeJornadas(prev, restantes));
      }
      setAvisoHorasDeMas(false);
      setError(null);
    },
    [canchas, modo, maxCanchas, canchaIds]
  );

  const elegirHora = useCallback(
    (hora) => {
      const r = esEvento
        ? seleccionarRango(horasSel, hora, horasBase, esLibre)
        : alternarHoraIndividual(horasSel, hora, horasBase);
      setHorasSel(r.sel);
      setError(r.error);
    },
    [esEvento, horasSel, horasBase, esLibre]
  );

  const cambiarFecha = useCallback(
    (iso) => {
      setFecha(iso);
      setHorasSel([]);
      setAvisoHorasDeMas(false);

      if (modo !== 'torneo') {
        setJornadas((prev) => moverFechaJornadas(prev, iso));
        setError(null);
        return;
      }

      const calcularCambioTorneo = (base) => {
        const conFecha = moverFechaJornadas(base, iso);
        const { jornadas: limpias, huboChoque, quitadas } = limpiarJornadasConChoque(
          conFecha,
          (r, cid, h) => esLibreFase(r, cid, h, conFecha)
        );
        return {
          jornadas: normalizarJornadasCascada(limpias, fases, dias, horasBase),
          huboChoque,
          quitadas,
        };
      };

      const precalculado = calcularCambioTorneo(jornadas);
      setJornadas((prev) =>
        prev === jornadas
          ? precalculado.jornadas
          : calcularCambioTorneo(prev).jornadas
      );
      setError(
        precalculado.huboChoque
          ? formatearAvisoChoqueJornadas(precalculado.quitadas, canchas, fases)
          : null
      );
    },
    [modo, jornadas, esLibreFase, fases, dias, horasBase, canchas]
  );

  const cambiarNombre = useCallback((valor) => {
    setNombre(limpiarNombre(valor));
  }, []);

  const cambiarTelefono = useCallback((valor) => {
    setTelefono(limpiarTelefono(valor));
  }, []);

  const marcarTocado = useCallback((campo) => {
    setTocado((prev) => ({ ...prev, [campo]: true }));
  }, []);

  const contarLibresDia = useMemo(() => {
    if (!esEvento && canchaSel) {
      return (iso) =>
        disponibilidad(canchaSel.id, iso).filter((h) => h.disponible).length;
    }
    if (esEvento && canchaIds.length > 0) {
      return (iso) =>
        horasBase.filter((hora) =>
          canchaIds.every((id) =>
            disponibilidad(id, iso).some((h) => h.hora === hora && h.disponible)
          )
        ).length;
    }
    return undefined;
  }, [esEvento, canchaSel, canchaIds, horasBase, disponibilidad]);

  const ejecutarConfirmacion = useCallback(() => {
    if (!puedeConfirmar || confirmado || confirmandoRef.current) return;
    confirmandoRef.current = true;

    let res;

    const datosTorneo =
      modo === 'torneo'
        ? armarTorneo({
            deporte: torneoPlan.deporte,
            equipos: Number(equipos),
            duracionPartido: Number(duracionPartido),
            emparejamiento,
            orden: ordenEquipos,
            canchaIds,
            horaInicio: null,
            jornadas: torneoPlan.jornadas,
          })
        : null;

    if (modo === 'cancha') {
      res = reservar({
        canchaId: canchaSel.id,
        fecha,
        horas: horasSel,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });
    } else if (modo === 'torneo') {
      const bloques = torneoPlan.bloques || [];
      const primerBloque = bloques[0] || {};
      res = reservarEvento({
        subtipo: 'torneo',
        fecha: primerBloque.fecha || fecha,
        canchaIds,
        horas: primerBloque.horas || [],
        bloques,
        equipos: Number(equipos),
        canchasNecesarias: canchaIds.length,
        invitados: null,
        torneo: datosTorneo,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });
    } else {
      res = reservarEvento({
        subtipo: modo,
        fecha,
        canchaIds,
        horas: horasSel,
        equipos: null,
        canchasNecesarias: null,
        invitados: Number(invitados),
        torneo: null,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });
    }

    if (!res.ok) {
      confirmandoRef.current = false;
      setError(res.error);
      if (modo === 'torneo') {
        // Si el rechazo no se debe a un choque de disponibilidad (p. ej. orden
        // cronológico entre fases), se muestra el error devuelto sin borrar horas.
        setJornadas((prev) => {
          const { jornadas: siguiente, huboChoque } = limpiarJornadasConChoque(
            prev,
            (r, cid, h) => esLibreFase(r, cid, h, prev)
          );
          if (!huboChoque) return prev;
          return normalizarJornadasCascada(siguiente, fases, dias, horasBase);
        });
      } else {
        setHorasSel([]);
      }
      return;
    }

    const primerBloque = (torneoPlan?.bloques && torneoPlan.bloques[0]) || null;
    const ultimoBloque =
      (torneoPlan?.bloques && torneoPlan.bloques[torneoPlan.bloques.length - 1]) ||
      null;

    const formatearBloqueUnico = (horasBloque = []) => {
      if (!Array.isArray(horasBloque) || horasBloque.length === 0) return '';
      const seguidas = horasBloque.every(
        (h, idx) => idx === 0 || finDeFranja(horasBloque[idx - 1]) === h
      );
      return seguidas
        ? `${horasBloque[0]} a ${finDeFranja(horasBloque[horasBloque.length - 1])}`
        : horasBloque.join(', ');
    };
    const fasesUnicasBloques = new Set((torneoPlan.bloques || []).map((b) => b.ronda)).size;
    const totalJornadas =
      fasesUnicasBloques > 1 ? fasesUnicasBloques : torneoPlan.bloques?.length || 0;

    const horario =
      modo === 'torneo'
        ? torneoPlan.bloques?.length > 1
          ? `${totalJornadas} jornadas`
          : formatearBloqueUnico(primerBloque?.horas)
        : `${horasSel[0]} a ${finDeFranja(horasSel[horasSel.length - 1])}`;

    const fechaTexto =
      modo === 'torneo' && torneoPlan.bloques?.length > 1
        ? `${fechaCompleta(primerBloque.fecha)} a ${fechaCompleta(ultimoBloque.fecha)}`
        : fechaCompleta((primerBloque && primerBloque.fecha) || fecha);

    const nombresCanchas = canchasElegidas.map((c) => c.nombre);
    const mapaNombresCanchas = Object.fromEntries(
      canchasElegidas.map((c) => [c.id, c.nombre])
    );
    const modoActual = MODOS.find((m) => m.valor === modo) || MODOS[0];
    const tipoEtiqueta = modoActual.tipoEtiqueta;

    setConfirmado({
      codigo: res.codigo,
      textoQr: textoQr({
        codigo: res.codigo,
        tipo: tipoEtiqueta,
        fecha: fechaTexto,
        horario,
        canchas: nombresCanchas,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        total: precio.total,
        torneo: datosTorneo,
        nombresCanchas: mapaNombresCanchas,
      }),
      resumen: {
        tipoEtiqueta,
        fechaTexto,
        horario,
        canchas: nombresCanchas,
        total: precio.total,
        packsAgua: precio.packsAgua,
        invitados: modo === 'cumpleanos' ? Number(invitados) : null,
        torneo: datosTorneo,
      },
    });
  }, [
    puedeConfirmar,
    modo,
    torneoPlan,
    equipos,
    duracionPartido,
    emparejamiento,
    ordenEquipos,
    canchaIds,
    horasSel,
    reservar,
    canchaSel,
    fecha,
    nombre,
    telefono,
    reservarEvento,
    invitados,
    canchasElegidas,
    precio,
    esLibreFase,
    fases,
    dias,
    horasBase,
    confirmado,
  ]);

  const confirmar = useCallback(() => {
    if (!puedeConfirmar) return;
    if (modo === 'torneo' && (torneoPlan?.fasesConHorasDeMas?.length || 0) > 0) {
      setAvisoHorasDeMas(true);
      return;
    }
    ejecutarConfirmacion();
  }, [puedeConfirmar, modo, torneoPlan, ejecutarConfirmacion]);

  const reservarIgual = useCallback(() => {
    setAvisoHorasDeMas(false);
    ejecutarConfirmacion();
  }, [ejecutarConfirmacion]);

  const cerrarAvisoHorasDeMas = useCallback(() => {
    setAvisoHorasDeMas(false);
  }, []);

  const revisarHorasDeMas = useCallback(() => {
    setAvisoHorasDeMas(false);
    const primeraFase = torneoPlan?.fasesConHorasDeMas?.[0] ?? null;
    if (primeraFase != null) {
      setFaseARevisar(primeraFase);
      setMarcaFaseARevisar((n) => n + 1);
    }
  }, [torneoPlan]);

  return {
    modo,
    modoInfo,
    esEvento,
    fecha,
    horasBase,
    canchaSel,
    canchaIds,
    canchasElegidas,
    horasSel,
    equipos,
    invitados,
    setInvitados,
    nombre,
    telefono,
    errNombre,
    errTelefono,
    verErrNombre,
    verErrTelefono,
    error,
    confirmado,
    precio,
    motivoBloqueo,
    puedeConfirmar,
    motivoNoAgregable,
    deporteBloqueado,
    esLibre,
    contarLibresDia,
    cambiarModo,
    elegirCancha,
    alternarCancha,
    alternarDeporte,
    elegirHora,
    cambiarFecha,
    cambiarNombre,
    cambiarTelefono,
    marcarTocado,
    confirmar,
    reservarIgual,
    revisarHorasDeMas,
    cerrarAvisoHorasDeMas,
    avisoHorasDeMas,
    faseARevisar,
    marcaFaseARevisar,
    reiniciar,
    duracionPartido,
    setDuracionPartido,
    emparejamiento,
    cambiarEmparejamiento,
    ordenEquipos,
    cambiarEquiposTorneo,
    resortearTorneo,
    cambiarCruceManual,
    torneoPlan,
    jornadas,
    cambiarFechaFase,
    elegirHoraFase,
    esLibreFase,
    contarLibresFase,
    esDiaBloqueadoFase,
  };
}

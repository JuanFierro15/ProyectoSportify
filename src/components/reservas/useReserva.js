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
import { canchasDelDeporte } from '../../lib/canchas';
import {
  OPCIONES_EQUIPOS,
  TRANSICION_MIN,
  MAX_CANCHAS_TORNEO,
  armarTorneo,
  desempateDe,
  fasesDelTorneo,
  minutosPorTurno,
  minutosRequeridos,
  partidosPorRonda,
  programarTorneo,
  sortearEquipos,
  sugerenciasTiempo,
  sugerenciasTiempoFase,
  turnosPorRonda,
  validarCanchasTorneo,
  validarCrucesManuales,
  validarFranja,
  validarJornadas,
} from '../../lib/torneo';

export const MODOS = [
  { valor: 'cancha', etiqueta: 'Cancha', titulo: 'Reserva tu cancha', tipoEtiqueta: 'Reserva de cancha' },
  { valor: 'torneo', etiqueta: 'Torneo', titulo: 'Reserva tu torneo', tipoEtiqueta: 'Torneo' },
  { valor: 'cumpleanos', etiqueta: 'Cumpleaños', titulo: 'Reserva tu cumpleaños', tipoEtiqueta: 'Cumpleaños' },
];

function inicializarJornadas(nEquipos, fechaPorDefecto, previas = {}) {
  const rondas = partidosPorRonda(nEquipos);
  const resultado = {};
  rondas.forEach((_, idx) => {
    const ronda = idx + 1;
    if (previas && previas[ronda]) {
      resultado[ronda] = {
        fecha: previas[ronda].fecha || fechaPorDefecto,
        horas: Array.isArray(previas[ronda].horas) ? [...previas[ronda].horas] : [],
      };
    } else {
      resultado[ronda] = {
        fecha: fechaPorDefecto,
        horas: [],
      };
    }
  });
  return resultado;
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

  const prevActivoRef = useRef(false);

  const reiniciar = useCallback(() => {
    setModo(modoInicial);
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
  }, [modoInicial, dias, canchaInicial]);

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
    (ronda, hora) => {
      const numRonda = Number(ronda);
      const fase = fases.find((f) => f.ronda === numRonda);
      if (!fase || fase.canchaIds.length === 0) {
        return false;
      }

      const jActual = jornadas[numRonda];
      const fechaFase = (jActual && jActual.fecha) || fecha;
      if (!fechaFase) return false;

      const libreEnCanchas = fase.canchaIds.every((cid) =>
        disponibilidad(cid, fechaFase).some((h) => h.hora === hora && h.disponible)
      );
      if (!libreEnCanchas) return false;

      const otraRondaSolapada = Object.keys(jornadas).some((rKey) => {
        const otraRonda = Number(rKey);
        if (otraRonda === numRonda) return false;
        const jOtra = jornadas[otraRonda];
        if (!jOtra || jOtra.fecha !== fechaFase || !Array.isArray(jOtra.horas)) {
          return false;
        }
        if (!jOtra.horas.includes(hora)) {
          return false;
        }
        const faseOtra = fases.find((f) => f.ronda === otraRonda);
        if (!faseOtra) return false;
        return fase.canchaIds.some((cid) => faseOtra.canchaIds.includes(cid));
      });

      return !otraRondaSolapada;
    },
    [fases, jornadas, fecha, disponibilidad]
  );

  const contarLibresFase = useCallback(
    (ronda) => {
      const numRonda = Number(ronda);
      const fase = fases.find((f) => f.ronda === numRonda);
      if (!fase || fase.canchaIds.length === 0) {
        return () => 0;
      }
      return (iso) =>
        horasBase.filter((hora) =>
          fase.canchaIds.every((cid) =>
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
      if (OPCIONES_EQUIPOS.includes(n)) {
        setOrdenEquipos(
          emparejamiento === 'aleatorio'
            ? sortearEquipos(n)
            : Array.from({ length: n }, (_, i) => i + 1)
        );
        setJornadas((prev) => inicializarJornadas(n, fecha, prev));
      }
    },
    [emparejamiento, fecha]
  );

  const setEquipos = cambiarEquiposTorneo;

  const setDuracionPartido = useCallback((min) => {
    setDuracionPartidoState(Number(min));
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
    setOrdenEquipos((prev) => {
      const copia = [...prev];
      copia[indice] = valor ? Number(valor) : null;
      return copia;
    });
  }, []);

  const cambiarFechaFase = useCallback((ronda, iso) => {
    const numRonda = Number(ronda);
    setJornadas((prev) => {
      const jActual = prev[numRonda] || { fecha: iso, horas: [] };
      return {
        ...prev,
        [numRonda]: {
          ...jActual,
          fecha: iso,
          horas: [],
        },
      };
    });
    setError(null);
  }, []);

  const elegirHoraFase = useCallback(
    (ronda, hora) => {
      const numRonda = Number(ronda);
      setJornadas((prev) => {
        const jActual = prev[numRonda] || { fecha, horas: [] };
        const horasActuales = Array.isArray(jActual.horas) ? jActual.horas : [];
        const res = seleccionarRango(
          horasActuales,
          hora,
          horasBase,
          (h) => esLibreFase(numRonda, h)
        );
        if (res.error) {
          setError(res.error);
        } else {
          setError(null);
        }
        return {
          ...prev,
          [numRonda]: {
            ...jActual,
            horas: res.sel,
          },
        };
      });
    },
    [fecha, horasBase, esLibreFase]
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
    const errorCanchas = validarCanchasTorneo(canchasElegidas);
    const errorCruces =
      emparejamiento === 'manual'
        ? validarCrucesManuales(ordenEquipos, Number(equipos))
        : '';

    const tieneJornadasConfiguradas = Object.values(jornadas).some(
      (j) => Array.isArray(j?.horas) && j.horas.length > 0
    );

    // Fallback: si no hay jornadas por fase configuradas pero hay horasSel globales
    const usarFallbackUnico = !tieneJornadasConfiguradas && horasSel.length > 0;

    let jornadasEfectivas;
    let validacionesJornadas;
    let sugerenciasPorFase;
    let bloques;
    let partidos;
    let validacionFranja;
    let sugerencias;

    if (usarFallbackUnico) {
      jornadasEfectivas = { 1: { fecha, horas: [...horasSel] } };
      sugerenciasPorFase = {};
      validacionFranja = validarFranja(minRequeridos, horasSel.length);
      sugerencias = sugerenciasTiempo({
        equipos: Number(equipos),
        canchas: numCanchas,
        duracionPartido: Number(duracionPartido),
        deporte: deporteTorneo,
        horasReservadas: horasSel.length,
      });
      validacionesJornadas = [
        {
          ronda: 1,
          nombreRonda: fases[0]?.nombreRonda || 'Torneo',
          completa: true,
          alcanza: validacionFranja.alcanza,
          ordenValido: true,
          disponibles: validacionFranja.disponibles,
          deficit: validacionFranja.deficit,
          error: validacionFranja.alcanza
            ? null
            : `La franja elegida no alcanza para el torneo (faltan ${validacionFranja.deficit} min).`,
        },
      ];
      bloques = [{ fecha, horas: [...horasSel], canchaIds: [...canchaIds] }];
      partidos = programarTorneo({
        orden: ordenEquipos,
        canchaIds,
        horaInicio: horasSel[0] || null,
        minutosTurno,
      });
    } else {
      jornadasEfectivas = jornadas;
      validacionesJornadas = validarJornadas(fases, jornadasEfectivas);
      sugerenciasPorFase = {};
      fases.forEach((fase) => {
        const j = jornadasEfectivas[fase.ronda];
        const nH = Array.isArray(j?.horas) ? j.horas.length : 0;
        sugerenciasPorFase[fase.ronda] = sugerenciasTiempoFase({
          fase,
          canchasTotales: canchaIds.length,
          duracionPartido: Number(duracionPartido),
          deporte: deporteTorneo,
          horasReservadas: nH,
        });
      });
      bloques = fases
        .map((fase) => {
          const j = jornadasEfectivas[fase.ronda];
          if (!j || !j.fecha || !Array.isArray(j.horas) || j.horas.length === 0) {
            return null;
          }
          return {
            ronda: fase.ronda,
            nombreRonda: fase.nombreRonda,
            fecha: j.fecha,
            horas: [...j.horas],
            canchaIds: [...fase.canchaIds],
          };
        })
        .filter(Boolean);
      partidos = programarTorneo({
        orden: ordenEquipos,
        canchaIds,
        horaInicio: null,
        minutosTurno,
        jornadas: jornadasEfectivas,
      });
      const horasTotales = Object.values(jornadasEfectivas).reduce(
        (acc, j) => acc + (Array.isArray(j?.horas) ? j.horas.length : 0),
        0
      );
      validacionFranja = validarFranja(minRequeridos, horasTotales);
      sugerencias = sugerenciasTiempo({
        equipos: Number(equipos),
        canchas: numCanchas,
        duracionPartido: Number(duracionPartido),
        deporte: deporteTorneo,
        horasReservadas: horasTotales,
      });
    }

    return {
      deporte: deporteTorneo,
      desempate,
      equipos: Number(equipos),
      duracionPartido: Number(duracionPartido),
      transicion: TRANSICION_MIN,
      minutosTurno,
      turnosTotales,
      minutosRequeridos: minRequeridos,
      validacionFranja,
      sugerencias,
      errorCanchas,
      errorCruces,
      emparejamiento,
      ordenEquipos,
      partidos,
      fases,
      jornadas: jornadasEfectivas,
      validacionesJornadas,
      sugerenciasPorFase,
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
    horasSel,
    fecha,
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
    if (modo === 'cumpleanos' && Number(invitados) < 1) {
      return 'Indica cuántos invitados vienen.';
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

  const cambiarModo = useCallback(
    (nuevo) => {
      if (nuevo === modo) return;
      if (nuevo === 'torneo') {
        if (modo === 'cancha') {
          setCanchaIds(canchaSel ? [canchaSel.id] : []);
        } else if (modo === 'cumpleanos') {
          setCanchaIds((prevIds) => {
            if (prevIds.length === 0) return [];
            const canchasActuales = prevIds
              .map((id) => canchas.find((c) => c.id === id))
              .filter(Boolean);
            if (canchasActuales.length === 0) return [];
            const primerDeporte = canchasActuales[0].deporte;
            const filtradas = canchasActuales
              .filter((c) => c.deporte === primerDeporte)
              .slice(0, MAX_CANCHAS_TORNEO);
            return filtradas.map((c) => c.id);
          });
        }
      } else if (modo === 'cancha' && nuevo !== 'cancha') {
        setCanchaIds(canchaSel ? [canchaSel.id] : []);
      } else if (modo !== 'cancha' && nuevo === 'cancha') {
        setCanchaId(canchaIds[0] || (canchaSel ? canchaSel.id : null));
      }
      setModo(nuevo);
      setHorasSel([]);
      setError(null);
    },
    [modo, canchaSel, canchaIds, canchas]
  );

  const elegirCancha = useCallback((id) => {
    setCanchaId(id);
    setHorasSel([]);
    setError(null);
  }, []);

  const alternarCancha = useCallback((id) => {
    setCanchaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  }, []);

  const alternarDeporte = useCallback(
    (slug) => {
      const ids = canchasDelDeporte(canchas, slug).map((c) => c.id);
      setCanchaIds((prev) =>
        ids.every((id) => prev.includes(id))
          ? prev.filter((id) => !ids.includes(id))
          : [...prev, ...ids.filter((id) => !prev.includes(id))]
      );
      setError(null);
    },
    [canchas]
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

  const cambiarFecha = useCallback((iso) => {
    setFecha(iso);
    setHorasSel([]);
    setJornadas((prev) => {
      const actualizadas = { ...prev };
      Object.keys(actualizadas).forEach((rondaKey) => {
        const j = actualizadas[rondaKey];
        if (!j || !j.horas || j.horas.length === 0 || Number(rondaKey) === 1) {
          actualizadas[rondaKey] = {
            ...j,
            fecha: iso,
          };
        }
      });
      return actualizadas;
    });
    setError(null);
  }, []);

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

  const confirmar = useCallback(() => {
    if (!puedeConfirmar) return;

    let res;
    const tieneJornadasConfiguradas = Object.values(jornadas).some(
      (j) => Array.isArray(j?.horas) && j.horas.length > 0
    );

    const datosTorneo =
      modo === 'torneo'
        ? armarTorneo({
            deporte: torneoPlan.deporte,
            equipos: Number(equipos),
            duracionPartido: Number(duracionPartido),
            emparejamiento,
            orden: ordenEquipos,
            canchaIds,
            horaInicio: horasSel[0] || null,
            jornadas: tieneJornadasConfiguradas ? torneoPlan.jornadas : null,
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
        horas: primerBloque.horas || horasSel,
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
      setError(res.error);
      if (modo !== 'torneo') {
        setHorasSel([]);
      }
      return;
    }

    const primerBloque = (torneoPlan?.bloques && torneoPlan.bloques[0]) || null;
    const ultimoBloque =
      (torneoPlan?.bloques && torneoPlan.bloques[torneoPlan.bloques.length - 1]) ||
      null;

    const horario =
      modo === 'torneo' && torneoPlan.bloques?.length > 1
        ? `${torneoPlan.bloques.length} jornadas`
        : primerBloque && primerBloque.horas && primerBloque.horas.length > 0
        ? `${primerBloque.horas[0]} a ${finDeFranja(primerBloque.horas[primerBloque.horas.length - 1])}`
        : `${horasSel[0]} a ${finDeFranja(horasSel[horasSel.length - 1])}`;

    const fechaTexto =
      modo === 'torneo' && torneoPlan.bloques?.length > 1
        ? `${fechaCompleta(primerBloque.fecha)} a ${fechaCompleta(ultimoBloque.fecha)}`
        : fechaCompleta((primerBloque && primerBloque.fecha) || fecha);

    const nombresCanchas = canchasElegidas.map((c) => c.nombre);
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
      }),
      resumen: {
        tipoEtiqueta,
        fechaTexto,
        horario,
        canchas: nombresCanchas,
        total: precio.total,
        packsAgua: precio.packsAgua,
        torneo: datosTorneo,
      },
    });
  }, [
    puedeConfirmar,
    jornadas,
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
  ]);

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
    setEquipos,
    invitados,
    setInvitados,
    nombre,
    telefono,
    tocado,
    errNombre,
    errTelefono,
    verErrNombre,
    verErrTelefono,
    error,
    confirmado,
    precio,
    motivoBloqueo,
    puedeConfirmar,
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
  };
}

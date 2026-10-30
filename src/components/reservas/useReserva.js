import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReservas } from '../../context/ReservasContext';
import { fechaCompleta } from '../../lib/fechas';
import { alternarHoraIndividual, seleccionarRango } from '../../lib/horarios';
import { calcularPrecioEvento, finDeFranja } from '../../lib/precios';
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
  minutosPorTurno,
  minutosRequeridos,
  programarTorneo,
  sortearEquipos,
  sugerenciasTiempo,
  turnosPorRonda,
  validarCanchasTorneo,
  validarCrucesManuales,
  validarFranja,
} from '../../lib/torneo';

export const MODOS = [
  { valor: 'cancha', etiqueta: 'Cancha', titulo: 'Reserva tu cancha', tipoEtiqueta: 'Reserva de cancha' },
  { valor: 'torneo', etiqueta: 'Torneo', titulo: 'Reserva tu torneo', tipoEtiqueta: 'Torneo' },
  { valor: 'cumpleanos', etiqueta: 'Cumpleaños', titulo: 'Reserva tu cumpleaños', tipoEtiqueta: 'Cumpleaños' },
];

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

  const precio = useMemo(
    () => calcularPrecioEvento(canchasElegidas, horasSel.length),
    [canchasElegidas, horasSel.length]
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
      }
    },
    [emparejamiento]
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
    const validacionFranja = validarFranja(minRequeridos, horasSel.length);
    const sugerencias =
      horasSel.length > 0
        ? sugerenciasTiempo({
            equipos: Number(equipos),
            canchas: numCanchas,
            duracionPartido: Number(duracionPartido),
            deporte: deporteTorneo,
            horasReservadas: horasSel.length,
          })
        : [];
    const errorCanchas = validarCanchasTorneo(canchasElegidas);
    const errorCruces =
      emparejamiento === 'manual'
        ? validarCrucesManuales(ordenEquipos, Number(equipos))
        : '';
    const partidos = programarTorneo({
      orden: ordenEquipos,
      canchaIds,
      horaInicio: horasSel[0] || null,
      minutosTurno,
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
      validacionFranja,
      sugerencias,
      errorCanchas,
      errorCruces,
      emparejamiento,
      ordenEquipos,
      partidos,
    };
  }, [
    canchasElegidas,
    canchaSel,
    duracionPartido,
    canchaIds,
    equipos,
    horasSel,
    emparejamiento,
    ordenEquipos,
  ]);

  const motivoBloqueo = useMemo(() => {
    if (modo === 'torneo') {
      if (torneoPlan.errorCanchas) {
        return torneoPlan.errorCanchas;
      }
      if (horasSel.length === 0) {
        return 'Elige el horario.';
      }
      if (!OPCIONES_EQUIPOS.includes(Number(equipos))) {
        return 'Elige 4, 8 o 16 equipos.';
      }
      if (torneoPlan.errorCruces) {
        return torneoPlan.errorCruces;
      }
      if (!torneoPlan.validacionFranja.alcanza) {
        return `La franja elegida no alcanza para el torneo (faltan ${torneoPlan.validacionFranja.deficit} min).`;
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
    horasSel.length,
    equipos,
    errNombre,
    errTelefono,
    esEvento,
    canchaIds.length,
    canchaSel,
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
    } else {
      res = reservarEvento({
        subtipo: modo,
        fecha,
        canchaIds,
        horas: horasSel,
        equipos: modo === 'torneo' ? Number(equipos) : null,
        canchasNecesarias: modo === 'torneo' ? canchaIds.length : null,
        invitados: modo === 'cumpleanos' ? Number(invitados) : null,
        torneo: datosTorneo,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });
    }

    if (!res.ok) {
      setError(res.error);
      setHorasSel([]);
      return;
    }

    const horario = `${horasSel[0]} a ${finDeFranja(horasSel[horasSel.length - 1])}`;
    const fechaTexto = fechaCompleta(fecha);
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
    modo,
    torneoPlan.deporte,
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
  };
}

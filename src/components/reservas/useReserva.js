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
  const [equipos, setEquipos] = useState('');
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
    setEquipos('');
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

  const motivoBloqueo = useMemo(() => {
    if (esEvento ? canchaIds.length === 0 : !canchaSel) {
      return esEvento ? 'Elige al menos una cancha.' : 'Elige una cancha.';
    }
    if (horasSel.length === 0) {
      return 'Elige el horario.';
    }
    if (modo === 'torneo' && Number(equipos) < 2) {
      return 'Indica cuántos equipos participan (mínimo 2).';
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
  }, [esEvento, canchaIds.length, canchaSel, horasSel.length, modo, equipos, invitados, errNombre, errTelefono]);

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

  const cambiarModo = useCallback((nuevo) => {
    if (nuevo === modo) return;
    if (modo === 'cancha' && nuevo !== 'cancha') {
      setCanchaIds(canchaSel ? [canchaSel.id] : []);
    } else if (modo !== 'cancha' && nuevo === 'cancha') {
      setCanchaId(canchaIds[0] || (canchaSel ? canchaSel.id : null));
    }
    setModo(nuevo);
    setHorasSel([]);
    setError(null);
  }, [modo, canchaSel, canchaIds]);

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

  const alternarDeporte = useCallback((slug) => {
    const ids = canchasDelDeporte(canchas, slug).map((c) => c.id);
    setCanchaIds((prev) =>
      ids.every((id) => prev.includes(id))
        ? prev.filter((id) => !ids.includes(id))
        : [...prev, ...ids.filter((id) => !prev.includes(id))]
    );
    setError(null);
  }, [canchas]);

  const elegirHora = useCallback((hora) => {
    const r = esEvento
      ? seleccionarRango(horasSel, hora, horasBase, esLibre)
      : alternarHoraIndividual(horasSel, hora, horasBase);
    setHorasSel(r.sel);
    setError(r.error);
  }, [esEvento, horasSel, horasBase, esLibre]);

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
      }),
      resumen: {
        tipoEtiqueta,
        fechaTexto,
        horario,
        canchas: nombresCanchas,
        total: precio.total,
        packsAgua: precio.packsAgua,
      },
    });
  }, [
    puedeConfirmar,
    modo,
    reservar,
    canchaSel,
    fecha,
    horasSel,
    nombre,
    telefono,
    reservarEvento,
    canchaIds,
    equipos,
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
  };
}

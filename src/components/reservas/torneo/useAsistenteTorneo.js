import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PASOS_TORNEO,
  estadoPasosTorneo,
  pasosAlcanzables,
} from '../../../lib/pasosTorneo';

const MEDIA_QUERY_MOVIL = '(max-width: 63.9375em)';
const MEDIA_QUERY_REDUCIDO = '(prefers-reduced-motion: reduce)';

/**
 * Hook para gestionar el asistente por pasos del modo torneo en móvil.
 *
 * @param {Object} [opciones]
 * @param {Object} opciones.reserva - Objeto de estado y acciones devuelto por useReserva.
 * @param {string} [opciones.pasoInicial='canchas'] - ID del paso inicial.
 * @returns {Object} Estado y acciones de navegación del asistente.
 */
export function useAsistenteTorneo(opciones = {}) {
  const reserva = opciones && typeof opciones === 'object' && 'reserva' in opciones
    ? opciones.reserva
    : opciones;
  const pasoInicial = opciones?.pasoInicial || 'canchas';

  // 1. Detección de pantalla móvil (< 64em / <= 63.9375em)
  const [esMovil, setEsMovil] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return Boolean(window.matchMedia(MEDIA_QUERY_MOVIL).matches);
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia(MEDIA_QUERY_MOVIL);
    const handler = (e) => setEsMovil(Boolean(e.matches));

    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else if (mql.addListener) {
      mql.addListener(handler);
    }

    setEsMovil(Boolean(mql.matches));

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else if (mql.removeListener) {
        mql.removeListener(handler);
      }
    };
  }, []);

  // 2. Paso actual y estado de completitud
  const [pasoActual, setPasoActual] = useState(pasoInicial);
  const encabezadoRef = useRef(null);
  const pasoPrevioRef = useRef(pasoActual);

  const estadosPasos = useMemo(
    () => estadoPasosTorneo(reserva),
    [reserva]
  );

  const alcanzables = useMemo(
    () => pasosAlcanzables(estadosPasos),
    [estadosPasos]
  );

  const pasoIndex = useMemo(() => {
    const idx = PASOS_TORNEO.findIndex((p) => p.id === pasoActual);
    return idx >= 0 ? idx : 0;
  }, [pasoActual]);

  const pasoActualInfo = useMemo(() => {
    return estadosPasos.find((p) => p.id === pasoActual) || estadosPasos[0];
  }, [estadosPasos, pasoActual]);

  // El asistente solo actúa sobre la página en móvil y en modo torneo (S2).
  const activo = esMovil && reserva?.modo === 'torneo';

  // "Siguiente" exige el paso actual completo y el de destino alcanzable (S5).
  const siguienteId = PASOS_TORNEO[pasoIndex + 1]?.id;
  const puedeAvanzar = Boolean(
    pasoActualInfo?.completo && siguienteId && alcanzables.includes(siguienteId)
  );

  let motivoAvance = '';
  if (!pasoActualInfo?.completo) {
    motivoAvance = pasoActualInfo?.motivo || '';
  } else if (siguienteId && !puedeAvanzar) {
    const pendiente = estadosPasos.find((p) => !p.completo);
    if (pendiente) {
      motivoAvance = `Primero completa ${pendiente.etiqueta}: ${pendiente.motivo}`;
    }
  }

  const puedeRetroceder = pasoIndex > 0;

  // 3. Funciones de navegación
  const siguiente = useCallback(() => {
    if (!puedeAvanzar) return false;
    setPasoActual(siguienteId);
    return true;
  }, [puedeAvanzar, siguienteId]);

  const anterior = useCallback(() => {
    if (pasoIndex <= 0) return false;
    const anteriorId = PASOS_TORNEO[pasoIndex - 1].id;
    setPasoActual(anteriorId);
    return true;
  }, [pasoIndex]);

  const irA = useCallback(
    (id) => {
      if (!alcanzables.includes(id)) return false;
      setPasoActual(id);
      return true;
    },
    [alcanzables]
  );

  // Si un cambio de la reserva (p. ej. "Limpiar selección") deja el paso
  // actual fuera de alcance, vuelve al primer paso incompleto.
  // En escritorio el paso se conserva tal cual (S6) y se corrige al volver
  // a móvil.
  useEffect(() => {
    if (!activo || alcanzables.includes(pasoActual)) return;
    const primerIncompleto = estadosPasos.find((p) => !p.completo);
    setPasoActual(primerIncompleto ? primerIncompleto.id : PASOS_TORNEO[0].id);
  }, [activo, alcanzables, estadosPasos, pasoActual]);

  // 4. Efecto de scroll y foco al cambiar de paso (solo con el asistente activo)
  useEffect(() => {
    if (pasoPrevioRef.current === pasoActual) return;
    pasoPrevioRef.current = pasoActual;
    if (!activo) return;

    // Scroll al inicio respetando prefers-reduced-motion
    if (typeof window !== 'undefined' && window.scrollTo) {
      const reducido = Boolean(
        window.matchMedia && window.matchMedia(MEDIA_QUERY_REDUCIDO).matches
      );
      window.scrollTo({
        top: 0,
        behavior: reducido ? 'auto' : 'smooth',
      });
    }

    // Foco en el encabezado del paso
    if (encabezadoRef.current && typeof encabezadoRef.current.focus === 'function') {
      encabezadoRef.current.focus();
    }
  }, [activo, pasoActual]);

  return {
    esMovil,
    pasoActual,
    pasoIndex,
    numeroPaso: pasoIndex + 1,
    totalPasos: PASOS_TORNEO.length,
    pasoActualInfo,
    motivoAvance,
    estadosPasos,
    alcanzables,
    puedeAvanzar,
    puedeRetroceder,
    siguiente,
    anterior,
    irA,
    encabezadoRef,
  };
}

export default useAsistenteTorneo;

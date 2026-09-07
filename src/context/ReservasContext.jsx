import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import canchasSemilla from '../data/canchas.json';

/**
 * ReservasContext (Bloque 4) — estado global de disponibilidad y reservas.
 *
 * - Fuente de verdad en runtime: este Context + localStorage.
 * - `src/data/canchas.json` es SOLO la semilla inicial (cuando no hay nada
 *   guardado todavía).
 * - Sin backend: todo vive en memoria y se espeja a localStorage.
 *
 * Consumir con el hook `useReservas()`.
 */

const STORAGE_KEY = 'sportify_reservas_v1';

const ReservasContext = createContext(null);

// Copia profunda de la semilla para no mutar nunca el JSON importado.
function clonarCanchas(fuente) {
  return fuente.map((c) => ({
    ...c,
    horarios: c.horarios.map((h) => ({ ...h })),
  }));
}

// Estado inicial: localStorage si existe y es válido; si no, la semilla.
function crearEstadoInicial() {
  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      const data = JSON.parse(guardado);
      if (
        data &&
        Array.isArray(data.canchas) &&
        Array.isArray(data.reservas)
      ) {
        return { canchas: data.canchas, reservas: data.reservas, error: null };
      }
    }
  } catch (e) {
    // localStorage no disponible o dato corrupto -> se usa la semilla.
  }
  return { canchas: clonarCanchas(canchasSemilla), reservas: [], error: null };
}

// ¿Está libre ese horario de esa cancha en el estado dado?
function horarioDisponible(canchas, canchaId, hora) {
  const cancha = canchas.find((c) => c.id === canchaId);
  const horario = cancha && cancha.horarios.find((h) => h.hora === hora);
  return Boolean(horario && horario.disponible);
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESERVAR': {
      const { canchaId, fecha, hora, nombre, telefono } = action.payload;

      // Validación de choque también a nivel reducer (última línea de defensa).
      if (!horarioDisponible(state.canchas, canchaId, hora)) {
        return {
          ...state,
          error: 'Ese horario ya no está disponible. Elegí otro.',
        };
      }

      const canchas = state.canchas.map((c) =>
        c.id !== canchaId
          ? c
          : {
              ...c,
              horarios: c.horarios.map((h) =>
                h.hora === hora ? { ...h, disponible: false } : h
              ),
            }
      );

      const cancha = state.canchas.find((c) => c.id === canchaId);
      const reserva = {
        id: `${canchaId}__${fecha}__${hora}__${Date.now()}`,
        canchaId,
        canchaNombre: cancha ? cancha.nombre : canchaId,
        deporte: cancha ? cancha.deporte : null,
        fecha,
        hora,
        nombre: nombre || null,
        telefono: telefono || null,
        creadaEn: new Date().toISOString(),
      };

      return { canchas, reservas: [...state.reservas, reserva], error: null };
    }

    case 'LIMPIAR_ERROR':
      return state.error ? { ...state, error: null } : state;

    default:
      return state;
  }
}

export function ReservasProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, crearEstadoInicial);

  // Espejo a localStorage en cada cambio de disponibilidad o reservas.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ canchas: state.canchas, reservas: state.reservas })
      );
    } catch (e) {
      // Sin persistencia (modo privado, cuota llena...): la app sigue en memoria.
    }
  }, [state.canchas, state.reservas]);

  // Reservar: valida disponibilidad actual y, si está libre, despacha.
  // Devuelve { ok, error? } para feedback inmediato en el modal.
  const reservar = useCallback(
    (datos) => {
      if (!horarioDisponible(state.canchas, datos.canchaId, datos.hora)) {
        return { ok: false, error: 'Ese horario ya no está disponible. Elegí otro.' };
      }
      dispatch({ type: 'RESERVAR', payload: datos });
      return { ok: true };
    },
    [state.canchas]
  );

  const limpiarError = useCallback(() => dispatch({ type: 'LIMPIAR_ERROR' }), []);

  const value = useMemo(
    () => ({
      canchas: state.canchas,
      reservas: state.reservas,
      error: state.error,
      reservar,
      limpiarError,
    }),
    [state.canchas, state.reservas, state.error, reservar, limpiarError]
  );

  return (
    <ReservasContext.Provider value={value}>
      {children}
    </ReservasContext.Provider>
  );
}

export function useReservas() {
  const ctx = useContext(ReservasContext);
  if (!ctx) {
    throw new Error('useReservas debe usarse dentro de <ReservasProvider>');
  }
  return ctx;
}

export default ReservasContext;

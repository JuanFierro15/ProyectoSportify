import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import semilla from '../data/canchas.json';

/**
 * ReservasContext (Bloque 4) — estado global de disponibilidad y reservas.
 *
 * - Fuente de verdad en runtime: este Context + almacenamiento local del
 *   navegador. `src/data/canchas.json` es solo la semilla inicial.
 * - Modelo de disponibilidad por día, para los próximos 7 días (hoy + 6).
 *   El estado guarda, por cancha y por fecha, la lista de horas ya reservadas
 *   (`ocupados`); todo lo demás está disponible.
 * - Sin backend: todo vive en memoria y se espeja al almacenamiento local.
 *
 * Consumir con el hook `useReservas()`.
 */

const STORAGE_KEY = 'sportify_reservas_v2';
const DIAS_VENTANA = 7;

const ReservasContext = createContext(null);

// Fecha (YYYY-MM-DD, hora local) a `offset` días de hoy.
function isoDia(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function ventanaDias() {
  return Array.from({ length: DIAS_VENTANA }, (_, i) => isoDia(i));
}

// Metadatos de las canchas (sin disponibilidad).
function canchasMeta() {
  return semilla.canchas.map((c) => ({
    id: c.id,
    deporte: c.deporte,
    nombre: c.nombre,
    precioHora: c.precioHora,
    horas: [...semilla.horas],
  }));
}

// `ocupados` a partir de la semilla, mapeando el offset de día a fecha real.
function ocupadosSemilla(dias) {
  const ocupados = {};
  semilla.canchas.forEach((c) => {
    ocupados[c.id] = {};
    dias.forEach((fecha, i) => {
      const lista = (c.ocupadosSemilla && c.ocupadosSemilla[i]) || [];
      ocupados[c.id][fecha] = [...lista];
    });
  });
  return ocupados;
}

// Estado inicial: si hay datos guardados válidos se reconcilian con la ventana
// de 7 días actual (se descartan fechas pasadas, las nuevas toman la semilla);
// si no, se usa la semilla completa.
function crearEstadoInicial() {
  const dias = ventanaDias();
  const canchas = canchasMeta();
  const semillaOcup = ocupadosSemilla(dias);

  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      const data = JSON.parse(guardado);
      if (data && data.ocupados && Array.isArray(data.reservas)) {
        const ocupados = {};
        canchas.forEach((c) => {
          ocupados[c.id] = {};
          dias.forEach((fecha) => {
            const guardadoDia =
              data.ocupados[c.id] && data.ocupados[c.id][fecha];
            ocupados[c.id][fecha] = Array.isArray(guardadoDia)
              ? [...guardadoDia]
              : [...semillaOcup[c.id][fecha]];
          });
        });
        return { dias, canchas, ocupados, reservas: data.reservas, error: null };
      }
    }
  } catch (e) {
    // Sin almacenamiento local o dato corrupto -> semilla completa.
  }

  return { dias, canchas, ocupados: semillaOcup, reservas: [], error: null };
}

// Horas de una cancha en una fecha, con su disponibilidad.
function calcularDisponibilidad(state, canchaId, fecha) {
  const cancha = state.canchas.find((c) => c.id === canchaId);
  if (!cancha) return [];
  const ocup =
    (state.ocupados[canchaId] && state.ocupados[canchaId][fecha]) || [];
  return cancha.horas.map((hora) => ({
    hora,
    disponible: !ocup.includes(hora),
  }));
}

function horaLibre(state, canchaId, fecha, hora) {
  const cancha = state.canchas.find((c) => c.id === canchaId);
  if (!cancha || !cancha.horas.includes(hora)) return false;
  if (!state.dias.includes(fecha)) return false;
  const ocup =
    (state.ocupados[canchaId] && state.ocupados[canchaId][fecha]) || [];
  return !ocup.includes(hora);
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESERVAR': {
      const { canchaId, fecha, hora, nombre, telefono } = action.payload;

      // Validación de choque también a nivel reducer (última línea de defensa).
      if (!horaLibre(state, canchaId, fecha, hora)) {
        return {
          ...state,
          error: 'Ese horario ya está reservado. Elegí otro.',
        };
      }

      const previas =
        (state.ocupados[canchaId] && state.ocupados[canchaId][fecha]) || [];
      const ocupados = {
        ...state.ocupados,
        [canchaId]: {
          ...state.ocupados[canchaId],
          [fecha]: [...previas, hora],
        },
      };

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

      return {
        ...state,
        ocupados,
        reservas: [...state.reservas, reserva],
        error: null,
      };
    }

    case 'LIMPIAR_ERROR':
      return state.error ? { ...state, error: null } : state;

    default:
      return state;
  }
}

export function ReservasProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, crearEstadoInicial);

  // Espejo al almacenamiento local en cada cambio.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ocupados: state.ocupados, reservas: state.reservas })
      );
    } catch (e) {
      // Sin persistencia (modo privado, cuota llena...): sigue en memoria.
    }
  }, [state.ocupados, state.reservas]);

  const disponibilidad = useCallback(
    (canchaId, fecha) => calcularDisponibilidad(state, canchaId, fecha),
    [state]
  );

  // Reserva: valida y, si sigue libre, despacha. Devuelve { ok, error? }.
  const reservar = useCallback(
    (datos) => {
      if (!horaLibre(state, datos.canchaId, datos.fecha, datos.hora)) {
        return { ok: false, error: 'Ese horario ya está reservado. Elegí otro.' };
      }
      dispatch({ type: 'RESERVAR', payload: datos });
      return { ok: true };
    },
    [state]
  );

  const limpiarError = useCallback(() => dispatch({ type: 'LIMPIAR_ERROR' }), []);

  const value = useMemo(
    () => ({
      dias: state.dias,
      canchas: state.canchas,
      reservas: state.reservas,
      error: state.error,
      disponibilidad,
      reservar,
      limpiarError,
    }),
    [state.dias, state.canchas, state.reservas, state.error, disponibilidad, reservar, limpiarError]
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

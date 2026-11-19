import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import semilla from '../data/canchas.json';
import negocio from '../data/negocio.json';
import {
  calcularPrecio,
  calcularPrecioEvento,
  calcularPrecioJornadas,
  MAX_HORAS_SEGUIDAS,
} from '../lib/precios';
import { esHoraPasada } from '../lib/fechas';
import { generarCodigo } from '../lib/codigoReserva';
import { aplicarCancelacion, verificarCancelable } from '../lib/cancelacion';
import { validarJornadas } from '../lib/torneo';

/**
 * ReservasContext — estado global de disponibilidad y reservas.
 *
 * - Fuente de verdad en runtime: este Context + almacenamiento local del
 *   navegador. `src/data/canchas.json` es solo la semilla inicial.
 * - Modelo de disponibilidad por día, para los próximos 7 días (hoy + 6).
 *   El estado guarda, por cancha y por fecha, la lista de horas ya reservadas
 *   (`ocupados`); todo lo demás está disponible.
 * - `reservas` mezcla dos clases de registro, distinguidas por `tipo`:
 *     - "individual": una cancha, de 1 a 3 horas seguidas (Bloque 4).
 *     - "evento": torneo o cumpleaños; varias canchas y/o varias horas
 *       consecutivas, bloqueadas todo-o-nada (Bloque 5). Guarda también su
 *       `total` (cumpleaños con calcularPrecioEvento; torneo con calcularPrecioJornadas).
 *   Ambos tipos guardan un `codigo` corto (SPF-XXXXXX) que se muestra en el
 *   QR de confirmación. Ambos tipos se reservan desde la misma página: la
 *   vista de canchas (VistaCanchas).
 * - La acción CANCELAR quita una reserva individual y libera sus horas (no las
 *   de la semilla ni las de eventos), respetando cancelacion.horasMinimas de
 *   negocio.json; la usan el chat y Mis reservas.
 * - Sin backend: todo vive en memoria y se espeja al almacenamiento local.
 *
 * Consumir con el hook `useReservas()`.
 */

export const STORAGE_KEY = 'sportify_reservas_v2';
const DIAS_VENTANA = 7;

export const ERROR_EVENTO_NO_DISPONIBLE =
  'Alguna cancha u horario del evento ya no está disponible. No se reservó nada.';
export const ERROR_EVENTO_HORAS_NO_SEGUIDAS =
  'Las horas del evento deben ser seguidas. Elige un rango sin saltos.';
export const ERROR_EVENTO_FECHA_FASE =
  'Todas las canchas de una fase deben jugarse el mismo día. No se reservó nada.';

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

// Metadatos de las canchas (sin disponibilidad). `caracteristicas`,
// `descripcion` e `imagen` son opcionales en la semilla (canchas antiguas sin
// esos campos siguen funcionando, con lista vacía / texto vacío / sin imagen).
function canchasMeta() {
  return semilla.canchas.map((c) => ({
    id: c.id,
    deporte: c.deporte,
    nombre: c.nombre,
    precioHora: c.precioHora,
    horas: [...semilla.horas],
    caracteristicas: Array.isArray(c.caracteristicas) ? c.caracteristicas : [],
    descripcion: c.descripcion || '',
    imagen: c.imagen || null,
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

/**
 * fusionarConSemilla — combina lo guardado en localStorage con la semilla
 * vigente, separando claramente dos clases de dato:
 *
 * - Campos de **catálogo** (nombre, imagen, características, precioHora,
 *   deporte, horas): siempre vienen de la semilla actual, nunca de
 *   localStorage. Ya llegan resueltos en `canchas` (ver `canchasMeta()`) —
 *   por eso esta función no los toca; es la razón por la que actualizar
 *   `canchas.json` (una foto nueva, una característica) se refleja de
 *   inmediato sin importar qué haya guardado el navegador.
 * - Campos de **estado de uso** (horas ya ocupadas): sí se conservan de
 *   localStorage cuando existen. Al recorrer `canchas` (la lista vigente,
 *   no la guardada): una cancha nueva en la semilla que no estaba en
 *   localStorage se completa con `ocupadosSemilla`; una cancha que ya no
 *   existe en la semilla actual simplemente no se recorre, así que queda
 *   descartada.
 *
 * Función pura: mismas entradas -> misma salida, sin leer ni escribir
 * storage ni estado de React (eso lo hace `crearEstadoInicial`).
 */
export function fusionarConSemilla(canchas, dias, ocupadosGuardados, semillaOcup) {
  const ocupados = {};
  canchas.forEach((c) => {
    ocupados[c.id] = {};
    dias.forEach((fecha) => {
      const guardadoDia = ocupadosGuardados && ocupadosGuardados[c.id] && ocupadosGuardados[c.id][fecha];
      ocupados[c.id][fecha] = Array.isArray(guardadoDia)
        ? [...guardadoDia]
        : [...semillaOcup[c.id][fecha]];
    });
  });
  return ocupados;
}

function leerRawStorage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function parsearDatosGuardados(raw) {
  try {
    const guardado = raw !== undefined ? raw : leerRawStorage();
    if (guardado) {
      const data = JSON.parse(guardado);
      if (
        data &&
        data.ocupados &&
        typeof data.ocupados === 'object' &&
        Array.isArray(data.reservas)
      ) {
        // Registros viejos sin `tipo` -> se infieren.
        const reservas = data.reservas.map((r) => ({
          tipo: r.tipo || (Array.isArray(r.canchaIds) ? 'evento' : 'individual'),
          ...r,
        }));
        return { ocupadosCrudos: data.ocupados, reservas };
      }
    }
  } catch (e) {
    // Sin almacenamiento local o dato corrupto -> sin datos guardados.
  }
  return null;
}

// Lee y reconcilia lo guardado en localStorage (o un JSON crudo recibido por evento).
// Devuelve { ocupados, reservas } o null si no hay datos válidos o falla la lectura.
function leerGuardado(canchas, dias, semillaOcup, raw) {
  const datos = parsearDatosGuardados(raw);
  if (!datos) {
    return null;
  }
  return {
    ocupados: fusionarConSemilla(
      canchas,
      dias,
      datos.ocupadosCrudos,
      semillaOcup
    ),
    reservas: datos.reservas,
  };
}

function combinarOcupadosPorCancha(a, b) {
  if (!a && !b) return null;
  const resultado = {};
  const ids = new Set([
    ...(a ? Object.keys(a) : []),
    ...(b ? Object.keys(b) : []),
  ]);
  ids.forEach((cid) => {
    resultado[cid] = {
      ...(a && a[cid] ? a[cid] : {}),
      ...(b && b[cid] ? b[cid] : {}),
    };
  });
  return resultado;
}

// Conserva fechas futuras posteriores a la ventana actual de ocupados previos
// (p. ej. otra pestaña en un día más reciente ya reservó su nuevo día +6) y
// descarta las fechas pasadas.
function armarOcupadosParaGuardar(ocupadosActuales, diasActuales, ocupadosPrevios) {
  if (!ocupadosPrevios || typeof ocupadosPrevios !== 'object') {
    return ocupadosActuales;
  }
  const conjuntoDias = new Set(diasActuales);
  const ultimaFecha =
    Array.isArray(diasActuales) && diasActuales.length > 0
      ? diasActuales[diasActuales.length - 1]
      : '';
  const resultado = {};
  Object.keys(ocupadosActuales).forEach((canchaId) => {
    const previosCancha = ocupadosPrevios[canchaId];
    const extras = {};
    if (previosCancha && typeof previosCancha === 'object') {
      Object.keys(previosCancha).forEach((fecha) => {
        if (
          !conjuntoDias.has(fecha) &&
          (!ultimaFecha || fecha > ultimaFecha) &&
          Array.isArray(previosCancha[fecha])
        ) {
          extras[fecha] = [...previosCancha[fecha]];
        }
      });
    }
    resultado[canchaId] = {
      ...extras,
      ...ocupadosActuales[canchaId],
    };
  });
  return resultado;
}

// Estado inicial: si hay datos guardados válidos se reconcilian con la ventana
// de 7 días actual (se descartan fechas pasadas, las nuevas toman la semilla);
// si no, se usa la semilla completa.
export function crearEstadoInicial() {
  const dias = ventanaDias();
  const canchas = canchasMeta();
  const semillaOcup = ocupadosSemilla(dias);
  const guardado = leerGuardado(canchas, dias, semillaOcup);

  if (guardado) {
    return { dias, canchas, ...guardado, version: 0 };
  }

  return { dias, canchas, ocupados: semillaOcup, reservas: [], version: 0 };
}

// Horas de una cancha en una fecha, con su disponibilidad.
function calcularDisponibilidad(state, canchaId, fecha) {
  const cancha = state.canchas.find((c) => c.id === canchaId);
  if (!cancha) return [];
  const enVentana = state.dias.includes(fecha);
  const ocup =
    (state.ocupados[canchaId] && state.ocupados[canchaId][fecha]) || [];
  return cancha.horas.map((hora) => ({
    hora,
    disponible: enVentana && !ocup.includes(hora) && !esHoraPasada(fecha, hora),
  }));
}

function horaLibre(state, canchaId, fecha, hora) {
  const cancha = state.canchas.find((c) => c.id === canchaId);
  if (!cancha || !cancha.horas.includes(hora)) return false;
  if (!state.dias.includes(fecha)) return false;
  if (esHoraPasada(fecha, hora)) return false;
  const ocup =
    (state.ocupados[canchaId] && state.ocupados[canchaId][fecha]) || [];
  return !ocup.includes(hora);
}

function horasConsecutivas(horasBase, horas) {
  if (!Array.isArray(horasBase) || !Array.isArray(horas) || horas.length === 0) {
    return false;
  }
  const inicio = horasBase.indexOf(horas[0]);
  if (inicio < 0) return false;
  return horas.every((h, i) => horasBase[inicio + i] === h);
}

// ¿Las horas pedidas son consecutivas (franjas de 1 h una tras otra) y todas
// están libres? Sirve para la reserva individual de 1 a 3 horas seguidas y
// para eventos (sin tope de 3 h cuando se pasa max = Infinity).
function bloqueLibre(state, canchaId, fecha, horas, max = MAX_HORAS_SEGUIDAS) {
  const cancha = state.canchas.find((c) => c.id === canchaId);
  if (!cancha || !Array.isArray(horas) || horas.length === 0) return false;
  if (horas.length > max) return false;
  return (
    horasConsecutivas(cancha.horas, horas) &&
    horas.every((h) => horaLibre(state, canchaId, fecha, h))
  );
}

function validarReservaEvento(state, datos = {}) {
  const { bloques, canchaIds, fecha, horas } = datos;

  if (Array.isArray(bloques) && bloques.length > 0) {
    const bloquesValidos = bloques.every(
      (b) =>
        b &&
        b.fecha &&
        Array.isArray(b.canchaIds) &&
        b.canchaIds.length > 0 &&
        Array.isArray(b.horas) &&
        b.horas.length > 0
    );
    if (!bloquesValidos) {
      return {
        ok: false,
        error: ERROR_EVENTO_NO_DISPONIBLE,
      };
    }

    for (const b of bloques) {
      for (const cid of b.canchaIds) {
        const cancha = state.canchas.find((c) => c.id === cid);
        if (!cancha || b.horas.some((h) => !cancha.horas.includes(h))) {
          return { ok: false, error: ERROR_EVENTO_NO_DISPONIBLE };
        }
      }
    }

    const gruposPorRonda = new Map();
    for (let idx = 0; idx < bloques.length; idx += 1) {
      const b = bloques[idx];
      const ronda =
        b.ronda != null && b.ronda !== '' && Number.isFinite(Number(b.ronda))
          ? Number(b.ronda)
          : idx + 1;

      if (!gruposPorRonda.has(ronda)) {
        gruposPorRonda.set(ronda, {
          ronda,
          nombreRonda: b.nombreRonda || null,
          fecha: b.fecha,
          horasPorCancha: {},
        });
      }
      const grupo = gruposPorRonda.get(ronda);
      if (grupo.fecha !== b.fecha) {
        return {
          ok: false,
          error: ERROR_EVENTO_FECHA_FASE,
        };
      }
      if (!grupo.nombreRonda && b.nombreRonda) {
        grupo.nombreRonda = b.nombreRonda;
      }
      b.canchaIds.forEach((cid) => {
        if (!grupo.horasPorCancha[cid]) {
          grupo.horasPorCancha[cid] = [];
        }
        grupo.horasPorCancha[cid].push(...b.horas);
      });
    }

    const rondasOrdenadas = Array.from(gruposPorRonda.values()).sort(
      (a, b) => a.ronda - b.ronda
    );

    const fases = rondasOrdenadas.map((g) => ({
      ronda: g.ronda,
      nombreRonda: g.nombreRonda || `Fase ${g.ronda}`,
      partidos: 0,
      turnos: 1,
      minutosTurno: 60,
      minutosRequeridos: 0,
    }));

    const jornadas = {};
    rondasOrdenadas.forEach((g) => {
      jornadas[g.ronda] = {
        fecha: g.fecha,
        horasPorCancha: g.horasPorCancha,
      };
    });

    const falloOrden = validarJornadas(fases, jornadas).find(
      (v) => !v.ordenValido
    );
    if (falloOrden) {
      return {
        ok: false,
        error: falloOrden.error,
      };
    }

    const celdasVistas = new Set();
    for (const b of bloques) {
      for (const cid of b.canchaIds) {
        for (const h of b.horas) {
          const clave = `${cid}__${b.fecha}__${h}`;
          if (!horaLibre(state, cid, b.fecha, h) || celdasVistas.has(clave)) {
            return {
              ok: false,
              error: ERROR_EVENTO_NO_DISPONIBLE,
            };
          }
          celdasVistas.add(clave);
        }
      }
    }

    return { ok: true };
  }

  if (
    !Array.isArray(canchaIds) ||
    canchaIds.length === 0 ||
    !Array.isArray(horas) ||
    horas.length === 0
  ) {
    return { ok: false, error: 'Faltan datos del evento.' };
  }

  const canchasEvento = canchaIds.map((cid) =>
    state.canchas.find((c) => c.id === cid)
  );
  if (canchasEvento.some((c) => !c)) {
    return { ok: false, error: ERROR_EVENTO_NO_DISPONIBLE };
  }

  const sonSeguidas = canchasEvento.every((c) =>
    horasConsecutivas(c.horas, horas)
  );
  if (!sonSeguidas) {
    return {
      ok: false,
      error: ERROR_EVENTO_HORAS_NO_SEGUIDAS,
    };
  }

  const hayConflicto = canchaIds.some((cid) =>
    horas.some((h) => !horaLibre(state, cid, fecha, h))
  );
  if (hayConflicto) {
    return {
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    };
  }

  return { ok: true };
}

// Acepta `horas` (bloque de 1 a 3) o, por compatibilidad, `hora` suelta.
function horasDe(datos) {
  return Array.isArray(datos.horas) && datos.horas.length > 0
    ? datos.horas
    : [datos.hora];
}

export function reducer(state, action) {
  switch (action.type) {
    case 'RESERVAR': {
      const { canchaId, fecha, nombre, telefono } = action.payload;
      const horas = horasDe(action.payload);

      // Validación de choque también a nivel reducer (última línea de defensa).
      if (!bloqueLibre(state, canchaId, fecha, horas)) {
        return state;
      }

      const previas =
        (state.ocupados[canchaId] && state.ocupados[canchaId][fecha]) || [];
      const ocupados = {
        ...state.ocupados,
        [canchaId]: {
          ...state.ocupados[canchaId],
          [fecha]: [...previas, ...horas],
        },
      };

      const marcaTiempo = action.payload.ahora ?? Date.now();
      const cancha = state.canchas.find((c) => c.id === canchaId);
      const precio = calcularPrecio(cancha ? cancha.precioHora : 0, horas.length);
      const reserva = {
        id: `${canchaId}__${fecha}__${horas[0]}__${marcaTiempo}`,
        codigo: action.payload.codigo || null,
        tipo: 'individual',
        canchaId,
        canchaNombre: cancha ? cancha.nombre : canchaId,
        deporte: cancha ? cancha.deporte : null,
        fecha,
        hora: horas[0],
        horas: [...horas],
        precioHora: precio.precioHora,
        descuentoHora: precio.descuentoHora,
        total: precio.total,
        aguaGratis: precio.aguaGratis,
        nombre: nombre || null,
        telefono: telefono || null,
        creadaEn: new Date(marcaTiempo).toISOString(),
      };

      return {
        ...state,
        ocupados,
        reservas: [...state.reservas, reserva],
      };
    }

    case 'RESERVAR_EVENTO': {
      const {
        bloques,
        subtipo,
        fecha,
        canchaIds,
        horas,
        equipos,
        canchasNecesarias,
        invitados,
        nombre,
        telefono,
        torneo,
      } = action.payload;

      const validacion = validarReservaEvento(state, action.payload);
      if (!validacion.ok) {
        return state;
      }

      const marcaTiempo = action.payload.ahora ?? Date.now();

      if (Array.isArray(bloques) && bloques.length > 0) {
        const ocupados = { ...state.ocupados };
        bloques.forEach((b) => {
          b.canchaIds.forEach((cid) => {
            const previas = (ocupados[cid] && ocupados[cid][b.fecha]) || [];
            ocupados[cid] = {
              ...ocupados[cid],
              [b.fecha]: [...previas, ...b.horas],
            };
          });
        });

        const precio = calcularPrecioJornadas(bloques, state.canchas);

        const deBloques = bloques.flatMap((b) => b.canchaIds);
        const enBloques = new Set(deBloques);
        const todosCanchaIds = Array.from(
          new Set(
            Array.isArray(canchaIds) && canchaIds.length > 0
              ? [...canchaIds.filter((id) => enBloques.has(id)), ...deBloques]
              : deBloques
          )
        );

        const canchaNombres = Array.from(
          new Set(
            todosCanchaIds.map((cid) => {
              const c = state.canchas.find((x) => x.id === cid);
              return c ? c.nombre : cid;
            })
          )
        );

        const evento = {
          id: `evento__${bloques[0].fecha}__${marcaTiempo}`,
          codigo: action.payload.codigo || null,
          tipo: 'evento',
          subtipo, // 'torneo' | 'cumpleanos'
          fecha: bloques[0].fecha,
          canchaIds: [...todosCanchaIds],
          canchaNombres,
          horas: [...bloques[0].horas],
          bloques: bloques.map((b) => ({
            ...b,
            canchaIds: [...b.canchaIds],
            horas: [...b.horas],
          })),
          total: precio.total,
          ahorro: precio.ahorro,
          packsAgua: precio.packsAgua,
          equipos: equipos != null ? equipos : null,
          canchasNecesarias: canchasNecesarias != null ? canchasNecesarias : null,
          invitados: invitados != null ? invitados : null,
          torneo: torneo || null,
          nombre: nombre || null,
          telefono: telefono || null,
          creadaEn: new Date(marcaTiempo).toISOString(),
        };

        return {
          ...state,
          ocupados,
          reservas: [...state.reservas, evento],
        };
      }

      const ocupados = { ...state.ocupados };
      canchaIds.forEach((cid) => {
        const previas = (ocupados[cid] && ocupados[cid][fecha]) || [];
        ocupados[cid] = {
          ...ocupados[cid],
          [fecha]: [...previas, ...horas],
        };
      });

      const canchaNombres = canchaIds.map((cid) => {
        const c = state.canchas.find((x) => x.id === cid);
        return c ? c.nombre : cid;
      });

      const canchasEvento = canchaIds
        .map((cid) => state.canchas.find((x) => x.id === cid))
        .filter(Boolean);
      const precio = calcularPrecioEvento(canchasEvento, horas.length);

      const evento = {
        id: `evento__${fecha}__${marcaTiempo}`,
        codigo: action.payload.codigo || null,
        tipo: 'evento',
        subtipo, // 'torneo' | 'cumpleanos'
        fecha,
        canchaIds: [...canchaIds],
        canchaNombres,
        horas: [...horas],
        total: precio.total,
        ahorro: precio.ahorro,
        packsAgua: precio.packsAgua,
        equipos: equipos != null ? equipos : null,
        canchasNecesarias: canchasNecesarias != null ? canchasNecesarias : null,
        invitados: invitados != null ? invitados : null,
        torneo: torneo || null,
        nombre: nombre || null,
        telefono: telefono || null,
        creadaEn: new Date(marcaTiempo).toISOString(),
      };

      return {
        ...state,
        ocupados,
        reservas: [...state.reservas, evento],
      };
    }

    case 'CANCELAR': {
      const { reservaId, ahora } = action.payload;
      const res = aplicarCancelacion(
        state,
        reservaId,
        new Date(ahora),
        negocio.cancelacion.horasMinimas
      );
      if (res.error) {
        return state;
      }
      return res.state;
    }

    case 'RENOVAR_VENTANA': {
      const dias = ventanaDias();
      if (state.dias[0] === dias[0]) {
        return state;
      }
      const semillaOcup = ocupadosSemilla(dias);
      const datosStorage =
        action.payload && 'datosStorage' in action.payload
          ? action.payload.datosStorage
          : null;
      const conservarMemoriaEnVentanaPrevia = Boolean(
        action.payload && action.payload.conservarMemoriaEnVentanaPrevia
      );
      const ocupadosDeStorage =
        (datosStorage && datosStorage.ocupadosCrudos) || null;
      const ocupadosCombinados = {};
      if (conservarMemoriaEnVentanaPrevia) {
        const conjuntoDiasPrevios = new Set(state.dias);
        state.canchas.forEach((c) => {
          const enMemoria = (state.ocupados && state.ocupados[c.id]) || {};
          const enStorage =
            (ocupadosDeStorage && ocupadosDeStorage[c.id]) || {};
          const porCancha = { ...enStorage };
          Object.keys(enMemoria).forEach((fecha) => {
            if (conjuntoDiasPrevios.has(fecha)) {
              porCancha[fecha] = enMemoria[fecha];
            }
          });
          ocupadosCombinados[c.id] = porCancha;
        });
      } else {
        const mezclados = combinarOcupadosPorCancha(
          state.ocupados,
          ocupadosDeStorage
        );
        state.canchas.forEach((c) => {
          ocupadosCombinados[c.id] = (mezclados && mezclados[c.id]) || {};
        });
      }
      const ocupados = fusionarConSemilla(
        state.canchas,
        dias,
        ocupadosCombinados,
        semillaOcup
      );
      const reservas =
        !conservarMemoriaEnVentanaPrevia &&
        datosStorage &&
        Array.isArray(datosStorage.reservas)
          ? datosStorage.reservas
          : state.reservas;
      return {
        ...state,
        dias,
        ocupados,
        reservas,
      };
    }

    case 'SINCRONIZAR': {
      const { ocupados, reservas } = action.payload || {};
      if (!ocupados || !Array.isArray(reservas)) {
        return state;
      }
      return {
        ...state,
        ocupados,
        reservas,
      };
    }

    default:
      return state;
  }
}

export function reducerVersionado(state, action) {
  const siguiente = reducer(state, action);
  if (siguiente === state) {
    return state;
  }
  return {
    ...siguiente,
    version: (state.version || 0) + 1,
  };
}

export function ReservasProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducerVersionado,
    undefined,
    crearEstadoInicial
  );
  const syncDesdeStorageRef = useRef(null);
  const estadoRef = useRef(state);
  // El render puede traer un estado más viejo que el que adelantó `despachar`;
  // solo se actualiza la ref si el render alcanza o supera su versión.
  if ((state.version || 0) >= (estadoRef.current.version || 0)) {
    estadoRef.current = state;
  }

  const ultimoRawStorageRef = useRef(undefined);
  if (ultimoRawStorageRef.current === undefined) {
    ultimoRawStorageRef.current = leerRawStorage();
  }
  const ocupadosCrudosRef = useRef(undefined);
  if (ocupadosCrudosRef.current === undefined) {
    ocupadosCrudosRef.current =
      parsearDatosGuardados(ultimoRawStorageRef.current)?.ocupadosCrudos || null;
  }

  // Aplica el reducer en memoria de forma síncrona además de encolarlo en React,
  // para que llamadas seguidas en el mismo tick no se pisen entre sí.
  const despachar = useCallback((action) => {
    estadoRef.current = reducerVersionado(estadoRef.current, action);
    dispatch(action);
  }, []);

  // Espejo al almacenamiento local en cada cambio (salvo si el estado coincide
  // exactamente con el payload despachado por el evento storage).
  useEffect(() => {
    const syncPayload = syncDesdeStorageRef.current;
    syncDesdeStorageRef.current = null;
    if (
      syncPayload &&
      state.ocupados === syncPayload.ocupados &&
      state.reservas === syncPayload.reservas
    ) {
      return;
    }
    try {
      const desdeStorage = parsearDatosGuardados()?.ocupadosCrudos || null;
      const ocupadosPrevios = combinarOcupadosPorCancha(
        ocupadosCrudosRef.current,
        desdeStorage
      );
      const ocupadosParaGuardar = armarOcupadosParaGuardar(
        state.ocupados,
        state.dias,
        ocupadosPrevios
      );
      const serializado = JSON.stringify({
        ocupados: ocupadosParaGuardar,
        reservas: state.reservas,
      });
      window.localStorage.setItem(STORAGE_KEY, serializado);
      ultimoRawStorageRef.current = serializado;
      ocupadosCrudosRef.current = ocupadosParaGuardar;
    } catch (e) {
      // Sin persistencia (modo privado, cuota llena...): sigue en memoria.
    }
  }, [state.ocupados, state.reservas, state.dias]);

  useEffect(() => {
    const renovarSiCambioElDia = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (estadoRef.current.dias[0] === ventanaDias()[0]) {
        return;
      }
      const rawActual = leerRawStorage();
      const cambioExterno =
        rawActual !== null && rawActual !== ultimoRawStorageRef.current;
      if (cambioExterno) {
        ultimoRawStorageRef.current = rawActual;
      }
      const desdeStorage = parsearDatosGuardados(
        rawActual !== null ? rawActual : undefined
      );
      if (desdeStorage) {
        ocupadosCrudosRef.current = desdeStorage.ocupadosCrudos;
      }
      const datosStorage =
        desdeStorage ||
        (ocupadosCrudosRef.current
          ? {
              ocupadosCrudos: ocupadosCrudosRef.current,
              reservas: estadoRef.current.reservas,
            }
          : null);
      despachar({
        type: 'RENOVAR_VENTANA',
        payload: {
          datosStorage,
          conservarMemoriaEnVentanaPrevia: !cambioExterno,
        },
      });
    };
    window.addEventListener('focus', renovarSiCambioElDia);
    document.addEventListener('visibilitychange', renovarSiCambioElDia);
    return () => {
      window.removeEventListener('focus', renovarSiCambioElDia);
      document.removeEventListener('visibilitychange', renovarSiCambioElDia);
    };
  }, [despachar]);

  useEffect(() => {
    const alCambiarStorage = (e) => {
      if (e.key !== STORAGE_KEY && e.key !== null) {
        return;
      }
      const actual = estadoRef.current;
      const semillaOcup = ocupadosSemilla(actual.dias);
      const raw = typeof e.newValue === 'string' ? e.newValue : undefined;
      const datos = parsearDatosGuardados(raw);
      if (datos) {
        ultimoRawStorageRef.current = raw !== undefined ? raw : leerRawStorage();
        ocupadosCrudosRef.current = datos.ocupadosCrudos;
        const guardado = {
          ocupados: fusionarConSemilla(
            actual.canchas,
            actual.dias,
            datos.ocupadosCrudos,
            semillaOcup
          ),
          reservas: datos.reservas,
        };
        syncDesdeStorageRef.current = guardado;
        despachar({ type: 'SINCRONIZAR', payload: guardado });
        return;
      }
      if (e.key === null || e.newValue === null) {
        try {
          // Lectura directa (no leerRawStorage()): ese helper devuelve null también
          // cuando getItem lanza, y aquí eso borraría las reservas en memoria.
          if (window.localStorage.getItem(STORAGE_KEY) === null) {
            ultimoRawStorageRef.current = null;
            ocupadosCrudosRef.current = null;
            const payload = { ocupados: semillaOcup, reservas: [] };
            syncDesdeStorageRef.current = payload;
            despachar({
              type: 'SINCRONIZAR',
              payload,
            });
          }
        } catch (err) {
          // Sin acceso a localStorage: conservar estado en memoria.
        }
      }
    };
    window.addEventListener('storage', alCambiarStorage);
    return () => window.removeEventListener('storage', alCambiarStorage);
  }, [despachar]);

  const leerEstadoFresco = useCallback(() => {
    const actual = estadoRef.current;
    const rawActual = leerRawStorage();
    if (rawActual !== null && rawActual !== ultimoRawStorageRef.current) {
      const datos = parsearDatosGuardados(rawActual);
      if (datos) {
        ultimoRawStorageRef.current = rawActual;
        ocupadosCrudosRef.current = datos.ocupadosCrudos;
        const guardado = {
          ocupados: fusionarConSemilla(
            actual.canchas,
            actual.dias,
            datos.ocupadosCrudos,
            ocupadosSemilla(actual.dias)
          ),
          reservas: datos.reservas,
        };
        return {
          guardado,
          estado: { ...actual, ...guardado },
        };
      }
    }
    return {
      guardado: null,
      estado: actual,
    };
  }, []);

  // `?? state` mantiene a `state` como dependencia válida para `exhaustive-deps`:
  // `disponibilidad` debe cambiar de identidad en cada estado nuevo porque
  // `useReserva`, `VistaCanchas` y el chat (`useAccionesReserva`) la usan en
  // `useMemo`/`useCallback` (quitarla dejaría cálculos viejos o un aviso de lint).
  const disponibilidad = useCallback(
    (canchaId, fecha) =>
      calcularDisponibilidad(estadoRef.current ?? state, canchaId, fecha),
    [state]
  );

  // Reserva individual: re-lee localStorage, valida y, si sigue libre, sincroniza y despacha.
  // Devuelve { ok, codigo?, error? }.
  const reservar = useCallback(
    (datos) => {
      const { guardado, estado } = leerEstadoFresco();
      if (!bloqueLibre(estado, datos.canchaId, datos.fecha, horasDe(datos))) {
        if (guardado) {
          despachar({ type: 'SINCRONIZAR', payload: guardado });
        }
        return { ok: false, error: 'Ese horario ya está reservado. Elige otro.' };
      }
      if (guardado) {
        despachar({ type: 'SINCRONIZAR', payload: guardado });
      }
      const codigo = generarCodigo();
      despachar({
        type: 'RESERVAR',
        payload: { ...datos, codigo, ahora: Date.now() },
      });
      return { ok: true, codigo };
    },
    [leerEstadoFresco, despachar]
  );

  // Evento (torneo / cumpleaños): re-lee localStorage y valida TODAS las celdas antes de despachar.
  // Devuelve { ok, codigo?, error? }. Bloqueo todo-o-nada.
  const reservarEvento = useCallback(
    (datos) => {
      const { guardado, estado } = leerEstadoFresco();
      const validacion = validarReservaEvento(estado, datos);
      if (!validacion.ok) {
        if (guardado) {
          despachar({ type: 'SINCRONIZAR', payload: guardado });
        }
        return validacion;
      }
      if (guardado) {
        despachar({ type: 'SINCRONIZAR', payload: guardado });
      }
      const codigo = generarCodigo();
      despachar({
        type: 'RESERVAR_EVENTO',
        payload: { ...datos, codigo, ahora: Date.now() },
      });
      return { ok: true, codigo };
    },
    [leerEstadoFresco, despachar]
  );

  // Cancelación individual: re-lee localStorage, valida el plazo y, si se puede, sincroniza y despacha.
  // Devuelve { ok, error? }.
  const cancelar = useCallback(
    (reservaId) => {
      const ahora = Date.now();
      const { guardado, estado } = leerEstadoFresco();
      const reserva = estado.reservas.find((r) => r.id === reservaId);
      const v = verificarCancelable(
        reserva,
        new Date(ahora),
        negocio.cancelacion.horasMinimas
      );
      if (!v.ok) {
        if (guardado) {
          despachar({ type: 'SINCRONIZAR', payload: guardado });
        }
        return { ok: false, error: v.error };
      }
      if (guardado) {
        despachar({ type: 'SINCRONIZAR', payload: guardado });
      }
      despachar({ type: 'CANCELAR', payload: { reservaId, ahora } });
      return { ok: true };
    },
    [leerEstadoFresco, despachar]
  );

  const value = useMemo(
    () => ({
      dias: state.dias,
      canchas: state.canchas,
      reservas: state.reservas,
      disponibilidad,
      reservar,
      reservarEvento,
      cancelar,
    }),
    [
      state.dias,
      state.canchas,
      state.reservas,
      disponibilidad,
      reservar,
      reservarEvento,
      cancelar,
    ]
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

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import semilla from '../data/canchas.json';
import negocio from '../data/negocio.json';
import {
  calcularPrecio,
  calcularPrecioEvento,
  calcularPrecioJornadas,
  MAX_HORAS_SEGUIDAS,
} from '../lib/precios';
import { esHoraPasada, fechaEnFrase, horaAmPm } from '../lib/fechas';
import { generarCodigo } from '../lib/codigoReserva';
import {
  aplicarCancelacion,
  celdasDeReserva,
  horasDeReserva,
  quitarReservasDeEstado,
  verificarCancelable,
} from '../lib/cancelacion';
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
  const ocupados = aplicarHorasDeReservas(
    fusionarConSemilla(canchas, dias, datos.ocupadosCrudos, semillaOcup),
    datos.reservas
  );
  return {
    ocupados,
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

// Asegura que las horas de `reservas` figuren en `ocupados` para las fechas ya
// presentes en `ocupados` (p. ej. si lo leído omitía una fecha pero conservaba
// una reserva para ella). No muta sus argumentos.
function aplicarHorasDeReservas(ocupados, reservas) {
  if (!ocupados || !Array.isArray(reservas) || reservas.length === 0) {
    return ocupados;
  }
  let resultado = ocupados;
  const canchasClonadas = new Set();

  reservas.forEach((reserva) => {
    celdasDeReserva(reserva).forEach(({ canchaId, fecha, horas }) => {
      if (
        !resultado[canchaId] ||
        !Array.isArray(resultado[canchaId][fecha]) ||
        !Array.isArray(horas) ||
        horas.length === 0
      ) {
        return;
      }
      const actuales = resultado[canchaId][fecha];
      if (horas.every((h) => actuales.includes(h))) {
        return;
      }
      if (resultado === ocupados) {
        resultado = { ...ocupados };
      }
      if (!canchasClonadas.has(canchaId)) {
        resultado[canchaId] = { ...resultado[canchaId] };
        canchasClonadas.add(canchaId);
      }
      resultado[canchaId][fecha] = Array.from(
        new Set([...actuales, ...horas])
      ).sort();
    });
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

/**
 * conciliarReservasSinGuardar — intenta fusionar en `guardado` las reservas en
 * memoria cuyos ids están pendientes de persistirse, descartando las que chocan
 * con celdas ya ocupadas en `ocupados`, en `guardado.reservas` o en candidatas
 * ya aceptadas, para no dejar reservas duplicadas sobre la misma hora.
 * Devuelve `{ guardado, conflictos }` sin mutar sus argumentos.
 */
export function conciliarReservasSinGuardar(
  guardado,
  reservasMemoria,
  idsSinGuardar
) {
  const conjuntoIds =
    idsSinGuardar instanceof Set
      ? idsSinGuardar
      : new Set(Array.isArray(idsSinGuardar) ? idsSinGuardar : []);
  if (conjuntoIds.size === 0 || !guardado) {
    return { guardado, conflictos: [] };
  }

  const reservasGuardadas = Array.isArray(guardado.reservas)
    ? guardado.reservas
    : [];
  const idsVistos = new Set(
    reservasGuardadas.map((r) => r && r.id).filter(Boolean)
  );
  const candidatas = [];
  if (Array.isArray(reservasMemoria)) {
    reservasMemoria.forEach((r) => {
      if (r && r.id && conjuntoIds.has(r.id) && !idsVistos.has(r.id)) {
        idsVistos.add(r.id);
        candidatas.push(r);
      }
    });
  }

  if (candidatas.length === 0) {
    return { guardado, conflictos: [] };
  }

  const celdasReservadas = new Set();
  const registrarCeldasReservadas = (celdas) => {
    celdas.forEach(({ canchaId, fecha, horas }) => {
      if (!canchaId || !fecha || !Array.isArray(horas)) {
        return;
      }
      horas.forEach((h) => {
        celdasReservadas.add(`${canchaId}__${fecha}__${h}`);
      });
    });
  };
  reservasGuardadas.forEach((r) =>
    registrarCeldasReservadas(celdasDeReserva(r))
  );

  let ocupados = guardado.ocupados;
  const canchasClonadas = new Set();
  const aceptadas = [];
  const conflictos = [];

  candidatas.forEach((reserva) => {
    const celdas = celdasDeReserva(reserva);
    const choca = celdas.some(({ canchaId, fecha, horas }) => {
      if (!Array.isArray(horas) || horas.length === 0) {
        return false;
      }
      const ocupadasDia =
        ocupados && ocupados[canchaId] && ocupados[canchaId][fecha];
      return horas.some(
        (h) =>
          (Array.isArray(ocupadasDia) && ocupadasDia.includes(h)) ||
          celdasReservadas.has(`${canchaId}__${fecha}__${h}`)
      );
    });
    if (choca) {
      conflictos.push(reserva);
      return;
    }

    aceptadas.push(reserva);
    registrarCeldasReservadas(celdas);
    celdas.forEach(({ canchaId, fecha, horas }) => {
      if (
        !ocupados ||
        !ocupados[canchaId] ||
        !Array.isArray(ocupados[canchaId][fecha]) ||
        !Array.isArray(horas) ||
        horas.length === 0
      ) {
        return;
      }
      if (ocupados === guardado.ocupados) {
        ocupados = { ...guardado.ocupados };
      }
      if (!canchasClonadas.has(canchaId)) {
        ocupados[canchaId] = { ...ocupados[canchaId] };
        canchasClonadas.add(canchaId);
      }
      ocupados[canchaId][fecha] = Array.from(
        new Set([...ocupados[canchaId][fecha], ...horas])
      ).sort();
    });
  });

  if (aceptadas.length === 0) {
    return { guardado, conflictos };
  }

  return {
    guardado: {
      ocupados,
      reservas: [...reservasGuardadas, ...aceptadas],
    },
    conflictos,
  };
}

function formatearAvisoConflicto(reserva, canchas = []) {
  if (reserva?.tipo === 'evento') {
    const codigoTxt = reserva.codigo ? ` (${reserva.codigo})` : '';
    return `Tu reserva de evento${codigoTxt} no pudo completarse porque uno de los horarios ya fue ocupado.`;
  }
  const canchaNombre =
    reserva?.canchaNombre ||
    canchas.find((c) => c.id === reserva?.canchaId)?.nombre ||
    '';
  const horas = horasDeReserva(reserva);
  const detallePartes = [
    canchaNombre,
    reserva?.fecha ? fechaEnFrase(reserva.fecha) : '',
    horas.length > 0 ? horaAmPm(horas[0]) : '',
  ].filter(Boolean);
  const detalle = detallePartes.length > 0 ? ` (${detallePartes.join(', ')})` : '';
  const codigoTxt = reserva?.codigo ? ` ${reserva.codigo}` : '';
  return `Tu reserva${codigoTxt}${detalle} no pudo completarse porque ese horario ya fue ocupado.`;
}

// Devuelve un Set con los ids guardados cuando `raw` es `null`/`undefined` (no
// hay nada guardado -> Set vacío) o cuando `datos` (ya parseados) es válido;
// devuelve `null` cuando `raw` es un texto ilegible que `parsearDatosGuardados`
// rechazó. No vuelve a parsear el JSON cuando recibe `datos`.
function idsDeRawStorage(raw, datos) {
  if (raw === null || raw === undefined) {
    return new Set();
  }
  const parseado = datos !== undefined ? datos : parsearDatosGuardados(raw);
  if (!parseado) {
    return null;
  }
  return new Set(parseado.reservas.map((r) => r && r.id).filter(Boolean));
}

// Incluye tanto ids ya registrados en idsSinGuardar como reservas en memoria
// que todavía no figuran en el último JSON sincronizado con localStorage
// (p. ej. despachadas dentro de startTransition antes del efecto espejo).
// Si `idsGuardados` es `null` (último raw ilegible), solo cuentan los ids de
// `idsSinGuardar`.
function obtenerIdsPendientesSinGuardar(
  idsSinGuardar,
  reservasMemoria,
  idsGuardados
) {
  const ids = new Set(idsSinGuardar);
  if (
    !Array.isArray(reservasMemoria) ||
    reservasMemoria.length === 0 ||
    idsGuardados === null
  ) {
    return ids;
  }
  reservasMemoria.forEach((r) => {
    if (r && r.id && !idsGuardados.has(r.id)) {
      ids.add(r.id);
    }
  });
  return ids;
}

function obtenerIdsCanceladosSinGuardar(
  idsCancelados,
  reservasMemoria,
  idsGuardados
) {
  const ids = new Set(idsCancelados);
  if (!idsGuardados || idsGuardados.size === 0) {
    return ids;
  }
  const idsEnMemoria = new Set(
    (Array.isArray(reservasMemoria) ? reservasMemoria : [])
      .map((r) => r && r.id)
      .filter(Boolean)
  );
  for (const id of idsGuardados) {
    if (!idsEnMemoria.has(id)) {
      ids.add(id);
    }
  }
  return ids;
}

// Filtra los ids de `ids` según si aparecen o no en `reservas`
// (`conservarPresentes`: true deja los que están en `reservas`; false deja los
// que no están). No muta sus argumentos y devuelve siempre un Set nuevo.
function filtrarRegistroIds(ids, reservas, { conservarPresentes = true } = {}) {
  if (!ids || ids.size === 0) {
    return new Set();
  }
  const presentes = new Set(
    (Array.isArray(reservas) ? reservas : [])
      .map((r) => r && r.id)
      .filter(Boolean)
  );
  const resultado = new Set();
  for (const id of ids) {
    if (presentes.has(id) === conservarPresentes) {
      resultado.add(id);
    }
  }
  return resultado;
}

function conciliarLecturaExterna({
  base,
  reservasMemoria,
  datosReservas,
  pendientesCreacion,
  pendientesCancelacion,
}) {
  const idsCreacion = filtrarRegistroIds(pendientesCreacion, datosReservas, {
    conservarPresentes: false,
  });
  const idsPendientesCancelacion = filtrarRegistroIds(
    pendientesCancelacion,
    datosReservas,
    { conservarPresentes: true }
  );
  const sinCanceladas = quitarReservasDeEstado(base, idsPendientesCancelacion);
  const { guardado, conflictos } = conciliarReservasSinGuardar(
    sinCanceladas,
    reservasMemoria,
    idsCreacion
  );
  const idsPendientesCreacion = filtrarRegistroIds(
    idsCreacion,
    guardado.reservas,
    { conservarPresentes: true }
  );
  return {
    guardado,
    idsPendientesCreacion,
    idsPendientesCancelacion,
    conflictos,
  };
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
  const ultimoDatosStorageRef = useRef(undefined);
  const ocupadosCrudosRef = useRef(undefined);
  if (ultimoRawStorageRef.current === undefined) {
    const rawInicial = leerRawStorage();
    const datosIniciales =
      rawInicial !== null ? parsearDatosGuardados(rawInicial) : null;
    ultimoRawStorageRef.current = rawInicial;
    ultimoDatosStorageRef.current = datosIniciales;
    ocupadosCrudosRef.current = datosIniciales?.ocupadosCrudos || null;
  }
  const idsSinGuardarRef = useRef(null);
  if (idsSinGuardarRef.current === null) {
    idsSinGuardarRef.current = new Set();
  }
  const idsCanceladosSinGuardarRef = useRef(null);
  if (idsCanceladosSinGuardarRef.current === null) {
    idsCanceladosSinGuardarRef.current = new Set();
  }
  const [avisosConflicto, setAvisosConflicto] = useState([]);

  const registrarConflictos = useCallback((conflictos, canchas) => {
    if (!Array.isArray(conflictos) || conflictos.length === 0) {
      return;
    }
    setAvisosConflicto((prev) => {
      const vistos = new Set(prev.map((a) => a.id));
      const nuevos = [];
      conflictos.forEach((reserva) => {
        const { id } = reserva;
        if (!vistos.has(id)) {
          vistos.add(id);
          nuevos.push({
            id,
            codigo: reserva.codigo ?? null,
            mensaje: formatearAvisoConflicto(reserva, canchas),
          });
        }
      });
      return nuevos.length > 0 ? [...prev, ...nuevos] : prev;
    });
  }, []);

  const descartarAvisoConflicto = useCallback((id) => {
    setAvisosConflicto((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sincronizarConLeido = useCallback(
    ({ raw, datos, base, actual, conservarCancelacionesPendientes = true }) => {
      const idsGuardados = idsDeRawStorage(
        ultimoRawStorageRef.current,
        ultimoDatosStorageRef.current
      );
      const pendientesCreacion = obtenerIdsPendientesSinGuardar(
        idsSinGuardarRef.current,
        actual.reservas,
        idsGuardados
      );
      const pendientesCancelacion = conservarCancelacionesPendientes
        ? obtenerIdsCanceladosSinGuardar(
            idsCanceladosSinGuardarRef.current,
            actual.reservas,
            idsGuardados
          )
        : new Set();
      ultimoRawStorageRef.current = raw;
      ultimoDatosStorageRef.current = datos;
      ocupadosCrudosRef.current = datos ? datos.ocupadosCrudos : null;
      const ocupadosBase = aplicarHorasDeReservas(base.ocupados, base.reservas);
      const baseReparada =
        ocupadosBase === base.ocupados
          ? base
          : { ...base, ocupados: ocupadosBase };
      const {
        guardado,
        idsPendientesCreacion,
        idsPendientesCancelacion,
        conflictos,
      } = conciliarLecturaExterna({
        base: baseReparada,
        reservasMemoria: actual.reservas,
        datosReservas: datos ? datos.reservas : [],
        pendientesCreacion,
        pendientesCancelacion,
      });
      idsSinGuardarRef.current = idsPendientesCreacion;
      idsCanceladosSinGuardarRef.current = idsPendientesCancelacion;
      registrarConflictos(conflictos, actual.canchas);
      return guardado;
    },
    [registrarConflictos]
  );

  // Aplica el reducer en memoria de forma síncrona además de encolarlo en React,
  // para que llamadas seguidas en el mismo tick no se pisen entre sí.
  const despachar = useCallback((action) => {
    const previo = estadoRef.current;
    const siguiente = reducerVersionado(previo, action);
    estadoRef.current = siguiente;
    if (siguiente !== previo) {
      if (action.type === 'RESERVAR' || action.type === 'RESERVAR_EVENTO') {
        const nueva = siguiente.reservas[siguiente.reservas.length - 1];
        if (nueva && nueva.id) {
          idsSinGuardarRef.current.add(nueva.id);
          idsCanceladosSinGuardarRef.current.delete(nueva.id);
        }
      } else if (action.type === 'CANCELAR') {
        const idCancelado = action.payload?.reservaId;
        if (idCancelado) {
          if (idsSinGuardarRef.current.has(idCancelado)) {
            idsSinGuardarRef.current.delete(idCancelado);
          } else {
            idsCanceladosSinGuardarRef.current.add(idCancelado);
          }
        }
      }
    }
    dispatch(action);
  }, []);

  // Espejo al almacenamiento local en cada cambio (salvo si el estado coincide
  // exactamente con el payload despachado por el evento storage).
  useEffect(() => {
    idsSinGuardarRef.current = filtrarRegistroIds(
      idsSinGuardarRef.current,
      estadoRef.current.reservas,
      { conservarPresentes: true }
    );
    idsCanceladosSinGuardarRef.current = filtrarRegistroIds(
      idsCanceladosSinGuardarRef.current,
      estadoRef.current.reservas,
      { conservarPresentes: false }
    );
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
      ultimoDatosStorageRef.current = {
        ocupadosCrudos: ocupadosParaGuardar,
        reservas: state.reservas,
      };
      ocupadosCrudosRef.current = ocupadosParaGuardar;
      idsSinGuardarRef.current.clear();
      idsCanceladosSinGuardarRef.current.clear();
    } catch (e) {
      // Sin persistencia (modo privado, cuota llena...): sigue en memoria.
      const idsGuardados = idsDeRawStorage(
        ultimoRawStorageRef.current,
        ultimoDatosStorageRef.current
      );
      if (idsGuardados !== null) {
        const idsEnMemoria = new Set(
          state.reservas.map((r) => r && r.id).filter(Boolean)
        );
        idsEnMemoria.forEach((id) => {
          if (!idsGuardados.has(id)) {
            idsSinGuardarRef.current.add(id);
          }
        });
        idsGuardados.forEach((id) => {
          if (!idsEnMemoria.has(id)) {
            idsCanceladosSinGuardarRef.current.add(id);
          }
        });
      }
    }
  }, [state.ocupados, state.reservas, state.dias]);

  useEffect(() => {
    const renovarSiCambioElDia = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      const diasNuevos = ventanaDias();
      const actual = estadoRef.current;
      if (actual.dias[0] === diasNuevos[0]) {
        return;
      }
      const rawActual = leerRawStorage();
      const cambioExterno =
        rawActual !== null && rawActual !== ultimoRawStorageRef.current;
      const desdeStorage =
        rawActual !== null ? parsearDatosGuardados(rawActual) : null;
      const cambioExternoValido = cambioExterno && Boolean(desdeStorage);
      let datosStorage;
      if (cambioExternoValido) {
        const ocupadosConSemilla = fusionarConSemilla(
          actual.canchas,
          diasNuevos,
          desdeStorage.ocupadosCrudos,
          ocupadosSemilla(diasNuevos)
        );
        const ocupadosBase = combinarOcupadosPorCancha(
          desdeStorage.ocupadosCrudos,
          ocupadosConSemilla
        );
        const guardado = sincronizarConLeido({
          raw: rawActual,
          datos: desdeStorage,
          base: {
            ocupados: ocupadosBase,
            reservas: desdeStorage.reservas,
          },
          actual,
        });
        ocupadosCrudosRef.current = guardado.ocupados;
        datosStorage = {
          ocupadosCrudos: guardado.ocupados,
          reservas: guardado.reservas,
        };
      } else {
        if (desdeStorage) {
          ocupadosCrudosRef.current = desdeStorage.ocupadosCrudos;
        }
        datosStorage =
          desdeStorage ||
          (ocupadosCrudosRef.current
            ? {
                ocupadosCrudos: ocupadosCrudosRef.current,
                reservas: actual.reservas,
              }
            : null);
      }
      despachar({
        type: 'RENOVAR_VENTANA',
        payload: {
          datosStorage,
          conservarMemoriaEnVentanaPrevia: !cambioExternoValido,
        },
      });
    };
    window.addEventListener('focus', renovarSiCambioElDia);
    document.addEventListener('visibilitychange', renovarSiCambioElDia);
    return () => {
      window.removeEventListener('focus', renovarSiCambioElDia);
      document.removeEventListener('visibilitychange', renovarSiCambioElDia);
    };
  }, [despachar, sincronizarConLeido]);

  useEffect(() => {
    const alCambiarStorage = (e) => {
      if (e.key !== STORAGE_KEY && e.key !== null) {
        return;
      }
      const actual = estadoRef.current;
      const semillaOcup = ocupadosSemilla(actual.dias);
      const raw = typeof e.newValue === 'string' ? e.newValue : leerRawStorage();
      const datos = raw !== null ? parsearDatosGuardados(raw) : null;
      if (datos) {
        const guardado = sincronizarConLeido({
          raw,
          datos,
          base: {
            ocupados: fusionarConSemilla(
              actual.canchas,
              actual.dias,
              datos.ocupadosCrudos,
              semillaOcup
            ),
            reservas: datos.reservas,
          },
          actual,
        });
        syncDesdeStorageRef.current =
          idsSinGuardarRef.current.size === 0 &&
          idsCanceladosSinGuardarRef.current.size === 0
            ? guardado
            : null;
        despachar({ type: 'SINCRONIZAR', payload: guardado });
        return;
      }
      if (e.key === null || e.newValue === null) {
        try {
          // Lectura directa (no leerRawStorage()): ese helper devuelve null también
          // cuando getItem lanza, y aquí eso borraría las reservas en memoria.
          if (window.localStorage.getItem(STORAGE_KEY) === null) {
            const guardado = sincronizarConLeido({
              raw: null,
              datos: null,
              base: { ocupados: semillaOcup, reservas: [] },
              actual,
              conservarCancelacionesPendientes: false,
            });
            syncDesdeStorageRef.current =
              idsSinGuardarRef.current.size === 0 ? guardado : null;
            despachar({
              type: 'SINCRONIZAR',
              payload: guardado,
            });
          }
        } catch (err) {
          // Sin acceso a localStorage: conservar estado en memoria.
        }
      }
    };
    window.addEventListener('storage', alCambiarStorage);
    return () => window.removeEventListener('storage', alCambiarStorage);
  }, [despachar, sincronizarConLeido]);

  const leerEstadoFresco = useCallback(() => {
    const actual = estadoRef.current;
    const rawActual = leerRawStorage();
    if (rawActual !== null && rawActual !== ultimoRawStorageRef.current) {
      const datos = parsearDatosGuardados(rawActual);
      if (datos) {
        const guardado = sincronizarConLeido({
          raw: rawActual,
          datos,
          base: {
            ocupados: fusionarConSemilla(
              actual.canchas,
              actual.dias,
              datos.ocupadosCrudos,
              ocupadosSemilla(actual.dias)
            ),
            reservas: datos.reservas,
          },
          actual,
        });
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
  }, [sincronizarConLeido]);

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
      avisosConflicto,
      disponibilidad,
      reservar,
      reservarEvento,
      cancelar,
      descartarAvisoConflicto,
    }),
    [
      state.dias,
      state.canchas,
      state.reservas,
      avisosConflicto,
      disponibilidad,
      reservar,
      reservarEvento,
      cancelar,
      descartarAvisoConflicto,
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

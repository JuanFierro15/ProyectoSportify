/**
 * Pasos del torneo y reglas de completitud y navegación.
 *
 * Módulo de lógica pura sin dependencias de React ni del navegador,
 * utilizable tanto en frontend como en pruebas.
 */

export const PASOS_TORNEO = [
  { id: 'canchas', etiqueta: 'Canchas' },
  { id: 'formato', etiqueta: 'Formato' },
  { id: 'fechas', etiqueta: 'Fechas por fase' },
  { id: 'llaves', etiqueta: 'Llaves' },
  { id: 'datos', etiqueta: 'Tus datos' },
  { id: 'resumen', etiqueta: 'Resumen' },
];

/**
 * Calcula el estado de completitud y motivo de bloqueo para cada uno de los 6 pasos del torneo.
 *
 * @param {Object} reserva - Objeto de estado devuelto por useReserva.
 * @returns {Array<{ id: string, etiqueta: string, completo: boolean, motivo: string }>}
 */
export function estadoPasosTorneo(reserva) {
  const r = reserva || {};

  // 1. Canchas
  const canchasCompleto = Boolean(
    r.canchaIds &&
      r.canchaIds.length > 0 &&
      !r.torneoPlan?.errorCanchas
  );
  let motivoCanchas = '';
  if (!canchasCompleto) {
    if (r.torneoPlan?.errorCanchas) {
      motivoCanchas = r.torneoPlan.errorCanchas;
    } else {
      motivoCanchas = 'Elige al menos una cancha';
    }
  }

  // 2. Formato
  const formatoCompleto = Boolean(
    [4, 8, 16].includes(Number(r.equipos)) && r.duracionPartido
  );
  let motivoFormato = '';
  if (!formatoCompleto) {
    motivoFormato = 'Elige el número de equipos y la duración por partido';
  }

  // 3. Fechas
  const fases = r.torneoPlan?.fases || [];
  const jornadas = r.torneoPlan?.jornadas || r.jornadas || {};
  const validaciones = r.torneoPlan?.validacionesJornadas || [];
  const todasFasesConHoras =
    fases.length > 0 &&
    fases.every((f) => {
      const j = jornadas[f.ronda];
      return Array.isArray(j?.horas) && j.horas.length > 0;
    });
  const errorValidacion = validaciones.find((v) => Boolean(v?.error))?.error;
  const fechasCompleto = todasFasesConHoras && !errorValidacion;
  let motivoFechas = '';
  if (!fechasCompleto) {
    motivoFechas = errorValidacion || 'Asigna fecha y horario a cada fase';
  }

  // 4. Llaves
  const llavesCompleto = Boolean(
    r.torneoPlan?.partidos &&
      r.torneoPlan.partidos.length > 0 &&
      !r.torneoPlan?.errorCruces
  );
  let motivoLlaves = '';
  if (!llavesCompleto) {
    if (r.torneoPlan?.errorCruces) {
      motivoLlaves = r.torneoPlan.errorCruces;
    } else {
      motivoLlaves = 'Genera o revisa las llaves del torneo';
    }
  }

  // 5. Tus datos
  const nombreValido = Boolean(r.nombre && r.nombre.trim().length > 0);
  const datosCompleto = Boolean(
    !r.errNombre &&
      !r.errTelefono &&
      nombreValido
  );
  let motivoDatos = '';
  if (!datosCompleto) {
    if (!nombreValido) {
      motivoDatos = 'Ingresa tu nombre';
    } else if (r.errNombre) {
      motivoDatos = r.errNombre;
    } else if (r.errTelefono) {
      motivoDatos = r.errTelefono;
    } else {
      motivoDatos = 'Ingresa tus datos de contacto';
    }
  }

  // 6. Resumen
  const resumenCompleto = Boolean(r.puedeConfirmar);
  let motivoResumen = '';
  if (!resumenCompleto) {
    motivoResumen = r.motivoBloqueo || 'Completa todos los pasos para confirmar';
  }

  const estados = [
    { id: 'canchas', etiqueta: 'Canchas', completo: canchasCompleto, motivo: motivoCanchas },
    { id: 'formato', etiqueta: 'Formato', completo: formatoCompleto, motivo: motivoFormato },
    { id: 'fechas', etiqueta: 'Fechas por fase', completo: fechasCompleto, motivo: motivoFechas },
    { id: 'llaves', etiqueta: 'Llaves', completo: llavesCompleto, motivo: motivoLlaves },
    { id: 'datos', etiqueta: 'Tus datos', completo: datosCompleto, motivo: motivoDatos },
    { id: 'resumen', etiqueta: 'Resumen', completo: resumenCompleto, motivo: motivoResumen },
  ];

  return estados;
}

/**
 * Determina qué identificadores de paso son alcanzables (navegables).
 * Regla (S5): permite saltar a cualquier paso completo o al primero incompleto.
 *
 * @param {Array<{ id: string, completo: boolean }>} estados
 * @returns {string[]} Lista de IDs de pasos alcanzables.
 */
export function pasosAlcanzables(estados) {
  if (!Array.isArray(estados) || estados.length === 0) return [];
  const primerIncompletoIdx = estados.findIndex((p) => !p.completo);
  return estados
    .filter((p, idx) => p.completo || idx === primerIncompletoIdx)
    .map((p) => p.id);
}

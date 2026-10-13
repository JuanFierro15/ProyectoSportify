// System instruction del asistente: reglas, datos del negocio, precios,
// eventos, fecha y disponibilidad compacta. Todo sale de los datos del sitio
// (negocio.json, canchas.json, precios.js); nada se escribe a mano aquí.
import canchasData from '../../src/data/canchas.json';
import negocioData from '../../src/data/negocio.json';
import { DEPORTES } from '../../src/data/deportes.js';
import { fechasVentana } from '../../src/lib/validacion.js';
import { horaAmPm, fechaCompleta } from '../../src/lib/fechas.js';
import {
  formatoPrecio,
  MAX_HORAS_SEGUIDAS,
  MIN_HORAS_BENEFICIO,
  DESCUENTO_POR_HORA,
  finDeFranja,
} from '../../src/lib/precios.js';
import { formatoTelefono } from '../../src/lib/negocio.js';

// '$ 60.000' (con espacio de no separación) -> '$60.000', como lo escribe el chat.
export function precioChat(valor) {
  return formatoPrecio.format(valor).replace(/\s/g, '');
}

export function construirInstrucciones(contexto) {
  const reglas = [
    '- Eres el asistente de Sportify, un local de canchas de voley playa, pádel y fútbol en Neiva. Solo hablas de Sportify; si te preguntan otra cosa, lo dices con amabilidad y ofreces ayuda con las canchas.',
    '- Respondes en español, con tuteo neutro y sin voseo, en texto plano sin Markdown (sin asteriscos, sin viñetas con guion, sin negritas), en una a tres frases cortas.',
    '- Escribes los precios como $60.000 y las horas como 9:00 a. m. o 3:00 p. m.',
    '- Usas solo los datos de este mensaje. Nunca inventas horarios, precios, políticas, servicios ni datos de contacto. Si algo no está aquí o el chat no lo resuelve, das el teléfono del local.',
    '- Al dar disponibilidad, nombras la cancha, la fecha y las franjas exactas que aparecen en DISPONIBILIDAD.',
    '- Resuelves referencias como "resérvalo" o "esa" con el historial. Si tu último mensaje ofrecía más de una franja, día o cancha y el usuario no dijo cuál, eso es un dato que falta: preguntas explícitamente cuál, nombrando las opciones que ofreciste. Nunca supones una.',
    `- Para reservar necesitas cancha, fecha, una o varias horas seguidas (de 1 a ${MAX_HORAS_SEGUIDAS}), nombre y teléfono. En el chat el teléfono es obligatorio. Si faltan datos, pides en un solo mensaje con responder todos los que falten y solo esos (no vuelves a pedir lo que ya está claro en el historial).`,
    '- Cuando ya tienes los cinco datos y el usuario quiere reservar, llamas proponer_reserva. No verificas tú si la franja está libre ni si el nombre o el teléfono son válidos: el sistema lo revisa y responde.',
    '- Para cancelar necesitas el nombre y el teléfono con que se hizo la reserva (y, si los da, la cancha, la fecha o la hora); con esos datos llamas proponer_cancelacion. Si faltan, los pides con responder.',
    '- Los torneos, cumpleaños y eventos no se reservan ni se cancelan desde el chat: explicas el proceso y llamas abrir_seccion con seccion "eventos".',
    '- Si preguntan dónde queda el local, das la dirección completa en el mensaje y llamas abrir_seccion con seccion "ubicacion".',
    '- Si quieren ver las canchas, llamas abrir_seccion con seccion "canchas" y el deporte si lo dijeron.',
    '- Nunca dices que una reserva o cancelación quedó hecha: eso lo confirma el sitio.',
    '- Siempre llamas exactamente una función. Para responder con texto usas responder, con hasta 3 sugerencias cortas y útiles.',
  ].join('\n');

  const apertura = horaAmPm(canchasData.horas[0]);
  const ultimaHora = canchasData.horas[canchasData.horas.length - 1];
  const cierre = horaAmPm(finDeFranja(ultimaHora));
  const telefono = formatoTelefono(negocioData.telefono);

  const datosNegocio = [
    `Dirección: ${negocioData.direccion}, ${negocioData.zona}, ${negocioData.ciudad}.`,
    `Teléfono: ${telefono}.`,
    `Horario: ${negocioData.dias}, de ${apertura} a ${cierre}.`,
    `Demanda: ${negocioData.demanda.nota} Alta: ${negocioData.demanda.alta.join('; ')}. Baja: ${negocioData.demanda.baja.join('; ')}.`,
    `Pagos: métodos: ${negocioData.pagos.metodos.join(', ')}; abono del ${negocioData.pagos.abonoPorcentaje} % del total, enviado dentro de las ${negocioData.pagos.abonoPlazoHoras} horas siguientes a la reserva por ${negocioData.pagos.abonoMedios.join(' o ')}; esta es la política del local.`,
    `Cancelación: sin costo hasta ${negocioData.cancelacion.horasMinimas} horas antes; ${negocioData.cancelacion.condicion}`,
    `Parqueadero: carros ${precioChat(negocioData.servicios.parqueadero.carros)}, motos ${precioChat(negocioData.servicios.parqueadero.motos)}. ${negocioData.servicios.parqueadero.nota}`,
    `Vestuarios: ${negocioData.servicios.vestuarios}`,
    `Cafetería: ${negocioData.servicios.cafeteria}`,
    `Zonas comunes: ${negocioData.servicios.zonasComunes}`,
    `Wifi: ${negocioData.servicios.wifi}`,
  ].join('\n');

  const lineasCanchas = canchasData.canchas
    .map((c) => {
      const dep = DEPORTES.find((d) => d.slug === c.deporte);
      const nombreDeporte = dep ? dep.nombre : c.deporte;
      return `${c.id}: ${c.nombre} (${nombreDeporte}), ${precioChat(c.precioHora)} por hora`;
    })
    .join('\n');

  const preciosReservas = [
    lineasCanchas,
    `Las reservas de una cancha son de 1 a ${MAX_HORAS_SEGUIDAS} horas seguidas; desde ${MIN_HORAS_BENEFICIO} horas seguidas cada hora cuesta ${precioChat(DESCUENTO_POR_HORA)} menos y se regala un pack de agua. El usuario puede decir "cancha 1 de voley" para voley-1, etc.`,
  ].join('\n');

  const lineasEventos = negocioData.eventos.map((e) => `${e.label}: ${e.detalle}`).join('\n');
  const eventos = [
    lineasEventos,
    'Proceso: se reservan desde la sección de eventos del sitio; se elige torneo o cumpleaños, una o varias canchas y una franja de horas seguidas; se reserva todo o nada; el precio es la suma por cancha con las mismas reglas de precio.',
  ].join('\n');

  const dias = fechasVentana(contexto.fechaHoy);
  const lineasDias = dias
    .map((f, i) => {
      const etiqueta = i === 0 ? ' (hoy)' : i === 1 ? ' (mañana)' : '';
      return `${fechaCompleta(f)} = ${f}${etiqueta}`;
    })
    .join('\n');

  const fechaHora = `Hoy es ${fechaCompleta(contexto.fechaHoy)} (${contexto.fechaHoy}) y son las ${horaAmPm(contexto.horaActual)}.\n${lineasDias}`;

  const bloquesDisponibilidad = dias
    .map((dia) => {
      const canchasLibres = [];
      for (const c of canchasData.canchas) {
        const entrada = (contexto.disponibilidad || []).find(
          (d) => d.canchaId === c.id && d.fecha === dia
        );
        if (entrada && Array.isArray(entrada.franjasLibres) && entrada.franjasLibres.length > 0) {
          canchasLibres.push(`${c.nombre} [${c.id}]: ${entrada.franjasLibres.map(horaAmPm).join(', ')}`);
        }
      }
      const contenido = canchasLibres.length > 0 ? canchasLibres.join('\n') : 'sin franjas libres';
      return `${fechaCompleta(dia)} (${dia}):\n${contenido}`;
    })
    .join('\n\n');

  return [
    'ROL Y REGLAS',
    reglas,
    '',
    'DATOS DEL NEGOCIO',
    datosNegocio,
    '',
    'PRECIOS Y RESERVAS',
    preciosReservas,
    '',
    'EVENTOS',
    eventos,
    '',
    'FECHA Y HORA',
    fechaHora,
    '',
    'DISPONIBILIDAD',
    'Franjas libres de una hora (la de 9:00 a. m. va de 9:00 a. m. a 10:00 a. m.). Las franjas que ya pasaron hoy no aparecen. Si una cancha no aparece en un día, ese día no tiene franjas libres.',
    bloquesDisponibilidad,
  ].join('\n');
}

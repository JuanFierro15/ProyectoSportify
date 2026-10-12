// Funciones que puede llamar el modelo y su procesamiento. El modelo solo
// propone: aquí se normalizan y validan los argumentos con el mismo módulo
// del formulario (src/lib/validacion.js) y se arma la acción propuesta
// (CONFIRMAR_RESERVA, BUSCAR_CANCELACION o ABRIR_SECCION). Si algo no es
// válido se responde el mensaje fijo, sin volver a llamar al modelo.
import canchasData from '../../src/data/canchas.json';
import negocioData from '../../src/data/negocio.json';
import { DEPORTES } from '../../src/data/deportes.js';
import {
  normalizarNombre,
  normalizarTelefono,
  validarContactoChat,
  validarPropuestaReserva,
  fechasVentana,
} from '../../src/lib/validacion.js';
import { horaAmPm, fechaCompleta } from '../../src/lib/fechas.js';
import { finDeFranja } from '../../src/lib/precios.js';

export const TEXTOS = Object.freeze({
  generico: 'Tuve un problema para responder. Intenta de nuevo en un momento.',
  limite: 'Estoy recibiendo muchas consultas. Intenta de nuevo en un minuto.',
  invalida: 'No pude leer tu mensaje. Escríbelo de nuevo, por favor.',
  cancelacion: 'Voy a buscar tu reserva con esos datos.',
  seccion: Object.freeze({
    canchas: 'Aquí puedes ver las canchas.',
    eventos: 'Aquí puedes reservar tu torneo o cumpleaños.',
    ubicacion: `Estamos en ${negocioData.direccion}, ${negocioData.zona}, ${negocioData.ciudad}.`,
  }),
});

export function declaraciones() {
  return [
    {
      name: 'responder',
      description: 'Responde al usuario en texto plano y proporciona sugerencias cortas para continuar la conversación.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          texto: {
            type: 'string',
            description: 'Respuesta para el usuario en texto plano, corta.',
          },
          sugerencias: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 3,
            description: 'Pedidos cortos que el usuario podría escribir después, en primera persona.',
          },
        },
        required: ['texto', 'sugerencias'],
      },
    },
    {
      name: 'proponer_reserva',
      description: 'Propone una reserva de cancha cuando se tienen los cinco datos obligatorios.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          canchaId: {
            type: 'string',
            enum: canchasData.canchas.map((c) => c.id),
            description: 'Identificador único de la cancha.',
          },
          fecha: {
            type: 'string',
            description: 'Fecha de la reserva en formato YYYY-MM-DD.',
          },
          horas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Horas de inicio de cada franja de una hora en formato HH:00 de 24 horas.',
          },
          nombre: {
            type: 'string',
            description: 'Nombre completo de la persona que reserva.',
          },
          telefono: {
            type: 'string',
            description: 'Número de teléfono celular colombiano de 10 dígitos.',
          },
        },
        required: ['canchaId', 'fecha', 'horas', 'nombre', 'telefono'],
      },
    },
    {
      name: 'proponer_cancelacion',
      description: 'Busca una reserva para cancelar a partir de los datos de contacto y detalles opcionales.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          nombre: {
            type: 'string',
            description: 'Nombre con el que se realizó la reserva.',
          },
          telefono: {
            type: 'string',
            description: 'Teléfono celular con el que se realizó la reserva.',
          },
          canchaId: {
            type: 'string',
            enum: canchasData.canchas.map((c) => c.id),
            description: 'Identificador de la cancha, si se indicó.',
          },
          fecha: {
            type: 'string',
            description: 'Fecha de la reserva en formato YYYY-MM-DD, si se indicó.',
          },
          hora: {
            type: 'string',
            description: 'Hora de inicio de la reserva en formato HH:00, si se indicó.',
          },
        },
        required: ['nombre', 'telefono'],
      },
    },
    {
      name: 'abrir_seccion',
      description: 'Dirige al usuario a una sección específica del sitio web.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          seccion: {
            type: 'string',
            enum: ['canchas', 'eventos', 'ubicacion'],
            description: 'Sección del sitio que se debe abrir.',
          },
          deporte: {
            type: 'string',
            enum: DEPORTES.map((d) => d.slug),
            description: 'Deporte a mostrar si la sección es canchas.',
          },
          mensaje: {
            type: 'string',
            description: 'Texto corto para el usuario que acompaña la acción.',
          },
        },
        required: ['seccion', 'mensaje'],
      },
    },
  ];
}

export function procesarLlamada(llamada, contexto) {
  const name = llamada?.name;
  const args = llamada?.args ?? {};

  if (name === 'responder') {
    const textoRecortado = typeof args.texto === 'string' ? args.texto.trim() : '';
    const respuesta = textoRecortado || TEXTOS.generico;
    const sugerencias = [];
    if (Array.isArray(args.sugerencias)) {
      for (const item of args.sugerencias) {
        if (typeof item === 'string') {
          const s = item.trim();
          if (s.length > 0 && s.length <= 60 && !sugerencias.includes(s)) {
            sugerencias.push(s);
            if (sugerencias.length === 3) break;
          }
        }
      }
    }
    return { respuesta, sugerencias, accion: null };
  }

  if (name === 'abrir_seccion') {
    const mensajeRecortado = typeof args.mensaje === 'string' ? args.mensaje.trim() : '';
    const seccionesValidas = ['canchas', 'eventos', 'ubicacion'];
    if (!seccionesValidas.includes(args.seccion)) {
      return {
        respuesta: mensajeRecortado || TEXTOS.generico,
        sugerencias: [],
        accion: null,
      };
    }

    const deporte =
      args.seccion === 'canchas' && DEPORTES.some((d) => d.slug === args.deporte)
        ? args.deporte
        : null;

    const textoFijo = TEXTOS.seccion[args.seccion] ?? TEXTOS.generico;
    const respuesta = mensajeRecortado || textoFijo;

    return {
      respuesta,
      sugerencias: [],
      accion: {
        tipo: 'ABRIR_SECCION',
        seccion: args.seccion,
        deporte,
      },
    };
  }

  if (name === 'proponer_reserva') {
    const nombre = normalizarNombre(args.nombre);
    const telefono = normalizarTelefono(args.telefono);
    const horas = Array.isArray(args.horas) ? [...args.horas].map(String).sort() : [];
    const propuesta = {
      canchaId: String(args.canchaId ?? ''),
      fecha: String(args.fecha ?? ''),
      horas,
      nombre,
      telefono,
    };

    const resultado = validarPropuestaReserva(propuesta, contexto);
    if (!resultado.ok) {
      return {
        respuesta: resultado.error,
        sugerencias: [],
        accion: null,
      };
    }

    const cancha = contexto?.canchas?.find((c) => c.id === propuesta.canchaId);
    const nombreCancha = cancha?.nombre ?? propuesta.canchaId;
    const horaInicio = horaAmPm(horas[0]);
    const horaFin = horaAmPm(finDeFranja(horas[horas.length - 1]));
    // fechaCompleta empieza en mayúscula (voucher); aquí va a mitad de frase.
    const fechaTexto = fechaCompleta(propuesta.fecha).replace(/^\p{Lu}/u, (l) => l.toLowerCase());

    const respuesta = `Revisa los datos: ${nombreCancha}, ${fechaTexto}, de ${horaInicio} a ${horaFin}, a nombre de ${nombre}. Confírmalos para hacer la reserva.`;

    return {
      respuesta,
      sugerencias: [],
      accion: {
        tipo: 'CONFIRMAR_RESERVA',
        ...propuesta,
      },
    };
  }

  if (name === 'proponer_cancelacion') {
    const nombre = normalizarNombre(args.nombre);
    const telefono = normalizarTelefono(args.telefono);
    const contacto = validarContactoChat(nombre, telefono);
    if (!contacto.ok) {
      return {
        respuesta: contacto.error,
        sugerencias: [],
        accion: null,
      };
    }

    const canchaExiste =
      Array.isArray(contexto?.canchas) && contexto.canchas.some((c) => c?.id === args.canchaId);
    const canchaId = canchaExiste ? args.canchaId : null;

    const ventana = fechasVentana(contexto?.fechaHoy);
    const fechaValida = typeof args.fecha === 'string' && ventana.includes(args.fecha);
    const fecha = fechaValida ? args.fecha : null;

    const horaValida = typeof args.hora === 'string' && /^\d{2}:00$/.test(args.hora);
    const hora = horaValida ? args.hora : null;

    return {
      respuesta: TEXTOS.cancelacion,
      sugerencias: [],
      accion: {
        tipo: 'BUSCAR_CANCELACION',
        nombre,
        telefono,
        canchaId,
        fecha,
        hora,
      },
    };
  }

  return {
    respuesta: TEXTOS.generico,
    sugerencias: [],
    accion: null,
  };
}

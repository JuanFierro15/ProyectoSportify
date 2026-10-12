import { useCallback } from 'react';
import { useReservas } from '../../context/ReservasContext';
import { normalizarNombre, normalizarTelefono, validarContactoChat } from '../../lib/validacion';
import { calcularPrecio, finDeFranja } from '../../lib/precios';
import { textoQr } from '../../lib/codigoReserva';
import { fechaCompleta } from '../../lib/fechas';
import {
  MENSAJES_CANCELACION,
  buscarReservasCancelables,
  horasDeReserva,
} from '../../lib/cancelacion';
import {
  mensajeReservaHecha,
  mensajeChoque,
  MENSAJE_RESERVA_NO_HECHA,
  mensajeSinCoincidencias,
  TEXTO_TARJETA_CANCELACION,
  TEXTO_OPCIONES_CANCELACION,
  mensajeCancelacionHecha,
  MENSAJE_CANCELACION_NO_HECHA,
  etiquetaReserva,
} from '../../lib/chat';

// Ejecuta lo que el chat propone, solo tras la confirmación del usuario:
// reservar con reservar() (la del formulario, todo o nada) y cancelar con
// cancelar() (acción CANCELAR). Los resultados se agregan como mensajes fijos
// del bot, y el estado de cada tarjeta se guarda en su mensaje.
export default function useAccionesReserva({ agregarMensaje, actualizarMensaje }) {
  const { reservar, cancelar, reservas, canchas, disponibilidad } = useReservas();

  const confirmarReserva = useCallback(
    (mensaje) => {
      if (!mensaje || mensaje.estado !== 'pendiente') return;

      const { canchaId, fecha, horas } = mensaje.accion || {};
      const nombre = normalizarNombre(mensaje.accion?.nombre);
      const telefono = normalizarTelefono(mensaje.accion?.telefono);

      const contacto = validarContactoChat(nombre, telefono);
      if (!contacto.ok) {
        actualizarMensaje(mensaje.id, { estado: 'fallida' });
        agregarMensaje({ texto: contacto.error });
        return;
      }

      const res = reservar({ canchaId, fecha, horas, nombre, telefono });
      const cancha = canchas.find((c) => c.id === canchaId);
      const canchaNombre = cancha ? cancha.nombre : canchaId;

      if (!res.ok) {
        actualizarMensaje(mensaje.id, { estado: 'fallida' });
        const libres = disponibilidad(canchaId, fecha)
          .filter((h) => h && h.disponible)
          .map((h) => h.hora);
        agregarMensaje({
          texto: mensajeChoque({ canchaNombre, fecha, libres }),
        });
        return;
      }

      actualizarMensaje(mensaje.id, { estado: 'confirmada' });
      const precio = calcularPrecio(cancha ? cancha.precioHora : 0, horas.length);
      const horario = `${horas[0]} a ${finDeFranja(horas[horas.length - 1])}`;
      const fechaTexto = fechaCompleta(fecha);

      agregarMensaje({
        texto: mensajeReservaHecha({
          canchaNombre,
          fecha,
          horas,
          codigo: res.codigo,
          total: precio.total,
        }),
        comprobante: {
          codigo: res.codigo,
          textoQr: textoQr({
            codigo: res.codigo,
            tipo: 'Reserva de cancha',
            fecha: fechaTexto,
            horario,
            canchas: [canchaNombre],
            nombre,
            telefono,
            total: precio.total,
          }),
          resumen: {
            tipoEtiqueta: 'Reserva de cancha',
            fechaTexto,
            horario,
            canchas: [canchaNombre],
            total: precio.total,
            packsAgua: precio.aguaGratis ? 1 : 0,
          },
        },
      });
    },
    [actualizarMensaje, agregarMensaje, canchas, disponibilidad, reservar]
  );

  const rechazarReserva = useCallback(
    (mensaje) => {
      if (!mensaje || mensaje.estado !== 'pendiente') return;
      actualizarMensaje(mensaje.id, { estado: 'cancelada' });
      agregarMensaje({ texto: MENSAJE_RESERVA_NO_HECHA });
    },
    [actualizarMensaje, agregarMensaje]
  );

  const manejarBusqueda = useCallback(
    (accion) => {
      if (!accion) return;
      const { cancelables, enVentana } = buscarReservasCancelables({
        reservas,
        nombre: accion.nombre,
        telefono: accion.telefono,
        canchaId: accion.canchaId,
        fecha: accion.fecha,
        hora: accion.hora,
        ahora: new Date(),
      });

      if (cancelables.length === 0 && enVentana.length > 0) {
        agregarMensaje({ texto: MENSAJES_CANCELACION.fueraDePlazo });
      } else if (cancelables.length === 0) {
        agregarMensaje({ texto: mensajeSinCoincidencias() });
      } else if (cancelables.length === 1) {
        const r = cancelables[0];
        const cancha = canchas.find((c) => c.id === r.canchaId);
        const canchaNombre = r.canchaNombre || (cancha ? cancha.nombre : r.canchaId);
        agregarMensaje({
          texto: TEXTO_TARJETA_CANCELACION,
          tarjeta: {
            tipo: 'cancelacion',
            reservaId: r.id,
            canchaNombre,
            fecha: r.fecha,
            horas: horasDeReserva(r),
            total: r.total,
            codigo: r.codigo,
          },
          estado: 'pendiente',
        });
      } else {
        agregarMensaje({
          texto: TEXTO_OPCIONES_CANCELACION,
          opciones: cancelables.map((r) => ({
            reservaId: r.id,
            etiqueta: etiquetaReserva(r),
          })),
          estado: 'pendiente',
        });
      }
    },
    [agregarMensaje, canchas, reservas]
  );

  const elegirReserva = useCallback(
    (mensajeOpciones, reservaId) => {
      if (!mensajeOpciones || mensajeOpciones.estado !== 'pendiente') return;
      actualizarMensaje(mensajeOpciones.id, {
        estado: 'confirmada',
        elegida: reservaId,
      });

      const r = reservas.find((res) => res.id === reservaId);
      if (!r) {
        agregarMensaje({ texto: MENSAJES_CANCELACION.noEncontrada });
        return;
      }

      const cancha = canchas.find((c) => c.id === r.canchaId);
      const canchaNombre = r.canchaNombre || (cancha ? cancha.nombre : r.canchaId);
      agregarMensaje({
        texto: TEXTO_TARJETA_CANCELACION,
        tarjeta: {
          tipo: 'cancelacion',
          reservaId: r.id,
          canchaNombre,
          fecha: r.fecha,
          horas: horasDeReserva(r),
          total: r.total,
          codigo: r.codigo,
        },
        estado: 'pendiente',
      });
    },
    [actualizarMensaje, agregarMensaje, canchas, reservas]
  );

  const confirmarCancelacion = useCallback(
    (mensaje) => {
      if (!mensaje || mensaje.estado !== 'pendiente') return;
      const res = cancelar(mensaje.tarjeta?.reservaId);
      if (res.ok) {
        actualizarMensaje(mensaje.id, { estado: 'confirmada' });
        const { canchaNombre, fecha, horas } = mensaje.tarjeta || {};
        agregarMensaje({
          texto: mensajeCancelacionHecha({ canchaNombre, fecha, horas }),
        });
      } else {
        actualizarMensaje(mensaje.id, { estado: 'fallida' });
        agregarMensaje({ texto: res.error });
      }
    },
    [actualizarMensaje, agregarMensaje, cancelar]
  );

  const rechazarCancelacion = useCallback(
    (mensaje) => {
      if (!mensaje || mensaje.estado !== 'pendiente') return;
      actualizarMensaje(mensaje.id, { estado: 'cancelada' });
      agregarMensaje({ texto: MENSAJE_CANCELACION_NO_HECHA });
    },
    [actualizarMensaje, agregarMensaje]
  );

  return {
    confirmarReserva,
    rechazarReserva,
    confirmarCancelacion,
    rechazarCancelacion,
    elegirReserva,
    manejarBusqueda,
  };
}

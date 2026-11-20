import {
  MENSAJES_CANCELACION,
  normalizarComparacion,
  normalizarCodigo,
  verificarCancelable,
  aplicarCancelacion,
  quitarReservasDeEstado,
  buscarReservasCancelables,
  buscarReservaPorCodigo,
  buscarReservasDePersona,
} from './cancelacion';
import semilla from '../data/canchas.json';

describe('lógica de cancelación de reservas', () => {
  const ahoraBase = new Date(2026, 9, 12, 10, 0);

  const r1 = {
    id: 'r1',
    codigo: 'SPF-ABCDEF',
    tipo: 'individual',
    canchaId: 'voley-1',
    canchaNombre: 'Cancha Voley Playa 1',
    fecha: '2026-10-13',
    hora: '09:00',
    horas: ['09:00', '10:00'],
    total: 80000,
    nombre: 'José Peña',
    telefono: '3001234567',
  };

  const e1 = {
    id: 'e1',
    codigo: 'SPF-EVT001',
    tipo: 'evento',
    canchaIds: ['padel-1'],
    fecha: '2026-10-13',
    horas: ['14:00'],
    nombre: 'José Peña',
    telefono: '3001234567',
  };

  const r2 = {
    id: 'r2',
    tipo: 'individual',
    canchaId: 'voley-1',
    fecha: '2026-10-14',
    hora: '15:00',
    horas: ['15:00'],
    nombre: 'José Peña',
    telefono: null,
  };

  const crearEstado = () => ({
    ocupados: {
      'voley-1': { '2026-10-13': ['08:00', '09:00', '10:00'] },
      'padel-1': { '2026-10-13': ['14:00'] },
    },
    reservas: [r1, e1, r2],
  });

  test('aplicarCancelacion con éxito libera horas y elimina la reserva sin mutar el estado original', () => {
    const estadoOriginal = crearEstado();
    const resultado = aplicarCancelacion(estadoOriginal, 'r1', ahoraBase);

    expect(resultado.error).toBeNull();
    expect(resultado.state.ocupados['voley-1']['2026-10-13']).toEqual(['08:00']);
    expect(resultado.state.ocupados['padel-1']['2026-10-13']).toEqual(['14:00']);
    expect(resultado.state.reservas.find((r) => r.id === 'r1')).toBeUndefined();
    expect(resultado.state.reservas).toHaveLength(2);

    expect(estadoOriginal.ocupados['voley-1']['2026-10-13']).toEqual([
      '08:00',
      '09:00',
      '10:00',
    ]);
    expect(estadoOriginal.reservas).toHaveLength(3);
    expect(resultado.state).not.toBe(estadoOriginal);
  });

  test('quitarReservasDeEstado conserva horas compartidas con reservas activas o bloques de torneo sin mutar la entrada (#53)', () => {
    const torneoMulti = {
      id: 'e-multi',
      codigo: 'SPF-EVTMUL',
      tipo: 'evento',
      bloques: [
        { fecha: '2026-10-13', canchaIds: ['voley-1'], horas: ['09:00'] },
      ],
    };
    const rSolapada = {
      id: 'r-sol',
      tipo: 'individual',
      canchaId: 'voley-1',
      fecha: '2026-10-13',
      horas: ['09:00', '11:00'],
    };
    const original = {
      ocupados: {
        'voley-1': { '2026-10-13': ['08:00', '09:00', '11:00'] },
      },
      reservas: [rSolapada, torneoMulti],
    };

    const sinCambio = quitarReservasDeEstado(original, new Set(['inexistente']));
    expect(sinCambio).toBe(original);

    const resultado = quitarReservasDeEstado(original, new Set(['r-sol']));
    expect(resultado.reservas).toEqual([torneoMulti]);
    expect(resultado.ocupados['voley-1']['2026-10-13']).toEqual(['08:00', '09:00']);
    expect(original.ocupados['voley-1']['2026-10-13']).toEqual([
      '08:00',
      '09:00',
      '11:00',
    ]);
  });

  test('quitarReservasDeEstado descarta entradas null o sin id al quitar y devuelve la misma referencia si no quita nada (H6)', () => {
    const original = {
      ocupados: {
        'voley-1': { '2026-10-13': ['08:00', '09:00', '10:00'] },
      },
      reservas: [null, r1, { sinId: true }, r2],
    };
    const copiaAntes = structuredClone(original);

    const sinCambio = quitarReservasDeEstado(original, ['inexistente']);
    expect(sinCambio).toBe(original);
    expect(original).toEqual(copiaAntes);

    const resultado = quitarReservasDeEstado(original, [r1.id]);
    expect(resultado.reservas).toEqual([r2]);
    expect(resultado.ocupados['voley-1']['2026-10-13']).toEqual(['08:00']);
    expect(original).toEqual(copiaAntes);
  });

  test('aplicarCancelacion sobre un estado con null y entradas sin id cancela bien y no los deja en reservas (H6)', () => {
    const estado = {
      ocupados: {
        'voley-1': { '2026-10-13': ['08:00', '09:00', '10:00'] },
      },
      reservas: [null, r1, { sinId: true }, r2],
    };
    const copiaAntes = structuredClone(estado);

    const res = aplicarCancelacion(estado, r1.id, ahoraBase);
    expect(res.error).toBeNull();
    expect(res.state.reservas).toEqual([r2]);
    expect(res.state.ocupados['voley-1']['2026-10-13']).toEqual(['08:00']);
    expect(estado).toEqual(copiaAntes);
  });

  test('aplicarCancelacion no libera una hora que otra reserva activa (individual o evento) sigue usando (#55)', () => {
    const rDuplicada = {
      id: 'r1-dup',
      codigo: 'SPF-DUP001',
      tipo: 'individual',
      canchaId: 'voley-1',
      fecha: '2026-10-13',
      hora: '10:00',
      horas: ['10:00'],
      nombre: 'Otra Persona',
    };
    const eSolapado = {
      id: 'e-solapado',
      codigo: 'SPF-EVTSOL',
      tipo: 'evento',
      canchaIds: ['voley-1'],
      fecha: '2026-10-13',
      horas: ['09:00'],
      nombre: 'Torneo Solapado',
    };
    const estado = {
      ocupados: {
        'voley-1': { '2026-10-13': ['08:00', '09:00', '10:00', '11:00'] },
      },
      reservas: [
        { ...r1, horas: ['09:00', '10:00', '11:00'] },
        rDuplicada,
        eSolapado,
      ],
    };

    const res = aplicarCancelacion(estado, 'r1', ahoraBase);

    expect(res.error).toBeNull();
    expect(res.state.reservas.map((r) => r.id)).toEqual(['r1-dup', 'e-solapado']);
    // 09:00 la usa e-solapado, 10:00 la usa r1-dup, 08:00 es semilla; solo se libera 11:00.
    expect(res.state.ocupados['voley-1']['2026-10-13']).toEqual([
      '08:00',
      '09:00',
      '10:00',
    ]);
  });

  test('#66 (S5): horas compartidas al cancelar con aplicarCancelacion y quitarReservasDeEstado, incluida la última hora del día y un evento con bloques', () => {
    const fecha = '2026-11-25';
    const ahora = new Date(2026, 10, 20, 10, 0);
    const ultimaHora = semilla.horas[semilla.horas.length - 1];

    const probarPar = (hora) => {
      const rX = {
        id: `padel-1__${fecha}__${hora}__1`,
        codigo: 'SPF-S5X',
        tipo: 'individual',
        canchaId: 'padel-1',
        fecha,
        hora,
        horas: [hora],
        nombre: 'Persona X',
      };
      const rY = {
        id: `padel-1__${fecha}__${hora}__2`,
        codigo: 'SPF-S5Y',
        tipo: 'individual',
        canchaId: 'padel-1',
        fecha,
        hora,
        horas: [hora],
        nombre: 'Persona Y',
      };
      const estado = {
        ocupados: { 'padel-1': { [fecha]: ['12:00', hora] } },
        reservas: [rX, rY],
      };

      const trasX = aplicarCancelacion(estado, rX.id, ahora);
      expect(trasX.error).toBeNull();
      expect(trasX.state.reservas.map((r) => r.codigo)).toEqual(['SPF-S5Y']);
      expect(trasX.state.ocupados['padel-1'][fecha]).toEqual(['12:00', hora]);

      const trasY = aplicarCancelacion(trasX.state, rY.id, ahora);
      expect(trasY.error).toBeNull();
      expect(trasY.state.reservas).toEqual([]);
      expect(trasY.state.ocupados['padel-1'][fecha]).toEqual(['12:00']);

      const trasSoloX = quitarReservasDeEstado(estado, [rX.id]);
      expect(trasSoloX.reservas.map((r) => r.codigo)).toEqual(['SPF-S5Y']);
      expect(trasSoloX.ocupados['padel-1'][fecha]).toEqual(['12:00', hora]);

      const trasAmbos = quitarReservasDeEstado(estado, [rX.id, rY.id]);
      expect(trasAmbos.reservas).toEqual([]);
      expect(trasAmbos.ocupados['padel-1'][fecha]).toEqual(['12:00']);
    };

    probarPar('14:00');
    probarPar(ultimaHora);

    const rXEv = {
      id: `padel-1__${fecha}__14:00__3`,
      codigo: 'SPF-S5XEV',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha,
      hora: '14:00',
      horas: ['14:00'],
      nombre: 'Persona X',
    };
    const rEv = {
      id: `evento__${fecha}__4`,
      codigo: 'SPF-S5EV',
      tipo: 'evento',
      subtipo: 'torneo',
      fecha,
      canchaIds: ['padel-1'],
      horas: ['14:00'],
      bloques: [
        {
          ronda: 1,
          nombreRonda: 'Final',
          fecha,
          canchaIds: ['padel-1'],
          horas: ['14:00'],
        },
      ],
      nombre: 'Torneo Compartido',
    };
    const estadoConEvento = {
      ocupados: { 'padel-1': { [fecha]: ['14:00'] } },
      reservas: [rXEv, rEv],
    };

    const trasXEv = aplicarCancelacion(estadoConEvento, rXEv.id, ahora);
    expect(trasXEv.error).toBeNull();
    expect(trasXEv.state.reservas.map((r) => r.codigo)).toEqual(['SPF-S5EV']);
    expect(trasXEv.state.ocupados['padel-1'][fecha]).toEqual(['14:00']);

    const trasQuitarXEv = quitarReservasDeEstado(estadoConEvento, [rXEv.id]);
    expect(trasQuitarXEv.reservas.map((r) => r.codigo)).toEqual(['SPF-S5EV']);
    expect(trasQuitarXEv.ocupados['padel-1'][fecha]).toEqual(['14:00']);
  });

  test('aplicarCancelacion con id inexistente devuelve error noEncontrada y el mismo objeto state', () => {
    const estadoOriginal = crearEstado();
    const resultado = aplicarCancelacion(estadoOriginal, 'nada', ahoraBase);

    expect(resultado.error).toBe(MENSAJES_CANCELACION.noEncontrada);
    expect(resultado.state).toBe(estadoOriginal);
  });

  test('aplicarCancelacion con reserva de tipo evento devuelve error evento', () => {
    const estadoOriginal = crearEstado();
    const resultado = aplicarCancelacion(estadoOriginal, 'e1', ahoraBase);

    expect(resultado.error).toBe(MENSAJES_CANCELACION.evento);
    expect(resultado.state).toBe(estadoOriginal);
  });

  test('aplicarCancelacion dentro de la ventana de 6 horas falla, pero exactamente a las 6 horas sí cancela', () => {
    const estadoOriginal = crearEstado();

    const ahora4h = new Date(2026, 9, 13, 5, 0);
    const res4h = aplicarCancelacion(estadoOriginal, 'r1', ahora4h);
    expect(res4h.error).toBe(MENSAJES_CANCELACION.fueraDePlazo);
    expect(res4h.state).toBe(estadoOriginal);

    const ahora6h = new Date(2026, 9, 13, 3, 0);
    const res6h = aplicarCancelacion(estadoOriginal, 'r1', ahora6h);
    expect(res6h.error).toBeNull();
    expect(res6h.state.reservas.find((r) => r.id === 'r1')).toBeUndefined();
    expect(res6h.state.ocupados['voley-1']['2026-10-13']).toEqual(['08:00']);
  });

  test('verificarCancelable de una reserva que ya pasó devuelve fueraDePlazo', () => {
    const ahoraPasada = new Date(2026, 9, 13, 10, 0);
    const verificacion = verificarCancelable(r1, ahoraPasada);
    expect(verificacion).toEqual({
      ok: false,
      error: MENSAJES_CANCELACION.fueraDePlazo,
    });
  });

  test('buscarReservasCancelables filtra por nombre, teléfono, fecha, hora y ventana', () => {
    const reservas = [r1, e1, r2];

    const resultadoBase = buscarReservasCancelables({
      reservas,
      nombre: 'jose pena',
      telefono: '+57 300 123 4567',
      ahora: ahoraBase,
    });
    expect(resultadoBase.cancelables).toEqual([r1]);
    expect(resultadoBase.enVentana).toEqual([]);

    const resOtroTel = buscarReservasCancelables({
      reservas,
      nombre: 'jose pena',
      telefono: '3119998877',
      ahora: ahoraBase,
    });
    expect(resOtroTel.cancelables).toEqual([]);
    expect(resOtroTel.enVentana).toEqual([]);

    const resFecha = buscarReservasCancelables({
      reservas,
      nombre: 'jose pena',
      telefono: '+57 300 123 4567',
      fecha: '2026-10-14',
      ahora: ahoraBase,
    });
    expect(resFecha.cancelables).toEqual([]);
    expect(resFecha.enVentana).toEqual([]);

    const resHora = buscarReservasCancelables({
      reservas,
      nombre: 'jose pena',
      telefono: '+57 300 123 4567',
      hora: '10:00',
      ahora: ahoraBase,
    });
    expect(resHora.cancelables).toEqual([r1]);
    expect(resHora.enVentana).toEqual([]);

    const ahora4h = new Date(2026, 9, 13, 5, 0);
    const resVentana = buscarReservasCancelables({
      reservas,
      nombre: 'jose pena',
      telefono: '+57 300 123 4567',
      ahora: ahora4h,
    });
    expect(resVentana.cancelables).toEqual([]);
    expect(resVentana.enVentana).toEqual([r1]);

    const resNombreVacio = buscarReservasCancelables({
      reservas,
      nombre: '',
      telefono: '+57 300 123 4567',
      ahora: ahoraBase,
    });
    expect(resNombreVacio.cancelables).toEqual([]);
    expect(resNombreVacio.enVentana).toEqual([]);
  });

  test('normalizarComparacion limpia tildes, mayúsculas y espacios repetidos', () => {
    expect(normalizarComparacion('José  PEÑA ')).toBe('jose pena');
  });

  describe('normalizarCodigo y buscarReservaPorCodigo', () => {
    test('normalizarCodigo limpia espacios, pasa a mayúsculas y antepone SPF- si falta', () => {
      expect(normalizarCodigo('spf-abcdef')).toBe('SPF-ABCDEF');
      expect(normalizarCodigo('SPF ABCDEF')).toBe('SPF-ABCDEF');
      expect(normalizarCodigo('ABCDEF')).toBe('SPF-ABCDEF');
      expect(normalizarCodigo('  spf - abcdef  ')).toBe('SPF-ABCDEF');
      expect(normalizarCodigo('')).toBe('');
      expect(normalizarCodigo(null)).toBe('');
    });

    test('buscarReservaPorCodigo encuentra reservas individuales y eventos con diversas variantes de formato', () => {
      const reservas = [r1, e1, r2];

      expect(buscarReservaPorCodigo(reservas, 'spf-abcdef')).toBe(r1);
      expect(buscarReservaPorCodigo(reservas, 'SPF ABCDEF')).toBe(r1);
      expect(buscarReservaPorCodigo(reservas, 'ABCDEF')).toBe(r1);
      expect(buscarReservaPorCodigo(reservas, '  spf - evt001 ')).toBe(e1);
      expect(buscarReservaPorCodigo(reservas, 'EVT001')).toBe(e1);
    });

    test('buscarReservaPorCodigo devuelve null si no existe o si los argumentos son inválidos', () => {
      const reservas = [r1, e1];
      expect(buscarReservaPorCodigo(reservas, 'INEXISTENTE')).toBeNull();
      expect(buscarReservaPorCodigo(reservas, '')).toBeNull();
      expect(buscarReservaPorCodigo(null, 'ABCDEF')).toBeNull();
    });
  });

  describe('buscarReservasDePersona', () => {
    test('devuelve reservas futuras de cualquier tipo ordenadas por inicio', () => {
      const reservas = [e1, r1, r2]; // e1 es a las 14:00, r1 es a las 09:00 del mismo día 2026-10-13

      const encontradas = buscarReservasDePersona({
        reservas,
        nombre: 'jose pena',
        telefono: '3001234567',
        ahora: ahoraBase, // 2026-10-12 10:00
      });

      // Debe incluir r1 (individual) y e1 (evento), ordenados: r1 (09:00) primero, luego e1 (14:00)
      expect(encontradas).toEqual([r1, e1]);
    });

    test('reserva sin teléfono nunca coincide', () => {
      const reservas = [r2]; // r2 tiene telefono: null
      const encontradas = buscarReservasDePersona({
        reservas,
        nombre: 'José Peña',
        telefono: '3001234567',
        ahora: ahoraBase,
      });
      expect(encontradas).toEqual([]);
    });

    test('teléfono diferente no coincide', () => {
      const reservas = [r1, e1];
      const encontradas = buscarReservasDePersona({
        reservas,
        nombre: 'José Peña',
        telefono: '3119998877',
        ahora: ahoraBase,
      });
      expect(encontradas).toEqual([]);
    });

    test('excluye reservas pasadas', () => {
      const reservas = [r1, e1];
      const ahoraTarde = new Date(2026, 9, 13, 11, 0); // Después de r1 (09:00), antes de e1 (14:00)

      const encontradas = buscarReservasDePersona({
        reservas,
        nombre: 'José Peña',
        telefono: '3001234567',
        ahora: ahoraTarde,
      });

      expect(encontradas).toEqual([e1]);
    });

    test('devuelve array vacío ante parámetros vacíos o inválidos', () => {
      expect(
        buscarReservasDePersona({
          reservas: [r1],
          nombre: '',
          telefono: '3001234567',
          ahora: ahoraBase,
        })
      ).toEqual([]);

      expect(
        buscarReservasDePersona({
          reservas: [r1],
          nombre: 'José Peña',
          telefono: '',
          ahora: ahoraBase,
        })
      ).toEqual([]);

      expect(
        buscarReservasDePersona({
          reservas: null,
          nombre: 'José Peña',
          telefono: '3001234567',
          ahora: ahoraBase,
        })
      ).toEqual([]);
    });
  });
});

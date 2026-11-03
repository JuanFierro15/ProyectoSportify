import {
  MENSAJES_CANCELACION,
  normalizarComparacion,
  normalizarCodigo,
  verificarCancelable,
  aplicarCancelacion,
  buscarReservasCancelables,
  buscarReservaPorCodigo,
  buscarReservasDePersona,
} from './cancelacion';

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

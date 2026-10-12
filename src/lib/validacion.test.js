import {
  MENSAJE_NOMBRE,
  MENSAJE_NOMBRE_VACIO,
  MENSAJE_TELEFONO,
  limpiarNombre,
  limpiarTelefono,
  errorNombre,
  errorNombreObligatorio,
  errorTelefono,
  empiezaMalTelefono,
  normalizarNombre,
  normalizarTelefono,
  MENSAJES_CHAT,
  mensajeHoraOcupada,
  fechasVentana,
  validarContactoChat,
  validarPropuestaReserva,
} from './validacion';

describe('teléfono', () => {
  test('limpia a solo dígitos y máximo 10', () => {
    expect(limpiarTelefono('300 123-4567 99')).toBe('3001234567');
  });

  test('válido e inválidos', () => {
    expect(errorTelefono('3001234567')).toBe('');
    expect(errorTelefono('2001234567')).toBe(MENSAJE_TELEFONO);
    expect(errorTelefono('300123')).toBe(MENSAJE_TELEFONO);
  });

  test('empiezaMalTelefono avisa solo si el primer dígito no es 3', () => {
    expect(empiezaMalTelefono('2')).toBe(true);
    expect(empiezaMalTelefono('3')).toBe(false);
    expect(empiezaMalTelefono('')).toBe(false);
  });
});

describe('nombre', () => {
  test('limpia números y símbolos', () => {
    expect(limpiarNombre('Ana 123 Ñu!')).toBe('Ana Ñu');
  });

  test('válido e inválido', () => {
    expect(errorNombre('José Núñez')).toBe('');
    expect(errorNombre('Ana1')).toBe(MENSAJE_NOMBRE);
  });

  test('errorNombreObligatorio: vacío y solo espacios devuelven MENSAJE_NOMBRE_VACIO', () => {
    expect(errorNombreObligatorio('')).toBe(MENSAJE_NOMBRE_VACIO);
    expect(errorNombreObligatorio('   ')).toBe(MENSAJE_NOMBRE_VACIO);
  });

  test('errorNombreObligatorio: nombre válido devuelve cadena vacía', () => {
    expect(errorNombreObligatorio('Juan Pérez')).toBe('');
  });

  test('errorNombreObligatorio: nombre con números devuelve MENSAJE_NOMBRE', () => {
    expect(errorNombreObligatorio('Juan3')).toBe(MENSAJE_NOMBRE);
  });
});

describe('normalizarNombre', () => {
  test('recorta y reduce espacios intermedios', () => {
    expect(normalizarNombre('  José   Ñúñez  ')).toBe('José Ñúñez');
  });
});

describe('normalizarTelefono', () => {
  test('quita caracteres no numéricos y prefijo +57', () => {
    expect(normalizarTelefono('+57 300 123 4567')).toBe('3001234567');
    expect(normalizarTelefono('300-123.4567')).toBe('3001234567');
  });
});

describe('fechasVentana', () => {
  test('genera 7 fechas desde fechaHoy de 2026-10-12 a 2026-10-18', () => {
    const ventana = fechasVentana('2026-10-12');
    expect(ventana).toHaveLength(7);
    expect(ventana[0]).toBe('2026-10-12');
    expect(ventana[6]).toBe('2026-10-18');
  });

  test('cruza el año correctamente con 2027-01-04 al final', () => {
    const ventana = fechasVentana('2026-12-29');
    expect(ventana).toHaveLength(7);
    expect(ventana[6]).toBe('2027-01-04');
  });
});

describe('validarContactoChat', () => {
  test('contacto válido con María José Peña y 3001234567', () => {
    expect(validarContactoChat('María José Peña', '3001234567')).toEqual({
      ok: true,
      error: null,
    });
  });

  test('nombre con Juan123 devuelve MENSAJES_CHAT.nombre y vacío devuelve nombreVacio', () => {
    expect(validarContactoChat('Juan123', '3001234567')).toEqual({
      ok: false,
      error: MENSAJES_CHAT.nombre,
    });
    expect(validarContactoChat('', '3001234567')).toEqual({
      ok: false,
      error: MENSAJES_CHAT.nombreVacio,
    });
  });

  test('teléfono con 2001234567 o 9 dígitos devuelve MENSAJES_CHAT.telefono y vacío devuelve telefonoVacio', () => {
    expect(validarContactoChat('María José Peña', '2001234567')).toEqual({
      ok: false,
      error: MENSAJES_CHAT.telefono,
    });
    expect(validarContactoChat('María José Peña', '300123456')).toEqual({
      ok: false,
      error: MENSAJES_CHAT.telefono,
    });
    expect(validarContactoChat('María José Peña', '')).toEqual({
      ok: false,
      error: MENSAJES_CHAT.telefonoVacio,
    });
  });

  test('normalizarTelefono con +573001234567 pasa la validación', () => {
    expect(
      validarContactoChat('María José Peña', normalizarTelefono('+573001234567'))
    ).toEqual({
      ok: true,
      error: null,
    });
  });
});

describe('validarPropuestaReserva', () => {
  const contexto = {
    fechaHoy: '2026-10-12',
    canchas: [{ id: 'voley-1' }, { id: 'padel-2' }],
    disponibilidad: [
      {
        canchaId: 'voley-1',
        fecha: '2026-10-12',
        franjasLibres: ['09:00', '10:00', '11:00', '15:00'],
      },
    ],
  };

  test('válida con 09:00 y 10:00', () => {
    const propuesta = {
      canchaId: 'voley-1',
      fecha: '2026-10-12',
      horas: ['09:00', '10:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuesta, contexto)).toEqual({
      ok: true,
      error: null,
    });
  });

  test('cancha tenis-1 devuelve MENSAJES_CHAT.cancha', () => {
    const propuesta = {
      canchaId: 'tenis-1',
      fecha: '2026-10-12',
      horas: ['09:00', '10:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuesta, contexto)).toEqual({
      ok: false,
      error: MENSAJES_CHAT.cancha,
    });
  });

  test('fecha 2026-10-19 fuera de la ventana devuelve fecha y 2026-10-18 pasa ventana pero falla por franja ocupada', () => {
    const propuestaFuera = {
      canchaId: 'voley-1',
      fecha: '2026-10-19',
      horas: ['09:00', '10:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuestaFuera, contexto)).toEqual({
      ok: false,
      error: MENSAJES_CHAT.fecha,
    });

    const propuestaSinDisp = {
      canchaId: 'voley-1',
      fecha: '2026-10-18',
      horas: ['09:00', '10:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuestaSinDisp, contexto)).toEqual({
      ok: false,
      error: mensajeHoraOcupada('09:00'),
    });
  });

  test('horas vacías devuelve MENSAJES_CHAT.horasVacias', () => {
    const propuesta = {
      canchaId: 'voley-1',
      fecha: '2026-10-12',
      horas: [],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuesta, contexto)).toEqual({
      ok: false,
      error: MENSAJES_CHAT.horasVacias,
    });
  });

  test('4 horas supera MAX_HORAS_SEGUIDAS y devuelve MENSAJES_CHAT.horasMax', () => {
    const propuesta = {
      canchaId: 'voley-1',
      fecha: '2026-10-12',
      horas: ['09:00', '10:00', '11:00', '12:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuesta, contexto)).toEqual({
      ok: false,
      error: MENSAJES_CHAT.horasMax,
    });
  });

  test('horas no consecutivas o repetidas devuelve MENSAJES_CHAT.horasSeguidas', () => {
    const noConsecutivas = {
      canchaId: 'voley-1',
      fecha: '2026-10-12',
      horas: ['09:00', '11:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(noConsecutivas, contexto)).toEqual({
      ok: false,
      error: MENSAJES_CHAT.horasSeguidas,
    });

    const repetidas = {
      canchaId: 'voley-1',
      fecha: '2026-10-12',
      horas: ['10:00', '10:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(repetidas, contexto)).toEqual({
      ok: false,
      error: MENSAJES_CHAT.horasSeguidas,
    });
  });

  test('11:00 y 12:00 falla en 12:00 por estar ocupada', () => {
    const propuesta = {
      canchaId: 'voley-1',
      fecha: '2026-10-12',
      horas: ['11:00', '12:00'],
      nombre: 'María José Peña',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuesta, contexto)).toEqual({
      ok: false,
      error: mensajeHoraOcupada('12:00'),
    });
  });

  test('nombre inválido Juan123 devuelve MENSAJES_CHAT.nombre', () => {
    const propuesta = {
      canchaId: 'voley-1',
      fecha: '2026-10-12',
      horas: ['09:00', '10:00'],
      nombre: 'Juan123',
      telefono: '3001234567',
    };
    expect(validarPropuestaReserva(propuesta, contexto)).toEqual({
      ok: false,
      error: MENSAJES_CHAT.nombre,
    });
  });
});

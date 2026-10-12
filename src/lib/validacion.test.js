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

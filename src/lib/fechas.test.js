import { vi } from 'vitest';
import { esHoraPasada, fechaCompleta, horaAmPm } from './fechas';

describe('fechaCompleta', () => {
  test('día de la semana, número y mes, sin fechas relativas', () => {
    expect(fechaCompleta('2026-10-13')).toBe('Martes 13 de octubre');
    expect(fechaCompleta('2026-10-14')).toBe('Miércoles 14 de octubre');
  });
});

describe('esHoraPasada', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 11 de octubre de 2026, 15:30 (los meses empiezan en 0)
    vi.setSystemTime(new Date(2026, 9, 11, 15, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('hoy: las horas anteriores a la actual ya pasaron', () => {
    expect(esHoraPasada('2026-10-11', '08:00')).toBe(true);
    expect(esHoraPasada('2026-10-11', '15:00')).toBe(true);
  });

  test('hoy: las posteriores no', () => {
    expect(esHoraPasada('2026-10-11', '16:00')).toBe(false);
  });

  test('otros días nunca están pasados', () => {
    expect(esHoraPasada('2026-10-12', '08:00')).toBe(false);
  });
});

describe('horaAmPm', () => {
  test('formato de 12 horas en español de Colombia', () => {
    expect(horaAmPm('09:00')).toBe('9:00 a. m.');
    expect(horaAmPm('08:30')).toBe('8:30 a. m.');
    expect(horaAmPm('12:00')).toBe('12:00 m.');
    expect(horaAmPm('13:00')).toBe('1:00 p. m.');
    expect(horaAmPm('20:00')).toBe('8:00 p. m.');
    expect(horaAmPm('00:00')).toBe('12:00 a. m.');
  });

  test('valor inválido se devuelve tal cual', () => {
    expect(horaAmPm('hola')).toBe('hola');
  });
});

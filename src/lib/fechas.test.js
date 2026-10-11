import { esHoraPasada } from './fechas';

describe('esHoraPasada', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // 11 de octubre de 2026, 15:30 (los meses empiezan en 0)
    jest.setSystemTime(new Date(2026, 9, 11, 15, 30));
  });

  afterEach(() => {
    jest.useRealTimers();
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

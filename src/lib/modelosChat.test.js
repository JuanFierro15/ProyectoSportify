// Pruebas unitarias para la lógica de selección y respaldo de modelos en el chat.
// Valida orden por disponibilidad, tiempos por intento, reintentos y errores finales.

import {
  MAX_MODELOS,
  listaModelos,
  esTiempoAgotado,
  esReintentable,
  ordenarPorDisponibilidad,
  registrarFalla,
  registrarExito,
  tiempoIntento,
  respuestaFinal,
} from './modelosChat';

describe('listaModelos', () => {
  test('devuelve el modelo principal y respaldos por defecto sin variables de entorno', () => {
    expect(listaModelos()).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
    ]);
    expect(listaModelos({})).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
    ]);
  });

  test('usa GEMINI_MODEL propio cuando está definido', () => {
    expect(listaModelos({ GEMINI_MODEL: 'gemini-custom' })).toEqual([
      'gemini-custom',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
    ]);
  });

  test('usa el principal por defecto si GEMINI_MODEL está vacío o solo contiene espacios', () => {
    expect(listaModelos({ GEMINI_MODEL: '' })).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
    ]);
    expect(listaModelos({ GEMINI_MODEL: '   ' })).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
    ]);
  });

  test('devuelve solo el modelo principal cuando GEMINI_MODELOS_RESPALDO es cadena vacía', () => {
    expect(listaModelos({ GEMINI_MODELOS_RESPALDO: '' })).toEqual([
      'gemini-3.5-flash-lite',
    ]);
  });

  test('procesa lista propia con espacios y comas sobrantes', () => {
    expect(listaModelos({ GEMINI_MODELOS_RESPALDO: ' a , ,b ' })).toEqual([
      'gemini-3.5-flash-lite',
      'a',
      'b',
    ]);
  });

  test('elimina duplicados conservando el primer orden de aparición', () => {
    expect(
      listaModelos({
        GEMINI_MODEL: 'gemini-3.1-flash-lite',
        GEMINI_MODELOS_RESPALDO: 'gemini-3.1-flash-lite, gemini-3.6-flash',
      })
    ).toEqual(['gemini-3.1-flash-lite', 'gemini-3.6-flash']);
  });

  test('limita el resultado a un máximo de tres modelos', () => {
    const resultado = listaModelos({
      GEMINI_MODEL: 'm1',
      GEMINI_MODELOS_RESPALDO: 'm2, m3, m4, m5',
    });
    expect(resultado).toEqual(['m1', 'm2', 'm3']);
    expect(resultado).toHaveLength(MAX_MODELOS);
  });
});

describe('esReintentable y esTiempoAgotado', () => {
  test('identifica tiempos de espera agotados', () => {
    expect(esTiempoAgotado({ name: 'TimeoutError' })).toBe(true);
    expect(esTiempoAgotado({ name: 'AbortError' })).toBe(true);
    expect(esTiempoAgotado({ name: 'ApiError' })).toBe(false);
    expect(esTiempoAgotado(null)).toBe(false);
    expect(esTiempoAgotado(undefined)).toBe(false);
  });

  test('devuelve true para errores reintentables y tiempos de espera', () => {
    expect(esReintentable({ name: 'ApiError', status: 503 })).toBe(true);
    expect(esReintentable({ status: 429 })).toBe(true);
    expect(esReintentable({ status: 500 })).toBe(true);
    expect(esReintentable({ status: 404 })).toBe(true);
    expect(esReintentable({ status: 504 })).toBe(true);
    expect(esReintentable({ name: 'TimeoutError' })).toBe(true);
    expect(esReintentable({ name: 'AbortError' })).toBe(true);
  });

  test('devuelve false para errores no reintentables y valores nulos', () => {
    expect(esReintentable({ status: 400 })).toBe(false);
    expect(esReintentable({ status: 401 })).toBe(false);
    expect(esReintentable({ status: 403 })).toBe(false);
    expect(esReintentable(new TypeError('x'))).toBe(false);
    expect(esReintentable(null)).toBe(false);
    expect(esReintentable(undefined)).toBe(false);
  });
});

describe('ordenarPorDisponibilidad', () => {
  const modelos = ['m1', 'm2', 'm3'];
  const ahora = 100000;

  test('manda al final un modelo con falla reciente (hace 10 s)', () => {
    const fallas = new Map([['m1', ahora - 10000]]);
    const resultado = ordenarPorDisponibilidad(modelos, fallas, ahora);
    expect(resultado).toEqual(['m2', 'm3', 'm1']);
  });

  test('no altera el orden si la falla está vencida (hace 61 s)', () => {
    const fallas = new Map([['m1', ahora - 61000]]);
    const resultado = ordenarPorDisponibilidad(modelos, fallas, ahora);
    expect(resultado).toEqual(['m1', 'm2', 'm3']);
  });

  test('conserva el orden original si todos los modelos están en enfriamiento', () => {
    const fallas = new Map([
      ['m1', ahora - 10000],
      ['m2', ahora - 20000],
      ['m3', ahora - 30000],
    ]);
    const resultado = ordenarPorDisponibilidad(modelos, fallas, ahora);
    expect(resultado).toEqual(['m1', 'm2', 'm3']);
  });

  test('no modifica el array de entrada', () => {
    const copia = [...modelos];
    const fallas = new Map([['m1', ahora - 10000]]);
    ordenarPorDisponibilidad(modelos, fallas, ahora);
    expect(modelos).toEqual(copia);
  });
});

describe('registrarFalla y registrarExito', () => {
  test('registrarFalla actualiza el Map con el instante de falla y devuelve el Map', () => {
    const fallas = new Map();
    const resultado = registrarFalla(fallas, 'm1', 50000);
    expect(resultado).toBe(fallas);
    expect(fallas.get('m1')).toBe(50000);
  });

  test('registrarExito elimina el modelo del Map y devuelve el Map', () => {
    const fallas = new Map([['m1', 50000]]);
    const resultado = registrarExito(fallas, 'm1');
    expect(resultado).toBe(fallas);
    expect(fallas.has('m1')).toBe(false);
  });
});

describe('tiempoIntento', () => {
  test('calcula los milisegundos según el intento y el tiempo restante', () => {
    expect(tiempoIntento(0, 17000)).toBe(7000);
    expect(tiempoIntento(1, 10000)).toBe(6000);
    expect(tiempoIntento(2, 4000)).toBe(4000);
    expect(tiempoIntento(2, 2000)).toBe(0);
    expect(tiempoIntento(0, 2500)).toBe(2500);
  });
});

describe('respuestaFinal', () => {
  test('devuelve status 429 y clave limite cuando todos los errores tienen status 429', () => {
    expect(respuestaFinal([{ status: 429 }, { status: 429 }])).toEqual({
      status: 429,
      clave: 'limite',
    });
  });

  test('devuelve status 504 cuando al menos un error fue por tiempo agotado', () => {
    expect(
      respuestaFinal([{ status: 429 }, { name: 'TimeoutError' }])
    ).toEqual({
      status: 504,
      clave: 'generico',
    });
  });

  test('devuelve status 502 cuando hay errores mixtos sin tiempo agotado', () => {
    expect(respuestaFinal([{ status: 503 }, { status: 429 }])).toEqual({
      status: 502,
      clave: 'generico',
    });
  });

  test('devuelve status 502 cuando el array de errores está vacío', () => {
    expect(respuestaFinal([])).toEqual({
      status: 502,
      clave: 'generico',
    });
  });
});

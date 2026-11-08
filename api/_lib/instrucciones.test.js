import { describe, expect, test } from 'vitest';
import { construirInstrucciones } from './instrucciones.js';
import { prepararContexto } from './peticion.js';

describe('construirInstrucciones', () => {
  test('genera instrucciones deterministas y estables contra snapshot', () => {
    const contextoBruto = {
      fechaHoy: '2026-11-09',
      horaActual: '07:00',
      disponibilidad: [
        {
          canchaId: 'voley-1',
          fecha: '2026-11-09',
          franjasLibres: ['08:00', '09:00', '10:00'],
        },
        {
          canchaId: 'voley-1',
          fecha: '2026-11-10',
          franjasLibres: ['14:00', '15:00'],
        },
        {
          canchaId: 'padel-1',
          fecha: '2026-11-09',
          franjasLibres: ['10:00', '11:00'],
        },
        {
          canchaId: 'padel-1',
          fecha: '2026-11-10',
          franjasLibres: ['16:00', '17:00'],
        },
      ],
    };

    const contexto = prepararContexto(contextoBruto);
    const texto = construirInstrucciones(contexto);

    expect(texto).toMatchSnapshot();
  });
});

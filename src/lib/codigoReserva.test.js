import { formatoPrecio } from './precios';
import { REGEX_CODIGO, generarCodigo, textoQr } from './codigoReserva';

describe('generarCodigo', () => {
  test('cumple REGEX_CODIGO al llamarlo varias veces', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(generarCodigo()).toMatch(REGEX_CODIGO);
    }
  });

  test('con función aleatoria fija devuelve SPF-AAAAAA', () => {
    expect(generarCodigo(() => 0)).toBe('SPF-AAAAAA');
  });
});

describe('textoQr', () => {
  test('con teléfono incluye la línea Teléfono: 3001234567, empieza con SPORTIFY · RESERVA e incluye Canchas: A, B y total formateado', () => {
    const texto = textoQr({
      codigo: 'SPF-ABCDEF',
      tipo: 'Torneo',
      fecha: '15 de octubre de 2026',
      horario: '08:00 a 11:00',
      canchas: ['A', 'B'],
      nombre: 'Carlos',
      telefono: '3001234567',
      total: 585000,
    });

    expect(texto.startsWith('SPORTIFY · RESERVA')).toBe(true);
    expect(texto).toContain('Teléfono: 3001234567');
    expect(texto).toContain('Canchas: A, B');
    expect(texto).toContain(formatoPrecio.format(585000));
  });

  test('sin teléfono no incluye la línea Teléfono:', () => {
    const texto = textoQr({
      codigo: 'SPF-ABCDEF',
      tipo: 'Cancha',
      fecha: '15 de octubre de 2026',
      horario: '08:00 a 09:00',
      canchas: ['Cancha 1'],
      nombre: 'Carlos',
      telefono: null,
      total: 45000,
    });

    expect(texto).not.toContain('Teléfono:');
  });
});

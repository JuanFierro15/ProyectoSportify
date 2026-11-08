import { formatoPrecio } from './precios';
import { generarCodigo, textoQr } from './codigoReserva';

describe('generarCodigo', () => {
  test('con función aleatoria fija devuelve SPF-AAAAAA', () => {
    expect(generarCodigo(() => 0)).toBe('SPF-AAAAAA');
  });

  test('llamado muchas veces nunca produce los caracteres ambiguos 0, O, 1 ni I y respeta el formato SPF- más 6 caracteres de su alfabeto', () => {
    const patronCodigo = /^SPF-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
    const ambiguos = /[0O1I]/;

    // Barrido determinista de las 32 posiciones del alfabeto
    for (let pos = 0; pos < 32; pos += 1) {
      const codigo = generarCodigo(() => pos / 32);
      expect(codigo).toMatch(patronCodigo);
      expect(codigo.slice(4)).not.toMatch(ambiguos);
    }

    // Muestreo aleatorio amplio
    for (let i = 0; i < 300; i += 1) {
      const codigo = generarCodigo();
      expect(codigo).toMatch(patronCodigo);
      expect(codigo.slice(4)).not.toMatch(ambiguos);
    }
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

  test('con torneo y jornadas incluye la línea de cada fase con su fecha y rango de horas', () => {
    const texto = textoQr({
      codigo: 'SPF-TORNEO',
      tipo: 'Torneo',
      fecha: '01 de noviembre de 2026',
      horario: '3 jornadas',
      canchas: ['Cancha 1', 'Cancha 2', 'Cancha 3'],
      nombre: 'Carlos',
      telefono: '3001234567',
      total: 375000,
      torneo: {
        equipos: 8,
        duracionPartido: 20,
        jornadas: [
          { nombreRonda: 'Cuartos de final', fecha: '2026-11-01', horas: ['08:00', '09:00'] },
          { nombreRonda: 'Semifinal', fecha: '2026-11-02', horas: ['10:00'] },
          { nombreRonda: 'Final', fecha: '2026-11-03', horas: ['14:00'] },
        ],
      },
    });

    expect(texto).toContain('Fase Cuartos de final: 2026-11-01 (08:00 a 10:00)');
    expect(texto).toContain('Fase Semifinal: 2026-11-02 (10:00 a 11:00)');
    expect(texto).toContain('Fase Final: 2026-11-03 (14:00 a 15:00)');
  });
});

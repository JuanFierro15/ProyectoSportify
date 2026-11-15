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

  test('con torneo y jornadas viejas (solo horas) conserva el rango de horas por fase', () => {
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

  test('con torneo y horasPorCancha escribe una línea por fase con las horas de cada cancha', () => {
    const texto = textoQr({
      codigo: 'SPF-NUEVO1',
      tipo: 'Torneo',
      fecha: '21 de noviembre de 2026',
      horario: '2 jornadas',
      canchas: ['Fútbol 1', 'Fútbol 2'],
      nombre: 'Carlos',
      telefono: '3001234567',
      total: 400000,
      torneo: {
        equipos: 4,
        duracionPartido: 20,
        jornadas: [
          {
            nombreRonda: 'Cuartos de final',
            fecha: '2026-11-21',
            canchaIds: ['futbol-1', 'futbol-2'],
            horasPorCancha: {
              'futbol-1': ['16:00', '18:00'],
              'futbol-2': ['19:00'],
            },
          },
          {
            nombreRonda: 'Final',
            fecha: '2026-11-22',
            canchaIds: ['futbol-2'],
            horasPorCancha: {
              'futbol-1': [],
              'futbol-2': ['20:00'],
            },
          },
        ],
      },
    });

    expect(texto).toContain(
      'Fase Cuartos de final: 2026-11-21 · futbol-1: 16:00, 18:00 · futbol-2: 19:00'
    );
    expect(texto).toContain('Fase Final: 2026-11-22 · futbol-2: 20:00');
    expect(texto).not.toContain('futbol-1: \n');
  });

  test('con nombresCanchas usa el nombre de la cancha y cae al id si falta en el mapa', () => {
    const texto = textoQr({
      codigo: 'SPF-NOMB1',
      tipo: 'Torneo',
      fecha: '21 de noviembre de 2026',
      horario: '2 jornadas',
      canchas: ['Cancha Pádel 1', 'Cancha Pádel 2'],
      nombre: 'Carlos',
      telefono: '3001234567',
      total: 400000,
      nombresCanchas: {
        'padel-1': 'Cancha Pádel 1',
      },
      torneo: {
        equipos: 4,
        duracionPartido: 20,
        jornadas: [
          {
            nombreRonda: 'Semifinal',
            fecha: '2026-11-21',
            canchaIds: ['padel-1', 'padel-2'],
            horasPorCancha: {
              'padel-1': ['16:00', '18:00'],
              'padel-2': ['19:00'],
            },
          },
        ],
      },
    });

    expect(texto).toContain(
      'Fase Semifinal: 2026-11-21 · Cancha Pádel 1: 16:00, 18:00 · padel-2: 19:00'
    );
  });
});

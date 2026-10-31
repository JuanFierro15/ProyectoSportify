import {
  calcularPrecio,
  calcularPrecioEvento,
  calcularPrecioJornadas,
  finDeFranja,
} from './precios';

describe('calcularPrecio (cancha de 45.000 por hora)', () => {
  test('1 hora: sin descuento ni agua', () => {
    const p = calcularPrecio(45000, 1);
    expect(p.total).toBe(45000);
    expect(p.ahorro).toBe(0);
    expect(p.aguaGratis).toBe(false);
  });

  test('2 horas: 5.000 menos por hora y agua gratis', () => {
    const p = calcularPrecio(45000, 2);
    expect(p.precioHoraFinal).toBe(40000);
    expect(p.total).toBe(80000);
    expect(p.ahorro).toBe(10000);
    expect(p.aguaGratis).toBe(true);
  });

  test('3 horas', () => {
    const p = calcularPrecio(45000, 3);
    expect(p.total).toBe(120000);
    expect(p.ahorro).toBe(15000);
    expect(p.aguaGratis).toBe(true);
  });
});

describe('calcularPrecioEvento', () => {
  test('dos canchas (45000 y 60000) por 1 hora: total 105000, ahorro 0, packsAgua 0, lineas.length 2', () => {
    const canchas = [
      { id: 'c1', nombre: 'Cancha 1', deporte: 'Fútbol', precioHora: 45000 },
      { id: 'c2', nombre: 'Cancha 2', deporte: 'Tenis', precioHora: 60000 },
    ];
    const res = calcularPrecioEvento(canchas, 1);
    expect(res.total).toBe(105000);
    expect(res.ahorro).toBe(0);
    expect(res.packsAgua).toBe(0);
    expect(res.lineas.length).toBe(2);
  });

  test('dos canchas (45000 y 60000) por 3 horas: total 285000, ahorro 30000, packsAgua 2', () => {
    const canchas = [
      { id: 'c1', nombre: 'Cancha 1', deporte: 'Fútbol', precioHora: 45000 },
      { id: 'c2', nombre: 'Cancha 2', deporte: 'Tenis', precioHora: 60000 },
    ];
    const res = calcularPrecioEvento(canchas, 3);
    expect(res.total).toBe(285000);
    expect(res.ahorro).toBe(30000);
    expect(res.packsAgua).toBe(2);
  });

  test('sin canchas: total 0, lineas []', () => {
    const res = calcularPrecioEvento([], 2);
    expect(res.total).toBe(0);
    expect(res.lineas).toEqual([]);
  });
});

describe('calcularPrecioJornadas (AC-013, DD-012)', () => {
  const canchasCatalogo = [
    { id: 'c1', nombre: 'Cancha 1', deporte: 'futbol', precioHora: 45000 },
    { id: 'c2', nombre: 'Cancha 2', deporte: 'futbol', precioHora: 45000 },
    { id: 'c3', nombre: 'Cancha 3', deporte: 'futbol', precioHora: 45000 },
  ];

  test('8 equipos con 3 canchas cobra canchas efectivas (3 en Cuartos, 2 en Semis, 1 en Final)', () => {
    // Cuartos: 3 canchas, 2 horas (con descuento: 40.000 * 2 = 80.000 cada una -> 240.000, 3 packs de agua)
    // Semifinal: 2 canchas (canchas efectivas), 1 hora (45.000 * 1 = 45.000 cada una -> 90.000, sin agua)
    // Final: 1 cancha (cancha efectiva), 1 hora (45.000 * 1 -> 45.000, sin agua)
    const bloques = [
      {
        ronda: 1,
        nombreRonda: 'Cuartos de final',
        fecha: '2026-11-01',
        horas: ['08:00', '09:00'],
        canchaIds: ['c1', 'c2', 'c3'],
      },
      {
        ronda: 2,
        nombreRonda: 'Semifinal',
        fecha: '2026-11-02',
        horas: ['10:00'],
        canchaIds: ['c1', 'c2'],
      },
      {
        ronda: 3,
        nombreRonda: 'Final',
        fecha: '2026-11-03',
        horas: ['14:00'],
        canchaIds: ['c1'],
      },
    ];

    const res = calcularPrecioJornadas(bloques, canchasCatalogo);

    // Total líneas = 3 (cuartos) + 2 (semis) + 1 (final) = 6 líneas
    expect(res.lineas).toHaveLength(6);
    expect(res.nHoras).toBe(4); // 2h + 1h + 1h
    expect(res.subtotal).toBe(3 * (45000 * 2) + 2 * (45000 * 1) + 1 * (45000 * 1)); // 270.000 + 90.000 + 45.000 = 405.000
    expect(res.ahorro).toBe(3 * (5000 * 2)); // 30.000
    expect(res.total).toBe(240000 + 90000 + 45000); // 375.000
    expect(res.packsAgua).toBe(3); // Solo en la jornada de 2 horas (Cuartos)

    // Formato de canchaId y nombre compuesto
    expect(res.lineas[0].canchaId).toBe('R1-c1');
    expect(res.lineas[0].nombre).toBe('Cuartos de final · Cancha 1');
    expect(res.lineas[5].canchaId).toBe('R3-c1');
    expect(res.lineas[5].nombre).toBe('Final · Cancha 1');
  });

  test('sin bloques o bloques vacíos devuelve ceros y arreglo vacío', () => {
    expect(calcularPrecioJornadas([], canchasCatalogo)).toEqual({
      nHoras: 0,
      lineas: [],
      subtotal: 0,
      total: 0,
      ahorro: 0,
      packsAgua: 0,
    });
    expect(calcularPrecioJornadas(null, canchasCatalogo)).toEqual({
      nHoras: 0,
      lineas: [],
      subtotal: 0,
      total: 0,
      ahorro: 0,
      packsAgua: 0,
    });
  });
});

describe('finDeFranja', () => {
  test('suma una hora', () => {
    expect(finDeFranja('20:00')).toBe('21:00');
    expect(finDeFranja('08:00')).toBe('09:00');
  });
});

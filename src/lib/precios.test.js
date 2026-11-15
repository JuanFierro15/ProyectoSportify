import {
  calcularPrecio,
  calcularPrecioEvento,
  calcularPrecioJornadas,
  finDeFranja,
  formatoPrecioCorto,
} from './precios';

describe('formatoPrecioCorto', () => {
  test('formatea valores a pesos colombianos sin espacios', () => {
    expect(formatoPrecioCorto(45000)).toBe('$45.000');
    expect(formatoPrecioCorto(60000)).toBe('$60.000');
    expect(formatoPrecioCorto(120000)).toBe('$120.000');
  });
});

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

  const canchasPadel = [
    { id: 'padel-1', nombre: 'Cancha Pádel 1', deporte: 'padel', precioHora: 65000 },
    { id: 'padel-2', nombre: 'Cancha Pádel 2', deporte: 'padel', precioHora: 65000 },
  ];

  test('2 horas salteadas en una cancha y fase aplica descuento ($60.000 x 2 en pádel, ahorro 10.000); 1 hora sin descuento', () => {
    const bloques = [
      {
        ronda: 1,
        nombreRonda: 'Cuartos de final',
        fecha: '2026-11-21',
        canchaIds: ['padel-1'],
        horas: ['16:00', '18:00'],
      },
      {
        ronda: 1,
        nombreRonda: 'Cuartos de final',
        fecha: '2026-11-21',
        canchaIds: ['padel-2'],
        horas: ['19:00'],
      },
    ];

    const res = calcularPrecioJornadas(bloques, canchasPadel);

    expect(res.lineas).toHaveLength(2);
    expect(res.lineas[0]).toMatchObject({
      canchaId: 'R1-padel-1',
      nombre: 'Cuartos de final · Cancha Pádel 1',
      nHoras: 2,
      precioHora: 65000,
      descuentoHora: 5000,
      precioHoraFinal: 60000,
      subtotal: 130000,
      total: 120000,
      ahorro: 10000,
      aguaGratis: true,
    });
    expect(res.lineas[1]).toMatchObject({
      canchaId: 'R1-padel-2',
      nombre: 'Cuartos de final · Cancha Pádel 2',
      nHoras: 1,
      precioHora: 65000,
      descuentoHora: 0,
      precioHoraFinal: 65000,
      subtotal: 65000,
      total: 65000,
      ahorro: 0,
      aguaGratis: false,
    });
    expect(res.nHoras).toBe(3);
    expect(res.subtotal).toBe(195000);
    expect(res.ahorro).toBe(10000);
    expect(res.total).toBe(185000);
    expect(res.packsAgua).toBe(1);
  });

  test('dos bloques de la misma ronda y cancha se unen en una sola línea sin repetir horas', () => {
    const bloquesDisjuntos = [
      {
        ronda: 1,
        nombreRonda: 'Cuartos de final',
        fecha: '2026-11-21',
        canchaIds: ['padel-1'],
        horas: ['16:00'],
      },
      {
        ronda: 1,
        nombreRonda: 'Cuartos de final',
        fecha: '2026-11-21',
        canchaIds: ['padel-1'],
        horas: ['18:00'],
      },
    ];

    const resDisjunto = calcularPrecioJornadas(bloquesDisjuntos, canchasPadel);
    expect(resDisjunto.lineas).toHaveLength(1);
    expect(resDisjunto.lineas[0]).toMatchObject({
      canchaId: 'R1-padel-1',
      nHoras: 2,
      precioHoraFinal: 60000,
      total: 120000,
      ahorro: 10000,
      aguaGratis: true,
    });
    expect(resDisjunto.nHoras).toBe(2);
    expect(resDisjunto.total).toBe(120000);
    expect(resDisjunto.ahorro).toBe(10000);
    expect(resDisjunto.packsAgua).toBe(1);

    const bloquesConRepetida = [
      {
        ronda: 1,
        nombreRonda: 'Cuartos de final',
        fecha: '2026-11-21',
        canchaIds: ['padel-1'],
        horas: ['16:00', '18:00'],
      },
      {
        ronda: 1,
        nombreRonda: 'Cuartos de final',
        fecha: '2026-11-21',
        canchaIds: ['padel-1'],
        horas: ['18:00', '20:00'],
      },
    ];

    const resRepetida = calcularPrecioJornadas(bloquesConRepetida, canchasPadel);
    expect(resRepetida.lineas).toHaveLength(1);
    expect(resRepetida.lineas[0].nHoras).toBe(3);
    expect(resRepetida.lineas[0].total).toBe(180000);
    expect(resRepetida.lineas[0].ahorro).toBe(15000);
    expect(resRepetida.nHoras).toBe(3);
  });

  test('reserva vieja de un bloque con dos canchas da dos líneas', () => {
    const resConRonda = calcularPrecioJornadas(
      [
        {
          ronda: 1,
          nombreRonda: 'Cuartos de final',
          fecha: '2026-11-21',
          canchaIds: ['padel-1', 'padel-2'],
          horas: ['16:00', '17:00'],
        },
      ],
      canchasPadel
    );

    expect(resConRonda.lineas).toHaveLength(2);
    expect(resConRonda.lineas.map((l) => l.canchaId)).toEqual([
      'R1-padel-1',
      'R1-padel-2',
    ]);
    expect(resConRonda.total).toBe(240000);
    expect(resConRonda.ahorro).toBe(20000);
    expect(resConRonda.packsAgua).toBe(2);
    expect(resConRonda.nHoras).toBe(2);

    const resSinRonda = calcularPrecioJornadas(
      [
        {
          fecha: '2026-11-21',
          canchaIds: ['padel-1', 'padel-2'],
          horas: ['16:00', '17:00'],
        },
      ],
      canchasPadel
    );

    expect(resSinRonda.lineas).toHaveLength(2);
    expect(resSinRonda.lineas.map((l) => l.canchaId)).toEqual([
      '2026-11-21-padel-1',
      '2026-11-21-padel-2',
    ]);
    expect(resSinRonda.total).toBe(240000);
  });
});

describe('finDeFranja', () => {
  test('suma una hora', () => {
    expect(finDeFranja('20:00')).toBe('21:00');
    expect(finDeFranja('08:00')).toBe('09:00');
  });
});

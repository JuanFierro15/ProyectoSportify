import { calcularPrecio, calcularPrecioEvento, finDeFranja } from './precios';

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

describe('finDeFranja', () => {
  test('suma una hora', () => {
    expect(finDeFranja('20:00')).toBe('21:00');
    expect(finDeFranja('08:00')).toBe('09:00');
  });
});

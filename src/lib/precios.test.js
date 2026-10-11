import { calcularPrecio, finDeFranja } from './precios';

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

describe('finDeFranja', () => {
  test('suma una hora', () => {
    expect(finDeFranja('20:00')).toBe('21:00');
    expect(finDeFranja('08:00')).toBe('09:00');
  });
});

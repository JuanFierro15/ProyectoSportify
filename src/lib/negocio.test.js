import { formatoTelefono, enlaceTelefono, textoHorario } from './negocio';
import canchas from '../data/canchas.json';
import negocio from '../data/negocio.json';
import { DEPORTES } from '../data/deportes';

describe('formatoTelefono', () => {
  test('formatea 10 dígitos en grupos 3-3-4', () => {
    expect(formatoTelefono('3107740572')).toBe('310 774 0572');
  });

  test('devuelve el valor original si no tiene 10 dígitos', () => {
    expect(formatoTelefono('123')).toBe('123');
  });
});

describe('enlaceTelefono', () => {
  test('antepone +57 y protocolo tel:', () => {
    expect(enlaceTelefono('3107740572')).toBe('tel:+573107740572');
  });

  test('elimina espacios y caracteres no numéricos', () => {
    expect(enlaceTelefono('310 774 0572')).toBe('tel:+573107740572');
  });
});

describe('textoHorario', () => {
  test('rango de apertura a cierre sin ceros a la izquierda', () => {
    expect(textoHorario(['08:00', '09:00', '20:00'])).toBe('8:00 - 21:00');
  });

  test('franja única de una hora', () => {
    expect(textoHorario(['10:00'])).toBe('10:00 - 11:00');
  });

  test('arreglo vacío devuelve cadena vacía', () => {
    expect(textoHorario([])).toBe('');
  });

  test('horario a partir de canchas.json', () => {
    expect(textoHorario(canchas.horas)).toBe('8:00 - 21:00');
  });
});

describe('negocio.json', () => {
  test('cancelacion.horasMinimas es un número entero mayor que 0', () => {
    expect(Number.isInteger(negocio.cancelacion.horasMinimas)).toBe(true);
    expect(negocio.cancelacion.horasMinimas).toBeGreaterThan(0);
  });

  test('pagos.abonoPorcentaje está entre 1 y 100', () => {
    expect(negocio.pagos.abonoPorcentaje).toBeGreaterThanOrEqual(1);
    expect(negocio.pagos.abonoPorcentaje).toBeLessThanOrEqual(100);
  });

  test('servicios de parqueadero tienen las tarifas esperadas', () => {
    expect(negocio.servicios.parqueadero.carros).toBe(2000);
    expect(negocio.servicios.parqueadero.motos).toBe(1000);
  });

  test('eventos tiene 3 elementos y cada slug existe en DEPORTES', () => {
    expect(negocio.eventos).toHaveLength(3);
    const slugsDeportes = DEPORTES.map((d) => d.slug);
    negocio.eventos.forEach((evento) => {
      expect(slugsDeportes).toContain(evento.slug);
    });
  });
});

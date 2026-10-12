import { alternarHoraIndividual, seleccionarRango } from './horarios';

const HORAS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

describe('alternarHoraIndividual', () => {
  test('elegir una', () => {
    const res = alternarHoraIndividual([], '08:00', HORAS);
    expect(res).toEqual({ sel: ['08:00'], error: null });
  });

  test('ampliar a la derecha y a la izquierda', () => {
    const derecha = alternarHoraIndividual(['09:00'], '10:00', HORAS);
    expect(derecha).toEqual({ sel: ['09:00', '10:00'], error: null });

    const izquierda = alternarHoraIndividual(['09:00'], '08:00', HORAS);
    expect(izquierda).toEqual({ sel: ['08:00', '09:00'], error: null });
  });

  test('quitar la del medio de un bloque de 3 conserva la parte anterior', () => {
    const bloque = ['08:00', '09:00', '10:00'];
    const res = alternarHoraIndividual(bloque, '09:00', HORAS);
    expect(res).toEqual({ sel: ['08:00'], error: null });
  });

  test('cuarta hora vecina devuelve error y la misma selección', () => {
    const bloque = ['08:00', '09:00', '10:00'];
    const res = alternarHoraIndividual(bloque, '11:00', HORAS);
    expect(res).toEqual({
      sel: bloque,
      error: 'Puedes reservar hasta 3 horas seguidas.',
    });
  });

  test('hora lejana reinicia', () => {
    const bloque = ['08:00', '09:00'];
    const res = alternarHoraIndividual(bloque, '14:00', HORAS);
    expect(res).toEqual({ sel: ['14:00'], error: null });
  });
});

describe('seleccionarRango', () => {
  test('08:00 y luego 20:00 -> 13 horas, de 08:00 a 20:00', () => {
    const esLibre = () => true;
    const paso1 = seleccionarRango([], '08:00', HORAS, esLibre);
    expect(paso1).toEqual({ sel: ['08:00'], error: null });

    const paso2 = seleccionarRango(paso1.sel, '20:00', HORAS, esLibre);
    expect(paso2.error).toBeNull();
    expect(paso2.sel.length).toBe(13);
    expect(paso2.sel[0]).toBe('08:00');
    expect(paso2.sel[12]).toBe('20:00');
    expect(paso2.sel).toEqual(HORAS);
  });

  test('en sentido inverso (20:00 y luego 08:00) da lo mismo', () => {
    const esLibre = () => true;
    const paso1 = seleccionarRango([], '20:00', HORAS, esLibre);
    const paso2 = seleccionarRango(paso1.sel, '08:00', HORAS, esLibre);
    expect(paso2).toEqual({ sel: HORAS, error: null });
  });

  test('con 12:00 ocupada, 08:00 -> 20:00 devuelve error y conserva [08:00]', () => {
    const esLibre = (h) => h !== '12:00';
    const paso1 = seleccionarRango([], '08:00', HORAS, esLibre);
    const paso2 = seleccionarRango(paso1.sel, '20:00', HORAS, esLibre);
    expect(paso2).toEqual({
      sel: ['08:00'],
      error: 'Entre esas horas hay horarios ocupados en alguna de las canchas elegidas. Elige otro rango.',
    });
  });

  test('tercer clic con rango elegido reinicia a [hora]', () => {
    const esLibre = () => true;
    const rango = ['08:00', '09:00', '10:00'];
    const res = seleccionarRango(rango, '15:00', HORAS, esLibre);
    expect(res).toEqual({ sel: ['15:00'], error: null });
  });

  test('clic en la única elegida la quita', () => {
    const esLibre = () => true;
    const res = seleccionarRango(['08:00'], '08:00', HORAS, esLibre);
    expect(res).toEqual({ sel: [], error: null });
  });

  test('hora no libre devuelve error', () => {
    const esLibre = (h) => h !== '10:00';
    const res = seleccionarRango([], '10:00', HORAS, esLibre);
    expect(res).toEqual({
      sel: [],
      error: 'Esa hora no está libre en las canchas elegidas.',
    });
  });
});

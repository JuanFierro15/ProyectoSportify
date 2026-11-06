import { describe, expect, it } from 'vitest';
import negocioData from '../../src/data/negocio.json';
import { procesarLlamada, TEXTOS } from './funciones.js';

const abrir = (seccion, mensaje) =>
  procesarLlamada({ name: 'abrir_seccion', args: { seccion, mensaje } }, {});

describe('abrir_seccion', () => {
  it('pone la dirección si el mensaje del modelo no la trae', () => {
    const r = abrir('ubicacion', 'Aquí puedes ver nuestra ubicación exacta en el mapa.');
    expect(r.respuesta).toBe(TEXTOS.seccion.ubicacion);
    expect(r.respuesta).toContain(negocioData.direccion);
    expect(r.accion).toEqual({ tipo: 'ABRIR_SECCION', seccion: 'ubicacion', deporte: null });
  });

  it('conserva el mensaje del modelo si ya trae la dirección', () => {
    const mensaje = `Quedamos en la ${negocioData.direccion}, en Neiva.`;
    expect(abrir('ubicacion', mensaje).respuesta).toBe(mensaje);
  });

  it('no cambia el mensaje de las otras secciones', () => {
    expect(abrir('eventos', 'Organiza tu torneo por fases.').respuesta).toBe(
      'Organiza tu torneo por fases.'
    );
  });
});

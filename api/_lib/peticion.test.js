import { describe, expect, it } from 'vitest';
import { validarPeticion } from './peticion.js';
import handler from '../chat.js';
import { TEXTOS } from './funciones.js';

describe('validarPeticion y handler POST /api/chat', () => {
  const peticionValidaBase = () => ({
    mensaje: 'Hola, ¿tienen canchas?',
    historial: [],
    contexto: {
      fechaHoy: '2026-11-09',
      horaActual: '07:00',
      canchas: [
        { id: 'voley-1', nombre: 'Cancha 1', deporte: 'voley-playa', precioHora: 45000 },
      ],
      disponibilidad: [
        {
          canchaId: 'voley-1',
          fecha: '2026-11-09',
          franjasLibres: ['08:00'],
        },
      ],
    },
  });

  it('acepta una petición válida sin contexto.canchas (S4)', () => {
    const peticion = peticionValidaBase();
    delete peticion.contexto.canchas;
    const res = validarPeticion(JSON.stringify(peticion));
    expect(res.ok).toBe(true);
    expect(res.datos.mensaje).toBe('Hola, ¿tienen canchas?');
  });

  it('acepta una petición con contexto.canchas (S4)', () => {
    const peticion = peticionValidaBase();
    const res = validarPeticion(JSON.stringify(peticion));
    expect(res.ok).toBe(true);
  });

  it('rechaza fechaHoy imposible como 2026-13-45 o 2026-02-30 (S3)', () => {
    const peticionMesInvalido = peticionValidaBase();
    peticionMesInvalido.contexto.fechaHoy = '2026-13-45';
    expect(validarPeticion(JSON.stringify(peticionMesInvalido)).ok).toBe(false);

    const peticionDiaInvalido = peticionValidaBase();
    peticionDiaInvalido.contexto.fechaHoy = '2026-02-30';
    expect(validarPeticion(JSON.stringify(peticionDiaInvalido)).ok).toBe(false);
  });

  it('rechaza fechaHoy con formato no numérico o mal formado', () => {
    const peticion = peticionValidaBase();
    peticion.contexto.fechaHoy = 'invalida';
    expect(validarPeticion(JSON.stringify(peticion)).ok).toBe(false);
  });

  it('el handler responde 400 con TEXTOS.invalida cuando fechaHoy es 2026-13-45 o 2026-02-30 (S3)', async () => {
    for (const fechaInvalida of ['2026-13-45', '2026-02-30']) {
      const peticion = peticionValidaBase();
      peticion.contexto.fechaHoy = fechaInvalida;

      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(peticion),
      });

      const res = await handler.fetch(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toEqual({
        respuesta: TEXTOS.invalida,
        sugerencias: [],
        accion: null,
      });
    }
  });
});

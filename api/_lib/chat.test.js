import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TEXTOS } from './funciones.js';
import { LIMITE_BYTES } from './peticion.js';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => ({
  ThinkingLevel: { MINIMAL: 'MINIMAL' },
  FunctionCallingConfigMode: { ANY: 'ANY' },
  GoogleGenAI: class {
    constructor() {
      this.models = {
        generateContent: generateContentMock,
      };
    }
  },
}));

function cuerpoValido(overrides = {}) {
  return {
    mensaje: 'Quiero reservar voley-1 mañana a las 8',
    historial: [],
    contexto: {
      fechaHoy: '2026-11-14',
      horaActual: '07:00',
      disponibilidad: [
        {
          canchaId: 'voley-1',
          fecha: '2026-11-15',
          franjasLibres: ['08:00', '09:00'],
        },
      ],
    },
    ...overrides,
  };
}

function crearRequest(body, { method = 'POST', contentType = 'application/json' } = {}) {
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  return new Request('http://localhost/api/chat', {
    method,
    headers,
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

describe('handler /api/chat', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    generateContentMock.mockReset();
    vi.stubEnv('GEMINI_API_KEY', 'clave-de-prueba-unitaria');
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.5-flash-lite');
    vi.stubEnv('GEMINI_MODELOS_RESPALDO', 'gemini-3.1-flash-lite,gemini-3.6-flash');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    handler = (await import('../chat.js')).default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('responde 405 con Allow: POST cuando el método no es POST', async () => {
    const res = await handler.fetch(crearRequest(null, { method: 'GET', contentType: null }));
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({
      respuesta: TEXTOS.invalida,
      sugerencias: [],
      accion: null,
    });
  });

  it('responde 400 si el Content-Type no es application/json', async () => {
    const resTipo = await handler.fetch(
      crearRequest(cuerpoValido(), { contentType: 'text/plain' })
    );
    expect(resTipo.status).toBe(400);
    expect(await resTipo.json()).toEqual({
      respuesta: TEXTOS.invalida,
      sugerencias: [],
      accion: null,
    });
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('responde 400 si el cuerpo supera LIMITE_BYTES (48 KB) y acepta exactamente el límite', async () => {
    const base = JSON.stringify(cuerpoValido());
    const faltan = LIMITE_BYTES - Buffer.byteLength(base, 'utf8');
    const cuerpoEnLimite = base + ' '.repeat(faltan);
    const cuerpoExcedido = base + ' '.repeat(faltan + 1);

    expect(Buffer.byteLength(cuerpoEnLimite, 'utf8')).toBe(LIMITE_BYTES);
    expect(Buffer.byteLength(cuerpoExcedido, 'utf8')).toBe(LIMITE_BYTES + 1);

    const resExcedido = await handler.fetch(crearRequest(cuerpoExcedido));
    expect(resExcedido.status).toBe(400);
    expect(await resExcedido.json()).toEqual({
      respuesta: TEXTOS.invalida,
      sugerencias: [],
      accion: null,
    });
    expect(generateContentMock).not.toHaveBeenCalled();

    generateContentMock.mockResolvedValueOnce({
      functionCalls: [
        {
          name: 'responder',
          args: {
            texto: 'Cuerpo aceptado en el límite.',
            sugerencias: [],
          },
        },
      ],
    });

    const resLimite = await handler.fetch(crearRequest(cuerpoEnLimite));
    expect(resLimite.status).toBe(200);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(await resLimite.json()).toEqual({
      respuesta: 'Cuerpo aceptado en el límite.',
      sugerencias: [],
      accion: null,
    });
  });

  it('responde 500 con el contrato sin exponer la key cuando falta GEMINI_API_KEY', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    const res = await handler.fetch(crearRequest(cuerpoValido()));
    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const texto = await res.text();
    expect(texto).not.toContain('clave-de-prueba-unitaria');
    expect(JSON.parse(texto)).toEqual({
      respuesta: TEXTOS.generico,
      sugerencias: [],
      accion: null,
    });
  });

  it('responde 200 con la acción CONFIRMAR_RESERVA normalizada cuando el modelo llama proponer_reserva', async () => {
    generateContentMock.mockResolvedValueOnce({
      functionCalls: [
        {
          name: 'proponer_reserva',
          args: {
            canchaId: 'voley-1',
            fecha: '2026-11-15',
            horas: ['08:00', '09:00'],
            nombre: 'Ana Gómez',
            telefono: '300 123 4567',
          },
        },
      ],
    });

    const res = await handler.fetch(crearRequest(cuerpoValido()));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const json = await res.json();
    expect(json.accion).toEqual({
      tipo: 'CONFIRMAR_RESERVA',
      canchaId: 'voley-1',
      fecha: '2026-11-15',
      horas: ['08:00', '09:00'],
      nombre: 'Ana Gómez',
      telefono: '3001234567',
    });
  });

  it('llega al tercer modelo de respaldo cuando los dos primeros fallan con 503 y responde 200', async () => {
    const err503 = Object.assign(new Error('Service Unavailable'), {
      name: 'ApiError',
      status: 503,
    });
    generateContentMock
      .mockRejectedValueOnce(err503)
      .mockRejectedValueOnce(err503)
      .mockResolvedValueOnce({
        functionCalls: [
          {
            name: 'responder',
            args: {
              texto: 'Respuesta desde el tercer modelo.',
              sugerencias: [],
            },
          },
        ],
      });

    const res = await handler.fetch(crearRequest(cuerpoValido()));
    expect(res.status).toBe(200);
    expect(generateContentMock).toHaveBeenCalledTimes(3);
    expect(generateContentMock.mock.calls[2][0].model).toBe('gemini-3.6-flash');
    expect(await res.json()).toEqual({
      respuesta: 'Respuesta desde el tercer modelo.',
      sugerencias: [],
      accion: null,
    });
  });

  it('corta sin intentar modelos de respaldo ante un error 400 del SDK', async () => {
    const err400 = Object.assign(new Error('Bad Request'), {
      name: 'ApiError',
      status: 400,
    });
    generateContentMock.mockRejectedValueOnce(err400);

    const res = await handler.fetch(crearRequest(cuerpoValido()));
    expect(res.status).toBe(502);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    const texto = await res.text();
    expect(texto).not.toContain('clave-de-prueba-unitaria');
    expect(JSON.parse(texto)).toEqual({
      respuesta: TEXTOS.generico,
      sugerencias: [],
      accion: null,
    });
  });

  it('devuelve 429 si todos los modelos fallan por cuota', async () => {
    const err429 = Object.assign(new Error('Quota exceeded'), { status: 429 });
    generateContentMock
      .mockRejectedValueOnce(err429)
      .mockRejectedValueOnce(err429)
      .mockRejectedValueOnce(err429);

    const res = await handler.fetch(crearRequest(cuerpoValido()));
    expect(res.status).toBe(429);
    expect(generateContentMock).toHaveBeenCalledTimes(3);
    expect(await res.json()).toEqual({
      respuesta: TEXTOS.limite,
      sugerencias: [],
      accion: null,
    });
  });

  it('devuelve 504 si todos los modelos agotan el tiempo de espera', async () => {
    const errTimeout = Object.assign(new Error('Timed out'), { name: 'TimeoutError' });
    generateContentMock
      .mockRejectedValueOnce(errTimeout)
      .mockRejectedValueOnce(errTimeout)
      .mockRejectedValueOnce(errTimeout);

    const res = await handler.fetch(crearRequest(cuerpoValido()));
    expect(res.status).toBe(504);
    expect(generateContentMock).toHaveBeenCalledTimes(3);
    expect(await res.json()).toEqual({
      respuesta: TEXTOS.generico,
      sugerencias: [],
      accion: null,
    });
  });
});

// POST /api/chat (Vercel Function, Node.js). No guarda estado: recibe el
// mensaje, el historial reciente y la disponibilidad que manda el navegador,
// hace una llamada a Gemini (si el modelo falla o se cuelga, reintenta con los
// de respaldo: src/lib/modelosChat.js) y responde { respuesta, sugerencias,
// accion } (también en errores). La key solo se lee de GEMINI_API_KEY.
import { GoogleGenAI, ThinkingLevel, FunctionCallingConfigMode } from '@google/genai';
import { validarPeticion, prepararContexto } from './_lib/peticion.js';
import { construirInstrucciones } from './_lib/instrucciones.js';
import { TEXTOS, declaraciones, procesarLlamada } from './_lib/funciones.js';
import {
  listaModelos,
  ordenarPorDisponibilidad,
  registrarFalla,
  registrarExito,
  tiempoIntento,
  esReintentable,
  respuestaFinal,
  PRESUPUESTO_MS,
} from '../src/lib/modelosChat.js';

// Memoria temporal de esta instancia: modelos que fallaron hace poco, para
// no esperar a uno caído en cada mensaje. No guarda datos de usuarios.
const fallasModelos = new Map();

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json(
        { respuesta: TEXTOS.invalida, sugerencias: [], accion: null },
        {
          status: 405,
          headers: {
            'Cache-Control': 'no-store',
            Allow: 'POST',
          },
        }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json(
        { respuesta: TEXTOS.invalida, sugerencias: [], accion: null },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    let cuerpoTexto;
    try {
      cuerpoTexto = await request.text();
    } catch {
      return Response.json(
        { respuesta: TEXTOS.invalida, sugerencias: [], accion: null },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const validacion = validarPeticion(cuerpoTexto);
    if (!validacion.ok) {
      return Response.json(
        { respuesta: TEXTOS.invalida, sugerencias: [], accion: null },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const { mensaje, historial, contexto: contextoBruto } = validacion.datos;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[chat] falta GEMINI_API_KEY');
      return Response.json(
        { respuesta: TEXTOS.generico, sugerencias: [], accion: null },
        {
          status: 500,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const contexto = prepararContexto(contextoBruto);

    const turnos = historial.map((h) => ({
      role: h.rol === 'usuario' ? 'user' : 'model',
      text: h.texto,
    }));

    const primerUserIndex = turnos.findIndex((t) => t.role === 'user');
    const turnosValidos = primerUserIndex === -1 ? [] : turnos.slice(primerUserIndex);

    const turnosUnidos = [];
    for (const t of turnosValidos) {
      if (turnosUnidos.length > 0 && turnosUnidos[turnosUnidos.length - 1].role === t.role) {
        turnosUnidos[turnosUnidos.length - 1].text += `\n${t.text}`;
      } else {
        turnosUnidos.push({ role: t.role, text: t.text });
      }
    }

    if (turnosUnidos.length > 0 && turnosUnidos[turnosUnidos.length - 1].role === 'user') {
      turnosUnidos[turnosUnidos.length - 1].text += `\n${mensaje}`;
    } else {
      turnosUnidos.push({ role: 'user', text: mensaje });
    }

    const contents = turnosUnidos.map((t) => ({
      role: t.role,
      parts: [{ text: t.text }],
    }));

    const ai = new GoogleGenAI({ apiKey });

    const config = {
      systemInstruction: construirInstrucciones(contexto),
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      maxOutputTokens: 400,
      tools: [{ functionDeclarations: declaraciones() }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY } },
    };

    const modelos = ordenarPorDisponibilidad(listaModelos(process.env), fallasModelos, Date.now());
    const inicio = Date.now();
    const errores = [];
    let respuestaGemini = null;
    let modeloUsado = null;

    for (let i = 0; i < modelos.length; i++) {
      const tiempo = tiempoIntento(i, PRESUPUESTO_MS - (Date.now() - inicio));
      if (!tiempo) break;
      try {
        respuestaGemini = await ai.models.generateContent({
          model: modelos[i],
          contents,
          config: { ...config, abortSignal: AbortSignal.timeout(tiempo) },
        });
        modeloUsado = modelos[i];
        registrarExito(fallasModelos, modelos[i]);
        break;
      } catch (error) {
        console.error('[chat] falló el modelo', `${modelos[i]}:`, error.name, error.status ?? '-');
        errores.push(error);
        if (!esReintentable(error)) break;
        registrarFalla(fallasModelos, modelos[i], Date.now());
      }
    }

    if (!respuestaGemini) {
      const { status, clave } = respuestaFinal(errores);
      return Response.json(
        { respuesta: TEXTOS[clave], sugerencias: [], accion: null },
        { status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (modeloUsado !== listaModelos(process.env)[0]) {
      console.warn('[chat] respondió el modelo de respaldo', modeloUsado);
    }

    try {
      let resultado;
      if (
        Array.isArray(respuestaGemini.functionCalls) &&
        respuestaGemini.functionCalls.length > 0
      ) {
        resultado = procesarLlamada(respuestaGemini.functionCalls[0], contexto);
      } else {
        const texto = typeof respuestaGemini.text === 'string' ? respuestaGemini.text.trim() : '';
        resultado = {
          respuesta: texto || TEXTOS.generico,
          sugerencias: [],
          accion: null,
        };
      }

      return Response.json(resultado, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      console.error('[chat] error al procesar la respuesta:', error.name);
      return Response.json(
        { respuesta: TEXTOS.generico, sugerencias: [], accion: null },
        {
          status: 502,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }
  },
};

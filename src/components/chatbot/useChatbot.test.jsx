import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReservasProvider, useReservas } from '../../context/ReservasContext';
import useChatbot from './useChatbot';

function wrapper({ children }) {
  return <ReservasProvider>{children}</ReservasProvider>;
}

function useTestChatbot() {
  const reservasContext = useReservas();
  const chatbot = useChatbot();
  return { ...chatbot, reservasContext };
}

describe('useChatbot - S1 y S2', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('S1: "cancelar" según la tarjeta pendiente', () => {
    it('con tarjeta de cancelación pendiente, "cancelar" confirma la cancelación', async () => {
      const { result } = renderHook(() => useTestChatbot(), { wrapper });

      const dia = result.current.reservasContext.dias[1];
      let resReserva;
      act(() => {
        resReserva = result.current.reservasContext.reservar({
          canchaId: 'voley-1',
          fecha: dia,
          horas: ['10:00'],
          nombre: 'Carlos Gomez',
          telefono: '3101234567',
        });
      });
      expect(resReserva.ok).toBe(true);
      expect(result.current.reservasContext.reservas).toHaveLength(1);

      // Simular búsqueda de cancelación que devuelve la tarjeta pendiente
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          respuesta: 'Encontré esta reserva. ¿Quieres cancelarla?',
          sugerencias: [],
          accion: {
            tipo: 'BUSCAR_CANCELACION',
            nombre: 'Carlos Gomez',
            telefono: '3101234567',
          },
        }),
      });

      await act(async () => {
        await result.current.enviar('Quiero cancelar mi reserva');
      });

      const msgPendiente = result.current.mensajes.find((m) => m.tarjeta?.tipo === 'cancelacion');
      expect(msgPendiente).toBeDefined();
      expect(msgPendiente.estado).toBe('pendiente');

      // Ahora el usuario escribe "cancelar"
      await act(async () => {
        await result.current.enviar('cancelar');
      });

      // La reserva debe haberse cancelado (desaparece de reservasContext)
      expect(result.current.reservasContext.reservas).toHaveLength(0);

      // No debe aparecer "Listo, no cancelé la reserva"
      const textos = result.current.mensajes.map((m) => m.texto);
      expect(textos).not.toContain('Listo, no cancelé la reserva. ¿Te ayudo con algo más?');
      expect(textos.some((t) => t.includes('Listo, cancelé tu reserva'))).toBe(true);
    });

    it('con tarjeta de reserva pendiente, "cancelar" la rechaza (no se crea la reserva)', async () => {
      const { result } = renderHook(() => useTestChatbot(), { wrapper });

      const dia = result.current.reservasContext.dias[1];

      // Simular propuesta de reserva
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          respuesta: 'Revisa los datos para confirmar la reserva.',
          sugerencias: [],
          accion: {
            tipo: 'CONFIRMAR_RESERVA',
            canchaId: 'voley-1',
            fecha: dia,
            horas: ['10:00'],
            nombre: 'Carlos Gomez',
            telefono: '3101234567',
          },
        }),
      });

      await act(async () => {
        await result.current.enviar('Reserva voley hoy 8am');
      });

      const msgPendiente = result.current.mensajes.find(
        (m) => m.accion?.tipo === 'CONFIRMAR_RESERVA'
      );
      expect(msgPendiente).toBeDefined();
      expect(msgPendiente.estado).toBe('pendiente');

      // El usuario escribe "cancelar"
      await act(async () => {
        await result.current.enviar('cancelar');
      });

      // No se crea ninguna reserva
      expect(result.current.reservasContext.reservas).toHaveLength(0);

      const textos = result.current.mensajes.map((m) => m.texto);
      expect(textos).toContain('Listo, no hice la reserva. ¿Te ayudo con algo más?');
    });

    it('S5: con horas vacío o sin horas, la tarjeta de reserva queda fallida sin llamar a reservar', async () => {
      const { result } = renderHook(() => useTestChatbot(), { wrapper });

      const dia = result.current.reservasContext.dias[1];

      // Simular propuesta de reserva sin horas
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          respuesta: 'Revisa los datos para confirmar la reserva.',
          sugerencias: [],
          accion: {
            tipo: 'CONFIRMAR_RESERVA',
            canchaId: 'voley-1',
            fecha: dia,
            nombre: 'Carlos Gomez',
            telefono: '3101234567',
          },
        }),
      });

      await act(async () => {
        await result.current.enviar('Reserva voley');
      });

      const msgPendiente = result.current.mensajes.find(
        (m) => m.accion?.tipo === 'CONFIRMAR_RESERVA'
      );
      expect(msgPendiente).toBeDefined();

      // El usuario confirma con "sí"
      await act(async () => {
        await result.current.enviar('sí');
      });

      // La tarjeta queda fallida
      const msgActualizado = result.current.mensajes.find((m) => m.id === msgPendiente.id);
      expect(msgActualizado.estado).toBe('fallida');
      expect(result.current.reservasContext.reservas).toHaveLength(0);

      const ultimo = result.current.mensajes[result.current.mensajes.length - 1];
      expect(ultimo.texto).toContain('Esa franja ya no está libre');
    });
  });

  describe('S2: respuestas de error del servidor no entran al historial', () => {
    it('con error 429, el bot muestra el texto con error: true y el siguiente envío no lo incluye en historial', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            respuesta: 'El servicio está ocupado. Intenta de nuevo en un momento.',
            sugerencias: [],
            accion: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            respuesta: 'Hola, ahora sí puedo responder.',
            sugerencias: [],
            accion: null,
          }),
        });

      globalThis.fetch = fetchMock;

      const { result } = renderHook(() => useTestChatbot(), { wrapper });

      await act(async () => {
        await result.current.enviar('Primer mensaje');
      });

      const ultimoMensaje = result.current.mensajes[result.current.mensajes.length - 1];
      expect(ultimoMensaje.texto).toBe('El servicio está ocupado. Intenta de nuevo en un momento.');
      expect(ultimoMensaje.error).toBe(true);

      // Siguiente envío
      await act(async () => {
        await result.current.enviar('Segundo mensaje');
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const segundoLlamado = JSON.parse(fetchMock.mock.calls[1][1].body);
      const textosEnHistorial = segundoLlamado.historial.map((h) => h.texto);
      expect(textosEnHistorial).not.toContain(
        'El servicio está ocupado. Intenta de nuevo en un momento.'
      );
      expect(textosEnHistorial).toContain('Primer mensaje');
    });

    it('con error 502, el bot muestra el texto con error: true y se excluye del historial', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          json: async () => ({
            respuesta: 'No pude comunicarme con el servicio.',
            sugerencias: [],
            accion: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            respuesta: 'Respuesta recuperada.',
            sugerencias: [],
            accion: null,
          }),
        });

      globalThis.fetch = fetchMock;

      const { result } = renderHook(() => useTestChatbot(), { wrapper });

      await act(async () => {
        await result.current.enviar('Mensaje con falla 502');
      });

      const ultimoMensaje = result.current.mensajes[result.current.mensajes.length - 1];
      expect(ultimoMensaje.texto).toBe('No pude comunicarme con el servicio.');
      expect(ultimoMensaje.error).toBe(true);

      await act(async () => {
        await result.current.enviar('Mensaje siguiente');
      });

      const segundoLlamado = JSON.parse(fetchMock.mock.calls[1][1].body);
      const textosEnHistorial = segundoLlamado.historial.map((h) => h.texto);
      expect(textosEnHistorial).not.toContain('No pude comunicarme con el servicio.');
      expect(textosEnHistorial).toContain('Mensaje con falla 502');
    });

    it('con respuesta 200 válida, entra al historial normalmente', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            respuesta: '¡Hola! Todo bien.',
            sugerencias: [],
            accion: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            respuesta: 'Segunda respuesta.',
            sugerencias: [],
            accion: null,
          }),
        });

      globalThis.fetch = fetchMock;

      const { result } = renderHook(() => useTestChatbot(), { wrapper });

      await act(async () => {
        await result.current.enviar('Hola');
      });

      const primerMensajeBot = result.current.mensajes[result.current.mensajes.length - 1];
      expect(primerMensajeBot.error).toBeFalsy();

      await act(async () => {
        await result.current.enviar('¿Cómo estás?');
      });

      const segundoLlamado = JSON.parse(fetchMock.mock.calls[1][1].body);
      const textosEnHistorial = segundoLlamado.historial.map((h) => h.texto);
      expect(textosEnHistorial).toContain('¡Hola! Todo bien.');
      expect(textosEnHistorial).toContain('Hola');
    });
  });
});

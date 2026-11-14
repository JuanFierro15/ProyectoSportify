import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ReservasProvider } from '../../context/ReservasContext';
import { VistaCanchasProvider } from '../../context/VistaCanchasContext';
import Chatbot from './Chatbot';

function renderChatbot() {
  return render(
    <ReservasProvider>
      <VistaCanchasProvider>
        <Chatbot />
      </VistaCanchasProvider>
    </ReservasProvider>
  );
}

function mananaISO() {
  const dt = new Date();
  dt.setDate(dt.getDate() + 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

describe('Chatbot UI', () => {
  let matchMediaOriginal;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    matchMediaOriginal = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('se monta en portal, abre el panel con foco al input y cierra con Escape devolviendo el foco', () => {
    const { container } = renderChatbot();

    // El widget vive en un portal sobre document.body, no dentro del contenedor raíz de render.
    expect(container.querySelector('.chatbot')).toBeNull();
    const boton = document.body.querySelector('.chatbot__boton');
    expect(boton).toBeInTheDocument();

    fireEvent.click(boton);

    const dialogo = screen.getByRole('dialog', { name: 'Asistente Sportify' });
    expect(dialogo).toBeInTheDocument();
    const input = screen.getByLabelText('Escribe tu mensaje');
    expect(document.activeElement).toBe(input);

    const listenerPadre = vi.fn();
    document.addEventListener('keydown', listenerPadre);
    fireEvent.keyDown(dialogo, { key: 'Escape' });
    document.removeEventListener('keydown', listenerPadre);

    // Escape dentro del chat detiene la propagación, desmonta el diálogo y devuelve el foco al botón.
    expect(listenerPadre).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Asistente Sportify' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(boton);
  });

  it('confirma una reserva propuesta, abre el comprobante y maneja Escape y Listo', async () => {
    const fecha = mananaISO();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        respuesta: 'Te propongo esta reserva:',
        sugerencias: [],
        accion: {
          tipo: 'CONFIRMAR_RESERVA',
          canchaId: 'voley-1',
          fecha,
          horas: ['10:00'],
          nombre: 'Ana Gómez',
          telefono: '3001234567',
        },
      }),
    }));

    renderChatbot();
    fireEvent.click(document.body.querySelector('.chatbot__boton'));

    const input = screen.getByLabelText('Escribe tu mensaje');
    fireEvent.change(input, { target: { value: 'Quiero reservar voley-1 mañana a las 10' } });
    fireEvent.submit(input.closest('form'));

    const botonConfirmar = await screen.findByRole('button', { name: 'Confirmar' });
    fireEvent.click(botonConfirmar);

    const botonVerComprobante = await screen.findByRole('button', { name: 'Ver comprobante' });
    fireEvent.click(botonVerComprobante);

    const contenedorComprobante = document.body.querySelector('.chatbot__comprobante');
    expect(contenedorComprobante).toBeInTheDocument();
    expect(
      within(contenedorComprobante).getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();
    expect(within(contenedorComprobante).getByText(/^SPF-/)).toBeInTheDocument();
    expect(
      within(contenedorComprobante).getByRole('button', { name: /descargar qr/i })
    ).toBeInTheDocument();

    // Escape cierra solo el comprobante y devuelve el foco al input sin cerrar el panel.
    const dialogo = screen.getByRole('dialog', { name: 'Asistente Sportify' });
    fireEvent.keyDown(dialogo, { key: 'Escape' });

    await waitFor(() => {
      expect(document.body.querySelector('.chatbot__comprobante')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('dialog', { name: 'Asistente Sportify' })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByLabelText('Escribe tu mensaje'));

    // Al reabrir y pulsar "Listo", regresa a la conversación manteniendo el historial.
    fireEvent.click(screen.getByRole('button', { name: 'Ver comprobante' }));
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(document.body.querySelector('.chatbot__comprobante')).not.toBeInTheDocument();
    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
  });

  it('reinicia la conversación y cierra el comprobante abierto al pulsar Nueva conversación', async () => {
    const fecha = mananaISO();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        respuesta: 'Propuesta lista:',
        sugerencias: [],
        accion: {
          tipo: 'CONFIRMAR_RESERVA',
          canchaId: 'voley-1',
          fecha,
          horas: ['11:00'],
          nombre: 'Luis Ruiz',
          telefono: '3107654321',
        },
      }),
    }));

    renderChatbot();
    fireEvent.click(document.body.querySelector('.chatbot__boton'));

    const input = screen.getByLabelText('Escribe tu mensaje');
    fireEvent.change(input, { target: { value: 'Reserva voley-1 a las 11' } });
    fireEvent.submit(input.closest('form'));

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ver comprobante' }));
    expect(document.body.querySelector('.chatbot__comprobante')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nueva conversación' }));

    await waitFor(() => {
      expect(document.body.querySelector('.chatbot__comprobante')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Propuesta lista:')).not.toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ReservasProvider } from '../../context/ReservasContext';
import { VistaCanchasProvider } from '../../context/VistaCanchasContext';
import Navbar from './Navbar';
import Footer from './Footer';

describe('Navbar y useIrACanchas (S9)', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
  });

  test('el header no tiene aria-hidden ni enlaces fuera del orden de tabulacion cuando esta oculto', () => {
    render(
      <ReservasProvider>
        <VistaCanchasProvider>
          <Navbar />
        </VistaCanchasProvider>
      </ReservasProvider>
    );

    const header = screen.getByRole('banner');
    expect(header).not.toHaveAttribute('aria-hidden');

    // Simular scroll hacia abajo para ocultar el header
    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(header).toHaveClass('site-header--hidden');
    expect(header).not.toHaveAttribute('aria-hidden');

    // Todos los controles interactivos dentro del header conservan tabIndex accesible
    const enlaces = screen.getAllByRole('link');
    enlaces.forEach((enlace) => {
      expect(enlace.getAttribute('tabindex')).not.toBe('-1');
    });

    const botonMisReservas = screen.getByRole('button', { name: /mis reservas/i });
    expect(botonMisReservas.getAttribute('tabindex')).not.toBe('-1');
  });

  test('el clic en "Canchas" del navbar navega a la pagina de reserva (/reservar/voley-playa)', () => {
    render(
      <ReservasProvider>
        <VistaCanchasProvider>
          <Navbar />
        </VistaCanchasProvider>
      </ReservasProvider>
    );

    const linkCanchas = screen.getByRole('link', { name: 'Canchas' });
    fireEvent.click(linkCanchas);

    expect(window.location.pathname).toBe('/reservar/voley-playa');
  });

  test('el clic en "Canchas" del footer navega igual que el navbar mediante useIrACanchas', () => {
    render(
      <ReservasProvider>
        <VistaCanchasProvider>
          <Footer />
        </VistaCanchasProvider>
      </ReservasProvider>
    );

    const linkCanchas = screen.getByRole('link', { name: 'Canchas' });
    fireEvent.click(linkCanchas);

    expect(window.location.pathname).toBe('/reservar/voley-playa');
  });

  test('al estar en la pagina de reserva, el clic en "Canchas" hace scroll al tope', () => {
    window.history.pushState(null, '', '/reservar/voley-playa');
    const spyScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(
      <ReservasProvider>
        <VistaCanchasProvider>
          <Navbar />
        </VistaCanchasProvider>
      </ReservasProvider>
    );

    const linkCanchas = screen.getByRole('link', { name: 'Canchas' });
    fireEvent.click(linkCanchas);

    expect(spyScroll).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0 })
    );

    spyScroll.mockRestore();
  });
});

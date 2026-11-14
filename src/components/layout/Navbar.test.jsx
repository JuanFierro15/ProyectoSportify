import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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

  it.each([
    {
      origen: 'Navbar',
      rolContenedor: 'banner',
      seccionId: 'eventos',
      nombreEnlace: /eventos/i,
    },
    {
      origen: 'Navbar',
      rolContenedor: 'banner',
      seccionId: 'ubicacion',
      nombreEnlace: 'Ubicación',
    },
    {
      origen: 'Footer',
      rolContenedor: 'contentinfo',
      seccionId: 'eventos',
      nombreEnlace: /eventos/i,
    },
    {
      origen: 'Footer',
      rolContenedor: 'contentinfo',
      seccionId: 'ubicacion',
      nombreEnlace: 'Ubicación',
    },
  ])(
    'en inicio, el enlace a $seccionId en $origen desplaza suavemente con scrollIntoView en dos clics seguidos',
    ({ rolContenedor, seccionId, nombreEnlace }) => {
      const seccion = document.createElement('section');
      seccion.id = seccionId;
      const spyScrollIntoView = vi.fn();
      seccion.scrollIntoView = spyScrollIntoView;
      document.body.appendChild(seccion);

      try {
        render(
          <ReservasProvider>
            <VistaCanchasProvider>
              <Navbar />
              <Footer />
            </VistaCanchasProvider>
          </ReservasProvider>
        );

        const contenedor = screen.getByRole(rolContenedor);
        const enlace = within(contenedor).getByRole('link', {
          name: nombreEnlace,
        });

        fireEvent.click(enlace);
        expect(spyScrollIntoView).toHaveBeenCalledTimes(1);
        expect(spyScrollIntoView).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ behavior: 'smooth', block: 'start' })
        );

        fireEvent.click(enlace);
        expect(spyScrollIntoView).toHaveBeenCalledTimes(2);
        expect(spyScrollIntoView).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ behavior: 'smooth', block: 'start' })
        );
      } finally {
        seccion.remove();
      }
    }
  );

  test('en inicio, el clic en "Inicio" del navbar desplaza al tope suavemente', () => {
    const spyScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    try {
      render(
        <ReservasProvider>
          <VistaCanchasProvider>
            <Navbar />
          </VistaCanchasProvider>
        </ReservasProvider>
      );

      fireEvent.click(screen.getByRole('link', { name: 'Inicio' }));
      expect(spyScroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    } finally {
      spyScroll.mockRestore();
    }
  });

  test('en inicio, el clic en "Inicio" del navbar usa behavior auto con prefers-reduced-motion: reduce', () => {
    const matchMediaOriginal = window.matchMedia;
    const spyScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    try {
      render(
        <ReservasProvider>
          <VistaCanchasProvider>
            <Navbar />
          </VistaCanchasProvider>
        </ReservasProvider>
      );

      fireEvent.click(screen.getByRole('link', { name: 'Inicio' }));
      expect(spyScroll).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    } finally {
      window.matchMedia = matchMediaOriginal;
      spyScroll.mockRestore();
    }
  });
});

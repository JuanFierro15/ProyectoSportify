import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AsistenteTorneo from './AsistenteTorneo';
import VistaCanchas from '../../canchas/VistaCanchas';
import { VistaCanchasProvider } from '../../../context/VistaCanchasContext';
import { ReservasProvider } from '../../../context/ReservasContext';

// Helper para mockear matchMedia
function mockMatchMedia(isMobile) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    if (query === '(max-width: 63.9375em)') {
      return {
        matches: isMobile,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }
    return {
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

describe('AsistenteTorneo y VistaCanchas (frente A)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AsistenteTorneo', () => {
    it('publica el alto de la barra inferior para que el chat no la tape, y lo quita al desmontar', () => {
      mockMatchMedia(true);
      const raiz = document.documentElement;
      const { unmount } = render(
        <AsistenteTorneo
          reserva={{ modo: 'torneo', canchaIds: [], torneoPlan: {} }}
          dias={[]}
          renderCanchas={() => null}
          asistente={{
            pasoActual: 'canchas',
            numeroPaso: 1,
            totalPasos: 6,
            pasoActualInfo: { id: 'canchas', etiqueta: 'Canchas', completo: false, motivo: '' },
            motivoAvance: '',
            alcanzables: ['canchas'],
            puedeAvanzar: false,
            puedeRetroceder: false,
            siguiente: vi.fn(),
            anterior: vi.fn(),
            irA: vi.fn(),
            encabezadoRef: { current: null },
          }}
        />
      );
      expect(raiz.style.getPropertyValue('--alto-barra-inferior')).toMatch(/px$/);

      unmount();
      expect(raiz.style.getPropertyValue('--alto-barra-inferior')).toBe('');
    });

    it('en móvil renderiza únicamente el paso actual (S3)', () => {
      const reserva = {
        modo: 'torneo',
        canchaIds: ['padel-1'],
        equipos: 8,
        duracionPartido: 20,
        nombre: 'Juan',
        telefono: '3001234567',
        torneoPlan: {
          partidos: [{ id: 1 }],
          fases: [{ ronda: 'final', nombreRonda: 'Final' }],
          jornadas: { final: { horas: ['10:00'] } },
        },
        horasSel: ['10:00'],
        precio: 100000,
        modoInfo: { tipoEtiqueta: 'Torneo' },
        fecha: '2026-11-10',
        horasBase: ['08:00', '09:00', '10:00'],
      };

      // 1. Paso 'canchas'
      const { rerender } = render(
        <AsistenteTorneo
          reserva={reserva}
          dias={['2026-11-10']}
          renderCanchas={() => <div data-testid="canchas-mock">Canchas</div>}
          asistente={{
            pasoActual: 'canchas',
            pasoIndex: 0,
            numeroPaso: 1,
            totalPasos: 6,
            pasoActualInfo: { id: 'canchas', etiqueta: 'Canchas', completo: true, motivo: '' },
            estadosPasos: [],
            alcanzables: ['canchas', 'formato'],
            puedeAvanzar: true,
            puedeRetroceder: false,
            siguiente: vi.fn(),
            anterior: vi.fn(),
            irA: vi.fn(),
            encabezadoRef: { current: null },
          }}
        />
      );

      expect(screen.getByTestId('paso-canchas')).toBeInTheDocument();
      expect(screen.getByTestId('canchas-mock')).toBeInTheDocument();
      expect(screen.queryByTestId('paso-formato')).not.toBeInTheDocument();
      expect(screen.queryByTestId('paso-fechas')).not.toBeInTheDocument();
      expect(screen.queryByTestId('paso-llaves')).not.toBeInTheDocument();
      expect(screen.queryByTestId('paso-datos')).not.toBeInTheDocument();
      expect(screen.queryByTestId('paso-resumen')).not.toBeInTheDocument();

      // 2. Paso 'formato'
      rerender(
        <AsistenteTorneo
          reserva={reserva}
          dias={['2026-11-10']}
          asistente={{
            pasoActual: 'formato',
            pasoIndex: 1,
            numeroPaso: 2,
            totalPasos: 6,
            pasoActualInfo: { id: 'formato', etiqueta: 'Formato', completo: true, motivo: '' },
            estadosPasos: [],
            alcanzables: ['canchas', 'formato'],
            puedeAvanzar: true,
            puedeRetroceder: true,
            siguiente: vi.fn(),
            anterior: vi.fn(),
            irA: vi.fn(),
            encabezadoRef: { current: null },
          }}
        />
      );

      expect(screen.queryByTestId('paso-canchas')).not.toBeInTheDocument();
      expect(screen.getByTestId('paso-formato')).toBeInTheDocument();
      expect(screen.queryByTestId('paso-fechas')).not.toBeInTheDocument();

      // 3. Paso 'resumen' (en la barra inferior no se muestra botón Siguiente)
      rerender(
        <AsistenteTorneo
          reserva={reserva}
          dias={['2026-11-10']}
          asistente={{
            pasoActual: 'resumen',
            pasoIndex: 5,
            numeroPaso: 6,
            totalPasos: 6,
            pasoActualInfo: { id: 'resumen', etiqueta: 'Resumen', completo: true, motivo: '' },
            estadosPasos: [],
            alcanzables: ['canchas', 'formato', 'fechas', 'llaves', 'datos', 'resumen'],
            puedeAvanzar: false,
            puedeRetroceder: true,
            siguiente: vi.fn(),
            anterior: vi.fn(),
            irA: vi.fn(),
            encabezadoRef: { current: null },
          }}
        />
      );

      expect(screen.getByTestId('paso-resumen')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Siguiente$/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Anterior$/i })).toBeInTheDocument();
    });

    it('muestra el motivo en la barra de navegación cuando el paso está incompleto', () => {
      const reserva = {
        modo: 'torneo',
        canchaIds: [],
        torneoPlan: {},
      };

      render(
        <AsistenteTorneo
          reserva={reserva}
          dias={['2026-11-10']}
          asistente={{
            pasoActual: 'canchas',
            pasoIndex: 0,
            numeroPaso: 1,
            totalPasos: 6,
            pasoActualInfo: {
              id: 'canchas',
              etiqueta: 'Canchas',
              completo: false,
              motivo: 'Elige al menos una cancha',
            },
            motivoAvance: 'Elige al menos una cancha',
            estadosPasos: [],
            alcanzables: ['canchas'],
            puedeAvanzar: false,
            puedeRetroceder: false,
            siguiente: vi.fn(),
            anterior: vi.fn(),
            irA: vi.fn(),
            encabezadoRef: { current: null },
          }}
        />
      );

      expect(screen.getByText('Elige al menos una cancha')).toBeInTheDocument();
      const btnSiguiente = screen.getByRole('button', { name: /^Siguiente$/i });
      expect(btnSiguiente).toBeDisabled();
      expect(btnSiguiente).toHaveAccessibleDescription('Elige al menos una cancha');
    });

    it('resalta el paso actual aunque esté completo (S9)', () => {
      render(
        <AsistenteTorneo
          reserva={{ modo: 'torneo', canchaIds: ['padel-1'], torneoPlan: {} }}
          dias={[]}
          renderCanchas={() => null}
          asistente={{
            pasoActual: 'canchas',
            pasoIndex: 0,
            numeroPaso: 1,
            totalPasos: 6,
            pasoActualInfo: { id: 'canchas', etiqueta: 'Canchas', completo: true, motivo: '' },
            motivoAvance: '',
            estadosPasos: [],
            alcanzables: ['canchas', 'formato'],
            puedeAvanzar: true,
            puedeRetroceder: false,
            siguiente: vi.fn(),
            anterior: vi.fn(),
            irA: vi.fn(),
            encabezadoRef: { current: null },
          }}
        />
      );

      const pasoCanchas = screen
        .getByRole('list', { name: 'Pasos del torneo' })
        .querySelector('[aria-current="step"]');
      expect(pasoCanchas).toHaveTextContent('Canchas');
      expect(pasoCanchas).toHaveClass('indicador-pasos__paso--completo');
      expect(pasoCanchas).toHaveClass('indicador-pasos__paso--actual');
      // "Paso 1 de 6" se anuncia una sola vez
      const contadoresVisiblesParaLectores = screen
        .getAllByText('Paso 1 de 6')
        .filter((el) => !el.closest('[aria-hidden="true"]'));
      expect(contadoresVisiblesParaLectores).toHaveLength(1);
    });
  });

  describe('Integración con VistaCanchas (escritorio vs móvil y preservación de estado)', () => {
    it('en escritorio (>= 64em) renderiza el layout tradicional con IndicadorPasos de 5 pasos', () => {
      mockMatchMedia(false); // escritorio

      // Simula URL en modo torneo
      window.history.pushState({}, '', '/reservar/padel?modo=torneo');

      render(
        <ReservasProvider>
          <VistaCanchasProvider>
            <VistaCanchas />
          </VistaCanchasProvider>
        </ReservasProvider>
      );

      // No debe existir el contenedor del asistente móvil
      expect(screen.queryByTestId('asistente-torneo')).not.toBeInTheDocument();

      // Debe existir el indicador de pasos con exactamente 5 pasos
      const indicador = screen.getByRole('list', { name: /pasos del torneo/i });
      const itemsPaso = within(indicador).getAllByRole('listitem');
      expect(itemsPaso).toHaveLength(5);
      expect(within(indicador).getByText('Canchas')).toBeInTheDocument();
      expect(within(indicador).getByText('Formato')).toBeInTheDocument();
      expect(within(indicador).getByText('Fechas por fase')).toBeInTheDocument();
      expect(within(indicador).getByText('Llaves')).toBeInTheDocument();
      expect(within(indicador).getByText('Tus datos')).toBeInTheDocument();
      expect(within(indicador).queryByText('Resumen')).not.toBeInTheDocument();

      // Subtítulo inicial con 8 equipos: hasta 3 canchas; al elegir 4 equipos cambia a hasta 2 canchas
      expect(
        screen.getByText(/Elige hasta 3 canchas de un deporte/i)
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /4 equipos \(3 partidos\)/i }));
      expect(
        screen.getByText(/Elige hasta 2 canchas de un deporte/i)
      ).toBeInTheDocument();
    });

    it('en móvil (< 64em) activa el asistente y conserva el estado al cambiar de paso', async () => {
      mockMatchMedia(true); // móvil

      window.history.pushState({}, '', '/reservar/futbol?modo=torneo');

      render(
        <ReservasProvider>
          <VistaCanchasProvider>
            <VistaCanchas />
          </VistaCanchasProvider>
        </ReservasProvider>
      );

      // En móvil modo torneo debe renderizarse el asistente
      expect(screen.getByTestId('asistente-torneo')).toBeInTheDocument();

      // Paso inicial es Canchas
      expect(screen.getByRole('heading', { level: 2, name: 'Canchas' })).toBeInTheDocument();
      expect(screen.getByTestId('paso-canchas')).toBeInTheDocument();

      // Las pestañas de deporte deben estar visibles en el paso canchas
      expect(screen.getByRole('tablist', { name: /deporte/i })).toBeInTheDocument();

      // Agregamos una cancha para completar el paso
      fireEvent.click(screen.getAllByRole('button', { name: /agregar al evento/i })[0]);

      // El botón siguiente debe habilitarse tras completar canchas
      const btnSiguiente = screen.getByRole('button', { name: /^Siguiente$/i });
      expect(btnSiguiente).not.toBeDisabled();

      // Avanzamos a Formato
      fireEvent.click(btnSiguiente);

      // Ahora el título del paso es Formato
      expect(screen.getByRole('heading', { level: 2, name: 'Formato' })).toBeInTheDocument();
      expect(screen.getByTestId('paso-formato')).toBeInTheDocument();

      // En el paso formato las pestañas de deporte NO se muestran (S3)
      expect(screen.queryByRole('tablist', { name: /deporte/i })).not.toBeInTheDocument();

      // El título de la página y SelectorModo siguen presentes (S3)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /tipo de reserva/i })).toBeInTheDocument();

      // Retrocedemos a Canchas con el botón Anterior
      const btnAnterior = screen.getByRole('button', { name: /^Anterior$/i });
      fireEvent.click(btnAnterior);

      // Estado conservado: volvemos a ver Canchas y la cancha sigue elegida
      expect(screen.getByRole('heading', { level: 2, name: 'Canchas' })).toBeInTheDocument();
      expect(screen.getByRole('tablist', { name: /deporte/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /quitar del evento/i }).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /^Siguiente$/i })).not.toBeDisabled();
    });
  });
});

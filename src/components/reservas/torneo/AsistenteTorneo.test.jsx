import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import AsistenteTorneo from './AsistenteTorneo';
import VistaCanchas from '../../canchas/VistaCanchas';
import AvisoConflictoReserva from '../../shared/AvisoConflictoReserva';
import { VistaCanchasProvider } from '../../../context/VistaCanchasContext';
import { ReservasProvider, STORAGE_KEY } from '../../../context/ReservasContext';

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
    const setItemOriginal = Storage.prototype.setItem;

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
      window.localStorage.clear();
      window.history.pushState({}, '', '/');
    });

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

    it('en móvil (< 64em) al descartar un torneo por choque en Cuartos, "Elegir otro horario" lleva a "Fechas por fase" y conserva las horas no chocadas', () => {
      window.localStorage.clear();
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-11-09T07:00:00'));
      mockMatchMedia(true);

      window.history.pushState({}, '', '/reservar/padel?modo=torneo');

      render(
        <ReservasProvider>
          <VistaCanchasProvider>
            <AvisoConflictoReserva />
            <VistaCanchas />
          </VistaCanchasProvider>
        </ReservasProvider>
      );

      const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

      // Paso 1: Canchas (agregar Cancha Pádel 1)
      fireEvent.click(screen.getByRole('button', { name: 'Agregar al evento' }));
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));

      // Paso 2: Formato -> Siguiente
      expect(screen.getByRole('heading', { level: 2, name: 'Formato' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));

      // Paso 3: Fechas por fase
      expect(screen.getByRole('heading', { level: 2, name: 'Fechas por fase' })).toBeInTheDocument();
      const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
      const diasCuartos = within(seccionCuartos)
        .getByRole('group', { name: 'Elige el día' })
        .querySelectorAll('button');
      fireEvent.click(diasCuartos[1]);
      fireEvent.click(
        screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 11:00' })
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 12:00' })
      );

      fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
      const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
      const diasSemi = within(seccionSemi)
        .getByRole('group', { name: 'Elige el día' })
        .querySelectorAll('button');
      fireEvent.click(diasSemi[2]);
      fireEvent.click(
        screen.getByRole('button', { name: 'Semifinal, Cancha 1, 11:00' })
      );

      fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
      const seccionFinal = screen.getByLabelText('Fase 3: Final');
      const diasFinal = within(seccionFinal)
        .getByRole('group', { name: 'Elige el día' })
        .querySelectorAll('button');
      fireEvent.click(diasFinal[3]);
      fireEvent.click(
        screen.getByRole('button', { name: 'Final, Cancha 1, 11:00' })
      );
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));

      // Paso 4: Llaves -> Siguiente
      expect(screen.getByRole('heading', { level: 2, name: 'Llaves' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));

      // Paso 5: Tus datos -> Siguiente
      expect(screen.getByRole('heading', { level: 2, name: 'Tus datos' })).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Nombre'), {
        target: { value: 'Laura Gómez' },
      });
      fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), {
        target: { value: '3105551234' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));

      // Paso 6: Resumen -> confirmar con setItem fallando
      expect(screen.getByRole('heading', { level: 2, name: 'Resumen' })).toBeInTheDocument();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
      expect(
        screen.getByRole('heading', { name: 'Reserva confirmada' })
      ).toBeInTheDocument();

      // Otra pestaña ocupa Pádel 1, 2.º día (2026-11-10), 11:00
      const fechaChoque = '2026-11-10';
      const otroEstado = structuredClone(base);
      otroEstado.ocupados['padel-1'][fechaChoque].push('11:00');
      otroEstado.reservas.push({
        id: `padel-1__${fechaChoque}__11:00__9999`,
        codigo: 'SPF-MOV99',
        tipo: 'individual',
        canchaId: 'padel-1',
        fecha: fechaChoque,
        hora: '11:00',
        horas: ['11:00'],
        nombre: 'Otra Persona',
      });
      const jsonOtro = JSON.stringify(otroEstado);
      setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtro);
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtro })
        );
      });

      expect(
        screen.getByRole('heading', { name: 'Tu reserva no pudo completarse' })
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Elegir otro horario' }));

      // Vuelve al paso "Fechas por fase"
      expect(
        screen.getByRole('heading', { level: 2, name: 'Fechas por fase' })
      ).toBeInTheDocument();

      // Cuartos conserva 12:00 y deshabilita 11:00
      fireEvent.click(screen.getByRole('tab', { name: /Cuartos de final/i }));
      const cuartosTrasVolver = screen.getByLabelText('Fase 1: Cuartos de final');
      const diasCuartosVolver = within(cuartosTrasVolver)
        .getByRole('group', { name: 'Elige el día' })
        .querySelectorAll('button');
      expect(diasCuartosVolver[1]).toHaveAttribute('aria-pressed', 'true');
      const btn11 = screen.getByRole('button', {
        name: 'Cuartos de final, Cancha 1, 11:00, reservada',
      });
      expect(btn11).toBeDisabled();
      expect(btn11).toHaveAttribute('aria-pressed', 'false');
      expect(
        screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 12:00' })
      ).toHaveAttribute('aria-pressed', 'true');

      // Semifinal conserva 3.er día y 11:00
      fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
      const semiTrasVolver = screen.getByLabelText('Fase 2: Semifinal');
      const diasSemiVolver = within(semiTrasVolver)
        .getByRole('group', { name: 'Elige el día' })
        .querySelectorAll('button');
      expect(diasSemiVolver[2]).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByRole('button', { name: 'Semifinal, Cancha 1, 11:00' })
      ).toHaveAttribute('aria-pressed', 'true');

      // Final conserva 4.º día y 11:00
      fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
      const finalTrasVolver = screen.getByLabelText('Fase 3: Final');
      const diasFinalVolver = within(finalTrasVolver)
        .getByRole('group', { name: 'Elige el día' })
        .querySelectorAll('button');
      expect(diasFinalVolver[3]).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByRole('button', { name: 'Final, Cancha 1, 11:00' })
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });
});

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReservasProvider } from '../../context/ReservasContext';
import { VistaCanchasProvider } from '../../context/VistaCanchasContext';
import VistaCanchas from './VistaCanchas';

vi.mock('../../data/canchas.json', async (importOriginal) => {
  const actual = await importOriginal();
  const base = actual.default || actual;
  const canchasModificadas = base.canchas.map((c) =>
    c.id === 'padel-3'
      ? {
          ...c,
          ocupadosSemilla: [
            base.horas, // todas las horas ocupadas en el día 0
            ...c.ocupadosSemilla.slice(1),
          ],
        }
      : c
  );
  return {
    ...base,
    canchas: canchasModificadas,
    default: {
      ...base,
      canchas: canchasModificadas,
    },
  };
});

function renderVistaCanchas(ruta = '/reservar/padel') {
  window.history.pushState({}, '', ruta);
  return render(
    <ReservasProvider>
      <VistaCanchasProvider>
        <VistaCanchas />
      </VistaCanchasProvider>
    </ReservasProvider>
  );
}

describe('VistaCanchas — Auditoría (#15)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T07:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.pushState({}, '', '/');
  });

  describe('S11 — Carrusel con filtro de disponibilidad', () => {
    it('al activar "Solo con horarios libres ese día" mantiene una tarjeta activa con su acción visible', async () => {
      renderVistaCanchas('/reservar/padel');

      // Seleccionamos padel-3 (que no tiene horarios libres hoy)
      const dots = screen.getAllByRole('button', { name: /ir a la cancha/i });
      expect(dots).toHaveLength(3);
      await act(async () => {
        fireEvent.click(dots[2]);
      });

      // Buscamos el switch de filtro "Solo con horarios libres ese día"
      const switchFiltro = screen.getByRole('switch', {
        name: /solo con horarios libres ese día/i,
      });
      expect(switchFiltro).not.toBeChecked();

      // Activamos el filtro (padel-3 no tiene horarios libres hoy, la lista pasa de 3 a 2 canchas)
      await act(async () => {
        fireEvent.click(switchFiltro);
      });

      expect(switchFiltro).toBeChecked();

      // Con el carrusel actualizado, debe haber una tarjeta activa con su acción visible ("Cancha elegida" o botón del visor)
      const accion =
        screen.queryByText('Cancha elegida') ||
        screen.queryByRole('button', { name: /ver cancha/i });
      expect(accion).toBeInTheDocument();
    });
  });

  describe('S13 — Pestañas de deporte con patrón ARIA', () => {
    it('cada pestaña de deporte tiene aria-controls que apunta a un elemento role="tabpanel" con aria-labelledby igual al id de la pestaña activa', () => {
      renderVistaCanchas('/reservar/padel');

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      const tabPadel = tabs.find((t) => t.textContent.includes('Pádel'));
      expect(tabPadel).toBeDefined();
      expect(tabPadel).toHaveAttribute('aria-selected', 'true');
      expect(tabPadel).toHaveAttribute('id');

      const idPadel = tabPadel.getAttribute('id');
      expect(idPadel).toBeTruthy();

      const panelId = tabPadel.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();

      const panel = screen.getByRole('tabpanel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('id', panelId);
      expect(panel).toHaveAttribute('aria-labelledby', idPadel);

      // Todas las pestañas apuntan a este panel
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-controls', panelId);
        expect(tab).toHaveAttribute('id');
      });
    });

    it('la navegación por teclado con flechas sigue funcionando y actualiza el panel', async () => {
      renderVistaCanchas('/reservar/padel');

      const tabs = screen.getAllByRole('tab');
      const tabPadel = tabs.find((t) => t.textContent.includes('Pádel'));
      const idxPadel = tabs.indexOf(tabPadel);

      // Flecha derecha para ir a la siguiente pestaña
      await act(async () => {
        fireEvent.keyDown(tabPadel, { key: 'ArrowRight' });
      });

      const tabsActualizadas = screen.getAllByRole('tab');
      const siguienteIdx = (idxPadel + 1) % tabs.length;
      const siguienteTab = tabsActualizadas[siguienteIdx];

      expect(siguienteTab).toHaveAttribute('aria-selected', 'true');

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute(
        'aria-labelledby',
        siguienteTab.getAttribute('id')
      );
    });
  });
});

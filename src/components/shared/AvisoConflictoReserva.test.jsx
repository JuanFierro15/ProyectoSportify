import React, { useEffect, useRef } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReservasProvider, useReservas } from '../../context/ReservasContext';
import AvisoConflictoReserva from './AvisoConflictoReserva';

const STORAGE_KEY = 'sportify_reservas_v2';

function EscenarioConflicto({ onListo }) {
  const { dias, reservar } = useReservas();
  const ejecutado = useRef(false);

  useEffect(() => {
    if (!ejecutado.current) {
      ejecutado.current = true;
      onListo({ dias, reservar });
    }
  }, [dias, reservar, onListo]);

  return null;
}

describe('AvisoConflictoReserva (#55)', () => {
  const setItemOriginal = Storage.prototype.setItem;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el aviso cuando una reserva pendiente choca con otra guardada y permite cerrarlo', () => {
    let api;
    render(
      <ReservasProvider>
        <AvisoConflictoReserva />
        <EscenarioConflicto onListo={(v) => { api = v; }} />
      </ReservasProvider>
    );

    expect(screen.queryByRole('alert')).toBeNull();

    const dia3 = api.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    act(() => {
      resA = api.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Banner',
      });
    });

    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('16:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__16:00__5599`,
      codigo: 'SPF-55BAN',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '16:00',
      horas: ['16:00'],
      nombre: 'Otra Pestaña',
    });
    const jsonOtro = JSON.stringify(otroEstado);

    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtro);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtro })
      );
    });

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(resA.codigo);
    expect(alerta.textContent).not.toMatch(/localStorage|pestaña/i);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

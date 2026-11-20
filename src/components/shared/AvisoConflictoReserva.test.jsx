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

  it('#66 caso 5: con dos reservas pendientes y una sola que choca, muestra un solo alert con el código de la que chocó', () => {
    let api;
    render(
      <ReservasProvider>
        <AvisoConflictoReserva />
        <EscenarioConflicto onListo={(v) => { api = v; }} />
      </ReservasProvider>
    );

    const dia3 = api.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let res1;
    let res2;
    act(() => {
      res1 = api.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Ana Pendiente Uno',
      });
      res2 = api.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Luis Pendiente Dos',
      });
    });
    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);

    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('16:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__16:00__6605`,
      codigo: 'SPF-66UI1',
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

    const alertas = screen.getAllByRole('alert');
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toHaveTextContent(res2.codigo);
    expect(alertas[0]).not.toHaveTextContent(res1.codigo);
    expect(alertas[0].textContent).not.toMatch(/localStorage|pestaña|storage/i);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

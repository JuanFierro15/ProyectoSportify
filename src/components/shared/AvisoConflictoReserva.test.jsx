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

  it('usa una sola región viva por aviso con dos conflictos y cierra primero el segundo y luego el último', () => {
    let api;
    const { container } = render(
      <ReservasProvider>
        <AvisoConflictoReserva />
        <EscenarioConflicto onListo={(v) => { api = v; }} />
      </ReservasProvider>
    );

    expect(container.querySelector('.avisos-conflicto')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();

    const dia3 = api.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    let resB;
    act(() => {
      resA = api.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Banner',
      });
      resB = api.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Beto Torres',
      });
    });

    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('16:00', '17:00');
    otroEstado.reservas.push(
      {
        id: `padel-1__${dia3}__16:00__5599`,
        codigo: 'SPF-55BAN',
        tipo: 'individual',
        canchaId: 'padel-1',
        fecha: dia3,
        hora: '16:00',
        horas: ['16:00'],
        nombre: 'Otra Pestaña 1',
      },
      {
        id: `padel-1__${dia3}__17:00__5598`,
        codigo: 'SPF-55BET',
        tipo: 'individual',
        canchaId: 'padel-1',
        fecha: dia3,
        hora: '17:00',
        horas: ['17:00'],
        nombre: 'Otra Pestaña 2',
      }
    );
    const jsonOtro = JSON.stringify(otroEstado);

    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtro);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtro })
      );
    });

    const contenedor = container.querySelector('.avisos-conflicto');
    expect(contenedor).not.toBeNull();
    expect(contenedor).not.toHaveAttribute('aria-live');
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(0);

    const alertas = screen.getAllByRole('alert');
    expect(alertas).toHaveLength(2);
    expect(alertas[0]).toHaveTextContent(resA.codigo);
    expect(alertas[1]).toHaveTextContent(resB.codigo);

    const botonesCerrar = screen.getAllByRole('button', { name: 'Cerrar aviso' });
    expect(botonesCerrar).toHaveLength(2);

    fireEvent.click(botonesCerrar[1]);

    const alertasRestantes = screen.getAllByRole('alert');
    expect(alertasRestantes).toHaveLength(1);
    expect(alertasRestantes[0]).toHaveTextContent(resA.codigo);
    expect(alertasRestantes[0]).not.toHaveTextContent(resB.codigo);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.querySelector('.avisos-conflicto')).toBeNull();
  });

  it('incluye codigo igual al de la reserva descartada en avisosConflicto conservando id y mensaje', () => {
    let api;
    let avisosActuales = [];
    function Inspector() {
      const ctx = useReservas();
      avisosActuales = ctx.avisosConflicto;
      const ejecutado = useRef(false);
      useEffect(() => {
        if (!ejecutado.current) {
          ejecutado.current = true;
          api = {
            dias: ctx.dias,
            reservar: ctx.reservar,
            reservarEvento: ctx.reservarEvento,
          };
        }
      }, [ctx.dias, ctx.reservar, ctx.reservarEvento]);
      return null;
    }

    render(
      <ReservasProvider>
        <AvisoConflictoReserva />
        <Inspector />
      </ReservasProvider>
    );

    const dia3 = api.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resInd;
    let resEv;
    act(() => {
      resInd = api.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Banner',
      });
      resEv = api.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia3,
        canchaIds: ['padel-2'],
        horas: ['17:00'],
        invitados: 15,
        nombre: 'Beto Evento',
      });
    });

    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('16:00');
    otroEstado.ocupados['padel-2'][dia3].push('17:00');
    otroEstado.reservas.push(
      {
        id: `padel-1__${dia3}__16:00__6101`,
        codigo: 'SPF-61IND',
        tipo: 'individual',
        canchaId: 'padel-1',
        fecha: dia3,
        hora: '16:00',
        horas: ['16:00'],
        nombre: 'Otra Pestaña 1',
      },
      {
        id: `padel-2__${dia3}__17:00__6102`,
        codigo: 'SPF-61EVE',
        tipo: 'individual',
        canchaId: 'padel-2',
        fecha: dia3,
        hora: '17:00',
        horas: ['17:00'],
        nombre: 'Otra Pestaña 2',
      }
    );
    const jsonOtro = JSON.stringify(otroEstado);

    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtro);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtro })
      );
    });

    expect(avisosActuales).toHaveLength(2);
    expect(avisosActuales[0].codigo).toBe(resInd.codigo);
    expect(avisosActuales[0].id).toMatch(/^padel-1__/);
    expect(avisosActuales[0].mensaje).toContain(resInd.codigo);
    expect(avisosActuales[1].codigo).toBe(resEv.codigo);
    expect(avisosActuales[1].id).toMatch(/^evento__/);
    expect(avisosActuales[1].mensaje).toContain(resEv.codigo);
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

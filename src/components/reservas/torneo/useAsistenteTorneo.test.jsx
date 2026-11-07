import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAsistenteTorneo from './useAsistenteTorneo';

describe('useAsistenteTorneo', () => {
  let listeners = [];
  let currentMatches = false;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;

    // Simula matchMedia configurable para las pruebas
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      if (query === '(max-width: 63.9375em)') {
        return {
          matches: currentMatches,
          media: query,
          onchange: null,
          addListener: (fn) => listeners.push(fn),
          removeListener: (fn) => {
            listeners = listeners.filter((l) => l !== fn);
          },
          addEventListener: (type, fn) => {
            if (type === 'change') listeners.push(fn);
          },
          removeEventListener: (type, fn) => {
            if (type === 'change') {
              listeners = listeners.filter((l) => l !== fn);
            }
          },
          dispatchEvent: vi.fn(),
        };
      }
      if (query === '(prefers-reduced-motion: reduce)') {
        return {
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      }
      return {
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    });

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detecta esMovil y reacciona a cambios de matchMedia', () => {
    currentMatches = true;
    const { result } = renderHook(() =>
      useAsistenteTorneo({ reserva: { modo: 'torneo' } })
    );

    expect(result.current.esMovil).toBe(true);

    act(() => {
      currentMatches = false;
      listeners.forEach((fn) => fn({ matches: false }));
    });

    expect(result.current.esMovil).toBe(false);
  });

  it('bloquea siguiente() si el paso actual está incompleto y avanza cuando está completo', () => {
    const reservaIncompleta = {
      modo: 'torneo',
      canchaIds: [], // canchas incompleto
      torneoPlan: {},
    };

    const { result, rerender } = renderHook(
      ({ r }) => useAsistenteTorneo({ reserva: r }),
      { initialProps: { r: reservaIncompleta } }
    );

    expect(result.current.pasoActual).toBe('canchas');
    expect(result.current.puedeAvanzar).toBe(false);

    let exito;
    act(() => {
      exito = result.current.siguiente();
    });
    expect(exito).toBe(false);
    expect(result.current.pasoActual).toBe('canchas');

    // Ahora completamos canchas
    const reservaConCanchas = {
      ...reservaIncompleta,
      canchaIds: ['c1'],
    };
    rerender({ r: reservaConCanchas });

    expect(result.current.puedeAvanzar).toBe(true);

    act(() => {
      exito = result.current.siguiente();
    });
    expect(exito).toBe(true);
    expect(result.current.pasoActual).toBe('formato');
    expect(result.current.numeroPaso).toBe(2);
  });

  it('anterior() retrocede de paso y se bloquea en el primer paso', () => {
    const reservaConCanchas = {
      modo: 'torneo',
      canchaIds: ['c1'],
      torneoPlan: {},
    };

    const { result } = renderHook(() =>
      useAsistenteTorneo({ reserva: reservaConCanchas })
    );

    act(() => {
      result.current.siguiente();
    });
    expect(result.current.pasoActual).toBe('formato');
    expect(result.current.puedeRetroceder).toBe(true);

    let retrocedio;
    act(() => {
      retrocedio = result.current.anterior();
    });
    expect(retrocedio).toBe(true);
    expect(result.current.pasoActual).toBe('canchas');
    expect(result.current.puedeRetroceder).toBe(false);

    act(() => {
      retrocedio = result.current.anterior();
    });
    expect(retrocedio).toBe(false);
    expect(result.current.pasoActual).toBe('canchas');
  });

  it('irA(id) rechaza pasos inalcanzables y permite saltar a los alcanzables', () => {
    const reserva = {
      modo: 'torneo',
      canchaIds: ['c1'], // canchas completo
      equipos: null, // formato incompleto -> primer incompleto
      torneoPlan: {},
    };

    const { result } = renderHook(() => useAsistenteTorneo({ reserva }));

    // Alcanzables: canchas (completo) y formato (primer incompleto)
    expect(result.current.alcanzables).toEqual(['canchas', 'formato']);

    // Intentar saltar a resumen o llaves (no alcanzables)
    let navego;
    act(() => {
      navego = result.current.irA('resumen');
    });
    expect(navego).toBe(false);
    expect(result.current.pasoActual).toBe('canchas');

    act(() => {
      navego = result.current.irA('llaves');
    });
    expect(navego).toBe(false);
    expect(result.current.pasoActual).toBe('canchas');

    // Saltar a formato (alcanzable)
    act(() => {
      navego = result.current.irA('formato');
    });
    expect(navego).toBe(true);
    expect(result.current.pasoActual).toBe('formato');
  });

  it('en escritorio no sube la página ni cambia de paso si una cancha se quita (S2)', () => {
    // Canchas completo y Formato incompleto: Formato es alcanzable solo
    // mientras Canchas siga completo.
    const conCanchas = { modo: 'torneo', canchaIds: ['c1'], torneoPlan: {} };
    const { result, rerender } = renderHook(
      ({ r }) => useAsistenteTorneo({ reserva: r }),
      { initialProps: { r: conCanchas } }
    );
    act(() => {
      result.current.irA('formato');
    });
    window.scrollTo.mockClear();

    rerender({ r: { ...conCanchas, canchaIds: [] } });

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(result.current.pasoActual).toBe('formato');
  });

  it('no avanza a un paso inalcanzable y explica qué paso falta (S5)', () => {
    currentMatches = true;
    // Formato completo, pero Canchas no: Fechas no es alcanzable.
    const reserva = {
      modo: 'torneo',
      canchaIds: [],
      equipos: 8,
      duracionPartido: 20,
      torneoPlan: {},
    };
    const { result } = renderHook(() => useAsistenteTorneo({ reserva }));
    act(() => {
      result.current.irA('formato');
    });
    expect(result.current.pasoActual).toBe('formato');
    expect(result.current.puedeAvanzar).toBe(false);
    expect(result.current.motivoAvance).toBe(
      'Primero completa Canchas: Elige al menos una cancha'
    );

    let avanzo;
    act(() => {
      avanzo = result.current.siguiente();
    });
    expect(avanzo).toBe(false);
    expect(result.current.pasoActual).toBe('formato');
  });

  it('vuelve al primer paso incompleto si el paso actual deja de ser alcanzable', () => {
    currentMatches = true;
    const conCanchas = { modo: 'torneo', canchaIds: ['c1'], torneoPlan: {} };
    const { result, rerender } = renderHook(
      ({ r }) => useAsistenteTorneo({ reserva: r }),
      { initialProps: { r: conCanchas } }
    );

    act(() => {
      result.current.siguiente();
    });
    expect(result.current.pasoActual).toBe('formato');

    // "Limpiar selección" borra las canchas: formato ya no es alcanzable
    rerender({ r: { ...conCanchas, canchaIds: [] } });
    expect(result.current.pasoActual).toBe('canchas');
  });

  it('hace scroll y pone el foco en el encabezado al cambiar de paso', () => {
    currentMatches = true;
    const reserva = {
      modo: 'torneo',
      canchaIds: ['c1'],
      equipos: 8,
      duracionPartido: 20,
    };

    const { result } = renderHook(() => useAsistenteTorneo({ reserva }));

    const dummyHeading = { focus: vi.fn(), tabIndex: -1 };
    result.current.encabezadoRef.current = dummyHeading;

    act(() => {
      result.current.siguiente();
    });

    expect(window.scrollTo).toHaveBeenCalled();
    expect(dummyHeading.focus).toHaveBeenCalled();
  });
});

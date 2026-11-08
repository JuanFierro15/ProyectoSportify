import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ReservasProvider,
  useReservas,
  reducer,
  crearEstadoInicial,
} from './ReservasContext';

const STORAGE_KEY = 'sportify_reservas_v2';

describe('ReservasContext y reducer — doble validación de eventos (S3, S4)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reducer RESERVAR_EVENTO rechaza bloques de torneo con fases fuera de orden cronológico (día anterior o misma fecha antes de que termine la previa)', () => {
    const estadoInicial = crearEstadoInicial();
    const [, dia1, dia2] = estadoInicial.dias;
    const ocupadosAntes = structuredClone(estadoInicial.ocupados);

    // Caso 1: Fase 2 en un día anterior a la Fase 1
    const estadoDiaInvertido = reducer(estadoInicial, {
      type: 'RESERVAR_EVENTO',
      payload: {
        codigo: 'SPF-TEST01',
        subtipo: 'torneo',
        fecha: dia2,
        canchaIds: ['futbol-1'],
        horas: ['14:00'],
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia2,
            canchaIds: ['futbol-1'],
            horas: ['14:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Final',
            fecha: dia1,
            canchaIds: ['futbol-1'],
            horas: ['16:00'],
          },
        ],
        nombre: 'Ana Gómez',
      },
    });

    expect(estadoDiaInvertido).toBe(estadoInicial);
    expect(estadoDiaInvertido.reservas).toEqual([]);
    expect(estadoDiaInvertido.ocupados).toEqual(ocupadosAntes);

    // Caso 2: Fase 2 el mismo día pero antes de que termine la Fase 1
    const estadoHoraInvertida = reducer(estadoInicial, {
      type: 'RESERVAR_EVENTO',
      payload: {
        codigo: 'SPF-TEST02',
        subtipo: 'torneo',
        fecha: dia1,
        canchaIds: ['futbol-1', 'futbol-2'],
        horas: ['15:00', '16:00'],
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia1,
            canchaIds: ['futbol-1', 'futbol-2'],
            horas: ['15:00', '16:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Final',
            fecha: dia1,
            canchaIds: ['futbol-1'],
            horas: ['15:00'],
          },
        ],
        nombre: 'Ana Gómez',
      },
    });

    expect(estadoHoraInvertida).toBe(estadoInicial);
    expect(estadoHoraInvertida.reservas).toEqual([]);
    expect(estadoHoraInvertida.ocupados).toEqual(ocupadosAntes);
  });

  it('reducer RESERVAR_EVENTO rechaza cumpleaños con horas no consecutivas', () => {
    const estadoInicial = crearEstadoInicial();
    const dia = estadoInicial.dias[4]; // día sin ocupación en voley-1
    const ocupadosAntes = structuredClone(estadoInicial.ocupados);

    const siguiente = reducer(estadoInicial, {
      type: 'RESERVAR_EVENTO',
      payload: {
        codigo: 'SPF-CUMP01',
        subtipo: 'cumpleanos',
        fecha: dia,
        canchaIds: ['voley-1'],
        horas: ['10:00', '12:00'],
        invitados: 20,
        nombre: 'Juan Pérez',
      },
    });

    expect(siguiente).toBe(estadoInicial);
    expect(siguiente.reservas).toEqual([]);
    expect(siguiente.ocupados).toEqual(ocupadosAntes);
  });

  it('reservarEvento valida antes de despachar orden de fases y horas consecutivas, sin tocar estado ni localStorage cuando falla', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const [, dia1, dia2, , dia4] = result.current.dias;
    const guardadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    // 1. Fases desordenadas en reservarEvento
    let resTorneo;
    act(() => {
      resTorneo = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia2,
        canchaIds: ['voley-1'],
        horas: ['10:00'],
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia2,
            canchaIds: ['voley-1'],
            horas: ['10:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Final',
            fecha: dia1,
            canchaIds: ['voley-1'],
            horas: ['11:00'],
          },
        ],
        nombre: 'Pedro Gómez',
      });
    });

    expect(resTorneo).toEqual({
      ok: false,
      error: `Final debe jugarse después de que termine Semifinal (${dia2} a las 11:00).`,
    });
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(guardadoInicial);

    // 2. Cumpleaños con horas no consecutivas en reservarEvento
    let resCumple;
    act(() => {
      resCumple = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia4,
        canchaIds: ['voley-1'],
        horas: ['09:00', '11:00'],
        invitados: 15,
        nombre: 'Pedro Gómez',
      });
    });

    expect(resCumple).toEqual({
      ok: false,
      error:
        'Alguna cancha u horario del evento ya no está disponible. No se reservó nada.',
    });
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(guardadoInicial);

    // 3. Cumpleaños válido con 4 horas consecutivas sí se guarda y persiste en localStorage
    let resCumpleOk;
    act(() => {
      resCumpleOk = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia4,
        canchaIds: ['voley-1'],
        horas: ['09:00', '10:00', '11:00', '12:00'],
        invitados: 15,
        nombre: 'Pedro Gómez',
      });
    });

    expect(resCumpleOk.ok).toBe(true);
    expect(resCumpleOk.codigo).toMatch(/^SPF-[A-Z0-9]{6}$/);
    expect(result.current.reservas).toHaveLength(1);
    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.reservas).toHaveLength(1);
    expect(persistido.ocupados['voley-1'][dia4]).toEqual(
      expect.arrayContaining(['09:00', '10:00', '11:00', '12:00'])
    );
  });
});

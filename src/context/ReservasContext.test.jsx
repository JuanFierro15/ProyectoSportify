import React, { startTransition, useState } from 'react';
import { flushSync } from 'react-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ReservasProvider,
  useReservas,
  reducer,
  reducerVersionado,
  crearEstadoInicial,
  conciliarReservasSinGuardar,
  conservarReservasSinGuardar,
  STORAGE_KEY,
  ERROR_EVENTO_NO_DISPONIBLE,
  ERROR_EVENTO_HORAS_NO_SEGUIDAS,
  ERROR_EVENTO_FECHA_FASE,
} from './ReservasContext';
import { MENSAJES_CANCELACION } from '../lib/cancelacion';
import semilla from '../data/canchas.json';

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

    // 2. Cumpleaños con horas no consecutivas en reservarEvento devuelve el mensaje propio de rango sin saltos
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
        'Las horas del evento deben ser seguidas. Elige un rango sin saltos.',
    });
    expect(resCumple.error).toBe(ERROR_EVENTO_HORAS_NO_SEGUIDAS);
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(guardadoInicial);

    // 2c. Cancha ocupada devuelve ERROR_EVENTO_NO_DISPONIBLE
    let resOcupada;
    act(() => {
      resOcupada = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia1,
        canchaIds: ['voley-2'],
        horas: ['14:00'],
        invitados: 15,
        nombre: 'Pedro Gómez',
      });
    });

    expect(resOcupada).toEqual({
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    });

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

  it('acepta torneo con horas por cancha y salteadas en ronda 1 (padel-1: 16:00, 18:00 y padel-2: 19:00) y semifinal después; ocupa exactamente esas 5 celdas', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const dia5 = result.current.dias[5];
    const ocupadosAntes = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
    ).ocupados;

    let res;
    act(() => {
      res = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        canchaIds: ['padel-1', 'padel-1', 'padel-2'],
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['16:00', '18:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-2'],
            horas: ['19:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Semifinal',
            fecha: dia5,
            canchaIds: ['padel-1'],
            horas: ['10:00', '12:00'],
          },
        ],
        nombre: 'Laura Gómez',
      });
    });

    expect(res.ok).toBe(true);
    expect(res.codigo).toMatch(/^SPF-[A-Z0-9]{6}$/);
    expect(result.current.reservas).toHaveLength(1);

    const guardada = result.current.reservas[0];
    expect(guardada.canchaIds).toEqual(['padel-1', 'padel-2']);
    expect(guardada.canchaNombres).toEqual([
      'Cancha Pádel 1',
      'Cancha Pádel 2',
    ]);
    expect(guardada.total).toBe(250000); // 100.000 (R1 padel-1) + 50.000 (R1 padel-2) + 100.000 (R2 padel-1)
    expect(guardada.ahorro).toBe(75000);
    expect(guardada.packsAgua).toBe(2);

    const esperadoOcupados = structuredClone(ocupadosAntes);
    esperadoOcupados['padel-1'][dia3].push('16:00', '18:00');
    esperadoOcupados['padel-2'][dia3].push('19:00');
    esperadoOcupados['padel-1'][dia5].push('10:00', '12:00');

    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.ocupados).toEqual(esperadoOcupados);

    // La hora intermedia (17:00) en padel-1 queda libre
    const dispPadel1Dia3 = result.current.disponibilidad('padel-1', dia3);
    expect(dispPadel1Dia3.find((h) => h.hora === '17:00').disponible).toBe(true);
    expect(dispPadel1Dia3.find((h) => h.hora === '16:00').disponible).toBe(false);
    expect(dispPadel1Dia3.find((h) => h.hora === '18:00').disponible).toBe(false);
  });

  it('acepta dos canchas con horas solapadas dentro de la misma ronda y evita canchas repetidas en canchaIds/canchaNombres', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    let res;
    act(() => {
      res = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        canchaIds: ['padel-1', 'padel-1', 'padel-3'],
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['18:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-2'],
            horas: ['17:00'],
          },
        ],
        nombre: 'Elena Cruz',
      });
    });

    expect(res.ok).toBe(true);
    expect(result.current.reservas[0].canchaIds).toEqual(['padel-1', 'padel-2']);
    expect(result.current.reservas[0].canchaNombres).toEqual([
      'Cancha Pádel 1',
      'Cancha Pádel 2',
    ]);
  });

  it('rechaza semifinal antes del cierre de la última hora de cuartos en la segunda cancha y acepta justo en el cierre', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const guardadoAntes = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    // Cuartos: padel-1 a las 15:00 (cierra 16:00), padel-2 a las 19:00 (cierra 20:00).
    // Semifinal a las 19:00 el mismo día empieza antes de las 20:00 -> rechaza.
    let resAntes;
    act(() => {
      resAntes = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['15:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-2'],
            horas: ['19:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Semifinal',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['19:00'],
          },
        ],
        nombre: 'Carlos Ruiz',
      });
    });

    expect(resAntes).toEqual({
      ok: false,
      error: `Semifinal debe jugarse después de que termine Cuartos de final (${dia3} a las 20:00).`,
    });
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(
      guardadoAntes
    );

    // Límite exacto: Semifinal a las 20:00 (justo al cierre de padel-2 19:00 -> 20:00)
    let resLimite;
    act(() => {
      resLimite = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['15:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-2'],
            horas: ['19:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Semifinal',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['20:00'],
          },
        ],
        nombre: 'Carlos Ruiz',
      });
    });

    expect(resLimite.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].canchaIds).toEqual(['padel-1', 'padel-2']);
  });

  it('rechaza bloques de la misma ronda con fechas distintas (ERROR_EVENTO_FECHA_FASE)', () => {
    const estadoInicial = crearEstadoInicial();
    const dia3 = estadoInicial.dias[3];
    const dia4 = estadoInicial.dias[4];
    const payload = {
      subtipo: 'torneo',
      fecha: dia3,
      canchaIds: ['padel-1', 'padel-2'],
      bloques: [
        {
          ronda: 1,
          nombreRonda: 'Cuartos de final',
          fecha: dia3,
          canchaIds: ['padel-1'],
          horas: ['16:00'],
        },
        {
          ronda: 1,
          nombreRonda: 'Cuartos de final',
          fecha: dia4,
          canchaIds: ['padel-2'],
          horas: ['18:00'],
        },
      ],
      nombre: 'María López',
    };

    const siguiente = reducer(estadoInicial, {
      type: 'RESERVAR_EVENTO',
      payload: { ...payload, codigo: 'SPF-FECHA1' },
    });
    expect(siguiente).toBe(estadoInicial);

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const guardadoAntes = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    let res;
    act(() => {
      res = result.current.reservarEvento(payload);
    });

    expect(res).toEqual({
      ok: false,
      error: ERROR_EVENTO_FECHA_FASE,
    });
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(
      guardadoAntes
    );
  });

  it('rechaza celda ocupada en el último bloque y celda repetida entre dos bloques sin ocupar nada (todo-o-nada)', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia1 = result.current.dias[1]; // padel-2 tiene 19:00 ocupada en semilla
    const dia3 = result.current.dias[3];
    const guardadoAntes = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    // 1. Celda ocupada en el último bloque (padel-1 16:00 libre; padel-2 19:00 ocupada)
    let resUltimoOcupado;
    act(() => {
      resUltimoOcupado = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia1,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia1,
            canchaIds: ['padel-1'],
            horas: ['16:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia1,
            canchaIds: ['padel-2'],
            horas: ['16:00', '19:00'],
          },
        ],
        nombre: 'Sofía Díaz',
      });
    });

    expect(resUltimoOcupado).toEqual({
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    });
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(
      guardadoAntes
    );

    // 2. Celda repetida entre dos bloques de la misma ronda y cancha
    let resRepetida;
    act(() => {
      resRepetida = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['16:00', '18:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['18:00', '19:00'],
          },
        ],
        nombre: 'Sofía Díaz',
      });
    });

    expect(resRepetida).toEqual({
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    });
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(
      guardadoAntes
    );
  });

  it('rechaza una hora que no existe en el horario de la cancha', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia5 = result.current.dias[5];
    const guardadoAntes = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    let res;
    act(() => {
      res = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia5,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Final',
            fecha: dia5,
            canchaIds: ['padel-1'],
            horas: ['16:00', '21:00'],
          },
        ],
        nombre: 'Andrés Gil',
      });
    });

    expect(res).toEqual({
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    });
    expect(result.current.reservas).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(
      guardadoAntes
    );
  });

  it('acepta reserva vieja con un bloque por fase, varias canchas y horas seguidas (con y sin ronda)', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const dia5 = result.current.dias[5];

    let resConRonda;
    act(() => {
      resConRonda = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        canchaIds: ['padel-1', 'padel-2'],
        horas: ['16:00', '17:00'],
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia3,
            canchaIds: ['padel-1', 'padel-2'],
            horas: ['16:00', '17:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Final',
            fecha: dia5,
            canchaIds: ['padel-1'],
            horas: ['14:00', '15:00'],
          },
        ],
        nombre: 'Diego Mora',
      });
    });

    expect(resConRonda.ok).toBe(true);

    // Reserva muy vieja sin campo `ronda` (usa idx + 1)
    let resSinRonda;
    act(() => {
      resSinRonda = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        canchaIds: ['voley-1', 'voley-2'],
        horas: ['14:00', '15:00'],
        bloques: [
          {
            nombreRonda: 'Semifinal',
            fecha: dia3,
            canchaIds: ['voley-1', 'voley-2'],
            horas: ['14:00', '15:00'],
          },
          {
            nombreRonda: 'Final',
            fecha: dia5,
            canchaIds: ['voley-1'],
            horas: ['16:00'],
          },
        ],
        nombre: 'Elena Cruz',
      });
    });

    expect(resSinRonda.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(2);
    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.ocupados['padel-1'][dia3]).toEqual(
      expect.arrayContaining(['16:00', '17:00'])
    );
    expect(persistido.ocupados['padel-2'][dia3]).toEqual(
      expect.arrayContaining(['16:00', '17:00'])
    );
    expect(persistido.ocupados['voley-2'][dia3]).toEqual(
      expect.arrayContaining(['14:00', '15:00'])
    );
    expect(persistido.ocupados['voley-1'][dia5]).toEqual(
      expect.arrayContaining(['16:00'])
    );
  });

  it('rechaza repetir la misma reserva de torneo dos veces y no la duplica', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const dia5 = result.current.dias[5];
    const payload = {
      subtipo: 'torneo',
      fecha: dia3,
      bloques: [
        {
          ronda: 1,
          nombreRonda: 'Cuartos de final',
          fecha: dia3,
          canchaIds: ['padel-1'],
          horas: ['16:00', '18:00'],
        },
        {
          ronda: 1,
          nombreRonda: 'Cuartos de final',
          fecha: dia3,
          canchaIds: ['padel-2'],
          horas: ['19:00'],
        },
        {
          ronda: 2,
          nombreRonda: 'Semifinal',
          fecha: dia5,
          canchaIds: ['padel-1'],
          horas: ['10:00'],
        },
      ],
      nombre: 'Laura Gómez',
    };

    let res1;
    act(() => {
      res1 = result.current.reservarEvento(payload);
    });
    expect(res1.ok).toBe(true);

    const estadoTrasPrimera = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
    );
    expect(result.current.reservas).toHaveLength(1);

    let res2;
    act(() => {
      res2 = result.current.reservarEvento(payload);
    });
    expect(res2).toEqual({
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    });
    expect(result.current.reservas).toHaveLength(1);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(
      estadoTrasPrimera
    );
  });
});

describe('ReservasContext — sincronización entre pestañas (S2, S3, S4, S5)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('S2: reducer SINCRONIZAR reemplaza ocupados y reservas manteniendo dias y canchas', () => {
    const estadoInicial = crearEstadoInicial();
    const dia3 = estadoInicial.dias[3];
    const nuevosOcupados = structuredClone(estadoInicial.ocupados);
    nuevosOcupados['padel-1'][dia3].push('16:00');
    const nuevasReservas = [
      {
        id: `padel-1__${dia3}__16:00__1`,
        codigo: 'SPF-SYNC01',
        tipo: 'individual',
        canchaId: 'padel-1',
        fecha: dia3,
        hora: '16:00',
        horas: ['16:00'],
        nombre: 'Sofía Mora',
      },
    ];

    const siguiente = reducer(estadoInicial, {
      type: 'SINCRONIZAR',
      payload: { ocupados: nuevosOcupados, reservas: nuevasReservas },
    });

    expect(siguiente.dias).toBe(estadoInicial.dias);
    expect(siguiente.canchas).toBe(estadoInicial.canchas);
    expect(siguiente.ocupados).toEqual(nuevosOcupados);
    expect(siguiente.reservas).toEqual(nuevasReservas);
  });

  it('S2: escucha eventos storage para STORAGE_KEY y key null, ignora otras claves y limpia el listener al desmontar', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result, unmount } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const estadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const ocupadosOtraPestana = structuredClone(estadoInicial.ocupados);
    ocupadosOtraPestana['padel-1'][dia3].push('16:00');
    const reservaOtraPestana = {
      id: `padel-1__${dia3}__16:00__100`,
      codigo: 'SPF-TAB001',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '16:00',
      horas: ['16:00'],
      nombre: 'Camila Ruiz',
    };

    // Evento de otra clave se ignora
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'otra_clave',
          newValue: JSON.stringify({
            ocupados: ocupadosOtraPestana,
            reservas: [reservaOtraPestana],
          }),
        })
      );
    });
    expect(result.current.reservas).toEqual([]);

    // Evento de STORAGE_KEY actualiza reservas y disponibilidad
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify({
            ocupados: ocupadosOtraPestana,
            reservas: [reservaOtraPestana],
          }),
        })
      );
    });
    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe('SPF-TAB001');
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);

    // Evento key: null (localStorage.clear en otra pestaña) reinicia a semilla
    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    expect(result.current.reservas).toEqual([]);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);

    // Al desmontar quita el listener
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('storage', expect.any(Function));
  });

  it('S3: re-lee localStorage antes de reservar/reservarEvento/cancelar y preserva reservas no conflictivas de otra pestaña', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const guardadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    // Otra pestaña escribe reserva en 18:00 sin disparar evento storage
    const ocupadosCon18 = structuredClone(guardadoInicial.ocupados);
    ocupadosCon18['padel-1'][dia3].push('18:00');
    const reservaTab1 = {
      id: `padel-1__${dia3}__18:00__200`,
      codigo: 'SPF-OTRA18',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '18:00',
      horas: ['18:00'],
      nombre: 'Ana Tab1',
    };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ocupados: ocupadosCon18, reservas: [reservaTab1] })
    );

    // Evento conflictivo en 18:00 se rechaza y sincroniza
    let resEvento;
    act(() => {
      resEvento = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia3,
        canchaIds: ['padel-1'],
        horas: ['18:00', '19:00'],
        invitados: 10,
        nombre: 'Pedro Tab2',
      });
    });
    expect(resEvento).toEqual({
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    });
    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe('SPF-OTRA18');

    // Reserva individual en otra hora libre (16:00) se fusiona con la de la otra pestaña
    let resLibre;
    act(() => {
      resLibre = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Luis Tab2',
      });
    });
    expect(resLibre.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(2);
    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.reservas).toHaveLength(2);

    // Si otra pestaña ya canceló una reserva, cancelar aquí falla y sincroniza
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ocupados: guardadoInicial.ocupados, reservas: [] })
    );
    let resCancelar;
    act(() => {
      resCancelar = result.current.cancelar(reservaTab1.id);
    });
    expect(resCancelar).toEqual({
      ok: false,
      error: MENSAJES_CANCELACION.noEncontrada,
    });
    expect(result.current.reservas).toEqual([]);
  });

  it('S4: dos pestañas reservan la misma cancha, día y hora — sin evento storage la segunda se rechaza y la primera se conserva', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const tab1 = renderHook(() => useReservas(), { wrapper });
    const tab2 = renderHook(() => useReservas(), { wrapper });

    const dia3 = tab1.result.current.dias[3];

    let res1;
    act(() => {
      res1 = tab1.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Primera Pestaña',
      });
    });
    expect(res1.ok).toBe(true);

    // El evento storage NO ha llegado a tab2 todavía
    let res2;
    act(() => {
      res2 = tab2.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Segunda Pestaña',
      });
    });

    expect(res2).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.reservas).toHaveLength(1);
    expect(persistido.reservas[0].codigo).toBe(res1.codigo);
    expect(tab1.result.current.reservas).toHaveLength(1);
    expect(tab2.result.current.reservas).toHaveLength(1);
    expect(tab2.result.current.reservas[0].codigo).toBe(res1.codigo);
  });

  it('S4: dos pestañas reservan la misma cancha, día y hora — cuando llega el evento storage, tab2 ve la hora ocupada antes de confirmar', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const tab1 = renderHook(() => useReservas(), { wrapper });
    const tab2 = renderHook(() => useReservas(), { wrapper });

    const dia3 = tab1.result.current.dias[3];

    let res1;
    act(() => {
      res1 = tab1.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Primera Pestaña',
      });
    });
    expect(res1.ok).toBe(true);

    // Llega el evento storage a tab2
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: window.localStorage.getItem(STORAGE_KEY),
        })
      );
    });

    expect(
      tab2.result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);

    let res2;
    act(() => {
      res2 = tab2.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Segunda Pestaña',
      });
    });

    expect(res2).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).reservas).toHaveLength(1);
    expect(tab2.result.current.reservas[0].codigo).toBe(res1.codigo);
  });

  it('S5: flujo en una sola pestaña (reservar, reservarEvento, cancelar, RENOVAR_VENTANA) y respaldo en memoria si localStorage lanza', () => {
    // 1. Una sola pestaña: reservar individual, reservarEvento y cancelar
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result, unmount } = renderHook(() => useReservas(), { wrapper });
    const dia4 = result.current.dias[4];

    let resInd;
    act(() => {
      resInd = result.current.reservar({
        canchaId: 'voley-1',
        fecha: dia4,
        horas: ['09:00'],
        nombre: 'Carlos Uno',
      });
    });
    expect(resInd.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(1);

    let resEv;
    act(() => {
      resEv = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia4,
        canchaIds: ['voley-1'],
        horas: ['11:00', '12:00'],
        invitados: 12,
        nombre: 'Carlos Evento',
      });
    });
    expect(resEv.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(2);

    let resCanc;
    act(() => {
      resCanc = result.current.cancelar(result.current.reservas[0].id);
    });
    expect(resCanc).toEqual({ ok: true });
    expect(result.current.reservas).toHaveLength(1);
    unmount();

    // 2. RENOVAR_VENTANA avanza los días cuando cambia la fecha
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));
    const estadoDia1 = crearEstadoInicial();
    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const estadoRenovado = reducer(estadoDia1, { type: 'RENOVAR_VENTANA' });
    expect(estadoRenovado.dias[0]).toBe('2026-11-17');
    vi.useRealTimers();

    // 3. localStorage que lanza al leer y escribir mantiene todo en memoria
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage bloqueado');
    });

    const mem = renderHook(() => useReservas(), { wrapper });
    const diaMem = mem.result.current.dias[4];
    let resMem;
    act(() => {
      resMem = mem.result.current.reservar({
        canchaId: 'voley-1',
        fecha: diaMem,
        horas: ['09:00'],
        nombre: 'En Memoria',
      });
    });
    expect(resMem.ok).toBe(true);
    expect(mem.result.current.reservas).toHaveLength(1);
    expect(
      mem.result.current
        .disponibilidad('voley-1', diaMem)
        .find((h) => h.hora === '09:00').disponible
    ).toBe(false);
  });

  it('S6: no reescribe localStorage tras un SINCRONIZAR disparado por evento storage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const estadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const ocupadosOtraPestana = structuredClone(estadoInicial.ocupados);
    ocupadosOtraPestana['padel-1'][dia3].push('16:00');
    const reservaOtraPestana = {
      id: `padel-1__${dia3}__16:00__300`,
      codigo: 'SPF-NOECHO1',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '16:00',
      horas: ['16:00'],
      nombre: 'Elena Sync',
    };

    setItemSpy.mockClear();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify({
            ocupados: ocupadosOtraPestana,
            reservas: [reservaOtraPestana],
          }),
        })
      );
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe('SPF-NOECHO1');
    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
  });

  it('S6: con ventana distinta a la del dato guardado, el evento storage no reescribe pero una reserva real posterior sí escribe', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const ultimoDia = result.current.dias[result.current.dias.length - 1];
    const estadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const ocupadosOtraVentana = structuredClone(estadoInicial.ocupados);
    // Simula otra pestaña con una fecha anterior extra y sin el último día de esta ventana
    ocupadosOtraVentana['padel-1']['2020-01-01'] = ['08:00'];
    delete ocupadosOtraVentana['padel-1'][ultimoDia];
    ocupadosOtraVentana['padel-1'][dia3].push('17:00');

    const reservaOtraPestana = {
      id: `padel-1__${dia3}__17:00__301`,
      codigo: 'SPF-WIN01',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '17:00',
      horas: ['17:00'],
      nombre: 'Marco Ventana',
    };

    setItemSpy.mockClear();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify({
            ocupados: ocupadosOtraVentana,
            reservas: [reservaOtraPestana],
          }),
        })
      );
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe('SPF-WIN01');
    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );

    let resReal;
    act(() => {
      resReal = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['18:00'],
        nombre: 'Lucía Real',
      });
    });

    expect(resReal.ok).toBe(true);
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });

  it('S6: si un evento storage y un reservar() local ocurren en el mismo render, la reserva local sí se escribe en localStorage', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const estadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const ocupadosOtraPestana = structuredClone(estadoInicial.ocupados);
    ocupadosOtraPestana['padel-1'][dia3].push('16:00');
    const reservaOtraPestana = {
      id: `padel-1__${dia3}__16:00__302`,
      codigo: 'SPF-BATCH1',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '16:00',
      horas: ['16:00'],
      nombre: 'Clara Batch',
    };
    const jsonOtraPestana = JSON.stringify({
      ocupados: ocupadosOtraPestana,
      reservas: [reservaOtraPestana],
    });
    window.localStorage.setItem(STORAGE_KEY, jsonOtraPestana);

    let resLocal;
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonOtraPestana,
        })
      );
      resLocal = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['18:00'],
        nombre: 'Mateo Local',
      });
    });

    expect(resLocal.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(2);

    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.reservas).toHaveLength(2);
    expect(persistido.reservas.map((r) => r.codigo)).toEqual(
      expect.arrayContaining(['SPF-BATCH1', resLocal.codigo])
    );
    expect(persistido.ocupados['padel-1'][dia3]).toEqual(
      expect.arrayContaining(['16:00', '18:00'])
    );
  });

  it('S3: rechaza reservar un bloque si solo la última hora ya fue ocupada en localStorage sin evento storage', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    const estadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const ocupadosOtraPestana = structuredClone(estadoInicial.ocupados);
    ocupadosOtraPestana['padel-1'][dia3].push('17:00');
    const reservaTab1 = {
      id: `padel-1__${dia3}__17:00__401`,
      codigo: 'SPF-ULTIMA',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '17:00',
      horas: ['17:00'],
      nombre: 'Daniela Tab1',
    };
    const jsonTab1 = JSON.stringify({
      ocupados: ocupadosOtraPestana,
      reservas: [reservaTab1],
    });
    window.localStorage.setItem(STORAGE_KEY, jsonTab1);

    let resBloque;
    act(() => {
      resBloque = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00', '17:00'],
        nombre: 'Sofía Bloque',
      });
    });

    expect(resBloque).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe('SPF-ULTIMA');
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '17:00').disponible
    ).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual(
      JSON.parse(jsonTab1)
    );
  });

  it('S2/S6: ante evento storage con key STORAGE_KEY y newValue null (removeItem en otra pestaña), vuelve a semilla y no escribe en localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    let resLocal;
    act(() => {
      resLocal = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Valeria Local',
      });
    });
    expect(resLocal.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(1);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);

    setItemSpy.mockClear();

    act(() => {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null })
      );
    });

    expect(result.current.reservas).toEqual([]);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(setItemSpy).not.toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
  });
});

describe('ReservasContext — sincronización sin pérdida de estado ni ventana (#40, #41, #42)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('#40: dos reservar() seguidos en horas distintas dentro del mismo act() se conservan ambos en memoria y en localStorage', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    let res1;
    let res2;
    act(() => {
      res1 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Sofía Uno',
      });
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Martín Dos',
      });
    });

    expect(res1.ok).toBe(true);
    expect(res1.codigo).toMatch(/^SPF-[A-Z0-9]{6}$/);
    expect(res2.ok).toBe(true);
    expect(res2.codigo).toMatch(/^SPF-[A-Z0-9]{6}$/);

    expect(result.current.reservas).toHaveLength(2);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      res1.codigo,
      res2.codigo,
    ]);

    const disp = result.current.disponibilidad('padel-1', dia3);
    expect(disp.find((h) => h.hora === '16:00').disponible).toBe(false);
    expect(disp.find((h) => h.hora === '17:00').disponible).toBe(false);

    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.reservas).toHaveLength(2);
    expect(persistido.reservas.map((r) => r.codigo)).toEqual([
      res1.codigo,
      res2.codigo,
    ]);
    expect(persistido.ocupados['padel-1'][dia3]).toEqual(
      expect.arrayContaining(['16:00', '17:00'])
    );
  });

  it('#40: dos reservar() seguidos en la misma cancha, fecha y hora dentro del mismo act() rechazan el segundo sin duplicar', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    let res1;
    let res2;
    act(() => {
      res1 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Lucía Primera',
      });
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Diego Duplicado',
      });
    });

    expect(res1.ok).toBe(true);
    expect(res1.codigo).toMatch(/^SPF-[A-Z0-9]{6}$/);
    expect(res2).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe(res1.codigo);

    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.reservas).toHaveLength(1);
    expect(persistido.reservas[0].codigo).toBe(res1.codigo);
  });

  it('#40: combinaciones en el mismo act() (reservar + reservarEvento y reservar + cancelar otra o la misma) acumulan el estado sin pisarse', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3]; // 2026-11-20

    // Reserva previa que luego se cancelará en el mismo act() que una nueva reserva
    let resPrevia;
    act(() => {
      resPrevia = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Reserva Previa',
      });
    });
    expect(resPrevia.ok).toBe(true);
    const idPrevia = result.current.reservas[0].id;

    // 1) reservar() + reservarEvento() rechazado por choque + reservarEvento() libre + cancelar(idPrevia) en el mismo act()
    let resInd;
    let resEvChoque;
    let resEvOk;
    let resCancPrevia;
    act(() => {
      resInd = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Individual',
      });
      resEvChoque = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia3,
        canchaIds: ['padel-1'],
        horas: ['16:00', '17:00'],
        invitados: 10,
        nombre: 'Choque Inmediato',
      });
      resEvOk = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia3,
        canchaIds: ['padel-1'],
        horas: ['17:00', '18:00'],
        invitados: 12,
        nombre: 'Evento Libre',
      });
      resCancPrevia = result.current.cancelar(idPrevia);
    });

    expect(resInd.ok).toBe(true);
    expect(resEvChoque).toEqual({
      ok: false,
      error: ERROR_EVENTO_NO_DISPONIBLE,
    });
    expect(resEvOk.ok).toBe(true);
    expect(resCancPrevia).toEqual({ ok: true });

    expect(result.current.reservas).toHaveLength(2);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      resInd.codigo,
      resEvOk.codigo,
    ]);

    const dispDia3 = result.current.disponibilidad('padel-1', dia3);
    expect(dispDia3.find((h) => h.hora === '14:00').disponible).toBe(true);
    expect(dispDia3.find((h) => h.hora === '16:00').disponible).toBe(false);
    expect(dispDia3.find((h) => h.hora === '17:00').disponible).toBe(false);
    expect(dispDia3.find((h) => h.hora === '18:00').disponible).toBe(false);

    // 2) reservar() seguido de cancelar() de ese mismo id en el mismo act()
    const tsMismo = Date.now();
    const idEsperado = `padel-1__${dia3}__19:00__${tsMismo}`;
    let resMismo;
    let resCancMismo;
    act(() => {
      resMismo = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['19:00'],
        nombre: 'Cancelación Mismo Act',
      });
      resCancMismo = result.current.cancelar(idEsperado);
    });

    expect(resMismo.ok).toBe(true);
    expect(resCancMismo).toEqual({ ok: true });
    expect(result.current.reservas).toHaveLength(2);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '19:00').disponible
    ).toBe(true);

    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.reservas).toHaveLength(2);
    expect(persistido.ocupados['padel-1'][dia3]).not.toContain('14:00');
    expect(persistido.ocupados['padel-1'][dia3]).not.toContain('19:00');
    expect(persistido.ocupados['padel-1'][dia3]).toEqual(
      expect.arrayContaining(['16:00', '17:00', '18:00'])
    );
  });

  it('#40: si setItem falla por cuota mientras getItem devuelve el JSON inicial viejo, la segunda reserva no borra la primera de memoria', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    const jsonInicialViejo = window.localStorage.getItem(STORAGE_KEY);
    expect(jsonInicialViejo).not.toBeNull();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let res1;
    act(() => {
      res1 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Primera En Cuota',
      });
    });
    expect(res1.ok).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(jsonInicialViejo);

    let res2;
    act(() => {
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Segunda En Cuota',
      });
    });
    expect(res2.ok).toBe(true);

    expect(result.current.reservas).toHaveLength(2);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      res1.codigo,
      res2.codigo,
    ]);
    const disp = result.current.disponibilidad('padel-1', dia3);
    expect(disp.find((h) => h.hora === '16:00').disponible).toBe(false);
    expect(disp.find((h) => h.hora === '17:00').disponible).toBe(false);
  });

  it('#41 Caso A: tabVieja reserva en un día compartido sin enfocarla antes y conserva en localStorage el día +6 reservado por tabNueva', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const tabVieja = renderHook(() => useReservas(), { wrapper });
    expect(tabVieja.result.current.dias).not.toContain('2026-11-23');

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const tabNueva = renderHook(() => useReservas(), { wrapper });
    expect(tabNueva.result.current.dias[6]).toBe('2026-11-23');

    let resNueva;
    act(() => {
      resNueva = tabNueva.result.current.reservar({
        canchaId: 'padel-1',
        fecha: '2026-11-23',
        horas: ['16:00'],
        nombre: 'Laura Día 6',
      });
    });
    expect(resNueva.ok).toBe(true);

    // tabVieja aún está en ventana 16..22 y reserva un día compartido sin haberse enfocado antes
    let resVieja;
    act(() => {
      resVieja = tabVieja.result.current.reservar({
        canchaId: 'padel-1',
        fecha: '2026-11-18',
        horas: ['14:00'],
        nombre: 'Carlos Día Compartido',
      });
    });
    expect(resVieja.ok).toBe(true);

    const persistido = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistido.ocupados['padel-1']['2026-11-23']).toContain('16:00');
    expect(persistido.ocupados['padel-1']['2026-11-18']).toContain('14:00');
    expect(persistido.reservas.map((r) => r.codigo)).toEqual(
      expect.arrayContaining([resNueva.codigo, resVieja.codigo])
    );

    // Al enfocar después tabVieja, renueva ventana y conserva 2026-11-23 ocupado en ambas pestañas
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(tabVieja.result.current.dias[6]).toBe('2026-11-23');
    expect(
      tabVieja.result.current
        .disponibilidad('padel-1', '2026-11-23')
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);
    expect(
      tabNueva.result.current
        .disponibilidad('padel-1', '2026-11-23')
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);

    const persistidoTrasRenovar = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(persistidoTrasRenovar.ocupados['padel-1']['2026-11-16']).toBeUndefined();
    expect(persistidoTrasRenovar.ocupados['padel-1']['2026-11-23']).toContain('16:00');
  });

  it('#41 Caso B: RENOVAR_VENTANA en tabVieja (sin evento storage previo, con evento storage previo y directo en reducer) no pierde el día +6', () => {
    vi.useFakeTimers();

    // Subcaso 1: sin haber recibido evento storage de tabNueva antes de focus
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const tabViejaSinSync = renderHook(() => useReservas(), { wrapper });

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const tabNueva1 = renderHook(() => useReservas(), { wrapper });

    let resNueva1;
    act(() => {
      resNueva1 = tabNueva1.result.current.reservar({
        canchaId: 'padel-1',
        fecha: '2026-11-23',
        horas: ['16:00'],
        nombre: 'Sofía Sin Sync',
      });
    });
    expect(resNueva1.ok).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(tabViejaSinSync.result.current.dias[6]).toBe('2026-11-23');
    expect(
      tabViejaSinSync.result.current
        .disponibilidad('padel-1', '2026-11-23')
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);
    expect(tabViejaSinSync.result.current.reservas.map((r) => r.codigo)).toContain(
      resNueva1.codigo
    );
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY)).ocupados['padel-1'][
        '2026-11-23'
      ]
    ).toContain('16:00');

    tabViejaSinSync.unmount();
    tabNueva1.unmount();
    window.localStorage.clear();

    // Subcaso 2: habiendo recibido el evento storage de tabNueva antes de focus
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));
    const tabViejaConSync = renderHook(() => useReservas(), { wrapper });

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const tabNueva2 = renderHook(() => useReservas(), { wrapper });

    let resNueva2;
    act(() => {
      resNueva2 = tabNueva2.result.current.reservar({
        canchaId: 'padel-1',
        fecha: '2026-11-23',
        horas: ['16:00'],
        nombre: 'Mateo Con Sync',
      });
    });
    expect(resNueva2.ok).toBe(true);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: window.localStorage.getItem(STORAGE_KEY),
        })
      );
    });
    expect(tabViejaConSync.result.current.dias[0]).toBe('2026-11-16');

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(tabViejaConSync.result.current.dias[6]).toBe('2026-11-23');
    expect(
      tabViejaConSync.result.current
        .disponibilidad('padel-1', '2026-11-23')
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY)).ocupados['padel-1'][
        '2026-11-23'
      ]
    ).toContain('16:00');

    tabViejaConSync.unmount();
    tabNueva2.unmount();
    window.localStorage.clear();

    // Subcaso 3: reducer directo con RENOVAR_VENTANA recibiendo datosStorage con el día 2026-11-23
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));
    const estadoDia1 = crearEstadoInicial();

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const estadoRenovado = reducer(estadoDia1, {
      type: 'RENOVAR_VENTANA',
      payload: {
        datosStorage: {
          ocupadosCrudos: {
            'padel-1': {
              '2026-11-23': ['08:00', '16:00', '20:00'],
            },
          },
          reservas: [
            {
              id: 'padel-1__2026-11-23__16:00__999',
              codigo: 'SPF-RED006',
              tipo: 'individual',
              canchaId: 'padel-1',
              fecha: '2026-11-23',
              hora: '16:00',
              horas: ['16:00'],
              nombre: 'Elena Reducer',
            },
          ],
        },
      },
    });
    expect(estadoRenovado.dias[6]).toBe('2026-11-23');
    expect(estadoRenovado.ocupados['padel-1']['2026-11-23']).toContain('16:00');
    expect(estadoRenovado.reservas).toHaveLength(1);
    expect(estadoRenovado.reservas[0].codigo).toBe('SPF-RED006');
  });

  it('#42: tras rechazo de reservar por choque con otra pestaña sin evento storage, disponibilidad() refleja la hora ocupada en el mismo tick antes del re-render', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });

    const dia3 = result.current.dias[3];
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);

    const guardadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const ocupadosOtraPestana = structuredClone(guardadoInicial.ocupados);
    ocupadosOtraPestana['padel-1'][dia3].push('16:00');
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ocupados: ocupadosOtraPestana,
        reservas: [
          {
            id: `padel-1__${dia3}__16:00__501`,
            codigo: 'SPF-CHOQ42',
            tipo: 'individual',
            canchaId: 'padel-1',
            fecha: dia3,
            hora: '16:00',
            horas: ['16:00'],
            nombre: 'Otro Usuario',
          },
        ],
      })
    );

    let resRechazo;
    let dispInmediata;
    act(() => {
      resRechazo = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Andrés Choque',
      });
      dispInmediata = result.current.disponibilidad('padel-1', dia3);
    });

    expect(resRechazo).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    expect(dispInmediata.find((h) => h.hora === '16:00').disponible).toBe(false);
    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe('SPF-CHOQ42');
  });

  it('rechaza reservar una hora que otra pestaña ya guardó en una segunda escritura', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia = result.current.dias[3];

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const conHoras = (horas, nombres) => {
      const d = JSON.parse(JSON.stringify(base));
      d.ocupados['padel-1'][dia] = [...(d.ocupados['padel-1'][dia] || []), ...horas];
      d.reservas = nombres.map((n, i) => ({
        id: `padel-1__${dia}__${horas[i]}__${i}`,
        tipo: 'individual', canchaId: 'padel-1', fecha: dia, horas: [horas[i]], nombre: n,
      }));
      return JSON.stringify(d);
    };
    const v1 = conHoras(['10:00'], ['Otra Uno']);
    const v2 = conHoras(['10:00', '11:00'], ['Otra Uno', 'Otra Dos']);

    // La otra pestaña escribe v1 y enseguida v2; aquí solo se procesó el evento de v1.
    window.localStorage.setItem(STORAGE_KEY, v2);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: v1 }));
    });

    let res;
    act(() => {
      res = result.current.reservar({ canchaId: 'padel-1', fecha: dia, horas: ['11:00'], nombre: 'Esta Pestana' });
    });

    const guardado = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(res).toEqual({ ok: false, error: 'Ese horario ya está reservado. Elige otro.' });
    expect(guardado.reservas.map((r) => r.nombre)).toEqual(
      expect.arrayContaining(['Otra Uno', 'Otra Dos'])
    );
  });

  it('conserva las dos escrituras previas de otra pestaña al reservar una hora libre en ambas versiones', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia = result.current.dias[3];

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const conHoras = (horas, nombres) => {
      const d = JSON.parse(JSON.stringify(base));
      d.ocupados['padel-1'][dia] = [...(d.ocupados['padel-1'][dia] || []), ...horas];
      d.reservas = nombres.map((n, i) => ({
        id: `padel-1__${dia}__${horas[i]}__${i}`,
        tipo: 'individual', canchaId: 'padel-1', fecha: dia, horas: [horas[i]], nombre: n,
      }));
      return JSON.stringify(d);
    };
    const v1 = conHoras(['10:00'], ['Otra Uno']);
    const v2 = conHoras(['10:00', '11:00'], ['Otra Uno', 'Otra Dos']);

    window.localStorage.setItem(STORAGE_KEY, v2);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: v1 }));
    });

    let res;
    act(() => {
      res = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia,
        horas: ['14:00'],
        nombre: 'Esta Pestana',
      });
    });

    expect(res.ok).toBe(true);
    expect(res.codigo).toMatch(/^SPF-[A-Z0-9]{6}$/);
    const guardado = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(guardado.reservas).toHaveLength(3);
    expect(guardado.reservas.map((r) => r.nombre)).toEqual(
      expect.arrayContaining(['Otra Uno', 'Otra Dos', 'Esta Pestana'])
    );
    expect(guardado.ocupados['padel-1'][dia]).toEqual(
      expect.arrayContaining(['10:00', '11:00', '14:00'])
    );
  });

  it('sincroniza desde localStorage si llega un evento storage con newValue null pero la clave sigue existiendo', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia = result.current.dias[3];

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const conHoras = (horas, nombres) => {
      const d = JSON.parse(JSON.stringify(base));
      d.ocupados['padel-1'][dia] = [...(d.ocupados['padel-1'][dia] || []), ...horas];
      d.reservas = nombres.map((n, i) => ({
        id: `padel-1__${dia}__${horas[i]}__${i}`,
        tipo: 'individual', canchaId: 'padel-1', fecha: dia, horas: [horas[i]], nombre: n,
      }));
      return JSON.stringify(d);
    };
    const v2 = conHoras(['10:00', '11:00'], ['Otra Uno', 'Otra Dos']);

    window.localStorage.setItem(STORAGE_KEY, v2);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: null }));
    });

    expect(result.current.reservas.map((r) => r.nombre)).toEqual(
      expect.arrayContaining(['Otra Uno', 'Otra Dos'])
    );

    let res;
    act(() => {
      res = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia,
        horas: ['11:00'],
        nombre: 'Esta Pestana',
      });
    });

    expect(res).toEqual({ ok: false, error: 'Ese horario ya está reservado. Elige otro.' });
  });

  it('RENOVAR_VENTANA en el reducer no lee localStorage cuando el payload omite datosStorage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const estadoInicial = crearEstadoInicial();
    const estadoConMemoria = reducer(estadoInicial, {
      type: 'RESERVAR',
      payload: {
        canchaId: 'padel-1',
        fecha: '2026-11-18',
        horas: ['14:00'],
        nombre: 'Reserva Memoria',
        codigo: 'SPF-MEM001',
        ahora: Date.now(),
      },
    });

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ocupados: {
          'padel-1': {
            '2026-11-23': ['16:00'],
          },
        },
        reservas: [
          {
            id: 'padel-1__2026-11-23__16:00__888',
            codigo: 'SPF-STG999',
            tipo: 'individual',
            canchaId: 'padel-1',
            fecha: '2026-11-23',
            hora: '16:00',
            horas: ['16:00'],
            nombre: 'Reserva Storage',
          },
        ],
      })
    );

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    const sinPayload = reducer(estadoConMemoria, { type: 'RENOVAR_VENTANA' });
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(sinPayload.dias[0]).toBe('2026-11-17');
    expect(sinPayload.reservas).toHaveLength(1);
    expect(sinPayload.reservas[0].codigo).toBe('SPF-MEM001');

    const sinDatosStorage = reducer(estadoConMemoria, {
      type: 'RENOVAR_VENTANA',
      payload: {},
    });
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(sinDatosStorage.dias[0]).toBe('2026-11-17');
    expect(sinDatosStorage.reservas).toHaveLength(1);
    expect(sinDatosStorage.reservas[0].codigo).toBe('SPF-MEM001');
  });

  it('conserva las reservas en memoria si getItem lanza durante un evento storage de borrado', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia = result.current.dias[3];

    let res;
    act(() => {
      res = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia,
        horas: ['14:00'],
        nombre: 'Reserva En Memoria',
      });
    });
    expect(res.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(1);

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage bloqueado');
    });

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }));
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe(res.codigo);
  });
});

describe('ReservasContext — render no pisa el avance de despachar (#51)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('#51: un render síncrono del padre tras startTransition no pisa estadoRef ni permite doble reserva de la misma hora', () => {
    let setTickPadre;
    function WrapperPadre({ children }) {
      const [tick, setTick] = useState(0);
      setTickPadre = setTick;
      return (
        <div data-tick={tick}>
          <ReservasProvider>{children}</ReservasProvider>
        </div>
      );
    }

    const { result } = renderHook(() => useReservas(), { wrapper: WrapperPadre });
    const dia3 = result.current.dias[3]; // padel-1 tiene 16:00 libre en semilla

    let res1;
    let res2;
    act(() => {
      startTransition(() => {
        res1 = result.current.reservar({
          canchaId: 'padel-1',
          fecha: dia3,
          horas: ['16:00'],
          nombre: 'Ana Transición',
        });
      });
      flushSync(() => {
        setTickPadre((n) => n + 1);
      });
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Luis Duplicado',
      });
    });

    expect(res1.ok).toBe(true);
    expect(res2).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe(res1.codigo);
  });

  it('#51: con tres reservas (H en transición, render del padre, H+1 y H), la tercera se rechaza y quedan exactamente dos reservas', () => {
    let setTickPadre;
    function WrapperPadre({ children }) {
      const [tick, setTick] = useState(0);
      setTickPadre = setTick;
      return (
        <div data-tick={tick}>
          <ReservasProvider>{children}</ReservasProvider>
        </div>
      );
    }

    const { result } = renderHook(() => useReservas(), { wrapper: WrapperPadre });
    const dia3 = result.current.dias[3]; // padel-1 tiene 16:00 y 17:00 libres en semilla

    let res1;
    let res2;
    let res3;
    act(() => {
      startTransition(() => {
        res1 = result.current.reservar({
          canchaId: 'padel-1',
          fecha: dia3,
          horas: ['16:00'],
          nombre: 'Sofía Hora H',
        });
      });
      flushSync(() => {
        setTickPadre((n) => n + 1);
      });
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Mateo Hora H+1',
      });
      res3 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Carlos Repetida',
      });
    });

    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);
    expect(res3).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    expect(result.current.reservas).toHaveLength(2);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual(
      expect.arrayContaining([res1.codigo, res2.codigo])
    );
  });

  it('#51: tras un evento storage de otra pestaña que ocupa H, reservar(H) falla y disponibilidad marca H ocupada en el mismo tick', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    const guardadoInicial = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const ocupadosOtraPestana = structuredClone(guardadoInicial.ocupados);
    ocupadosOtraPestana['padel-1'][dia3].push('16:00');
    const jsonOtraPestana = JSON.stringify({
      ocupados: ocupadosOtraPestana,
      reservas: [
        {
          id: `padel-1__${dia3}__16:00__510`,
          codigo: 'SPF-TAB51A',
          tipo: 'individual',
          canchaId: 'padel-1',
          fecha: dia3,
          hora: '16:00',
          horas: ['16:00'],
          nombre: 'Otra Pestaña',
        },
      ],
    });
    window.localStorage.setItem(STORAGE_KEY, jsonOtraPestana);

    let res;
    let dispEnMismoTick;
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonOtraPestana,
        })
      );
      dispEnMismoTick = result.current.disponibilidad('padel-1', dia3);
      res = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Esta Pestaña',
      });
    });

    expect(res).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    expect(dispEnMismoTick.find((h) => h.hora === '16:00').disponible).toBe(false);
    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].codigo).toBe('SPF-TAB51A');
  });

  it('#51: reducerVersionado sube version solo cuando el estado cambia y deja la misma referencia y version ante acciones sin efecto', () => {
    const inicial = crearEstadoInicial();
    expect(inicial.version).toBe(0);
    const dia3 = inicial.dias[3];

    // CANCELAR de un id inexistente no cambia nada
    const trasCancelarInexistente = reducerVersionado(inicial, {
      type: 'CANCELAR',
      payload: { reservaId: 'id-inexistente', ahora: Date.now() },
    });
    expect(trasCancelarInexistente).toBe(inicial);
    expect(trasCancelarInexistente.version).toBe(0);

    // RESERVAR válida sube la versión a 1
    const trasReservar = reducerVersionado(inicial, {
      type: 'RESERVAR',
      payload: {
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Sofía Versión',
        codigo: 'SPF-VER001',
        ahora: Date.now(),
      },
    });
    expect(trasReservar).not.toBe(inicial);
    expect(trasReservar.version).toBe(1);

    // RESERVAR sobre una hora ya ocupada devuelve exactamente la misma referencia y versión
    const trasOcupada = reducerVersionado(trasReservar, {
      type: 'RESERVAR',
      payload: {
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Luis Ocupada',
        codigo: 'SPF-VER002',
        ahora: Date.now(),
      },
    });
    expect(trasOcupada).toBe(trasReservar);
    expect(trasOcupada.version).toBe(1);
  });
});

describe('ReservasContext — reservas sin guardar (#50)', () => {
  const setItemOriginal = Storage.prototype.setItem;

  function congelarProfundo(valor) {
    if (!valor || typeof valor !== 'object') {
      return valor;
    }
    Object.freeze(valor);
    Object.keys(valor).forEach((clave) => {
      congelarProfundo(valor[clave]);
    });
    return valor;
  }

  function crearReservaIndividual({
    id,
    codigo,
    canchaId,
    fecha,
    hora,
    horas,
    nombre,
  }) {
    const listaHoras = horas || [hora];
    return {
      id,
      codigo,
      tipo: 'individual',
      canchaId,
      fecha,
      hora: listaHoras[0],
      horas: listaHoras,
      nombre,
    };
  }

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('C1 (#50): conserva reserva pendiente en memoria cuando otra pestaña escribe y dispara evento storage', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Pendiente',
      });
    });
    expect(resA.ok).toBe(true);
    const idA = result.current.reservas[0].id;

    const r2 = crearReservaIndividual({
      id: `padel-1__${dia3}__17:00__200`,
      codigo: 'SPF-OTRA02',
      canchaId: 'padel-1',
      fecha: dia3,
      horas: ['17:00'],
      nombre: 'Carlos Otra',
    });
    const ocupadosOtra = structuredClone(base.ocupados);
    ocupadosOtra['padel-1'][dia3].push('17:00');
    const jsonOtra = JSON.stringify({
      ocupados: ocupadosOtra,
      reservas: [r2],
    });
    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtra);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonOtra,
        })
      );
    });

    expect(result.current.reservas).toHaveLength(2);
    expect(result.current.reservas.map((r) => r.id)).toEqual(
      expect.arrayContaining([idA, r2.id])
    );

    const disp = result.current.disponibilidad('padel-1', dia3);
    expect(disp.find((h) => h.hora === '16:00').disponible).toBe(false);
    expect(disp.find((h) => h.hora === '17:00').disponible).toBe(false);
  });

  it('C2 (#50): conserva reserva pendiente por el camino leerEstadoFresco sin evento storage y rechaza reservar la misma hora H', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Pendiente',
      });
    });
    expect(resA.ok).toBe(true);
    const idA = result.current.reservas[0].id;

    const r2 = crearReservaIndividual({
      id: `padel-1__${dia3}__17:00__201`,
      codigo: 'SPF-OTRA03',
      canchaId: 'padel-1',
      fecha: dia3,
      horas: ['17:00'],
      nombre: 'Luis Otra',
    });
    const ocupadosOtra = structuredClone(base.ocupados);
    ocupadosOtra['padel-1'][dia3].push('17:00');
    setItemOriginal.call(
      window.localStorage,
      STORAGE_KEY,
      JSON.stringify({ ocupados: ocupadosOtra, reservas: [r2] })
    );

    let resNueva;
    act(() => {
      resNueva = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['18:00'],
        nombre: 'Elena Nueva',
      });
    });
    expect(resNueva.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(3);
    expect(result.current.reservas.map((r) => r.id)).toEqual(
      expect.arrayContaining([idA, r2.id])
    );

    let resChoqueH;
    act(() => {
      resChoqueH = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Intento Choque H',
      });
    });
    expect(resChoqueH).toEqual({
      ok: false,
      error: 'Ese horario ya está reservado. Elige otro.',
    });
    expect(result.current.reservas).toHaveLength(3);
  });

  it('C3 (#50): conserva reserva pendiente para mañana y su hora ocupada en el nuevo día 0 tras cambio de día con escritura externa', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const manana = result.current.dias[1]; // 2026-11-17

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: manana,
        horas: ['16:00'],
        nombre: 'Ana Mañana',
      });
    });
    expect(resA.ok).toBe(true);
    const idA = result.current.reservas[0].id;

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const estadoDiaNuevo = crearEstadoInicial();
    const r2 = crearReservaIndividual({
      id: 'padel-1__2026-11-23__18:00__300',
      codigo: 'SPF-DIA6',
      canchaId: 'padel-1',
      fecha: '2026-11-23',
      horas: ['18:00'],
      nombre: 'Pedro Día Nuevo',
    });
    const ocupadosOtra = structuredClone(estadoDiaNuevo.ocupados);
    ocupadosOtra['padel-1']['2026-11-23'].push('18:00');
    setItemOriginal.call(
      window.localStorage,
      STORAGE_KEY,
      JSON.stringify({ ocupados: ocupadosOtra, reservas: [r2] })
    );

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.dias[0]).toBe('2026-11-17');
    expect(result.current.reservas).toHaveLength(2);
    expect(result.current.reservas.map((r) => r.id)).toEqual(
      expect.arrayContaining([idA, r2.id])
    );
    expect(
      result.current
        .disponibilidad('padel-1', '2026-11-17')
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);
    expect(
      result.current
        .disponibilidad('padel-1', '2026-11-23')
        .find((h) => h.hora === '18:00').disponible
    ).toBe(false);
  });

  it('C4 (#50): un torneo o cumpleaños pendiente sobrevive al evento storage con todas sus celdas ocupadas', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const dia4 = result.current.dias[4];
    const dia5 = result.current.dias[5];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resTorneo;
    let resCumple;
    act(() => {
      resTorneo = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['16:00', '18:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            fecha: dia3,
            canchaIds: ['padel-2'],
            horas: ['17:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Final',
            fecha: dia5,
            canchaIds: ['padel-1'],
            horas: ['10:00'],
          },
        ],
        nombre: 'Torneo Pendiente',
      });
      resCumple = result.current.reservarEvento({
        subtipo: 'cumpleanos',
        fecha: dia4,
        canchaIds: ['voley-1', 'voley-2'],
        horas: ['09:00', '10:00'],
        invitados: 18,
        nombre: 'Cumple Pendiente',
      });
    });
    expect(resTorneo.ok).toBe(true);
    expect(resCumple.ok).toBe(true);
    const idTorneo = result.current.reservas[0].id;
    const idCumple = result.current.reservas[1].id;

    const r2 = crearReservaIndividual({
      id: `voley-1__${dia4}__14:00__400`,
      codigo: 'SPF-OTRA04',
      canchaId: 'voley-1',
      fecha: dia4,
      horas: ['14:00'],
      nombre: 'Marta Otra',
    });
    const ocupadosOtra = structuredClone(base.ocupados);
    ocupadosOtra['voley-1'][dia4].push('14:00');
    const jsonOtra = JSON.stringify({
      ocupados: ocupadosOtra,
      reservas: [r2],
    });
    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtra);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonOtra,
        })
      );
    });

    expect(result.current.reservas).toHaveLength(3);
    expect(result.current.reservas.map((r) => r.id)).toEqual(
      expect.arrayContaining([idTorneo, idCumple, r2.id])
    );

    const ocupada = (canchaId, fecha, hora) =>
      result.current
        .disponibilidad(canchaId, fecha)
        .find((h) => h.hora === hora).disponible;

    expect(ocupada('padel-1', dia3, '16:00')).toBe(false);
    expect(ocupada('padel-1', dia3, '18:00')).toBe(false);
    expect(ocupada('padel-2', dia3, '17:00')).toBe(false);
    expect(ocupada('padel-1', dia5, '10:00')).toBe(false);
    expect(ocupada('voley-1', dia4, '09:00')).toBe(false);
    expect(ocupada('voley-1', dia4, '10:00')).toBe(false);
    expect(ocupada('voley-2', dia4, '09:00')).toBe(false);
    expect(ocupada('voley-2', dia4, '10:00')).toBe(false);
    expect(ocupada('voley-1', dia4, '14:00')).toBe(false);
  });

  it('C5 (#50): no duplica la reserva si la otra pestaña ya escribió el mismo id', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    act(() => {
      result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Mismo Id',
      });
    });
    const reservaPendiente = result.current.reservas[0];

    const ocupadosOtra = structuredClone(base.ocupados);
    ocupadosOtra['padel-1'][dia3].push('16:00');
    const jsonOtra = JSON.stringify({
      ocupados: ocupadosOtra,
      reservas: [reservaPendiente],
    });
    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtra);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonOtra,
        })
      );
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].id).toBe(reservaPendiente.id);
  });

  it('C6 (#50): cuando setItem vuelve a funcionar, la siguiente escritura guarda la pendiente en localStorage y una escritura externa posterior sin ella la reemplaza', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Recuperada',
      });
    });
    expect(resA.ok).toBe(true);
    const idA = result.current.reservas[0].id;
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).reservas).toEqual([]);

    // Se restablece setItem y llega evento storage de otra pestaña con R2
    setItemSpy.mockRestore();

    const r2 = crearReservaIndividual({
      id: `padel-1__${dia3}__17:00__500`,
      codigo: 'SPF-REC002',
      canchaId: 'padel-1',
      fecha: dia3,
      horas: ['17:00'],
      nombre: 'Carlos Otra',
    });
    const ocupadosConR2 = structuredClone(base.ocupados);
    ocupadosConR2['padel-1'][dia3].push('17:00');
    const jsonR2 = JSON.stringify({
      ocupados: ocupadosConR2,
      reservas: [r2],
    });
    window.localStorage.setItem(STORAGE_KEY, jsonR2);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonR2,
        })
      );
    });

    const persistidoTrasRecuperar = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
    );
    expect(persistidoTrasRecuperar.reservas).toHaveLength(2);
    expect(persistidoTrasRecuperar.reservas.map((r) => r.id)).toEqual(
      expect.arrayContaining([idA, r2.id])
    );

    // Escritura externa posterior sin idA reemplaza el estado normalmente
    window.localStorage.setItem(STORAGE_KEY, jsonR2);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonR2,
        })
      );
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].id).toBe(r2.id);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);
  });

  it('C7 (#50): si A cancela una reserva pendiente, no reaparece tras un evento storage ni tras un cambio de día', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3]; // 2026-11-19
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Cancelada',
      });
    });
    expect(resA.ok).toBe(true);
    const idA = result.current.reservas[0].id;

    let resCancel;
    act(() => {
      resCancel = result.current.cancelar(idA);
    });
    expect(resCancel).toEqual({ ok: true });
    expect(result.current.reservas).toEqual([]);

    const r2 = crearReservaIndividual({
      id: `padel-1__${dia3}__17:00__600`,
      codigo: 'SPF-OTRA06',
      canchaId: 'padel-1',
      fecha: dia3,
      horas: ['17:00'],
      nombre: 'Luis Otra',
    });
    const ocupadosOtra = structuredClone(base.ocupados);
    ocupadosOtra['padel-1'][dia3].push('17:00');
    const jsonOtra = JSON.stringify({
      ocupados: ocupadosOtra,
      reservas: [r2],
    });
    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtra);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonOtra,
        })
      );
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].id).toBe(r2.id);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const estadoDiaNuevo = crearEstadoInicial();
    const ocupadosDiaNuevo = structuredClone(estadoDiaNuevo.ocupados);
    ocupadosDiaNuevo['padel-1'][dia3].push('17:00');
    setItemOriginal.call(
      window.localStorage,
      STORAGE_KEY,
      JSON.stringify({ ocupados: ocupadosDiaNuevo, reservas: [r2] })
    );

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.reservas).toHaveLength(1);
    expect(result.current.reservas[0].id).toBe(r2.id);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);
  });

  it('C8 (#50): con setItem funcionando siempre, una reserva cancelada en otra pestaña desaparece de A tras el evento storage', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Sofía Normal',
      });
    });
    expect(resA.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(1);

    const jsonSinReserva = JSON.stringify({
      ocupados: base.ocupados,
      reservas: [],
    });
    window.localStorage.setItem(STORAGE_KEY, jsonSinReserva);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: jsonSinReserva,
        })
      );
    });

    expect(result.current.reservas).toEqual([]);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(true);
  });

  it('C9 (#54): si otra pestaña borra la clave (removeItem o clear), A conserva las reservas sin guardar sobre la semilla y el espejo reintenta guardar', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    // Reserva ya guardada (debe desaparecer si otra pestaña limpia el almacenamiento).
    let rGuardada;
    act(() => {
      rGuardada = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Ana Guardada',
      });
    });
    expect(rGuardada.ok).toBe(true);

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let rPendiente1;
    act(() => {
      rPendiente1 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Borrado',
      });
    });
    expect(result.current.reservas).toHaveLength(2);

    act(() => {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null })
      );
    });

    expect(result.current.reservas.map((r) => r.codigo)).toEqual([rPendiente1.codigo]);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '14:00').disponible
    ).toBe(true);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);

    // También ante localStorage.clear() (key: null) conserva las pendientes y reintenta al recuperar setItem.
    setItemSpy.mockRestore();
    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });

    expect(result.current.reservas.map((r) => r.codigo)).toEqual([rPendiente1.codigo]);
    expect(
      result.current
        .disponibilidad('padel-1', dia3)
        .find((h) => h.hora === '16:00').disponible
    ).toBe(false);
    const guardadoReintento = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(guardadoReintento.reservas.map((r) => r.codigo)).toEqual([
      rPendiente1.codigo,
    ]);
  });

  it('C10 (#50): conservarReservasSinGuardar no muta sus argumentos y con el registro vacío devuelve el mismo objeto guardado', () => {
    expect(typeof conservarReservasSinGuardar).toBe('function');

    const estadoBase = crearEstadoInicial();
    const dia3 = estadoBase.dias[3];
    const dia5 = estadoBase.dias[5];

    const rGuardada = crearReservaIndividual({
      id: `padel-1__${dia3}__10:00__1`,
      codigo: 'SPF-G001',
      canchaId: 'padel-1',
      fecha: dia3,
      horas: ['10:00'],
      nombre: 'Guardada',
    });
    const ocupadosGuardado = structuredClone(estadoBase.ocupados);
    ocupadosGuardado['padel-1'][dia3].push('10:00');
    const guardado = congelarProfundo({
      ocupados: ocupadosGuardado,
      reservas: [rGuardada],
    });

    const vacio = conservarReservasSinGuardar(guardado, [rGuardada], new Set());
    expect(vacio).toBe(guardado);

    const rIndividual = crearReservaIndividual({
      id: `padel-1__${dia3}__16:00__2`,
      codigo: 'SPF-P002',
      canchaId: 'padel-1',
      fecha: dia3,
      horas: ['16:00', '17:00'],
      nombre: 'Individual Pendiente',
    });
    const rTorneo = {
      id: `evento__${dia3}__3`,
      codigo: 'SPF-P003',
      tipo: 'evento',
      subtipo: 'torneo',
      fecha: dia3,
      canchaIds: ['padel-1', 'padel-2'],
      horas: ['14:00'],
      bloques: [
        {
          ronda: 1,
          fecha: dia3,
          canchaIds: ['padel-2'],
          horas: ['18:00', '15:00'],
        },
        {
          ronda: 2,
          fecha: dia5,
          canchaIds: ['padel-1'],
          horas: ['09:00'],
        },
        {
          ronda: 3,
          fecha: '2020-01-01', // fuera de ventana
          canchaIds: ['padel-1'],
          horas: ['12:00'],
        },
      ],
      nombre: 'Torneo Pendiente',
    };
    const rCumple = {
      id: `evento__${dia5}__4`,
      codigo: 'SPF-P004',
      tipo: 'evento',
      subtipo: 'cumpleanos',
      fecha: dia5,
      canchaIds: ['voley-1', 'voley-2'],
      horas: ['11:00', '12:00'],
      nombre: 'Cumple Pendiente',
    };

    const reservasMemoria = congelarProfundo([
      rGuardada,
      rIndividual,
      rTorneo,
      rCumple,
    ]);
    const idsSinGuardar = new Set([
      rGuardada.id,
      rIndividual.id,
      rTorneo.id,
      rCumple.id,
    ]);

    const resultado = conservarReservasSinGuardar(
      guardado,
      reservasMemoria,
      idsSinGuardar
    );

    expect(resultado).not.toBe(guardado);
    expect(resultado.reservas.map((r) => r.id)).toEqual([
      rGuardada.id,
      rIndividual.id,
      rTorneo.id,
      rCumple.id,
    ]);
    expect(resultado.ocupados['padel-1'][dia3]).toEqual(
      expect.arrayContaining(['10:00', '16:00', '17:00'])
    );
    expect(resultado.ocupados['padel-2'][dia3]).toEqual(
      expect.arrayContaining(['15:00', '18:00'])
    );
    // Verifica orden y sin duplicados en padel-2 dia3
    const horasPadel2Dia3 = resultado.ocupados['padel-2'][dia3];
    expect(horasPadel2Dia3).toEqual([...new Set(horasPadel2Dia3)].sort());
    expect(resultado.ocupados['padel-1'][dia5]).toContain('09:00');
    expect(resultado.ocupados['voley-1'][dia5]).toEqual(
      expect.arrayContaining(['11:00', '12:00'])
    );
    expect(resultado.ocupados['voley-2'][dia5]).toEqual(
      expect.arrayContaining(['11:00', '12:00'])
    );
    expect(resultado.ocupados['padel-1']['2020-01-01']).toBeUndefined();
  });
});

describe('ReservasContext — transición antes del render y storage (#56)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('#56: reserva despachada dentro de startTransition no se pierde si llega un evento storage antes de que confirme el render', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    const ocupadosOtra = structuredClone(base.ocupados);
    ocupadosOtra['padel-1'][dia3].push('14:00');
    const jsonOtra = JSON.stringify({
      ocupados: ocupadosOtra,
      reservas: [
        {
          id: `padel-1__${dia3}__14:00__5601`,
          codigo: 'SPF-56OTRA',
          tipo: 'individual',
          canchaId: 'padel-1',
          fecha: dia3,
          hora: '14:00',
          horas: ['14:00'],
          nombre: 'Otra Pestaña',
        },
      ],
    });

    let resTransicion;
    act(() => {
      startTransition(() => {
        resTransicion = result.current.reservar({
          canchaId: 'padel-1',
          fecha: dia3,
          horas: ['16:00'],
          nombre: 'Ana Transición',
        });
      });

      // Mismo tick, antes de confirmar el render/efecto espejo: otra pestaña escribe y dispara storage.
      window.localStorage.setItem(STORAGE_KEY, jsonOtra);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtra })
      );
    });

    expect(resTransicion.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(2);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual(
      expect.arrayContaining(['SPF-56OTRA', resTransicion.codigo])
    );

    const guardadoFinal = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(guardadoFinal.reservas.map((r) => r.codigo)).toEqual(
      expect.arrayContaining(['SPF-56OTRA', resTransicion.codigo])
    );
    const dispDia3 = result.current.disponibilidad('padel-1', dia3);
    expect(dispDia3.find((h) => h.hora === '14:00').disponible).toBe(false);
    expect(dispDia3.find((h) => h.hora === '16:00').disponible).toBe(false);
  });

  it('#56: reserva despachada dentro de startTransition no se pierde si leerEstadoFresco sincroniza otra escritura en el mismo tick', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    const ocupadosOtra = structuredClone(base.ocupados);
    ocupadosOtra['padel-1'][dia3].push('14:00');
    const jsonOtra = JSON.stringify({
      ocupados: ocupadosOtra,
      reservas: [
        {
          id: `padel-1__${dia3}__14:00__5602`,
          codigo: 'SPF-56OTRA2',
          tipo: 'individual',
          canchaId: 'padel-1',
          fecha: dia3,
          hora: '14:00',
          horas: ['14:00'],
          nombre: 'Otra Pestaña 2',
        },
      ],
    });

    let res1;
    let res2;
    act(() => {
      startTransition(() => {
        res1 = result.current.reservar({
          canchaId: 'padel-1',
          fecha: dia3,
          horas: ['16:00'],
          nombre: 'Ana Transición 1',
        });
      });

      // Otra pestaña escribe sin que todavía llegue storage; una segunda reserva local ejecuta leerEstadoFresco.
      window.localStorage.setItem(STORAGE_KEY, jsonOtra);
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Luis Segunda',
      });
    });

    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);
    expect(result.current.reservas).toHaveLength(3);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual(
      expect.arrayContaining(['SPF-56OTRA2', res1.codigo, res2.codigo])
    );
  });
});

describe('ReservasContext — cancelaciones sin guardar (#53)', () => {
  const setItemOriginal = Storage.prototype.setItem;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('#53 camino storage: una cancelación que falló al guardarse no reaparece cuando otra pestaña escribe y se limpia al volver a guardar', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Cancelar',
      });
    });
    expect(resA.ok).toBe(true);
    const idA = result.current.reservas[0].id;
    const guardadoConA = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resCancel;
    act(() => {
      resCancel = result.current.cancelar(idA);
    });
    expect(resCancel).toEqual({ ok: true });
    expect(result.current.reservas).toEqual([]);

    const otroEstado = structuredClone(guardadoConA);
    otroEstado.ocupados['padel-1'][dia3].push('14:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__14:00__5301`,
      codigo: 'SPF-53B1',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '14:00',
      horas: ['14:00'],
      nombre: 'Otra Pestaña',
    });
    const jsonOtro = JSON.stringify(otroEstado);

    setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtro);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtro })
      );
    });

    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-53B1']);
    const disp = result.current.disponibilidad('padel-1', dia3);
    expect(disp.find((h) => h.hora === '16:00').disponible).toBe(true);
    expect(disp.find((h) => h.hora === '14:00').disponible).toBe(false);

    // Al restaurar setItem y guardar de nuevo, la cancelación persiste en localStorage y se limpia el registro.
    setItemSpy.mockRestore();
    let resC;
    act(() => {
      resC = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Carlos Nueva',
      });
    });
    expect(resC.ok).toBe(true);
    const guardadoFinal = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(guardadoFinal.reservas.map((r) => r.codigo)).toEqual(['SPF-53B1', resC.codigo]);
    expect(guardadoFinal.ocupados['padel-1'][dia3]).not.toContain('16:00');
  });

  it('#53 camino leerEstadoFresco: una cancelación sin guardar no reaparece al reservar otra hora después de una escritura externa', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    act(() => {
      result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Cancelar 2',
      });
    });
    const idA = result.current.reservas[0].id;
    const guardadoConA = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    act(() => {
      result.current.cancelar(idA);
    });
    expect(result.current.reservas).toEqual([]);

    const otroEstado = structuredClone(guardadoConA);
    otroEstado.ocupados['padel-1'][dia3].push('14:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__14:00__5302`,
      codigo: 'SPF-53B2',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '14:00',
      horas: ['14:00'],
      nombre: 'Otra Pestaña 2',
    });
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otroEstado));

    let resC;
    act(() => {
      resC = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Luis Tercera',
      });
    });

    expect(resC.ok).toBe(true);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-53B2', resC.codigo]);
    const disp = result.current.disponibilidad('padel-1', dia3);
    expect(disp.find((h) => h.hora === '16:00').disponible).toBe(true);
    expect(disp.find((h) => h.hora === '14:00').disponible).toBe(false);
    expect(disp.find((h) => h.hora === '17:00').disponible).toBe(false);
  });

  it('#53 camino renovarSiCambioElDia: una cancelación sin guardar no reaparece al cambiar de día con escritura externa', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 10, 10, 0, 0));

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    act(() => {
      result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Cambio Día',
      });
    });
    const idA = result.current.reservas[0].id;
    const guardadoConA = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    act(() => {
      result.current.cancelar(idA);
    });
    expect(result.current.reservas).toEqual([]);

    // Pasa al día siguiente y otra pestaña escribe manteniendo idA + una nueva reserva en el mismo día.
    vi.setSystemTime(new Date(2026, 10, 11, 8, 0, 0));
    const otroEstado = structuredClone(guardadoConA);
    otroEstado.ocupados['padel-1'][dia3].push('14:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__14:00__5303`,
      codigo: 'SPF-53B3',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '14:00',
      horas: ['14:00'],
      nombre: 'Otra Pestaña 3',
    });
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otroEstado));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-53B3']);
    const disp = result.current.disponibilidad('padel-1', dia3);
    expect(disp.find((h) => h.hora === '16:00').disponible).toBe(true);
    expect(disp.find((h) => h.hora === '14:00').disponible).toBe(false);
  });

  it('#53 + #56: cancelación en startTransition antes del render no reaparece si llega evento storage', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    act(() => {
      result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Transición Cancelar',
      });
    });
    const idA = result.current.reservas[0].id;
    const guardadoConA = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    const otroEstado = structuredClone(guardadoConA);
    otroEstado.ocupados['padel-1'][dia3].push('14:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__14:00__5304`,
      codigo: 'SPF-53B4',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '14:00',
      horas: ['14:00'],
      nombre: 'Otra Pestaña 4',
    });
    const jsonOtro = JSON.stringify(otroEstado);

    let resCancel;
    act(() => {
      startTransition(() => {
        resCancel = result.current.cancelar(idA);
      });
      window.localStorage.setItem(STORAGE_KEY, jsonOtro);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtro })
      );
    });

    expect(resCancel).toEqual({ ok: true });
    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-53B4']);
    const disp = result.current.disponibilidad('padel-1', dia3);
    expect(disp.find((h) => h.hora === '16:00').disponible).toBe(true);
    expect(disp.find((h) => h.hora === '14:00').disponible).toBe(false);
  });
});

describe('ReservasContext — choque de reserva sin guardar con otra guardada (#55)', () => {
  const setItemOriginal = Storage.prototype.setItem;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('#55: si una reserva pendiente choca con otra ya guardada al llegar storage, se descarta y registra un aviso descartable', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Choque',
      });
    });
    expect(resA.ok).toBe(true);
    expect(result.current.avisosConflicto).toEqual([]);

    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('16:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__16:00__5501`,
      codigo: 'SPF-55B1',
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

    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-55B1']);
    expect(result.current.avisosConflicto).toHaveLength(1);
    const aviso = result.current.avisosConflicto[0];
    expect(aviso.mensaje).toContain(resA.codigo);
    expect(aviso.mensaje).not.toMatch(/localStorage|pestaña/i);

    act(() => {
      result.current.descartarAvisoConflicto(aviso.id);
    });
    expect(result.current.avisosConflicto).toEqual([]);
  });

  it('#55: también descarta el choque y avisa cuando sincroniza por leerEstadoFresco', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    let resA;
    act(() => {
      resA = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Choque Fresco',
      });
    });

    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('16:00');
    otroEstado.reservas.push({
      id: `padel-1__${dia3}__16:00__5502`,
      codigo: 'SPF-55B2',
      tipo: 'individual',
      canchaId: 'padel-1',
      fecha: dia3,
      hora: '16:00',
      horas: ['16:00'],
      nombre: 'Otra Pestaña 2',
    });
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otroEstado));

    let resA2;
    act(() => {
      resA2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['17:00'],
        nombre: 'Ana Libre',
      });
    });

    expect(resA2.ok).toBe(true);
    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-55B2',
      resA2.codigo,
    ]);
    expect(result.current.avisosConflicto).toHaveLength(1);
    expect(result.current.avisosConflicto[0].mensaje).toContain(resA.codigo);
  });
});

describe('ReservasContext — casos de riesgo de sincronización (#66)', () => {
  const setItemOriginal = Storage.prototype.setItem;
  const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;

  function mockearSetItemFalla() {
    return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });
  }

  function leerGuardado() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
  }

  function escribirYDespacharStorage(datos) {
    const json = JSON.stringify(datos);
    setItemOriginal.call(window.localStorage, STORAGE_KEY, json);
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: json })
      );
    });
    return json;
  }

  function crearReservaExterna({
    id,
    codigo,
    canchaId = 'padel-1',
    fecha,
    horas,
    nombre = 'Otra Pestaña',
  }) {
    return {
      id,
      codigo,
      tipo: 'individual',
      canchaId,
      canchaNombre: 'Cancha Pádel 1',
      deporte: 'padel',
      fecha,
      hora: horas[0],
      horas: [...horas],
      nombre,
    };
  }

  function horaDisponible(result, canchaId, fecha, hora) {
    return result.current
      .disponibilidad(canchaId, fecha)
      .find((h) => h.hora === hora)?.disponible;
  }

  function assertUnAvisoConCodigo(result, codigo) {
    expect(result.current.avisosConflicto).toHaveLength(1);
    const aviso = result.current.avisosConflicto[0];
    expect(aviso.mensaje).toContain(codigo);
    expect(aviso.mensaje).not.toMatch(/localStorage|pestaña|storage/i);
    return aviso;
  }

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('#66 caso 1 (S2): cancelar R1 y volver a reservar R2 en la misma celda sin guardar, luego storage con R1 y Rb deja R2 y Rb sin avisos', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];

    let res1;
    act(() => {
      res1 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Ana R1',
      });
    });
    expect(res1.ok).toBe(true);
    const idR1 = result.current.reservas[0].id;
    const estadoGuardado = leerGuardado();

    mockearSetItemFalla();
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 10));

    let resCancel;
    let res2;
    act(() => {
      resCancel = result.current.cancelar(idR1);
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Ana R2 Misma Hora',
      });
    });
    expect(resCancel).toEqual({ ok: true });
    expect(res2.ok).toBe(true);

    const rb = crearReservaExterna({
      id: `padel-1__${dia3}__18:00__6601`,
      codigo: 'SPF-S2B001',
      fecha: dia3,
      horas: ['18:00'],
    });
    const otroEstado = structuredClone(estadoGuardado);
    otroEstado.ocupados['padel-1'][dia3].push('18:00');
    otroEstado.reservas.push(rb);
    escribirYDespacharStorage(otroEstado);

    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-S2B001',
      res2.codigo,
    ]);
    expect(horaDisponible(result, 'padel-1', dia3, '14:00')).toBe(false);
    expect(horaDisponible(result, 'padel-1', dia3, '18:00')).toBe(false);
    expect(result.current.avisosConflicto).toEqual([]);
  });

  it('#66 caso 2 (segundo bloque): un torneo pendiente que choca en su segundo bloque contra una individual guardada se descarta completo', () => {
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const dia5 = result.current.dias[5];
    const base = leerGuardado();

    mockearSetItemFalla();

    let resTorneo;
    act(() => {
      resTorneo = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['14:00', '15:00'],
          },
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-2'],
            horas: ['16:00', '17:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Semifinal',
            fecha: dia5,
            canchaIds: ['padel-1'],
            horas: ['10:00', '11:00'],
          },
        ],
        nombre: 'Torneo Choque Bloque 2',
      });
    });
    expect(resTorneo.ok).toBe(true);

    const rb = crearReservaExterna({
      id: `padel-2__${dia3}__16:00__6602`,
      codigo: 'SPF-66EV2A',
      canchaId: 'padel-2',
      fecha: dia3,
      horas: ['16:00'],
    });
    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-2'][dia3].push('16:00');
    otroEstado.reservas.push(rb);
    escribirYDespacharStorage(otroEstado);

    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-66EV2A']);
    expect(horaDisponible(result, 'padel-1', dia3, '14:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia3, '15:00')).toBe(true);
    expect(horaDisponible(result, 'padel-2', dia3, '16:00')).toBe(false);
    expect(horaDisponible(result, 'padel-2', dia3, '17:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia5, '10:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia5, '11:00')).toBe(true);
    assertUnAvisoConCodigo(result, resTorneo.codigo);
  });

  it('#66 caso 2 (último bloque): un torneo pendiente que choca en su último bloque contra una individual guardada se descarta completo', () => {
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const dia4 = result.current.dias[4];
    const dia5 = result.current.dias[5];
    const base = leerGuardado();

    mockearSetItemFalla();

    let resTorneo;
    act(() => {
      resTorneo = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['14:00', '15:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Semifinal',
            fecha: dia4,
            canchaIds: ['padel-2'],
            horas: ['10:00', '11:00'],
          },
          {
            ronda: 3,
            nombreRonda: 'Final',
            fecha: dia5,
            canchaIds: ['padel-1'],
            horas: ['16:00', '17:00'],
          },
        ],
        nombre: 'Torneo Choque Último Bloque',
      });
    });
    expect(resTorneo.ok).toBe(true);

    const rb = crearReservaExterna({
      id: `padel-1__${dia5}__17:00__6603`,
      codigo: 'SPF-66EV3A',
      canchaId: 'padel-1',
      fecha: dia5,
      horas: ['17:00'],
    });
    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia5].push('17:00');
    otroEstado.reservas.push(rb);
    escribirYDespacharStorage(otroEstado);

    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-66EV3A']);
    expect(horaDisponible(result, 'padel-1', dia3, '14:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia3, '15:00')).toBe(true);
    expect(horaDisponible(result, 'padel-2', dia4, '10:00')).toBe(true);
    expect(horaDisponible(result, 'padel-2', dia4, '11:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia5, '16:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia5, '17:00')).toBe(false);
    assertUnAvisoConCodigo(result, resTorneo.codigo);
  });

  it('#66 caso 3 (S6): borrar la clave con removeItem y clear(), sin pendientes y con cancelación más alta pendiente', () => {
    // (a) Sin pendientes: removeItem
    const tabA = renderHook(() => useReservas(), { wrapper });
    const dia3a = tabA.result.current.dias[3];

    let resA;
    act(() => {
      resA = tabA.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3a,
        horas: ['16:00'],
        nombre: 'Ana S6a',
      });
    });
    expect(resA.ok).toBe(true);

    act(() => {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null })
      );
    });
    expect(tabA.result.current.reservas).toEqual([]);
    expect(horaDisponible(tabA.result, 'padel-1', dia3a, '16:00')).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(tabA.result.current.avisosConflicto).toEqual([]);
    tabA.unmount();
    window.localStorage.clear();

    // (b) Sin pendientes: clear() con key null
    const tabB = renderHook(() => useReservas(), { wrapper });
    const dia3b = tabB.result.current.dias[3];

    let resB;
    act(() => {
      resB = tabB.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3b,
        horas: ['16:00'],
        nombre: 'Ana S6b',
      });
    });
    expect(resB.ok).toBe(true);

    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    expect(tabB.result.current.reservas).toEqual([]);
    expect(horaDisponible(tabB.result, 'padel-1', dia3b, '16:00')).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(tabB.result.current.avisosConflicto).toEqual([]);
    tabB.unmount();
    window.localStorage.clear();

    // (c) Con cancelación pendiente + alta pendiente: removeItem, luego setItem restaurado + otra acción
    const tabC = renderHook(() => useReservas(), { wrapper });
    const dia3c = tabC.result.current.dias[3];

    let resGuardadaC;
    act(() => {
      resGuardadaC = tabC.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3c,
        horas: ['14:00'],
        nombre: 'Ana Guardada S6c',
      });
    });
    expect(resGuardadaC.ok).toBe(true);
    const idGuardadaC = tabC.result.current.reservas[0].id;

    const spyC = mockearSetItemFalla();
    let resCancelC;
    let resPendC;
    act(() => {
      resCancelC = tabC.result.current.cancelar(idGuardadaC);
      resPendC = tabC.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3c,
        horas: ['16:00'],
        nombre: 'Ana Pendiente S6c',
      });
    });
    expect(resCancelC).toEqual({ ok: true });
    expect(resPendC.ok).toBe(true);

    act(() => {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null })
      );
    });
    expect(tabC.result.current.reservas.map((r) => r.codigo)).toEqual([
      resPendC.codigo,
    ]);
    expect(horaDisponible(tabC.result, 'padel-1', dia3c, '14:00')).toBe(true);
    expect(horaDisponible(tabC.result, 'padel-1', dia3c, '16:00')).toBe(false);
    expect(tabC.result.current.avisosConflicto).toEqual([]);

    spyC.mockRestore();
    let resNuevaC;
    act(() => {
      resNuevaC = tabC.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3c,
        horas: ['17:00'],
        nombre: 'Luis S6c',
      });
    });
    expect(resNuevaC.ok).toBe(true);
    expect(tabC.result.current.reservas.map((r) => r.codigo)).toEqual([
      resPendC.codigo,
      resNuevaC.codigo,
    ]);
    const guardadoFinalC = leerGuardado();
    expect(guardadoFinalC.reservas.map((r) => r.codigo)).toEqual([
      resPendC.codigo,
      resNuevaC.codigo,
    ]);
    expect(horaDisponible(tabC.result, 'padel-1', dia3c, '14:00')).toBe(true);
    expect(horaDisponible(tabC.result, 'padel-1', dia3c, '16:00')).toBe(false);
    expect(horaDisponible(tabC.result, 'padel-1', dia3c, '17:00')).toBe(false);
    tabC.unmount();
    window.localStorage.clear();

    // (d) Con cancelación pendiente + alta pendiente: localStorage.clear() (key null), luego setItem restaurado + otra acción
    const tabD = renderHook(() => useReservas(), { wrapper });
    const dia3d = tabD.result.current.dias[3];

    let resGuardadaD;
    act(() => {
      resGuardadaD = tabD.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3d,
        horas: ['14:00'],
        nombre: 'Ana Guardada S6d',
      });
    });
    expect(resGuardadaD.ok).toBe(true);
    const idGuardadaD = tabD.result.current.reservas[0].id;

    const spyD = mockearSetItemFalla();
    let resCancelD;
    let resPendD;
    act(() => {
      resCancelD = tabD.result.current.cancelar(idGuardadaD);
      resPendD = tabD.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3d,
        horas: ['16:00'],
        nombre: 'Ana Pendiente S6d',
      });
    });
    expect(resCancelD).toEqual({ ok: true });
    expect(resPendD.ok).toBe(true);

    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    expect(tabD.result.current.reservas.map((r) => r.codigo)).toEqual([
      resPendD.codigo,
    ]);
    expect(horaDisponible(tabD.result, 'padel-1', dia3d, '14:00')).toBe(true);
    expect(horaDisponible(tabD.result, 'padel-1', dia3d, '16:00')).toBe(false);
    expect(tabD.result.current.avisosConflicto).toEqual([]);

    spyD.mockRestore();
    let resNuevaD;
    act(() => {
      resNuevaD = tabD.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3d,
        horas: ['17:00'],
        nombre: 'Luis S6d',
      });
    });
    expect(resNuevaD.ok).toBe(true);
    expect(tabD.result.current.reservas.map((r) => r.codigo)).toEqual([
      resPendD.codigo,
      resNuevaD.codigo,
    ]);
    const guardadoFinalD = leerGuardado();
    expect(guardadoFinalD.reservas.map((r) => r.codigo)).toEqual([
      resPendD.codigo,
      resNuevaD.codigo,
    ]);
    expect(horaDisponible(tabD.result, 'padel-1', dia3d, '14:00')).toBe(true);
    expect(horaDisponible(tabD.result, 'padel-1', dia3d, '16:00')).toBe(false);
    expect(horaDisponible(tabD.result, 'padel-1', dia3d, '17:00')).toBe(false);
  });

  it('#66 caso 4 (S14): ultimoRawStorageRef ilegible o nulo (JSON corrupto + cambio de día + storage válido sin R1, y clave borrada + setItem fallando + storage válido con Rb)', () => {
    // Variante (a): JSON corrupto + cambio de día + estado válido sin R1
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const tabA = renderHook(() => useReservas(), { wrapper });
    const dia3 = tabA.result.current.dias[3]; // 2026-11-19
    const baseSinR1 = leerGuardado();

    let resR1;
    act(() => {
      resR1 = tabA.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Ana R1 S14a',
      });
    });
    expect(resR1.ok).toBe(true);

    setItemOriginal.call(window.localStorage, STORAGE_KEY, '{no es json');

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    const rb1 = crearReservaExterna({
      id: `padel-1__${dia3}__18:00__66141`,
      codigo: 'SPF-S14B01',
      fecha: dia3,
      horas: ['18:00'],
    });
    const validoSinR1 = structuredClone(baseSinR1);
    validoSinR1.ocupados['padel-1'][dia3].push('18:00');
    validoSinR1.reservas = [rb1];
    escribirYDespacharStorage(validoSinR1);

    expect(tabA.result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-S14B01',
    ]);
    expect(leerGuardado().reservas.map((r) => r.codigo)).toEqual(['SPF-S14B01']);
    expect(horaDisponible(tabA.result, 'padel-1', dia3, '14:00')).toBe(true);
    expect(horaDisponible(tabA.result, 'padel-1', dia3, '18:00')).toBe(false);
    expect(tabA.result.current.avisosConflicto).toEqual([]);

    tabA.unmount();
    window.localStorage.clear();
    vi.useRealTimers();

    // Variante (b): clave borrada -> setItem falla para B -> otra pestaña escribe estado válido con Rb
    const tabB = renderHook(() => useReservas(), { wrapper });
    const dia3b = tabB.result.current.dias[3];
    const baseB = leerGuardado();

    let resR1b;
    act(() => {
      resR1b = tabB.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3b,
        horas: ['14:00'],
        nombre: 'Ana R1 S14b',
      });
    });
    expect(resR1b.ok).toBe(true);

    act(() => {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: null })
      );
    });

    mockearSetItemFalla();

    const rb2 = crearReservaExterna({
      id: `padel-1__${dia3b}__18:00__66142`,
      codigo: 'SPF-S14B02',
      fecha: dia3b,
      horas: ['18:00'],
    });
    const validoConRb2 = structuredClone(baseB);
    validoConRb2.ocupados['padel-1'][dia3b].push('18:00');
    validoConRb2.reservas = [rb2];
    escribirYDespacharStorage(validoConRb2);

    expect(tabB.result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-S14B02',
    ]);
    expect(horaDisponible(tabB.result, 'padel-1', dia3b, '14:00')).toBe(true);
    expect(horaDisponible(tabB.result, 'padel-1', dia3b, '18:00')).toBe(false);
    expect(tabB.result.current.avisosConflicto).toEqual([]);
  });

  it('#66 caso 5 (choca la primera pendiente): queda la segunda pendiente y avisa solo de la primera', () => {
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = leerGuardado();

    mockearSetItemFalla();

    let res1;
    let res2;
    act(() => {
      res1 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Ana Pendiente 1',
      });
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Luis Pendiente 2',
      });
    });
    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);

    const rb = crearReservaExterna({
      id: `padel-1__${dia3}__14:00__66051`,
      codigo: 'SPF-66C5B1',
      fecha: dia3,
      horas: ['14:00'],
    });
    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('14:00');
    otroEstado.reservas.push(rb);
    escribirYDespacharStorage(otroEstado);

    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-66C5B1',
      res2.codigo,
    ]);
    expect(horaDisponible(result, 'padel-1', dia3, '14:00')).toBe(false);
    expect(horaDisponible(result, 'padel-1', dia3, '16:00')).toBe(false);
    const aviso = assertUnAvisoConCodigo(result, res1.codigo);
    expect(aviso.mensaje).not.toContain(res2.codigo);
  });

  it('#66 caso 5 (choca la segunda pendiente): queda la primera pendiente y avisa solo de la segunda', () => {
    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = leerGuardado();

    mockearSetItemFalla();

    let res1;
    let res2;
    act(() => {
      res1 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Ana Pendiente 1',
      });
      res2 = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Luis Pendiente 2',
      });
    });
    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);

    const rb = crearReservaExterna({
      id: `padel-1__${dia3}__16:00__66052`,
      codigo: 'SPF-66C5B2',
      fecha: dia3,
      horas: ['16:00'],
    });
    const otroEstado = structuredClone(base);
    otroEstado.ocupados['padel-1'][dia3].push('16:00');
    otroEstado.reservas.push(rb);
    escribirYDespacharStorage(otroEstado);

    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-66C5B2',
      res1.codigo,
    ]);
    expect(horaDisponible(result, 'padel-1', dia3, '14:00')).toBe(false);
    expect(horaDisponible(result, 'padel-1', dia3, '16:00')).toBe(false);
    const aviso = assertUnAvisoConCodigo(result, res2.codigo);
    expect(aviso.mensaje).not.toContain(res1.codigo);
  });
});

describe('ReservasContext — choque al sincronizar contra reservas guardadas (#62)', () => {
  const setItemOriginal = Storage.prototype.setItem;
  const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;

  function mockearSetItemFalla() {
    return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });
  }

  function leerGuardado() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
  }

  function crearReservaExterna({
    id,
    codigo,
    canchaId = 'padel-1',
    fecha,
    horas,
    nombre = 'Otra Pestaña',
  }) {
    return {
      id,
      codigo,
      tipo: 'individual',
      canchaId,
      canchaNombre: 'Cancha Pádel 1',
      deporte: 'padel',
      fecha,
      hora: horas[0],
      horas: [...horas],
      nombre,
    };
  }

  function horaDisponible(result, canchaId, fecha, hora) {
    return result.current
      .disponibilidad(canchaId, fecha)
      .find((h) => h.hora === hora)?.disponible;
  }

  function assertUnAvisoConCodigo(result, codigo) {
    expect(result.current.avisosConflicto).toHaveLength(1);
    const aviso = result.current.avisosConflicto[0];
    expect(aviso.mensaje).toContain(codigo);
    expect(aviso.mensaje).not.toMatch(/localStorage|pestaña|storage/i);
    return aviso;
  }

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('S13 (#62): choque en el cambio de día (con fecha en ocupados y variante sin la clave de esa fecha en ocupados)', () => {
    // Subcaso 1: ocupados['padel-1'][dia3] incluye '16:00'
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const tab1 = renderHook(() => useReservas(), { wrapper });
    const dia3 = tab1.result.current.dias[3]; // 2026-11-19
    const base1 = leerGuardado();

    const spy1 = mockearSetItemFalla();
    let resR1;
    act(() => {
      resR1 = tab1.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Choque Día 1',
      });
    });
    expect(resR1.ok).toBe(true);

    const rb1 = crearReservaExterna({
      id: `padel-1__${dia3}__16:00__90131`,
      codigo: 'SPF-S13B01',
      fecha: dia3,
      horas: ['16:00'],
    });
    const otro1 = structuredClone(base1);
    otro1.ocupados['padel-1'][dia3].push('16:00');
    otro1.reservas.push(rb1);
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otro1));

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(tab1.result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-S13B01']);
    expect(horaDisponible(tab1.result, 'padel-1', dia3, '16:00')).toBe(false);
    assertUnAvisoConCodigo(tab1.result, resR1.codigo);

    tab1.unmount();
    spy1.mockRestore();
    window.localStorage.clear();

    // Subcaso 2 (variante): el JSON de otra pestaña NO trae la clave de esa fecha en ocupados['padel-1']
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));
    const tab2 = renderHook(() => useReservas(), { wrapper });
    const dia3b = tab2.result.current.dias[3];
    const base2 = leerGuardado();

    mockearSetItemFalla();
    let resR2;
    act(() => {
      resR2 = tab2.result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3b,
        horas: ['16:00'],
        nombre: 'Ana Choque Día 2',
      });
    });
    expect(resR2.ok).toBe(true);

    const rb2 = crearReservaExterna({
      id: `padel-1__${dia3b}__16:00__90132`,
      codigo: 'SPF-S13B02',
      fecha: dia3b,
      horas: ['16:00'],
    });
    const otro2 = structuredClone(base2);
    delete otro2.ocupados['padel-1'][dia3b];
    otro2.reservas.push(rb2);
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otro2));

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(tab2.result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-S13B02']);
    expect(horaDisponible(tab2.result, 'padel-1', dia3b, '16:00')).toBe(false);
    assertUnAvisoConCodigo(tab2.result, resR2.codigo);
  });

  it('#62: conciliarReservasSinGuardar detecta choque contra guardado.reservas y entre candidatas aceptadas aunque falte la fecha en ocupados', () => {
    const fecha = '2026-11-19';
    const guardada = crearReservaExterna({
      id: `padel-1__${fecha}__16:00__6201`,
      codigo: 'SPF-62G001',
      fecha,
      horas: ['16:00'],
    });
    const candidataChocaGuardada = crearReservaExterna({
      id: `padel-1__${fecha}__16:00__6202`,
      codigo: 'SPF-62C001',
      fecha,
      horas: ['16:00'],
    });
    const guardadoSinFecha = {
      ocupados: { 'padel-1': {} },
      reservas: [guardada],
    };
    const copiaAntes = structuredClone(guardadoSinFecha);

    const resGuardada = conciliarReservasSinGuardar(
      guardadoSinFecha,
      [candidataChocaGuardada],
      [candidataChocaGuardada.id]
    );
    expect(resGuardada.conflictos).toEqual([candidataChocaGuardada]);
    expect(resGuardada.guardado.reservas).toEqual([guardada]);
    expect(guardadoSinFecha).toEqual(copiaAntes);

    // Dos pendientes sobre la misma celda sin la fecha en ocupados: la primera entra y la segunda choca
    const pend1 = crearReservaExterna({
      id: `padel-1__${fecha}__14:00__6203`,
      codigo: 'SPF-62P001',
      fecha,
      horas: ['14:00'],
    });
    const pend2 = crearReservaExterna({
      id: `padel-1__${fecha}__14:00__6204`,
      codigo: 'SPF-62P002',
      fecha,
      horas: ['14:00'],
    });
    const resEntrePendientes = conciliarReservasSinGuardar(
      { ocupados: { 'padel-1': {} }, reservas: [] },
      [pend1, pend2],
      [pend1.id, pend2.id]
    );
    expect(resEntrePendientes.guardado.reservas).toEqual([pend1]);
    expect(resEntrePendientes.conflictos).toEqual([pend2]);
  });

  it('#62: un evento con bloques pendiente cuyo último bloque choca con una reserva guardada ausente de ocupados se descarta entero con un aviso', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3]; // 2026-11-19
    const dia4 = result.current.dias[4]; // 2026-11-20
    const dia5 = result.current.dias[5]; // 2026-11-21
    const base = leerGuardado();

    mockearSetItemFalla();

    let resTorneo;
    act(() => {
      resTorneo = result.current.reservarEvento({
        subtipo: 'torneo',
        fecha: dia3,
        bloques: [
          {
            ronda: 1,
            nombreRonda: 'Cuartos de final',
            fecha: dia3,
            canchaIds: ['padel-1'],
            horas: ['14:00', '15:00'],
          },
          {
            ronda: 2,
            nombreRonda: 'Semifinal',
            fecha: dia4,
            canchaIds: ['padel-2'],
            horas: ['15:00', '16:00'],
          },
          {
            ronda: 3,
            nombreRonda: 'Final',
            fecha: dia5,
            canchaIds: ['padel-1'],
            horas: ['13:00', '14:00'],
          },
        ],
        nombre: 'Torneo Choque Sin Clave',
      });
    });
    expect(resTorneo.ok).toBe(true);

    // 14:00 no es hora semilla en padel-1 para dia5 (ni en offset 5 ni en offset 4 tras cambiar de día)
    const rb = crearReservaExterna({
      id: `padel-1__${dia5}__14:00__6205`,
      codigo: 'SPF-62EV01',
      canchaId: 'padel-1',
      fecha: dia5,
      horas: ['14:00'],
    });
    const otro = structuredClone(base);
    delete otro.ocupados['padel-1'][dia5];
    otro.reservas.push(rb);
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otro));

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.reservas.map((r) => r.codigo)).toEqual(['SPF-62EV01']);
    expect(horaDisponible(result, 'padel-1', dia3, '14:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia3, '15:00')).toBe(true);
    expect(horaDisponible(result, 'padel-2', dia4, '15:00')).toBe(true);
    expect(horaDisponible(result, 'padel-2', dia4, '16:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia5, '13:00')).toBe(true);
    expect(horaDisponible(result, 'padel-1', dia5, '14:00')).toBe(false);
    assertUnAvisoConCodigo(result, resTorneo.codigo);
  });

  it('#62: una pendiente que no choca con su fecha ausente de ocupados en lo leído se acepta, ocupa su hora y conserva la semilla del día', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3]; // 2026-11-19 (offset 2 al pasar al 17)
    const base = leerGuardado();

    mockearSetItemFalla();

    let resPend;
    act(() => {
      resPend = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Sin Choque',
      });
    });
    expect(resPend.ok).toBe(true);

    const rbOtraCancha = crearReservaExterna({
      id: `voley-1__${dia3}__14:00__6206`,
      codigo: 'SPF-62OK01',
      canchaId: 'voley-1',
      fecha: dia3,
      horas: ['14:00'],
    });
    const otro = structuredClone(base);
    delete otro.ocupados['padel-1'][dia3];
    otro.ocupados['voley-1'][dia3].push('14:00');
    otro.reservas.push(rbOtraCancha);
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otro));

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.dias[0]).toBe('2026-11-17');
    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-62OK01',
      resPend.codigo,
    ]);
    expect(result.current.avisosConflicto).toEqual([]);

    const semillaPadel1Offset2 =
      semilla.canchas.find((c) => c.id === 'padel-1').ocupadosSemilla[2] || [];
    const esperadasOcupadas = new Set([...semillaPadel1Offset2, '16:00']);
    const dispDia3 = result.current.disponibilidad('padel-1', dia3);
    dispDia3.forEach(({ hora, disponible }) => {
      expect(disponible).toBe(!esperadasOcupadas.has(hora));
    });
  });

  it('#62: conserva fechas futuras fuera de la ventana nueva tras el cambio de día con cambio externo', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const { result } = renderHook(() => useReservas(), { wrapper });
    const base = leerGuardado();

    // Otra pestaña ya guardó una fecha futura posterior al nuevo día +6 (2026-11-23)
    const fechaFutura = '2026-11-24';
    const otro = structuredClone(base);
    otro.ocupados['padel-1'][fechaFutura] = ['15:00'];
    otro.reservas.push(
      crearReservaExterna({
        id: `padel-1__${fechaFutura}__15:00__6207`,
        codigo: 'SPF-62FUT1',
        fecha: fechaFutura,
        horas: ['15:00'],
      })
    );
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otro));

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.dias[6]).toBe('2026-11-23');
    const persistidoDia17 = leerGuardado();
    expect(persistidoDia17.ocupados['padel-1'][fechaFutura]).toEqual(['15:00']);

    // Al avanzar un día más, 2026-11-24 entra en la ventana y mantiene 15:00 ocupado
    vi.setSystemTime(new Date(2026, 10, 18, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.dias[6]).toBe(fechaFutura);
    expect(horaDisponible(result, 'padel-1', fechaFutura, '15:00')).toBe(false);
  });

  it('#62: repetir focus y visibilitychange después del cambio de día no duplica reservas ni avisos', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 10, 0, 0));

    const { result } = renderHook(() => useReservas(), { wrapper });
    const dia3 = result.current.dias[3];
    const base = leerGuardado();

    mockearSetItemFalla();

    let resChoque;
    let resLibre;
    act(() => {
      resChoque = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['16:00'],
        nombre: 'Ana Choque Repetido',
      });
      resLibre = result.current.reservar({
        canchaId: 'padel-1',
        fecha: dia3,
        horas: ['14:00'],
        nombre: 'Luis Libre Repetido',
      });
    });
    expect(resChoque.ok).toBe(true);
    expect(resLibre.ok).toBe(true);

    const rb = crearReservaExterna({
      id: `padel-1__${dia3}__16:00__6208`,
      codigo: 'SPF-62REP1',
      fecha: dia3,
      horas: ['16:00'],
    });
    const otro = structuredClone(base);
    delete otro.ocupados['padel-1'][dia3];
    otro.reservas.push(rb);
    setItemOriginal.call(window.localStorage, STORAGE_KEY, JSON.stringify(otro));

    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-62REP1',
      resLibre.codigo,
    ]);
    assertUnAvisoConCodigo(result, resChoque.codigo);

    // Otro ciclo de focus + visibilitychange en un render posterior tampoco duplica
    act(() => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.reservas.map((r) => r.codigo)).toEqual([
      'SPF-62REP1',
      resLibre.codigo,
    ]);
    assertUnAvisoConCodigo(result, resChoque.codigo);
  });
});

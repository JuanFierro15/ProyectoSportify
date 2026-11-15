import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ReservasProvider,
  useReservas,
  reducer,
  crearEstadoInicial,
  ERROR_EVENTO_NO_DISPONIBLE,
  ERROR_EVENTO_HORAS_NO_SEGUIDAS,
  ERROR_EVENTO_FECHA_FASE,
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

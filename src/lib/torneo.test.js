import { describe, expect, test } from 'vitest';
import {
  OPCIONES_DURACION,
  OPCIONES_EQUIPOS,
  TRANSICION_MIN,
  MAX_CANCHAS_TORNEO,
  DESEMPATES,
  desempateDe,
  minutosPorTurno,
  partidosPorRonda,
  maxCanchasTorneo,
  mensajeTopeCanchas,
  horasDeJornada,
  turnosDeCancha,
  turnosDeFase,
  capacidadFase,
  limpiarJornadasConChoque,
  turnosPorRonda,
  minutosRequeridos,
  horasSinPartido,
  mensajeHorasSinPartido,
  validarCanchasTorneo,
  sortearEquipos,
  validarCrucesManuales,
  nombreRonda,
  sumarMinutos,
  programarTorneo,
  armarTorneo,
  fasesDelTorneo,
  validarJornadas,
  sugerenciasTiempoFase,
} from './torneo';

describe('Constantes y métodos de desempate', () => {
  test('exporta las opciones de equipos y duración', () => {
    expect(OPCIONES_EQUIPOS).toEqual([4, 8, 16]);
    expect(OPCIONES_DURACION).toEqual([15, 20, 30]);
    expect(TRANSICION_MIN).toBe(5);
    expect(MAX_CANCHAS_TORNEO).toBe(3);
  });

  test('desempateDe devuelve el método de desempate por deporte', () => {
    expect(desempateDe('futbol')).toEqual(DESEMPATES.futbol);
    expect(desempateDe('futbol')?.metodo).toBe('penales');
    expect(desempateDe('voley-playa')?.metodo).toBe('tie-break');
    expect(desempateDe('padel')?.metodo).toBe('super-tie-break');
    expect(desempateDe('desconocido')).toBeNull();
  });

  test('minutosPorTurno calcula duracion + desempate + transicion', () => {
    // futbol: 20 + 5 (penales) + 5 (transicion) = 30
    expect(minutosPorTurno(20, 'futbol')).toBe(30);
    // voley-playa: 15 + 5 + 5 = 25
    expect(minutosPorTurno(15, 'voley-playa')).toBe(25);
    // padel: 30 + 5 + 5 = 40
    expect(minutosPorTurno(30, 'padel')).toBe(40);
    // deporte sin desempate configurado usa fallback de 5 min: 20 + 5 + 5 = 30
    expect(minutosPorTurno(20, 'otro')).toBe(30);
  });
});

describe('Estructura de rondas y cálculo de tiempo', () => {
  test('partidosPorRonda genera los partidos para potencias de 2 válidas', () => {
    expect(partidosPorRonda(4)).toEqual([2, 1]);
    expect(partidosPorRonda(8)).toEqual([4, 2, 1]);
    expect(partidosPorRonda(16)).toEqual([8, 4, 2, 1]);
    expect(partidosPorRonda(6)).toEqual([]);
    expect(partidosPorRonda(0)).toEqual([]);
  });

  test('maxCanchasTorneo limita por los partidos de la fase más grande y MAX_CANCHAS_TORNEO', () => {
    expect(maxCanchasTorneo(4)).toBe(2);
    expect(maxCanchasTorneo(8)).toBe(3);
    expect(maxCanchasTorneo(16)).toBe(3);
    expect(maxCanchasTorneo(6)).toBe(MAX_CANCHAS_TORNEO);
    expect(maxCanchasTorneo(0)).toBe(MAX_CANCHAS_TORNEO);
    expect(maxCanchasTorneo()).toBe(MAX_CANCHAS_TORNEO);
  });

  test('mensajeTopeCanchas construye el aviso de límite y el de recorte', () => {
    expect(mensajeTopeCanchas(4)).toBe(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: elige hasta 2 canchas.'
    );
    expect(mensajeTopeCanchas(4, { recorte: true })).toBe(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: se dejaron las primeras 2 canchas elegidas.'
    );
  });

  test('limpiarJornadasConChoque quita solo la hora ocupada de la cancha afectada, conserva fecha y el resto, y al repetirla no quita nada más', () => {
    const jornadas = {
      1: {
        fecha: '2026-11-10',
        horasPorCancha: {
          'futbol-1': ['14:00', '15:00'],
          'futbol-2': ['15:00', '16:00'],
        },
      },
      2: {
        fecha: '2026-11-11',
        horasPorCancha: {
          'futbol-1': ['16:00'],
        },
      },
    };
    const snapshot = structuredClone(jornadas);

    const conChoque = limpiarJornadasConChoque(
      jornadas,
      (r, canchaId, h) => !(r === 1 && canchaId === 'futbol-2' && h === '15:00')
    );
    expect(conChoque).toEqual({
      huboChoque: true,
      quitadas: [{ ronda: 1, canchaId: 'futbol-2', hora: '15:00' }],
      jornadas: {
        1: {
          fecha: '2026-11-10',
          horasPorCancha: {
            'futbol-1': ['14:00', '15:00'],
            'futbol-2': ['16:00'],
          },
        },
        2: {
          fecha: '2026-11-11',
          horasPorCancha: {
            'futbol-1': ['16:00'],
          },
        },
      },
    });
    expect(jornadas).toEqual(snapshot);

    const segundaPasada = limpiarJornadasConChoque(
      conChoque.jornadas,
      (r, canchaId, h) => !(r === 1 && canchaId === 'futbol-2' && h === '15:00')
    );
    expect(segundaPasada).toEqual({
      huboChoque: false,
      quitadas: [],
      jornadas: conChoque.jornadas,
    });
  });

  test('turnosPorRonda distribuye partidos según canchas disponibles', () => {
    // 8 equipos -> [4, 2, 1] partidos. Con 3 canchas: [ceil(4/3)=2, ceil(2/3)=1, ceil(1/3)=1] -> [2, 1, 1]
    expect(turnosPorRonda(8, 3)).toEqual([2, 1, 1]);
    // Con 1 cancha: [4, 2, 1]
    expect(turnosPorRonda(8, 1)).toEqual([4, 2, 1]);
    // Con 2 canchas: [2, 1, 1]
    expect(turnosPorRonda(8, 2)).toEqual([2, 1, 1]);
  });

  test('minutosRequeridos devuelve 0 para configuraciones no permitidas y calcula el mínimo ideal válido', () => {
    expect(minutosRequeridos({ equipos: 6, canchas: 2, minutosTurno: 30 })).toBe(0);
    expect(minutosRequeridos({ equipos: 8, canchas: 0, minutosTurno: 30 })).toBe(0);

    const minutosTurno = minutosPorTurno(20, 'futbol'); // 30
    expect(minutosRequeridos({ equipos: 8, canchas: 3, minutosTurno })).toBe(120);
    expect(minutosRequeridos({ equipos: 8, canchas: 1, minutosTurno })).toBe(210);
    expect(minutosRequeridos({ equipos: 8, canchas: 2, minutosTurno })).toBe(120);
    expect(minutosRequeridos({ equipos: 16, canchas: 3, minutosTurno })).toBe(210);
    expect(minutosRequeridos({ equipos: 4, canchas: 1, minutosTurno })).toBe(90);
  });
});

describe('Horas por cancha, tramos y capacidad de fase', () => {
  test('horasDeJornada devuelve lista plana ordenada sin repetidos, ignora listas vacías y tolera nulos', () => {
    expect(horasDeJornada(null)).toEqual([]);
    expect(horasDeJornada(undefined)).toEqual([]);
    expect(horasDeJornada({})).toEqual([]);
    expect(horasDeJornada({ fecha: '2026-11-21' })).toEqual([]);
    expect(horasDeJornada({ horasPorCancha: null })).toEqual([]);
    expect(horasDeJornada({ horasPorCancha: { c1: [], c2: [] } })).toEqual([]);
    expect(
      horasDeJornada({
        fecha: '2026-11-21',
        horasPorCancha: {
          'futbol-1': ['18:00', '16:00'],
          'futbol-2': [],
          'futbol-3': ['19:00', '16:00'],
        },
      })
    ).toEqual(['16:00', '18:00', '19:00']);
  });

  test('turnosDeCancha corta por tramos seguidos y cumple los ejemplos exactos', () => {
    expect(turnosDeCancha(['16:00'], 35)).toEqual(['16:00']);
    expect(turnosDeCancha(['16:00', '17:00'], 35)).toEqual(['16:00', '16:35', '17:10']);
    expect(turnosDeCancha(['16:00'], 30)).toEqual(['16:00', '16:30']);
    expect(turnosDeCancha(['16:00', '18:00'], 25)).toEqual(['16:00', '16:25', '18:00', '18:25']);
    expect(turnosDeCancha(['18:00', '16:00', '16:00'], 25)).toEqual(['16:00', '16:25', '18:00', '18:25']);
    expect(turnosDeCancha([], 30)).toEqual([]);
    // Con hueco entre 16:00 y 18:00 y turno de 35 min caben 2 turnos (no 3)
    expect(turnosDeCancha(['16:00', '18:00'], 35)).toEqual(['16:00', '18:00']);
  });

  test('turnosDeFase y capacidadFase ordenan por inicio y desempate por ordenCanchas', () => {
    const hpcCapacidad = {
      'futbol-1': ['16:00', '18:00'],
      'futbol-2': ['19:00'],
    };
    expect(capacidadFase(hpcCapacidad, 25)).toBe(6);
    expect(turnosDeFase(hpcCapacidad, 25, ['futbol-1', 'futbol-2'])).toEqual([
      { canchaId: 'futbol-1', inicio: '16:00' },
      { canchaId: 'futbol-1', inicio: '16:25' },
      { canchaId: 'futbol-1', inicio: '18:00' },
      { canchaId: 'futbol-1', inicio: '18:25' },
      { canchaId: 'futbol-2', inicio: '19:00' },
      { canchaId: 'futbol-2', inicio: '19:25' },
    ]);

    // A igual hora respeta ordenCanchas y las no listadas van al final por id
    const hpcEmpate = {
      'futbol-3': ['16:00'],
      'futbol-1': ['16:00'],
      'futbol-2': ['16:00'],
      'futbol-4': ['16:00'],
    };
    expect(turnosDeFase(hpcEmpate, 60, ['futbol-2', 'futbol-1'])).toEqual([
      { canchaId: 'futbol-2', inicio: '16:00' },
      { canchaId: 'futbol-1', inicio: '16:00' },
      { canchaId: 'futbol-3', inicio: '16:00' },
      { canchaId: 'futbol-4', inicio: '16:00' },
    ]);

    // Si la segunda cancha tiene hora más temprana, va primero
    expect(
      turnosDeFase(
        { 'futbol-1': ['18:00'], 'futbol-2': ['16:00'] },
        60,
        ['futbol-1', 'futbol-2']
      )
    ).toEqual([
      { canchaId: 'futbol-2', inicio: '16:00' },
      { canchaId: 'futbol-1', inicio: '18:00' },
    ]);
  });

  test('horasSinPartido detecta horas marcadas sin ningún partido asignado', () => {
    // Final de 20 min de fútbol (turno 30), 1 partido, 16:00..20:00 -> 4 horas sin partido
    expect(
      horasSinPartido(
        { 'futbol-1': ['16:00', '17:00', '18:00', '19:00', '20:00'] },
        30,
        1,
        ['futbol-1']
      )
    ).toEqual([
      { canchaId: 'futbol-1', hora: '17:00' },
      { canchaId: 'futbol-1', hora: '18:00' },
      { canchaId: 'futbol-1', hora: '19:00' },
      { canchaId: 'futbol-1', hora: '20:00' },
    ]);

    // Solo 16:00 -> []
    expect(
      horasSinPartido({ 'futbol-1': ['16:00'] }, 30, 1, ['futbol-1'])
    ).toEqual([]);

    // Turno 35 con 16:00 y 17:00 y 2 partidos: el 2.º es 16:35-17:10 y usa 17:00 -> []
    expect(
      horasSinPartido({ 'futbol-1': ['16:00', '17:00'] }, 35, 2, ['futbol-1'])
    ).toEqual([]);
  });

  test('mensajeHorasSinPartido respeta artículos, verbos, plurales y concordancia', () => {
    expect(
      mensajeHorasSinPartido({
        nombreRonda: 'Final',
        partidos: 1,
        duracionPartido: 20,
        horasElegidas: 5,
        sinPartido: 4,
      })
    ).toBe('La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.');

    expect(
      mensajeHorasSinPartido({
        nombreRonda: 'Cuartos de final',
        partidos: 4,
        duracionPartido: 20,
        horasElegidas: 5,
        sinPartido: 1,
      })
    ).toBe('Los Cuartos de final son 4 partidos de 20 min. Marcaste 5 horas y 1 quedaría sin partido.');

    expect(
      mensajeHorasSinPartido({
        nombreRonda: 'Semifinal',
        partidos: 2,
        duracionPartido: 15,
        horasElegidas: 1,
        sinPartido: 1,
      })
    ).toBe('La Semifinal es 2 partidos de 15 min. Marcaste 1 hora y 1 quedaría sin partido.');

    expect(
      mensajeHorasSinPartido({
        nombreRonda: 'Octavos de final',
        partidos: 8,
        duracionPartido: 30,
        horasElegidas: 6,
        sinPartido: 2,
      })
    ).toBe('Los Octavos de final son 8 partidos de 30 min. Marcaste 6 horas y 2 quedarían sin partido.');

    expect(
      mensajeHorasSinPartido({
        nombreRonda: 'Ronda de 32',
        partidos: 16,
        duracionPartido: 20,
        horasElegidas: 10,
        sinPartido: 2,
      })
    ).toBe('Ronda de 32 es 16 partidos de 20 min. Marcaste 10 horas y 2 quedarían sin partido.');

    expect(
      mensajeHorasSinPartido({
        nombreRonda: 'Final',
        partidos: 1,
        duracionPartido: 20,
        horasElegidas: 1,
        sinPartido: 0,
      })
    ).toBe('');
  });
});

describe('validarCanchasTorneo', () => {
  test('retorna error si no hay canchas elegidas', () => {
    expect(validarCanchasTorneo([])).toBe('Elige al menos una cancha.');
    expect(validarCanchasTorneo(null)).toBe('Elige al menos una cancha.');
  });

  test('retorna error si se eligen más de 3 canchas', () => {
    const canchas = [
      { id: 'c1', deporte: 'futbol' },
      { id: 'c2', deporte: 'futbol' },
      { id: 'c3', deporte: 'futbol' },
      { id: 'c4', deporte: 'futbol' },
    ];
    expect(validarCanchasTorneo(canchas)).toBe('Elige máximo 3 canchas para el torneo.');
  });

  test('con 4 equipos limita a 2 canchas y explica el motivo', () => {
    const tresCanchas = [
      { id: 'c1', deporte: 'futbol' },
      { id: 'c2', deporte: 'futbol' },
      { id: 'c3', deporte: 'futbol' },
    ];
    expect(validarCanchasTorneo(tresCanchas, 4)).toBe(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: elige hasta 2 canchas.'
    );
    expect(validarCanchasTorneo(tresCanchas.slice(0, 2), 4)).toBe('');
  });

  test('retorna error si las canchas son de deportes distintos', () => {
    const canchas = [
      { id: 'c1', deporte: 'futbol' },
      { id: 'c2', deporte: 'padel' },
    ];
    expect(validarCanchasTorneo(canchas)).toBe('Todas las canchas del torneo deben ser del mismo deporte.');
  });

  test('retorna cadena vacía si la selección de canchas es válida (1 a 3 del mismo deporte)', () => {
    expect(validarCanchasTorneo([{ id: 'c1', deporte: 'futbol' }])).toBe('');
    expect(
      validarCanchasTorneo([
        { id: 'c1', deporte: 'padel' },
        { id: 'c2', deporte: 'padel' },
        { id: 'c3', deporte: 'padel' },
      ])
    ).toBe('');
  });
});

describe('sortearEquipos', () => {
  test('devuelve una permutación válida conteniendo los números del 1 al n', () => {
    const resultado = sortearEquipos(8);
    expect(resultado).toHaveLength(8);
    expect([...resultado].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('es determinista cuando se inyecta una función rng fija', () => {
    // Si rng siempre devuelve 0, en Fisher-Yates se va intercambiando con la posición 0
    const rngMock = () => 0;
    const resultado = sortearEquipos(4, rngMock);
    expect(resultado).toEqual([2, 3, 4, 1]);
  });
});

describe('validarCrucesManuales (AC-006)', () => {
  test('detecta posiciones vacías, incompletas o no numéricas', () => {
    expect(validarCrucesManuales([1, 2, 3, null], 4)).toBe(
      'Asigna un equipo en cada posición de la primera ronda.'
    );
    expect(validarCrucesManuales([1, 2, 3], 4)).toBe(
      'Asigna un equipo en cada posición de la primera ronda.'
    );
    expect(validarCrucesManuales([1, 2, 3, 5], 4)).toBe(
      'Asigna un equipo en cada posición de la primera ronda.'
    );
    expect(validarCrucesManuales([1, 2, 3, 0], 4)).toBe(
      'Asigna un equipo en cada posición de la primera ronda.'
    );
  });

  test('detecta equipos duplicados', () => {
    expect(validarCrucesManuales([1, 2, 2, 4], 4)).toBe(
      'Hay equipos repetidos en los cruces.'
    );
  });

  test('retorna cadena vacía si los cruces manuales son válidos', () => {
    expect(validarCrucesManuales([4, 3, 2, 1], 4)).toBe('');
    expect(validarCrucesManuales([8, 7, 6, 5, 4, 3, 2, 1], 8)).toBe('');
  });
});

describe('Utilidades de fixture y nombres', () => {
  test('nombreRonda traduce según cantidad de partidos', () => {
    expect(nombreRonda(1)).toBe('Final');
    expect(nombreRonda(2)).toBe('Semifinal');
    expect(nombreRonda(4)).toBe('Cuartos de final');
    expect(nombreRonda(8)).toBe('Octavos de final');
    expect(nombreRonda(16)).toBe('Ronda de 32');
  });

  test('sumarMinutos maneja avance de minutos y salto de hora', () => {
    expect(sumarMinutos('08:00', 30)).toBe('08:30');
    expect(sumarMinutos('08:45', 30)).toBe('09:15');
    expect(sumarMinutos('23:30', 45)).toBe('00:15');
  });
});

describe('programarTorneo y armarTorneo (AC-007)', () => {
  test('genera N - 1 partidos con orden de rondas y referencias de ganador', () => {
    const orden = [1, 2, 3, 4, 5, 6, 7, 8];
    const partidos = programarTorneo({
      orden,
      canchaIds: ['cancha-1', 'cancha-2'],
      horaInicio: '08:00',
      minutosTurno: 30,
    });

    // 8 equipos -> 7 partidos
    expect(partidos).toHaveLength(7);

    // Ronda 1
    const r1 = partidos.filter((p) => p.ronda === 1);
    expect(r1).toHaveLength(4);
    expect(r1[0]).toMatchObject({
      id: 'R1-P1',
      local: 'Equipo 1',
      visitante: 'Equipo 2',
      canchaId: 'cancha-1',
      turno: 1,
      inicio: '08:00',
    });
    expect(r1[1]).toMatchObject({
      id: 'R1-P2',
      local: 'Equipo 3',
      visitante: 'Equipo 4',
      canchaId: 'cancha-2',
      turno: 1,
      inicio: '08:00',
    });
    expect(r1[2]).toMatchObject({
      id: 'R1-P3',
      local: 'Equipo 5',
      visitante: 'Equipo 6',
      canchaId: 'cancha-1',
      turno: 2,
      inicio: '08:30',
    });
    expect(r1[3]).toMatchObject({
      id: 'R1-P4',
      local: 'Equipo 7',
      visitante: 'Equipo 8',
      canchaId: 'cancha-2',
      turno: 2,
      inicio: '08:30',
    });

    // Ronda 2 (Semifinales)
    const r2 = partidos.filter((p) => p.ronda === 2);
    expect(r2).toHaveLength(2);
    expect(r2[0]).toMatchObject({
      id: 'R2-P1',
      nombreRonda: 'Semifinal',
      local: 'Ganador R1-P1',
      visitante: 'Ganador R1-P2',
      turno: 3,
      inicio: '09:00',
    });
    expect(r2[1]).toMatchObject({
      id: 'R2-P2',
      nombreRonda: 'Semifinal',
      local: 'Ganador R1-P3',
      visitante: 'Ganador R1-P4',
      turno: 3,
      inicio: '09:00',
    });

    // Ronda 3 (Final)
    const r3 = partidos.filter((p) => p.ronda === 3);
    expect(r3).toHaveLength(1);
    expect(r3[0]).toMatchObject({
      id: 'R3-P1',
      nombreRonda: 'Final',
      local: 'Ganador R2-P1',
      visitante: 'Ganador R2-P2',
      turno: 4,
      inicio: '09:30',
    });
  });

  test('no genera colisión de cancha física en un mismo turno (turno, canchaId)', () => {
    const orden = Array.from({ length: 16 }, (_, i) => i + 1);
    const canchaIds = ['cancha-a', 'cancha-b', 'cancha-c'];
    const partidos = programarTorneo({
      orden,
      canchaIds,
      horaInicio: '10:00',
      minutosTurno: 30,
    });

    // 16 equipos -> 15 partidos
    expect(partidos).toHaveLength(15);

    const asignaciones = new Set();
    partidos.forEach((p) => {
      const clave = `${p.turno}__${p.canchaId}`;
      expect(asignaciones.has(clave)).toBe(false);
      asignaciones.add(clave);
    });
  });

  test('soporta canchaIds vacío y horaInicio nula sin arrojar error', () => {
    const partidos = programarTorneo({
      orden: [1, null, 3, 4],
      canchaIds: [],
      horaInicio: null,
      minutosTurno: 25,
    });

    expect(partidos).toHaveLength(3);
    expect(partidos[0].inicio).toBeNull();
    expect(partidos[0].canchaId).toBeNull();
    expect(partidos[0].local).toBe('Equipo 1');
    expect(partidos[0].visitante).toBe('Por definir');
  });

  test('armarTorneo construye el objeto completo de torneo', () => {
    const torneo = armarTorneo({
      deporte: 'futbol',
      equipos: 8,
      duracionPartido: 20,
      emparejamiento: 'aleatorio',
      orden: [1, 2, 3, 4, 5, 6, 7, 8],
      canchaIds: ['c1', 'c2'],
      horaInicio: '09:00',
    });

    expect(torneo.deporte).toBe('futbol');
    expect(torneo.equipos).toBe(8);
    expect(torneo.duracionPartido).toBe(20);
    expect(torneo.transicion).toBe(5);
    expect(torneo.desempate).toEqual({
      metodo: 'penales',
      etiqueta: 'Penales',
      minutos: 5,
      descripcion: 'Penales: 3 por equipo y, si sigue el empate, muerte súbita.',
    });
    expect(torneo.emparejamiento).toBe('aleatorio');
    expect(torneo.minutosRequeridos).toBe(120);
    expect(torneo.partidos).toHaveLength(7);
  });
});

describe('fasesDelTorneo (AC-009, DD-011, DD-012)', () => {
  test('8 equipos con 3 canchas incluye todas las canchas y minutosTurno en cada fase, manteniendo el ideal en canchasEfectivas', () => {
    const fases = fasesDelTorneo({
      equipos: 8,
      canchaIds: ['c1', 'c2', 'c3'],
      minutosTurno: 30,
    });

    expect(fases).toHaveLength(3);

    // Cuartos de final: 4 partidos, 3 canchas efectivas, 2 turnos -> 60 min
    expect(fases[0]).toEqual({
      ronda: 1,
      nombreRonda: 'Cuartos de final',
      partidos: 4,
      canchasEfectivas: 3,
      canchaIds: ['c1', 'c2', 'c3'],
      turnos: 2,
      minutosTurno: 30,
      minutosRequeridos: 60,
      horasMinimas: 1,
    });

    // Semifinal: 2 partidos, 2 canchas efectivas (min(3, 2)), pero canchaIds trae todas
    expect(fases[1]).toEqual({
      ronda: 2,
      nombreRonda: 'Semifinal',
      partidos: 2,
      canchasEfectivas: 2,
      canchaIds: ['c1', 'c2', 'c3'],
      turnos: 1,
      minutosTurno: 30,
      minutosRequeridos: 30,
      horasMinimas: 1,
    });

    // Final: 1 partido, 1 cancha efectiva, pero canchaIds trae todas
    expect(fases[2]).toEqual({
      ronda: 3,
      nombreRonda: 'Final',
      partidos: 1,
      canchasEfectivas: 1,
      canchaIds: ['c1', 'c2', 'c3'],
      turnos: 1,
      minutosTurno: 30,
      minutosRequeridos: 30,
      horasMinimas: 1,
    });
  });

  test('4 equipos con 2 canchas genera Semifinal y Final', () => {
    const fases = fasesDelTorneo({
      equipos: 4,
      canchaIds: ['c1', 'c2'],
      minutosTurno: 30,
    });

    expect(fases).toHaveLength(2);
    expect(fases[0].nombreRonda).toBe('Semifinal');
    expect(fases[0].canchasEfectivas).toBe(2);
    expect(fases[0].canchaIds).toEqual(['c1', 'c2']);
    expect(fases[0].turnos).toBe(1);
    expect(fases[1].nombreRonda).toBe('Final');
    expect(fases[1].canchasEfectivas).toBe(1);
    expect(fases[1].canchaIds).toEqual(['c1', 'c2']);
  });

  test('16 equipos con 2 canchas calcula horasMinimas según turnos', () => {
    const fases = fasesDelTorneo({
      equipos: 16,
      canchaIds: ['c1', 'c2'],
      minutosTurno: 30,
    });

    expect(fases).toHaveLength(4);
    expect(fases[0].nombreRonda).toBe('Octavos de final');
    expect(fases[0].partidos).toBe(8);
    expect(fases[0].canchasEfectivas).toBe(2);
    expect(fases[0].turnos).toBe(4);
    expect(fases[0].minutosTurno).toBe(30);
    expect(fases[0].minutosRequeridos).toBe(120);
    expect(fases[0].horasMinimas).toBe(2);
  });

  test('sin canchas usa fallback de 1 cancha y equipos no válidos devuelve arreglo vacío', () => {
    const fasesSinCancha = fasesDelTorneo({ equipos: 4, canchaIds: [] });
    expect(fasesSinCancha[0].canchasEfectivas).toBe(1);
    expect(fasesSinCancha[0].canchaIds).toEqual([]);
    expect(fasesSinCancha[0].minutosTurno).toBe(30);

    expect(fasesDelTorneo({ equipos: 6 })).toEqual([]);
    expect(fasesDelTorneo({ equipos: 0 })).toEqual([]);
  });
});

describe('validarJornadas (AC-010, AC-011, DD-013)', () => {
  const fases8eq = [
    { ronda: 1, nombreRonda: 'Cuartos de final', partidos: 4, turnos: 2, minutosTurno: 30, minutosRequeridos: 60, horasMinimas: 1 },
    { ronda: 2, nombreRonda: 'Semifinal', partidos: 2, turnos: 1, minutosTurno: 30, minutosRequeridos: 30, horasMinimas: 1 },
    { ronda: 3, nombreRonda: 'Final', partidos: 1, turnos: 1, minutosTurno: 30, minutosRequeridos: 30, horasMinimas: 1 },
  ];

  test('AC-010: valida capacidad con horas salteadas por cancha y orden entre fases', () => {
    const fases25 = [
      { ronda: 1, nombreRonda: 'Cuartos de final', partidos: 4, turnos: 2, minutosTurno: 25, minutosRequeridos: 50, horasMinimas: 1 },
      { ronda: 2, nombreRonda: 'Semifinal', partidos: 2, turnos: 1, minutosTurno: 25, minutosRequeridos: 25, horasMinimas: 1 },
      { ronda: 3, nombreRonda: 'Final', partidos: 1, turnos: 1, minutosTurno: 25, minutosRequeridos: 25, horasMinimas: 1 },
    ];
    const jornadas = {
      1: {
        fecha: '2026-11-21',
        horasPorCancha: { 'futbol-1': ['16:00', '18:00'], 'futbol-2': ['19:00'] }, // 6 turnos
      },
      2: {
        fecha: '2026-11-21',
        horasPorCancha: { 'futbol-2': ['20:00'] }, // empieza exactamente cuando termina 19:00 -> 20:00
      },
      3: {
        fecha: '2026-11-22',
        horasPorCancha: { 'futbol-2': ['10:00'] },
      },
    };

    const validaciones = validarJornadas(fases25, jornadas);
    expect(validaciones).toHaveLength(3);
    expect(validaciones[0]).toEqual({
      ronda: 1,
      nombreRonda: 'Cuartos de final',
      completa: true,
      alcanza: true,
      ordenValido: true,
      disponibles: 150,
      deficit: 0,
      turnosDisponibles: 6,
      partidosSinUbicar: 0,
      error: null,
    });
    expect(validaciones[1].alcanza).toBe(true);
    expect(validaciones[1].ordenValido).toBe(true);
    expect(validaciones[1].error).toBeNull();
    expect(validaciones[2].alcanza).toBe(true);
    expect(validaciones[2].ordenValido).toBe(true);
    expect(validaciones[2].error).toBeNull();
  });

  test('detecta fase incompleta (sin fecha o sin horas en ninguna cancha)', () => {
    const jornadas = {
      1: { fecha: '2026-11-01', horasPorCancha: { c1: ['08:00'], c2: ['08:00'] } },
      2: { fecha: '2026-11-01', horasPorCancha: { c1: [], c2: [] } },
      3: { fecha: null, horasPorCancha: { c1: ['10:00'] } },
    };

    const validaciones = validarJornadas(fases8eq, jornadas);
    expect(validaciones[1]).toEqual({
      ronda: 2,
      nombreRonda: 'Semifinal',
      completa: false,
      alcanza: false,
      ordenValido: true,
      disponibles: 0,
      deficit: 30,
      turnosDisponibles: 0,
      partidosSinUbicar: 2,
      error: 'Elige el día y el horario para Semifinal.',
    });
    expect(validaciones[2]).toEqual({
      ronda: 3,
      nombreRonda: 'Final',
      completa: false,
      alcanza: false,
      ordenValido: true,
      disponibles: 0,
      deficit: 30,
      turnosDisponibles: 0,
      partidosSinUbicar: 1,
      error: 'Elige el día y el horario para Final.',
    });
  });

  test('detecta déficit de partidos por ubicar y deduce minutosTurno si no viene explícito', () => {
    const fasesSinMinTurno = [
      { ronda: 1, nombreRonda: 'Cuartos de final', partidos: 4, turnos: 2, minutosRequeridos: 60 },
      { ronda: 2, nombreRonda: 'Semifinal', partidos: 2, turnos: 1, minutosRequeridos: 35 }, // deduce 35 min/turno
    ];
    const jornadas = {
      // 1 hora en c1 con turno 30 -> 2 turnos, faltan 2 partidos
      1: { fecha: '2026-11-01', horasPorCancha: { c1: ['08:00'] } },
      // 1 hora en c1 con turno 35 -> 1 turno, falta 1 partido
      2: { fecha: '2026-11-02', horasPorCancha: { c1: ['08:00'] } },
    };

    const [v1, v2] = validarJornadas(fasesSinMinTurno, jornadas);
    expect(v1).toMatchObject({
      completa: true,
      alcanza: false,
      turnosDisponibles: 2,
      partidosSinUbicar: 2,
      disponibles: 60,
      deficit: 60,
      error: 'Las horas de Cuartos de final no alcanzan: faltan 2 partidos por ubicar.',
    });
    expect(v2).toMatchObject({
      completa: true,
      alcanza: false,
      turnosDisponibles: 1,
      partidosSinUbicar: 1,
      disponibles: 35,
      deficit: 35,
      error: 'Las horas de Semifinal no alcanzan: faltan 1 partido por ubicar.',
    });
  });

  test('AC-011: orden exacto válido vs un minuto antes inválido y fase con inicio en segunda cancha', () => {
    // Hora exacta: cuartos termina a las 17:00 en c1, semifinal empieza a las 17:00 en c2 -> válida
    const [ok1, ok2] = validarJornadas(fases8eq.slice(0, 2), {
      1: { fecha: '2026-11-01', horasPorCancha: { c1: ['16:00'], c2: ['16:00'] } },
      2: { fecha: '2026-11-01', horasPorCancha: { c2: ['17:00'] } },
    });
    expect(ok1.ordenValido).toBe(true);
    expect(ok2.ordenValido).toBe(true);
    expect(ok2.error).toBeNull();

    // Un minuto antes en otra cancha: cuartos termina 17:00, semifinal empieza 16:59 -> inválida
    const [, invMinuto] = validarJornadas(fases8eq.slice(0, 2), {
      1: { fecha: '2026-11-01', horasPorCancha: { c1: ['16:00'], c2: ['16:00'] } },
      2: { fecha: '2026-11-01', horasPorCancha: { c2: ['16:59'] } },
    });
    expect(invMinuto.ordenValido).toBe(false);
    expect(invMinuto.error).toBe(
      'Semifinal debe jugarse después de que termine Cuartos de final (2026-11-01 a las 17:00).'
    );

    // Inicio de fase está en la segunda cancha (17:00 en c2 < fin 18:00 de cuartos en c1)
    const [, invSegundaCancha] = validarJornadas(fases8eq.slice(0, 2), {
      1: { fecha: '2026-11-01', horasPorCancha: { c1: ['16:00', '17:00'] } },
      2: { fecha: '2026-11-01', horasPorCancha: { c1: ['18:00'], c2: ['17:00'] } },
    });
    expect(invSegundaCancha.ordenValido).toBe(false);
    expect(invSegundaCancha.error).toBe(
      'Semifinal debe jugarse después de que termine Cuartos de final (2026-11-01 a las 18:00).'
    );

    // El orden se revisa antes que la capacidad
    expect(invSegundaCancha.alcanza).toBe(true);
  });

  test('AC-011: detecta violación de orden cronológico en días invertidos', () => {
    const jornadas = {
      1: { fecha: '2026-11-02', horasPorCancha: { c1: ['08:00'], c2: ['08:00'] } },
      2: { fecha: '2026-11-01', horasPorCancha: { c1: ['10:00'] } },
    };

    const validaciones = validarJornadas(fases8eq.slice(0, 2), jornadas);
    expect(validaciones[1].ordenValido).toBe(false);
    expect(validaciones[1].error).toBe(
      'Semifinal debe jugarse después de que termine Cuartos de final (2026-11-02 a las 09:00).'
    );
  });
});

describe('sugerenciasTiempoFase', () => {
  test('devuelve vacío si capacidadFase alcanza para los partidos de la fase', () => {
    const fase = {
      ronda: 1,
      nombreRonda: 'Semifinal',
      partidos: 2,
      canchasEfectivas: 2,
      minutosTurno: 30,
      minutosRequeridos: 30,
      horasMinimas: 1,
    };
    expect(
      sugerenciasTiempoFase({
        fase,
        canchasTotales: 2,
        duracionPartido: 20,
        deporte: 'futbol',
        horasPorCancha: { c1: ['16:00'], c2: [] },
      })
    ).toEqual([]);
  });

  test('devuelve sugerencias accionables cuando faltan partidos por ubicar', () => {
    const fase = {
      ronda: 1,
      nombreRonda: 'Octavos de final',
      partidos: 8,
      canchasEfectivas: 1,
      minutosTurno: 30,
      minutosRequeridos: 240,
      horasMinimas: 4,
    };
    const sugs = sugerenciasTiempoFase({
      fase,
      canchasTotales: 1,
      duracionPartido: 20,
      deporte: 'futbol',
      horasPorCancha: { c1: ['08:00'] }, // 2 turnos -> faltan 6 partidos
    });

    expect(sugs.length).toBe(3);
    expect(sugs[0]).toBe('Marca más horas en Octavos de final: faltan turnos para 6 partidos.');
    expect(sugs[1]).toContain('Agrega más canchas del mismo deporte');
    expect(sugs[2]).toContain('Reduce la duración por partido a 15 min');

    // Caso con 1 partido faltante
    const sugsUno = sugerenciasTiempoFase({
      fase: {
        ronda: 2,
        nombreRonda: 'Semifinal',
        partidos: 2,
        canchasEfectivas: 2,
        minutosTurno: 35,
      },
      canchasTotales: 2,
      duracionPartido: 25,
      deporte: 'futbol',
      horasPorCancha: { c1: ['10:00'] }, // 1 turno -> falta 1 partido
    });
    expect(sugsUno[0]).toBe('Marca más horas en Semifinal: faltan turnos para 1 partido.');
  });
});

describe('programarTorneo y armarTorneo con jornadas (DD-011, DD-012, DD-014)', () => {
  test('programarTorneo con horas por cancha asigna el 2.º y 4.º partido correctamente sin cruzar huecos y permite final en cancha 2', () => {
    const orden = [1, 2, 3, 4, 5, 6, 7, 8];
    const canchaIds = ['futbol-1', 'futbol-2'];
    const jornadas = {
      1: {
        fecha: '2026-11-21',
        horasPorCancha: {
          'futbol-1': ['16:00', '18:00'],
          'futbol-2': ['19:00'],
        },
      },
      2: {
        fecha: '2026-11-22',
        horasPorCancha: {
          'futbol-1': ['16:00'],
          'futbol-2': ['16:00'],
        },
      },
      3: {
        fecha: '2026-11-23',
        horasPorCancha: {
          'futbol-2': ['20:00'],
        },
      },
    };

    const partidos = programarTorneo({
      orden,
      canchaIds,
      minutosTurno: 25,
      jornadas,
    });

    expect(partidos).toHaveLength(7);

    // R1 (Cuartos): 4 partidos en futbol-1 (16:00, 16:25, 18:00, 18:25); ninguno cruza el hueco de las 17:00
    const r1 = partidos.filter((p) => p.ronda === 1);
    expect(r1[0]).toMatchObject({
      id: 'R1-P1',
      canchaId: 'futbol-1',
      turno: 1,
      inicio: '16:00',
      fecha: '2026-11-21',
    });
    expect(r1[1]).toMatchObject({
      id: 'R1-P2',
      canchaId: 'futbol-1',
      turno: 2,
      inicio: '16:25',
      fecha: '2026-11-21',
    });
    expect(r1[2]).toMatchObject({
      id: 'R1-P3',
      canchaId: 'futbol-1',
      turno: 3,
      inicio: '18:00',
      fecha: '2026-11-21',
    });
    expect(r1[3]).toMatchObject({
      id: 'R1-P4',
      canchaId: 'futbol-1',
      turno: 4,
      inicio: '18:25',
      fecha: '2026-11-21',
    });

    // R2 (Semifinal): dos partidos a la misma hora comparten turno: 1
    const r2 = partidos.filter((p) => p.ronda === 2);
    expect(r2[0]).toMatchObject({
      id: 'R2-P1',
      canchaId: 'futbol-1',
      turno: 1,
      inicio: '16:00',
      fecha: '2026-11-22',
    });
    expect(r2[1]).toMatchObject({
      id: 'R2-P2',
      canchaId: 'futbol-2',
      turno: 1,
      inicio: '16:00',
      fecha: '2026-11-22',
    });

    // R3 (Final): solo cancha 2 tiene horas -> va en futbol-2
    const r3 = partidos.filter((p) => p.ronda === 3);
    expect(r3[0]).toMatchObject({
      id: 'R3-P1',
      canchaId: 'futbol-2',
      turno: 1,
      inicio: '20:00',
      fecha: '2026-11-23',
    });
  });

  test('programarTorneo ordena por hora entre canchas antes de asignar partidos y deja null si faltan turnos', () => {
    const partidos = programarTorneo({
      orden: [1, 2, 3, 4, 5, 6, 7, 8],
      canchaIds: ['futbol-1', 'futbol-2'],
      minutosTurno: 25,
      jornadas: {
        // futbol-1 tiene 16:00 y 18:00; futbol-2 tiene 17:00 -> el 3.º y 4.º partido deben ir a las 17:00/17:25 en futbol-2
        1: {
          fecha: '2026-11-21',
          horasPorCancha: {
            'futbol-1': ['16:00', '18:00'],
            'futbol-2': ['17:00'],
          },
        },
        // Semifinal sin horas -> ambos partidos quedan sin turno
        2: {
          fecha: '2026-11-22',
          horasPorCancha: {},
        },
        // Final con 1 solo turno de 60 min (minutosTurno 25 -> 2 disponibles, toma el 1.º)
        3: {
          fecha: '2026-11-23',
          horasPorCancha: {
            'futbol-1': ['12:00'],
          },
        },
      },
    });

    const r1 = partidos.filter((p) => p.ronda === 1);
    expect(r1.map((p) => ({ id: p.id, canchaId: p.canchaId, inicio: p.inicio, turno: p.turno }))).toEqual([
      { id: 'R1-P1', canchaId: 'futbol-1', inicio: '16:00', turno: 1 },
      { id: 'R1-P2', canchaId: 'futbol-1', inicio: '16:25', turno: 2 },
      { id: 'R1-P3', canchaId: 'futbol-2', inicio: '17:00', turno: 3 },
      { id: 'R1-P4', canchaId: 'futbol-2', inicio: '17:25', turno: 4 },
    ]);

    const r2 = partidos.filter((p) => p.ronda === 2);
    expect(r2[0]).toMatchObject({ canchaId: null, inicio: null, turno: null });
    expect(r2[1]).toMatchObject({ canchaId: null, inicio: null, turno: null });

    // Fase parcialmente cubierta con minutosTurno 35 (solo cabe 1 turno en 1 hora)
    const parcial = programarTorneo({
      orden: [1, 2, 3, 4],
      canchaIds: ['futbol-1', 'futbol-2'],
      minutosTurno: 35,
      jornadas: {
        1: { fecha: '2026-11-22', horasPorCancha: { 'futbol-2': ['10:00'] } },
        2: { fecha: '2026-11-23', horasPorCancha: { 'futbol-2': ['11:00'] } },
      },
    });
    const semi = parcial.filter((p) => p.ronda === 1);
    expect(semi[0]).toMatchObject({ canchaId: 'futbol-2', inicio: '10:00', turno: 1 });
    expect(semi[1]).toMatchObject({ canchaId: null, inicio: null, turno: null });
  });

  test('armarTorneo con jornadas genera resumen con horasPorCancha sin vacías, horas planas y canchaIds usadas en el orden del torneo', () => {
    const jornadas = {
      1: {
        fecha: '2026-11-01',
        horasPorCancha: {
          c3: ['09:00'],
          c1: ['08:00', '10:00'],
          c2: [],
        },
      },
      2: {
        fecha: '2026-11-02',
        horasPorCancha: {
          c2: ['09:00'],
        },
      },
      3: {
        fecha: '2026-11-03',
        horasPorCancha: {
          c3: ['10:00'],
        },
      },
    };
    const snapshot = structuredClone(jornadas);

    const torneo = armarTorneo({
      deporte: 'futbol',
      equipos: 8,
      duracionPartido: 20,
      emparejamiento: 'aleatorio',
      orden: [1, 2, 3, 4, 5, 6, 7, 8],
      canchaIds: ['c1', 'c2', 'c3'],
      jornadas,
    });

    expect(jornadas).toEqual(snapshot);
    expect(torneo.jornadas).toBeDefined();
    expect(torneo.jornadas).toHaveLength(3);
    expect(torneo.jornadas[0]).toEqual({
      ronda: 1,
      nombreRonda: 'Cuartos de final',
      fecha: '2026-11-01',
      horasPorCancha: {
        c3: ['09:00'],
        c1: ['08:00', '10:00'],
      },
      horas: ['08:00', '09:00', '10:00'],
      canchaIds: ['c1', 'c3'],
      canchasEfectivas: 3,
      partidos: 4,
      turnos: 2,
      minutosRequeridos: 60,
    });
    expect(torneo.jornadas[0].horasPorCancha).not.toBe(jornadas[1].horasPorCancha);
    expect(torneo.jornadas[1]).toEqual({
      ronda: 2,
      nombreRonda: 'Semifinal',
      fecha: '2026-11-02',
      horasPorCancha: { c2: ['09:00'] },
      horas: ['09:00'],
      canchaIds: ['c2'],
      canchasEfectivas: 2,
      partidos: 2,
      turnos: 1,
      minutosRequeridos: 30,
    });
    expect(torneo.jornadas[2]).toEqual({
      ronda: 3,
      nombreRonda: 'Final',
      fecha: '2026-11-03',
      horasPorCancha: { c3: ['10:00'] },
      horas: ['10:00'],
      canchaIds: ['c3'],
      canchasEfectivas: 1,
      partidos: 1,
      turnos: 1,
      minutosRequeridos: 30,
    });
  });
});

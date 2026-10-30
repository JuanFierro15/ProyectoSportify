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
  turnosPorRonda,
  minutosRequeridos,
  validarFranja,
  sugerenciasTiempo,
  validarCanchasTorneo,
  sortearEquipos,
  validarCrucesManuales,
  nombreRonda,
  sumarMinutos,
  programarTorneo,
  armarTorneo,
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

  test('turnosPorRonda distribuye partidos según canchas disponibles', () => {
    // 8 equipos -> [4, 2, 1] partidos. Con 3 canchas: [ceil(4/3)=2, ceil(2/3)=1, ceil(1/3)=1] -> [2, 1, 1]
    expect(turnosPorRonda(8, 3)).toEqual([2, 1, 1]);
    // Con 1 cancha: [4, 2, 1]
    expect(turnosPorRonda(8, 1)).toEqual([4, 2, 1]);
    // Con 2 canchas: [2, 1, 1]
    expect(turnosPorRonda(8, 2)).toEqual([2, 1, 1]);
  });

  test('minutosRequeridos devuelve 0 para configuraciones no permitidas', () => {
    expect(minutosRequeridos({ equipos: 6, canchas: 2, minutosTurno: 30 })).toBe(0);
    expect(minutosRequeridos({ equipos: 8, canchas: 0, minutosTurno: 30 })).toBe(0);
  });

  // AC-001 a AC-005: Cálculos en peor caso con duracion 20 min en fútbol (minutosTurno = 30)
  test('AC-001: 8 equipos, 3 canchas, 2 horas -> 120 min requeridos, alcanza', () => {
    const minutosTurno = minutosPorTurno(20, 'futbol'); // 30
    const req = minutosRequeridos({ equipos: 8, canchas: 3, minutosTurno });
    expect(req).toBe(120);

    const validacion = validarFranja(req, 2);
    expect(validacion).toEqual({
      alcanza: true,
      disponibles: 120,
      deficit: 0,
    });
  });

  test('AC-002: 8 equipos, 3 canchas, 1 hora -> déficit 60 min', () => {
    const minutosTurno = minutosPorTurno(20, 'futbol'); // 30
    const req = minutosRequeridos({ equipos: 8, canchas: 3, minutosTurno }); // 120
    const validacion = validarFranja(req, 1);
    expect(validacion).toEqual({
      alcanza: false,
      disponibles: 60,
      deficit: 60,
    });
  });

  test('AC-003: 8 equipos, 1 cancha, 3 horas -> 210 min requeridos, déficit 30 min', () => {
    const minutosTurno = minutosPorTurno(20, 'futbol'); // 30
    const req = minutosRequeridos({ equipos: 8, canchas: 1, minutosTurno });
    expect(req).toBe(210);

    const validacion = validarFranja(req, 3);
    expect(validacion).toEqual({
      alcanza: false,
      disponibles: 180,
      deficit: 30,
    });
  });

  test('AC-004: 8 equipos, 2 canchas, 2 horas -> 120 min requeridos, alcanza', () => {
    const minutosTurno = minutosPorTurno(20, 'futbol'); // 30
    const req = minutosRequeridos({ equipos: 8, canchas: 2, minutosTurno });
    expect(req).toBe(120);

    const validacion = validarFranja(req, 2);
    expect(validacion).toEqual({
      alcanza: true,
      disponibles: 120,
      deficit: 0,
    });
  });

  test('AC-005: 16 equipos, 3 canchas, 4 horas -> 210 min requeridos, alcanza', () => {
    const minutosTurno = minutosPorTurno(20, 'futbol'); // 30
    // turnos 16 eq, 3 canchas: [ceil(8/3)=3, ceil(4/3)=2, ceil(2/3)=1, ceil(1/3)=1] -> 7 turnos -> 7 * 30 = 210 min
    const req = minutosRequeridos({ equipos: 16, canchas: 3, minutosTurno });
    expect(req).toBe(210);

    const validacion = validarFranja(req, 4);
    expect(validacion).toEqual({
      alcanza: true,
      disponibles: 240,
      deficit: 0,
    });
  });

  test('4 equipos en 1 cancha requiere 90 min', () => {
    const minutosTurno = minutosPorTurno(20, 'futbol'); // 30
    const req = minutosRequeridos({ equipos: 4, canchas: 1, minutosTurno });
    expect(req).toBe(90);
  });
});

describe('sugerenciasTiempo', () => {
  test('devuelve arreglo vacío si la franja horaria alcanza', () => {
    const sugs = sugerenciasTiempo({
      equipos: 8,
      canchas: 3,
      duracionPartido: 20,
      deporte: 'futbol',
      horasReservadas: 2,
    });
    expect(sugs).toEqual([]);
  });

  test('devuelve sugerencias accionables cuando hay déficit de tiempo', () => {
    // 8 equipos, 1 cancha, duracion 20 min, futbol -> req = 210 min, horas = 1 (60 min)
    const sugs = sugerenciasTiempo({
      equipos: 8,
      canchas: 1,
      duracionPartido: 20,
      deporte: 'futbol',
      horasReservadas: 1,
    });

    expect(sugs.length).toBe(3);
    // 1. Ampliar franja a ceil(210 / 60) = 4 horas (240 min)
    expect(sugs[0]).toBe('Amplía la franja horaria a al menos 4 horas (240 min).');
    // 2. Agregar más canchas (con 3 canchas tomaría 120 min)
    expect(sugs[1]).toBe('Agrega más canchas del mismo deporte (con 3 canchas en paralelo tomaría 120 min).');
    // 3. Reducir duración a 15 min (minutosTurno 25 -> 7 * 25 = 175 min)
    expect(sugs[2]).toBe('Reduce la duración por partido a 15 min (tomaría 175 min).');
  });

  test('omite sugerencias que ya están en el límite', () => {
    // Con 3 canchas y 15 min por partido, solo sugiere ampliar franja
    const sugs = sugerenciasTiempo({
      equipos: 16,
      canchas: 3,
      duracionPartido: 15,
      deporte: 'futbol',
      horasReservadas: 1,
    });

    expect(sugs.length).toBe(1);
    expect(sugs[0]).toContain('Amplía la franja horaria');
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

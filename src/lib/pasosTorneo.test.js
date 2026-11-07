import { describe, it, expect } from 'vitest';
import {
  PASOS_TORNEO,
  estadoPasosTorneo,
  pasosAlcanzables,
} from './pasosTorneo';

describe('pasosTorneo', () => {
  describe('PASOS_TORNEO', () => {
    it('define los 6 pasos en el orden e identificadores especificados', () => {
      expect(PASOS_TORNEO).toEqual([
        { id: 'canchas', etiqueta: 'Canchas' },
        { id: 'formato', etiqueta: 'Formato' },
        { id: 'fechas', etiqueta: 'Fechas por fase' },
        { id: 'llaves', etiqueta: 'Llaves' },
        { id: 'datos', etiqueta: 'Tus datos' },
        { id: 'resumen', etiqueta: 'Resumen' },
      ]);
    });
  });

  describe('estadoPasosTorneo - completitud y motivos', () => {
    it('paso 1 (canchas): incompleto sin canchas y completo con canchas válidas', () => {
      const sinCanchas = estadoPasosTorneo({
        canchaIds: [],
        torneoPlan: {},
      });
      const pasoCanchasIncompleto = sinCanchas.find((p) => p.id === 'canchas');
      expect(pasoCanchasIncompleto.completo).toBe(false);
      expect(pasoCanchasIncompleto.motivo).toMatch(/elige al menos una cancha/i);

      const conError = estadoPasosTorneo({
        canchaIds: ['c1'],
        torneoPlan: { errorCanchas: 'Solo se permiten canchas del mismo deporte' },
      });
      const pasoConError = conError.find((p) => p.id === 'canchas');
      expect(pasoConError.completo).toBe(false);
      expect(pasoConError.motivo).toBe('Solo se permiten canchas del mismo deporte');

      const completo = estadoPasosTorneo({
        canchaIds: ['c1', 'c2'],
        torneoPlan: {},
      });
      const pasoCanchasCompleto = completo.find((p) => p.id === 'canchas');
      expect(pasoCanchasCompleto.completo).toBe(true);
      expect(pasoCanchasCompleto.motivo).toBe('');
    });

    it('paso 2 (formato): incompleto sin equipos o duración y completo con ambos válidos', () => {
      const sinFormato = estadoPasosTorneo({
        equipos: null,
        duracionPartido: null,
      });
      const pasoFormatoIncompleto = sinFormato.find((p) => p.id === 'formato');
      expect(pasoFormatoIncompleto.completo).toBe(false);
      expect(pasoFormatoIncompleto.motivo).toMatch(/elige el número de equipos/i);

      const completo = estadoPasosTorneo({
        equipos: 8,
        duracionPartido: 20,
      });
      const pasoFormatoCompleto = completo.find((p) => p.id === 'formato');
      expect(pasoFormatoCompleto.completo).toBe(true);
      expect(pasoFormatoCompleto.motivo).toBe('');
    });

    it('paso 3 (fechas): incompleto si falta horario o hay errores en fases', () => {
      const fasesSinHoras = estadoPasosTorneo({
        torneoPlan: {
          fases: [{ ronda: 'cuartos' }, { ronda: 'semifinal' }],
          jornadas: { cuartos: { horas: ['08:00'] }, semifinal: { horas: [] } },
          validacionesJornadas: [],
        },
      });
      const pasoFechasIncompleto = fasesSinHoras.find((p) => p.id === 'fechas');
      expect(pasoFechasIncompleto.completo).toBe(false);
      expect(pasoFechasIncompleto.motivo).toMatch(/asigna fecha y horario|completa los horarios/i);

      const conErrorValidacion = estadoPasosTorneo({
        torneoPlan: {
          fases: [{ ronda: 'cuartos' }],
          jornadas: { cuartos: { horas: ['08:00'] } },
          validacionesJornadas: [{ error: 'La semifinal debe ser posterior a cuartos' }],
        },
      });
      const pasoConError = conErrorValidacion.find((p) => p.id === 'fechas');
      expect(pasoConError.completo).toBe(false);
      expect(pasoConError.motivo).toBe('La semifinal debe ser posterior a cuartos');

      const completo = estadoPasosTorneo({
        torneoPlan: {
          fases: [{ ronda: 'final' }],
          jornadas: { final: { horas: ['10:00'] } },
          validacionesJornadas: [],
        },
      });
      const pasoFechasCompleto = completo.find((p) => p.id === 'fechas');
      expect(pasoFechasCompleto.completo).toBe(true);
      expect(pasoFechasCompleto.motivo).toBe('');
    });

    it('paso 4 (llaves): incompleto sin partidos o con errorCruces, completo con cruces válidos', () => {
      const sinPartidos = estadoPasosTorneo({
        torneoPlan: { partidos: [], errorCruces: null },
      });
      const pasoLlavesIncompleto = sinPartidos.find((p) => p.id === 'llaves');
      expect(pasoLlavesIncompleto.completo).toBe(false);
      expect(pasoLlavesIncompleto.motivo).toMatch(/llaves/i);

      const conErrorCruces = estadoPasosTorneo({
        torneoPlan: {
          partidos: [{ id: 1 }],
          errorCruces: 'Hay equipos duplicados en el cruce manual',
        },
      });
      const pasoLlavesConError = conErrorCruces.find((p) => p.id === 'llaves');
      expect(pasoLlavesConError.completo).toBe(false);
      expect(pasoLlavesConError.motivo).toBe('Hay equipos duplicados en el cruce manual');

      const completo = estadoPasosTorneo({
        torneoPlan: {
          partidos: [{ id: 1 }, { id: 2 }],
          errorCruces: null,
        },
      });
      const pasoLlavesCompleto = completo.find((p) => p.id === 'llaves');
      expect(pasoLlavesCompleto.completo).toBe(true);
      expect(pasoLlavesCompleto.motivo).toBe('');
    });

    it('paso 5 (datos): incompleto sin nombre o con errores, completo con nombre válido', () => {
      const sinNombre = estadoPasosTorneo({
        nombre: '',
        telefono: '',
      });
      const pasoDatosIncompleto = sinNombre.find((p) => p.id === 'datos');
      expect(pasoDatosIncompleto.completo).toBe(false);
      expect(pasoDatosIncompleto.motivo).toMatch(/nombre/i);

      const conErrorTel = estadoPasosTorneo({
        nombre: 'Carlos Gómez',
        telefono: '123',
        errTelefono: 'El teléfono debe tener 10 dígitos',
      });
      const pasoDatosError = conErrorTel.find((p) => p.id === 'datos');
      expect(pasoDatosError.completo).toBe(false);
      expect(pasoDatosError.motivo).toBe('El teléfono debe tener 10 dígitos');

      const completo = estadoPasosTorneo({
        nombre: 'Carlos Gómez',
        telefono: '3001234567',
        errNombre: null,
        errTelefono: null,
      });
      const pasoDatosCompleto = completo.find((p) => p.id === 'datos');
      expect(pasoDatosCompleto.completo).toBe(true);
      expect(pasoDatosCompleto.motivo).toBe('');
    });

    it('paso 6 (resumen): completo cuando puedeConfirmar es true', () => {
      const incompleto = estadoPasosTorneo({
        puedeConfirmar: false,
        motivoBloqueo: 'Falta seleccionar horarios',
      });
      const pasoResumenIncompleto = incompleto.find((p) => p.id === 'resumen');
      expect(pasoResumenIncompleto.completo).toBe(false);
      expect(pasoResumenIncompleto.motivo).toBe('Falta seleccionar horarios');

      const completo = estadoPasosTorneo({
        puedeConfirmar: true,
        motivoBloqueo: null,
      });
      const pasoResumenCompleto = completo.find((p) => p.id === 'resumen');
      expect(pasoResumenCompleto.completo).toBe(true);
      expect(pasoResumenCompleto.motivo).toBe('');
    });
  });

  describe('pasosAlcanzables (regla de salto de S5)', () => {
    it('si todos están incompletos, solo el primer paso incompleto es alcanzable', () => {
      const estados = [
        { id: 'canchas', completo: false },
        { id: 'formato', completo: false },
        { id: 'fechas', completo: false },
        { id: 'llaves', completo: false },
        { id: 'datos', completo: false },
        { id: 'resumen', completo: false },
      ];
      expect(pasosAlcanzables(estados)).toEqual(['canchas']);
    });

    it('permite saltar a cualquier paso completo o al primero incompleto', () => {
      const estados = [
        { id: 'canchas', completo: true },
        { id: 'formato', completo: true },
        { id: 'fechas', completo: false }, // primer incompleto
        { id: 'llaves', completo: false },
        { id: 'datos', completo: false },
        { id: 'resumen', completo: false },
      ];
      expect(pasosAlcanzables(estados)).toEqual(['canchas', 'formato', 'fechas']);
    });

    it('si hay un paso completo posterior, permite visitarlo junto al primer incompleto', () => {
      const estados = [
        { id: 'canchas', completo: true },
        { id: 'formato', completo: false }, // primer incompleto
        { id: 'fechas', completo: false },
        { id: 'llaves', completo: false },
        { id: 'datos', completo: true }, // completado previamente
        { id: 'resumen', completo: false },
      ];
      expect(pasosAlcanzables(estados)).toEqual(['canchas', 'formato', 'datos']);
    });

    it('cuando todos están completos, todos los pasos son alcanzables', () => {
      const estados = [
        { id: 'canchas', completo: true },
        { id: 'formato', completo: true },
        { id: 'fechas', completo: true },
        { id: 'llaves', completo: true },
        { id: 'datos', completo: true },
        { id: 'resumen', completo: true },
      ];
      expect(pasosAlcanzables(estados)).toEqual([
        'canchas',
        'formato',
        'fechas',
        'llaves',
        'datos',
        'resumen',
      ]);
    });

    it('maneja listas vacías o nulas sin lanzar error', () => {
      expect(pasosAlcanzables([])).toEqual([]);
      expect(pasosAlcanzables(null)).toEqual([]);
      expect(pasosAlcanzables(undefined)).toEqual([]);
    });
  });
});

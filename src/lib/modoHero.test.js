import { describe, it, expect } from 'vitest';
import {
  DURACION_FADE_CONTENIDO,
  REPOSO_HERO,
  TOLERANCIA_REPOSO,
  decidirAccionHero,
} from './modoHero';

describe('modoHero', () => {
  it('expone las constantes esperadas', () => {
    expect(DURACION_FADE_CONTENIDO).toBe(0.15);
    expect(REPOSO_HERO).toBe(0.15);
    expect(TOLERANCIA_REPOSO).toBe(0.01);
  });

  it('mantiene REPOSO_HERO >= DURACION_FADE_CONTENIDO para que el CTA quede visible', () => {
    expect(REPOSO_HERO).toBeGreaterThanOrEqual(DURACION_FADE_CONTENIDO);
  });
});

describe('decidirAccionHero', () => {
  it('devuelve null cuando el progreso no es un número finito', () => {
    expect(decidirAccionHero({ progreso: NaN, direccion: 1 })).toBeNull();
    expect(decidirAccionHero({ progreso: Infinity, direccion: 1 })).toBeNull();
    expect(decidirAccionHero({ progreso: undefined, direccion: 1 })).toBeNull();
  });

  it('devuelve null si la dirección no es hacia abajo (1)', () => {
    expect(decidirAccionHero({ progreso: 0.5, direccion: -1 })).toBeNull();
  });

  it('devuelve null si el progreso es negativo', () => {
    expect(decidirAccionHero({ progreso: -0.01, direccion: 1 })).toBeNull();
  });

  it('devuelve "reposar" antes de la ventana de reposo', () => {
    expect(decidirAccionHero({ progreso: 0, direccion: 1 })).toBe('reposar');
    expect(decidirAccionHero({ progreso: 0.139, direccion: 1 })).toBe('reposar');
  });

  it('devuelve null dentro de la ventana de reposo (0.15 ± 0.01)', () => {
    expect(decidirAccionHero({ progreso: 0.14, direccion: 1 })).toBeNull();
    expect(decidirAccionHero({ progreso: 0.15, direccion: 1 })).toBeNull();
    expect(decidirAccionHero({ progreso: 0.16, direccion: 1 })).toBeNull();
  });

  it('devuelve "reproducir" después de la ventana de reposo y antes de 1', () => {
    expect(decidirAccionHero({ progreso: 0.1601, direccion: 1 })).toBe(
      'reproducir'
    );
    expect(decidirAccionHero({ progreso: 0.5, direccion: 1 })).toBe(
      'reproducir'
    );
    expect(decidirAccionHero({ progreso: 0.999, direccion: 1 })).toBe(
      'reproducir'
    );
  });

  it('devuelve "siguiente" cuando el progreso es >= 1', () => {
    expect(decidirAccionHero({ progreso: 1, direccion: 1 })).toBe('siguiente');
    expect(decidirAccionHero({ progreso: 1.4, direccion: 1 })).toBe(
      'siguiente'
    );
  });
});

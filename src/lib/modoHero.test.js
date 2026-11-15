import { describe, it, expect } from 'vitest';
import {
  MODOS_HERO,
  REPOSO_HERO,
  TOLERANCIA_REPOSO,
  modoScrollHero,
  decidirAccionHero,
} from './modoHero';

describe('modoHero', () => {
  it('expone las constantes esperadas', () => {
    expect(MODOS_HERO).toEqual(['scrub', 'snap']);
    expect(REPOSO_HERO).toBe(0.15);
    expect(TOLERANCIA_REPOSO).toBe(0.01);
  });

  it('devuelve "snap" cuando ?hero=snap en distintos formatos', () => {
    expect(modoScrollHero('?hero=snap')).toBe('snap');
    expect(modoScrollHero('?hero=SNAP')).toBe('snap');
    expect(modoScrollHero('?hero=%20snap%20')).toBe('snap');
    expect(modoScrollHero('?foo=1&hero=snap&bar=2')).toBe('snap');
  });

  it('devuelve "scrub" en cualquier otro caso o entradas vacías', () => {
    expect(modoScrollHero('?hero=scrub')).toBe('scrub');
    expect(modoScrollHero('')).toBe('scrub');
    expect(modoScrollHero(undefined)).toBe('scrub');
    expect(modoScrollHero(null)).toBe('scrub');
    expect(modoScrollHero('?hero=otro')).toBe('scrub');
    expect(modoScrollHero('?hero=')).toBe('scrub');
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

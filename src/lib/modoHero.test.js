import { describe, it, expect } from 'vitest';
import {
  MODOS_HERO,
  REPOSO_HERO,
  PUNTOS_SNAP_HERO,
  modoScrollHero,
} from './modoHero';

describe('modoHero', () => {
  it('expone las constantes esperadas y PUNTOS_SNAP_HERO es [0, 0.15, 1]', () => {
    expect(MODOS_HERO).toEqual(['scrub', 'snap']);
    expect(REPOSO_HERO).toBe(0.15);
    expect(PUNTOS_SNAP_HERO).toEqual([0, 0.15, 1]);
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

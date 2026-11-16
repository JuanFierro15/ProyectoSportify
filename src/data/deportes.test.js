import { describe, it, expect } from 'vitest';
import { DEPORTES, POSICIONES_TEXTO_HERO } from './deportes';

describe('DEPORTES', () => {
  it('cada deporte tiene una posicionTexto válida', () => {
    expect(POSICIONES_TEXTO_HERO.length).toBeGreaterThan(0);

    for (const deporte of DEPORTES) {
      expect(POSICIONES_TEXTO_HERO).toContain(deporte.posicionTexto);
    }
  });
});

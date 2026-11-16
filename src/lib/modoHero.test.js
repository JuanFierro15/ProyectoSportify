import { describe, it, expect } from 'vitest';
import {
  DURACION_FADE_CONTENIDO,
  REPOSO_HERO,
  TOLERANCIA_REPOSO,
  accionPorGesto,
  enFinalDeTramo,
  enReposoDeTramo,
  finalDeTramo,
  indiceHeroEnZona,
  puedeDesplazarAncestro,
  puntoEstableMasCercano,
  reposoDeTramo,
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

describe('reposoDeTramo', () => {
  it('calcula el punto de reposo en start + REPOSO_HERO * (end - start)', () => {
    expect(reposoDeTramo({ start: 0, end: 1000 })).toBe(150);
    expect(reposoDeTramo({ start: 2000, end: 3000 })).toBe(2150);
  });

  it('devuelve null con tramos inválidos', () => {
    expect(reposoDeTramo(null)).toBeNull();
    expect(reposoDeTramo({ start: NaN, end: 1000 })).toBeNull();
    expect(reposoDeTramo({ start: 0, end: Infinity })).toBeNull();
  });
});

describe('enReposoDeTramo', () => {
  const tramo = { start: 0, end: 1000 };

  it('acepta posiciones dentro de REPOSO_HERO ± TOLERANCIA_REPOSO', () => {
    expect(enReposoDeTramo(140, tramo)).toBe(true);
    expect(enReposoDeTramo(150, tramo)).toBe(true);
    expect(enReposoDeTramo(160, tramo)).toBe(true);
  });

  it('rechaza posiciones fuera de la tolerancia o con tramo inválido', () => {
    expect(enReposoDeTramo(139, tramo)).toBe(false);
    expect(enReposoDeTramo(161, tramo)).toBe(false);
    expect(enReposoDeTramo(150, { start: 100, end: 100 })).toBe(false);
    expect(enReposoDeTramo(NaN, tramo)).toBe(false);
  });
});

describe('finalDeTramo', () => {
  it('devuelve tramo.end para tramos válidos', () => {
    expect(finalDeTramo({ start: 0, end: 1000 })).toBe(1000);
    expect(finalDeTramo({ start: 2000, end: 3000 })).toBe(3000);
  });

  it('devuelve null con tramos inválidos', () => {
    expect(finalDeTramo(null)).toBeNull();
    expect(finalDeTramo({ start: NaN, end: 1000 })).toBeNull();
    expect(finalDeTramo({ start: 0, end: Infinity })).toBeNull();
  });
});

describe('enFinalDeTramo', () => {
  const tramo = { start: 0, end: 1000 };

  it('acepta posiciones dentro de 1 ± TOLERANCIA_REPOSO', () => {
    expect(enFinalDeTramo(990, tramo)).toBe(true);
    expect(enFinalDeTramo(1000, tramo)).toBe(true);
    expect(enFinalDeTramo(1010, tramo)).toBe(true);
  });

  it('rechaza posiciones fuera de la tolerancia o con tramo inválido', () => {
    expect(enFinalDeTramo(989, tramo)).toBe(false);
    expect(enFinalDeTramo(1011, tramo)).toBe(false);
    expect(enFinalDeTramo(1000, { start: 100, end: 100 })).toBe(false);
    expect(enFinalDeTramo(NaN, tramo)).toBe(false);
  });
});

describe('indiceHeroEnZona', () => {
  const tramos = [
    { start: 0, end: 1000 },
    { start: 1200, end: 2200 },
  ];

  it('devuelve -1 fuera de la zona de heros', () => {
    expect(indiceHeroEnZona(-1, tramos, 2500)).toBe(-1);
    expect(indiceHeroEnZona(2500, tramos, 2500)).toBe(-1);
    expect(indiceHeroEnZona(3000, tramos, 2500)).toBe(-1);
    expect(indiceHeroEnZona(NaN, tramos, 2500)).toBe(-1);
    expect(indiceHeroEnZona(100, [], 2500)).toBe(-1);
  });

  it('identifica el tramo correspondiente dentro de la zona', () => {
    expect(indiceHeroEnZona(0, tramos, 2500)).toBe(0);
    expect(indiceHeroEnZona(1199, tramos, 2500)).toBe(0);
    expect(indiceHeroEnZona(1200, tramos, 2500)).toBe(1);
    expect(indiceHeroEnZona(2499, tramos, 2500)).toBe(1);
  });
});

describe('puntoEstableMasCercano', () => {
  it('elige el punto estable más cercano entre inicio y final de cada hero y en el punto medio exacto pasa al siguiente', () => {
    const tramos = [
      { start: 0, end: 1000 },
      { start: 1000, end: 2000 },
    ];
    // Hero 0: inicio 150, final 1000 (punto medio = 575).
    expect(puntoEstableMasCercano(574, tramos)).toEqual({
      indice: 0,
      punto: 'inicio',
      y: 150,
    });
    expect(puntoEstableMasCercano(575, tramos)).toEqual({
      indice: 0,
      punto: 'final',
      y: 1000,
    });
    // Hero 0 final 1000 vs Hero 1 inicio 1150 (punto medio = 1075).
    expect(puntoEstableMasCercano(1074, tramos)).toEqual({
      indice: 0,
      punto: 'final',
      y: 1000,
    });
    expect(puntoEstableMasCercano(1075, tramos)).toEqual({
      indice: 1,
      punto: 'inicio',
      y: 1150,
    });
  });

  it('en el hueco entre N.end y N+1.start elige el más cercano entre N.final y N+1.inicio (en empate exacto pasa a N+1.inicio)', () => {
    const tramos = [
      { start: 0, end: 600 },
      { start: 1500, end: 2100 },
    ];
    // 0.final = 600, 1.inicio = 1590; punto medio exacto = 1095.
    expect(puntoEstableMasCercano(790, tramos)).toEqual({
      indice: 0,
      punto: 'final',
      y: 600,
    });
    expect(puntoEstableMasCercano(1094, tramos)).toEqual({
      indice: 0,
      punto: 'final',
      y: 600,
    });
    expect(puntoEstableMasCercano(1095, tramos)).toEqual({
      indice: 1,
      punto: 'inicio',
      y: 1590,
    });
    expect(puntoEstableMasCercano(1200, tramos)).toEqual({
      indice: 1,
      punto: 'inicio',
      y: 1590,
    });
  });

  it('devuelve null con entradas inválidas', () => {
    expect(puntoEstableMasCercano(NaN, [{ start: 0, end: 1000 }])).toBeNull();
    expect(puntoEstableMasCercano(100, [])).toBeNull();
  });
});

describe('accionPorGesto', () => {
  it('hacia abajo en inicio o en otro punto sin reproducir ni animar inicia reproducción', () => {
    expect(
      accionPorGesto({
        direccion: 1,
        punto: 'inicio',
        reproduciendo: false,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('reproducir');
    expect(
      accionPorGesto({
        direccion: 1,
        punto: 'otro',
        reproduciendo: false,
        animando: false,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('reproducir');
  });

  it('hacia abajo en final desliza directo al inicio del siguiente (o #eventos)', () => {
    expect(
      accionPorGesto({
        direccion: 1,
        punto: 'final',
        reproduciendo: false,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('siguiente_inicio');
    expect(
      accionPorGesto({
        direccion: 1,
        punto: 'final',
        reproduciendo: false,
        animando: false,
        indiceHero: 2,
        totalHeros: 3,
      })
    ).toBe('siguiente_inicio');
  });

  it('hacia abajo mientras reproduce se ignora sin cancelar', () => {
    expect(
      accionPorGesto({
        direccion: 1,
        punto: 'otro',
        reproduciendo: true,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('ignorar');
  });

  it('cualquier gesto mientras hay una animación (tween) en curso se ignora', () => {
    expect(
      accionPorGesto({
        direccion: 1,
        punto: 'inicio',
        reproduciendo: false,
        animando: true,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('ignorar');
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'final',
        reproduciendo: false,
        animando: true,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('ignorar');
  });

  it('hacia arriba mientras reproduce cancela y vuelve al reposo', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'otro',
        reproduciendo: true,
        animando: false,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('cancelar_y_reposar');
  });

  it('hacia arriba en inicio va al final del anterior si no es el primero, y devuelve null en el primero', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'inicio',
        reproduciendo: false,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBeNull();
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'inicio',
        reproduciendo: false,
        animando: false,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('anterior_final');
  });

  it('hacia arriba en final rebobina hasta el inicio del mismo hero', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'final',
        reproduciendo: false,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('rebobinar');
  });

  it('hacia arriba en otro punto pasado el reposo vuelve al reposo del hero actual', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'otro',
        pasadoReposo: true,
        reproduciendo: false,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('reposar');
  });

  it('hacia arriba en otro punto antes del reposo va al final del anterior o devuelve null en el primero', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'otro',
        pasadoReposo: false,
        reproduciendo: false,
        animando: false,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('anterior_final');
    expect(
      accionPorGesto({
        direccion: -1,
        punto: 'otro',
        pasadoReposo: false,
        reproduciendo: false,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBeNull();
  });

  it('devuelve null con dirección o índice inválido', () => {
    expect(
      accionPorGesto({
        direccion: 0,
        punto: 'inicio',
        reproduciendo: false,
        animando: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBeNull();
    expect(
      accionPorGesto({
        direccion: 1,
        punto: 'inicio',
        reproduciendo: false,
        animando: false,
        indiceHero: -1,
        totalHeros: 3,
      })
    ).toBeNull();
  });
});

describe('puedeDesplazarAncestro', () => {
  it('devuelve true si algún ancestro con overflow-y auto/scroll puede desplazarse en la dirección dada', () => {
    expect(
      puedeDesplazarAncestro(
        [
          { overflowY: 'visible', scrollTop: 0, scrollHeight: 500, clientHeight: 200 },
          { overflowY: 'auto', scrollTop: 0, scrollHeight: 400, clientHeight: 200 },
        ],
        1
      )
    ).toBe(true);

    expect(
      puedeDesplazarAncestro(
        [{ overflowY: 'scroll', scrollTop: 50, scrollHeight: 400, clientHeight: 200 }],
        -1
      )
    ).toBe(true);
  });

  it('devuelve false si el ancestro ya llegó al tope en esa dirección o no tiene desbordamiento', () => {
    expect(
      puedeDesplazarAncestro(
        [{ overflowY: 'auto', scrollTop: 200, scrollHeight: 400, clientHeight: 200 }],
        1
      )
    ).toBe(false);

    expect(
      puedeDesplazarAncestro(
        [{ overflowY: 'auto', scrollTop: 0, scrollHeight: 400, clientHeight: 200 }],
        -1
      )
    ).toBe(false);

    expect(
      puedeDesplazarAncestro(
        [{ overflowY: 'auto', scrollTop: 0, scrollHeight: 200, clientHeight: 200 }],
        1
      )
    ).toBe(false);

    expect(
      puedeDesplazarAncestro(
        [{ overflowY: 'hidden', scrollTop: 50, scrollHeight: 400, clientHeight: 200 }],
        1
      )
    ).toBe(false);

    expect(puedeDesplazarAncestro([], 1)).toBe(false);
    expect(
      puedeDesplazarAncestro(
        [{ overflowY: 'auto', scrollTop: 50, scrollHeight: 400, clientHeight: 200 }],
        0
      )
    ).toBe(false);
  });
});

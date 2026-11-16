import { describe, it, expect } from 'vitest';
import {
  DURACION_FADE_CONTENIDO,
  REPOSO_HERO,
  TOLERANCIA_REPOSO,
  accionPorGesto,
  enReposoDeTramo,
  indiceHeroEnZona,
  reposoDeTramo,
  reposoMasCercano,
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

describe('reposoMasCercano', () => {
  it('elige el reposo más cercano por distancia y en el punto medio exacto pasa al siguiente', () => {
    const tramos = [
      { start: 0, end: 1000 },
      { start: 1000, end: 2000 },
    ];
    // Reposos en 150 y 1150; punto medio exacto = 650.
    expect(reposoMasCercano(649, tramos)).toEqual({ indice: 0, y: 150 });
    expect(reposoMasCercano(650, tramos)).toEqual({ indice: 1, y: 1150 });
    expect(reposoMasCercano(651, tramos)).toEqual({ indice: 1, y: 1150 });
  });

  it('asigna el hueco después de st.end al hero siguiente aunque el reposo previo quede más cerca', () => {
    const tramos = [
      { start: 0, end: 200 },
      { start: 1000, end: 1200 },
    ];
    // Reposos en 30 y 1030. En y = 250 (hueco > 200 y < 1000) pertenece al hero 1.
    expect(reposoMasCercano(250, tramos)).toEqual({ indice: 1, y: 1030 });
  });

  it('devuelve null con entradas inválidas', () => {
    expect(reposoMasCercano(NaN, [{ start: 0, end: 1000 }])).toBeNull();
    expect(reposoMasCercano(100, [])).toBeNull();
  });
});

describe('accionPorGesto', () => {
  it('hacia abajo en reposo o sin reproducir inicia reproducción', () => {
    expect(
      accionPorGesto({
        direccion: 1,
        enReposo: true,
        reproduciendo: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('reproducir');
    expect(
      accionPorGesto({
        direccion: 1,
        enReposo: false,
        reproduciendo: false,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('reproducir');
  });

  it('hacia abajo mientras reproduce se ignora sin cancelar', () => {
    expect(
      accionPorGesto({
        direccion: 1,
        enReposo: false,
        reproduciendo: true,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('ignorar');
  });

  it('hacia arriba mientras reproduce cancela y vuelve al reposo', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        enReposo: false,
        reproduciendo: true,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('cancelar_y_reposar');
  });

  it('hacia arriba en reposo va al anterior si no es el primero, y devuelve null en el primero', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        enReposo: true,
        reproduciendo: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBeNull();
    expect(
      accionPorGesto({
        direccion: -1,
        enReposo: true,
        reproduciendo: false,
        indiceHero: 1,
        totalHeros: 3,
      })
    ).toBe('anterior');
  });

  it('hacia arriba pasado el reposo y sin reproducir vuelve al reposo del hero actual', () => {
    expect(
      accionPorGesto({
        direccion: -1,
        enReposo: false,
        pasadoReposo: true,
        reproduciendo: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBe('reposar');
  });

  it('devuelve null con dirección o índice inválido', () => {
    expect(
      accionPorGesto({
        direccion: 0,
        enReposo: true,
        reproduciendo: false,
        indiceHero: 0,
        totalHeros: 3,
      })
    ).toBeNull();
    expect(
      accionPorGesto({
        direccion: 1,
        enReposo: true,
        reproduciendo: false,
        indiceHero: -1,
        totalHeros: 3,
      })
    ).toBeNull();
  });
});

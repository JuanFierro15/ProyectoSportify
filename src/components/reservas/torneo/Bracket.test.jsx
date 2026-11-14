import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { gsap } from 'gsap';
import { programarTorneo } from '../../../lib/torneo';
import Bracket from './Bracket';

const CANCHAS = [
  { id: 'futbol-1', nombre: 'Cancha Fútbol 1', deporte: 'futbol' },
  { id: 'futbol-2', nombre: 'Cancha Fútbol 2', deporte: 'futbol' },
];

const PARTIDOS_4_EQUIPOS = programarTorneo({
  orden: [1, 2, 3, 4],
  canchaIds: ['futbol-1', 'futbol-2'],
  horaInicio: '14:00',
  minutosTurno: 30,
});

const PARTIDOS_8_EQUIPOS = programarTorneo({
  orden: [1, 2, 3, 4, 5, 6, 7, 8],
  canchaIds: ['futbol-1', 'futbol-2'],
  horaInicio: '14:00',
  minutosTurno: 30,
});

function simularMatchMedia(queryActiva) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === queryActiva,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

function espiarMatchMediaGsap() {
  const matchMediaReal = gsap.matchMedia;
  const instancias = [];
  const spyMatchMedia = vi
    .spyOn(gsap, 'matchMedia')
    .mockImplementation((scope) => {
      const mm = matchMediaReal.call(gsap, scope);
      const spyRevert = vi.spyOn(mm, 'revert');
      instancias.push({ mm, spyRevert });
      return mm;
    });
  return { spyMatchMedia, instancias };
}

describe('Bracket - limpieza de GSAP', () => {
  let matchMediaOriginal;

  beforeEach(() => {
    matchMediaOriginal = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
    vi.restoreAllMocks();
  });

  it('al montar con prefers-reduced-motion: no-preference anima .bracket-torneo__partido con gsap.from', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const { spyMatchMedia } = espiarMatchMediaGsap();
    const spyFrom = vi.spyOn(gsap, 'from');

    render(<Bracket partidos={PARTIDOS_4_EQUIPOS} canchas={CANCHAS} />);

    expect(spyMatchMedia).toHaveBeenCalledTimes(1);
    expect(spyFrom).toHaveBeenCalledTimes(1);
    expect(spyFrom).toHaveBeenCalledWith(
      '.bracket-torneo__partido',
      expect.any(Object)
    );
  });

  it('al cambiar partidos.length con rerender revierte la instancia anterior de matchMedia y crea una nueva', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const { spyMatchMedia, instancias } = espiarMatchMediaGsap();
    const spyFrom = vi.spyOn(gsap, 'from');

    const { rerender } = render(
      <Bracket partidos={PARTIDOS_4_EQUIPOS} canchas={CANCHAS} />
    );

    expect(instancias).toHaveLength(1);
    expect(instancias[0].spyRevert).not.toHaveBeenCalled();

    rerender(<Bracket partidos={PARTIDOS_8_EQUIPOS} canchas={CANCHAS} />);

    expect(spyMatchMedia).toHaveBeenCalledTimes(2);
    expect(instancias).toHaveLength(2);
    expect(instancias[0].spyRevert).toHaveBeenCalledTimes(1);
    expect(instancias[1].spyRevert).not.toHaveBeenCalled();
    expect(spyFrom).toHaveBeenCalledTimes(2);
    expect(spyFrom).toHaveBeenLastCalledWith(
      '.bracket-torneo__partido',
      expect.any(Object)
    );
  });

  it('al desmontar revierte la última instancia de matchMedia', () => {
    simularMatchMedia('(prefers-reduced-motion: no-preference)');
    const { instancias } = espiarMatchMediaGsap();

    const { unmount } = render(
      <Bracket partidos={PARTIDOS_4_EQUIPOS} canchas={CANCHAS} />
    );

    expect(instancias).toHaveLength(1);
    expect(instancias[0].spyRevert).not.toHaveBeenCalled();

    unmount();

    expect(instancias[0].spyRevert).toHaveBeenCalledTimes(1);
  });

  it('con prefers-reduced-motion: reduce no llama a gsap.from', () => {
    simularMatchMedia('(prefers-reduced-motion: reduce)');
    const { spyMatchMedia } = espiarMatchMediaGsap();
    const spyFrom = vi.spyOn(gsap, 'from');

    render(<Bracket partidos={PARTIDOS_4_EQUIPOS} canchas={CANCHAS} />);

    expect(spyMatchMedia).toHaveBeenCalledTimes(1);
    expect(spyFrom).not.toHaveBeenCalled();
  });
});

import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CalendarioTorneo from './CalendarioTorneo';

const DIAS = ['2026-11-13', '2026-11-14', '2026-11-15'];
const HORAS_BASE = ['10:00', '11:00', '12:00', '13:00', '14:00'];
const CANCHAS = [
  { id: 'futbol-1', nombre: 'Cancha Fútbol 1', deporte: 'futbol' },
  { id: 'futbol-2', nombre: 'Cancha Fútbol 2', deporte: 'futbol' },
];

const FASES_BASE = [
  {
    ronda: 1,
    nombreRonda: 'Cuartos de final',
    partidos: 4,
    canchasEfectivas: 2,
    canchaIds: ['futbol-1', 'futbol-2'],
    minutosRequeridos: 60,
    horasMinimas: 1,
  },
  {
    ronda: 2,
    nombreRonda: 'Semifinal',
    partidos: 2,
    canchasEfectivas: 2,
    canchaIds: ['futbol-1', 'futbol-2'],
    minutosRequeridos: 60,
    horasMinimas: 1,
  },
  {
    ronda: 3,
    nombreRonda: 'Final',
    partidos: 1,
    canchasEfectivas: 1,
    canchaIds: ['futbol-1'],
    minutosRequeridos: 60,
    horasMinimas: 1,
  },
];

function jornadasVacias(fases = FASES_BASE) {
  return Object.fromEntries(
    fases.map((f) => [f.ronda, { fecha: DIAS[0], horas: [] }])
  );
}

function renderCalendario(props = {}) {
  return render(
    <CalendarioTorneo
      fases={FASES_BASE}
      jornadas={jornadasVacias()}
      validacionesJornadas={[]}
      dias={DIAS}
      horasBase={HORAS_BASE}
      canchas={CANCHAS}
      canchaIds={['futbol-1', 'futbol-2']}
      duracionPartido={20}
      esLibreFase={() => true}
      {...props}
    />
  );
}

describe('CalendarioTorneo - pestañas por fase', () => {
  it('renderiza una pestaña por fase dentro del tablist y solo muestra el panel activo', () => {
    renderCalendario();

    const tablist = screen.getByRole('tablist', { name: 'Fases del torneo' });
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('Cuartos de final');
    expect(tabs[1]).toHaveTextContent('Semifinal');
    expect(tabs[2]).toHaveTextContent('Final');

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');

    const panel1 = screen.getByLabelText('Fase 1: Cuartos de final');
    const panel2 = screen.getByLabelText('Fase 2: Semifinal');
    const panel3 = screen.getByLabelText('Fase 3: Final');

    expect(panel1).not.toHaveAttribute('hidden');
    expect(panel2).toHaveAttribute('hidden');
    expect(panel3).toHaveAttribute('hidden');
  });

  it('al hacer clic en otra pestaña la activa y oculta las demás', () => {
    renderCalendario();

    const tabCuartos = screen.getByRole('tab', { name: /Cuartos de final/i });
    const tabSemi = screen.getByRole('tab', { name: /Semifinal/i });
    const tabFinal = screen.getByRole('tab', { name: /^Final\b/i });

    fireEvent.click(tabSemi);

    expect(tabSemi).toHaveAttribute('aria-selected', 'true');
    expect(tabSemi).toHaveAttribute('tabindex', '0');
    expect(tabCuartos).toHaveAttribute('aria-selected', 'false');
    expect(tabCuartos).toHaveAttribute('tabindex', '-1');
    expect(tabFinal).toHaveAttribute('aria-selected', 'false');

    expect(screen.getByLabelText('Fase 1: Cuartos de final')).toHaveAttribute('hidden');
    expect(screen.getByLabelText('Fase 2: Semifinal')).not.toHaveAttribute('hidden');
    expect(screen.getByLabelText('Fase 3: Final')).toHaveAttribute('hidden');
  });

  it('navega con ArrowRight, ArrowLeft circulares, Home y End moviendo el foco', () => {
    renderCalendario();

    const tabCuartos = screen.getByRole('tab', { name: /Cuartos de final/i });
    const tabSemi = screen.getByRole('tab', { name: /Semifinal/i });
    const tabFinal = screen.getByRole('tab', { name: /^Final\b/i });

    tabCuartos.focus();
    fireEvent.keyDown(tabCuartos, { key: 'ArrowRight' });
    expect(tabSemi).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabSemi);

    fireEvent.keyDown(tabSemi, { key: 'ArrowRight' });
    expect(tabFinal).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabFinal);

    // Circular hacia adelante: Final -> Cuartos
    fireEvent.keyDown(tabFinal, { key: 'ArrowRight' });
    expect(tabCuartos).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabCuartos);

    // Circular hacia atrás: Cuartos -> Final
    fireEvent.keyDown(tabCuartos, { key: 'ArrowLeft' });
    expect(tabFinal).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabFinal);

    // Home -> primera pestaña
    fireEvent.keyDown(tabFinal, { key: 'Home' });
    expect(tabCuartos).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabCuartos);

    // End -> última pestaña
    fireEvent.keyDown(tabCuartos, { key: 'End' });
    expect(tabFinal).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabFinal);
  });

  it('muestra en cada pestaña el rango horario o "Sin horario" y la selección sigue visible al volver', () => {
    function CalendarioConEstado() {
      const [jornadas, setJornadas] = useState(() => jornadasVacias());

      const manejarCambiarFecha = (ronda, iso) => {
        setJornadas((prev) => ({
          ...prev,
          [ronda]: { ...prev[ronda], fecha: iso },
        }));
      };

      const manejarElegirHora = (ronda, hora) => {
        setJornadas((prev) => {
          const actual = prev[ronda]?.horas || [];
          const existe = actual.includes(hora);
          const nuevas = existe
            ? actual.filter((h) => h !== hora)
            : [...actual, hora].sort();
          return {
            ...prev,
            [ronda]: { ...prev[ronda], horas: nuevas },
          };
        });
      };

      return (
        <CalendarioTorneo
          fases={FASES_BASE}
          jornadas={jornadas}
          validacionesJornadas={[]}
          dias={DIAS}
          horasBase={HORAS_BASE}
          canchas={CANCHAS}
          canchaIds={['futbol-1', 'futbol-2']}
          duracionPartido={20}
          esLibreFase={() => true}
          onCambiarFechaFase={manejarCambiarFecha}
          onElegirHoraFase={manejarElegirHora}
        />
      );
    }

    render(<CalendarioConEstado />);

    const tabCuartos = screen.getByRole('tab', { name: /Cuartos de final/i });
    const tabSemi = screen.getByRole('tab', { name: /Semifinal/i });

    expect(tabCuartos).toHaveTextContent('Sin horario');
    expect(tabSemi).toHaveTextContent('Sin horario');

    const panelCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const botonesDia = within(panelCuartos).getAllByRole('button').slice(0, DIAS.length);
    fireEvent.click(botonesDia[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Cuartos de final 11:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cuartos de final 12:00' }));

    expect(tabCuartos).toHaveTextContent('Mañana · 11:00 a 13:00');
    expect(tabSemi).toHaveTextContent('Sin horario');

    // Cambiar a Semifinal y volver a Cuartos
    fireEvent.click(tabSemi);
    expect(screen.getByLabelText('Fase 2: Semifinal')).not.toHaveAttribute('hidden');
    expect(tabCuartos).toHaveTextContent('Mañana · 11:00 a 13:00');

    fireEvent.click(tabCuartos);
    expect(screen.getByRole('button', { name: 'Cuartos de final 11:00' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Cuartos de final 12:00' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('muestra aviso visible en la pestaña cuando una fase tiene ordenValido: false o alcanza: false con horas elegidas', () => {
    const jornadas = {
      ...jornadasVacias(),
      2: { fecha: DIAS[0], horas: ['10:00'] },
      3: { fecha: DIAS[0], horas: ['12:00'] },
    };

    renderCalendario({
      jornadas,
      validacionesJornadas: [
        { ronda: 1, ordenValido: true, alcanza: true },
        {
          ronda: 2,
          ordenValido: false,
          alcanza: true,
          error: 'Semifinal debe jugarse después de Cuartos de final.',
        },
        {
          ronda: 3,
          ordenValido: true,
          alcanza: false,
          disponibles: 60,
          deficit: 30,
        },
      ],
    });

    const tabCuartos = screen.getByRole('tab', { name: /Cuartos de final/i });
    const tabSemi = screen.getByRole('tab', { name: /Semifinal/i });
    const tabFinal = screen.getByRole('tab', { name: /^Final\b/i });

    expect(tabCuartos).not.toHaveTextContent('Revisa el horario');
    expect(tabCuartos).not.toHaveClass('calendario-torneo__pestana--alerta');

    expect(tabSemi).toHaveTextContent('Revisa el horario');
    expect(within(tabSemi).getByText('Revisa el horario')).not.toHaveClass('show-for-sr');
    expect(tabSemi).toHaveClass('calendario-torneo__pestana--alerta');

    expect(tabFinal).toHaveTextContent('Revisa el horario');
    expect(within(tabFinal).getByText('Revisa el horario')).not.toHaveClass('show-for-sr');
    expect(tabFinal).toHaveClass('calendario-torneo__pestana--alerta');
  });

  it('no muestra aviso en la pestaña si la fase aún no tiene horas elegidas aunque alcanza sea false', () => {
    renderCalendario({
      jornadas: jornadasVacias(),
      validacionesJornadas: [
        { ronda: 1, ordenValido: true, alcanza: false, disponibles: 0, deficit: 60 },
        { ronda: 2, ordenValido: true, alcanza: false, disponibles: 0, deficit: 60 },
        { ronda: 3, ordenValido: true, alcanza: false, disponibles: 0, deficit: 60 },
      ],
    });

    const tabCuartos = screen.getByRole('tab', { name: /Cuartos de final/i });
    const tabSemi = screen.getByRole('tab', { name: /Semifinal/i });
    const tabFinal = screen.getByRole('tab', { name: /^Final\b/i });

    expect(tabCuartos).not.toHaveTextContent('Revisa el horario');
    expect(tabCuartos).not.toHaveClass('calendario-torneo__pestana--alerta');
    expect(tabSemi).not.toHaveTextContent('Revisa el horario');
    expect(tabSemi).not.toHaveClass('calendario-torneo__pestana--alerta');
    expect(tabFinal).not.toHaveTextContent('Revisa el horario');
    expect(tabFinal).not.toHaveClass('calendario-torneo__pestana--alerta');
  });

  it('vuelve a la primera fase si la activa desaparece al reducir las fases y la mantiene al volver a 3 fases', () => {
    const { rerender } = renderCalendario();

    const tabFinal = screen.getByRole('tab', { name: /^Final\b/i });
    fireEvent.click(tabFinal);
    expect(tabFinal).toHaveAttribute('aria-selected', 'true');

    // Reducimos fases quitando la ronda 3 (por ejemplo de 8 a 4 equipos con rondas 1 y 2)
    const fasesReducidas = [
      { ...FASES_BASE[1], ronda: 1, nombreRonda: 'Semifinal' },
      { ...FASES_BASE[2], ronda: 2, nombreRonda: 'Final' },
    ];

    rerender(
      <CalendarioTorneo
        fases={fasesReducidas}
        jornadas={jornadasVacias(fasesReducidas)}
        validacionesJornadas={[]}
        dias={DIAS}
        horasBase={HORAS_BASE}
        canchas={CANCHAS}
        canchaIds={['futbol-1', 'futbol-2']}
        duracionPartido={20}
        esLibreFase={() => true}
      />
    );

    const tabsReducidas = screen.getAllByRole('tab');
    expect(tabsReducidas).toHaveLength(2);
    expect(tabsReducidas[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabsReducidas[0]).toHaveTextContent('Semifinal');
    expect(screen.getByLabelText('Fase 1: Semifinal')).not.toHaveAttribute('hidden');

    // Al volver a las 3 fases, la activa sigue siendo la primera (el useEffect actualizó faseActiva)
    rerender(
      <CalendarioTorneo
        fases={FASES_BASE}
        jornadas={jornadasVacias(FASES_BASE)}
        validacionesJornadas={[]}
        dias={DIAS}
        horasBase={HORAS_BASE}
        canchas={CANCHAS}
        canchaIds={['futbol-1', 'futbol-2']}
        duracionPartido={20}
        esLibreFase={() => true}
      />
    );

    const tabsRestauradas = screen.getAllByRole('tab');
    expect(tabsRestauradas).toHaveLength(3);
    expect(tabsRestauradas[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabsRestauradas[2]).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByLabelText('Fase 1: Cuartos de final')).not.toHaveAttribute('hidden');
  });

  it('el botón "Siguiente fase" activa la siguiente pestaña con foco y no aparece en la última fase', () => {
    renderCalendario();

    const panelCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const btnSiguiente1 = within(panelCuartos).getByRole('button', {
      name: 'Siguiente fase: Semifinal',
    });
    fireEvent.click(btnSiguiente1);

    const tabSemi = screen.getByRole('tab', { name: /Semifinal/i });
    expect(tabSemi).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabSemi);

    const panelSemi = screen.getByLabelText('Fase 2: Semifinal');
    const btnSiguiente2 = within(panelSemi).getByRole('button', {
      name: 'Siguiente fase: Final',
    });
    fireEvent.click(btnSiguiente2);

    const tabFinal = screen.getByRole('tab', { name: /^Final\b/i });
    expect(tabFinal).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabFinal);

    const panelFinal = screen.getByLabelText('Fase 3: Final');
    expect(
      within(panelFinal).queryByRole('button', { name: /Siguiente fase:/i })
    ).not.toBeInTheDocument();
  });
});

import React, { useEffect, useRef, useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReservasProvider, useReservas } from '../../context/ReservasContext';
import useReserva from './useReserva';
import FormularioReserva from './FormularioReserva';

function TestHarness({
  modo = 'torneo',
  seccion,
  canchasIniciales = [],
  horasIniciales = [],
  guardarTorneoPrevio = false,
}) {
  const { dias, canchas, reservarEvento } = useReservas();
  const canchaInicial = modo === 'cancha' ? canchas[0] : null;
  const reserva = useReserva({
    activo: true,
    modoInicial: modo,
    canchaInicial,
  });

  const inicializadoRef = useRef(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!inicializadoRef.current) {
      inicializadoRef.current = true;
      if (guardarTorneoPrevio) {
        reservarEvento({
          tipo: 'evento',
          subtipo: 'torneo',
          nombre: 'Torneo Previo',
          telefono: '3001234567',
          canchaIds: ['futbol-1'],
          fecha: dias[1],
          horas: ['14:00'],
          bloques: [
            { fecha: dias[1], canchaIds: ['futbol-1'], horas: ['14:00'] },
          ],
          torneo: {
            equipos: 4,
            partidos: [
              { id: 1, ronda: 1, eq1: 1, eq2: 4 },
              { id: 2, ronda: 1, eq1: 2, eq2: 3 },
              { id: 3, ronda: 2, eq1: 'G1', eq2: 'G2' },
            ],
            jornadas: [
              {
                ronda: 1,
                nombreRonda: 'Semifinal',
                fecha: dias[1],
                horas: ['14:00'],
                canchasEfectivas: 1,
              },
            ],
          },
        });
      }
      if (canchasIniciales.length > 0) {
        canchasIniciales.forEach((id) => reserva.alternarCancha(id));
      }
      setListo(true);
    }
  }, [canchasIniciales, dias, guardarTorneoPrevio, reserva, reservarEvento]);

  useEffect(() => {
    if (reserva.canchaIds.length >= canchasIniciales.length && horasIniciales.length > 0 && reserva.horasSel.length === 0) {
      horasIniciales.forEach((h) => reserva.elegirHora(h));
    }
  }, [canchasIniciales.length, horasIniciales, reserva]);

  if (!listo) {
    return null;
  }

  return <FormularioReserva reserva={reserva} dias={dias} seccion={seccion} />;
}

describe('FormularioReserva - Prop seccion y renderizado público', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T07:00:00'));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sin sección en modo torneo: muestra todos los bloques en el orden correcto', () => {
    render(
      <ReservasProvider>
        <TestHarness
          modo="torneo"
          canchasIniciales={['futbol-1', 'futbol-2']}
          guardarTorneoPrevio={true}
        />
      </ReservasProvider>
    );

    const bloqueFormato = screen.getByText('Formato del torneo');
    const bloqueEquipos = screen.getByText(/Cantidad de equipos/i);
    const bloqueDuracion = screen.getByText(/Duración por partido/i);
    const bloqueDesempate = screen.getByText(/^Desempate\b/i);
    const bloqueEmparejamiento = screen.getByText(/Emparejamiento de 1\.ª ronda/i);
    const bloqueCapacidad = screen.getByText(/Capacidad y tiempo estimado/i);
    const bloqueFases = screen.getByText(/Programación por fases/i);
    const bloqueGuardados = screen.getByText(/Torneos reservados/i);
    const bloqueDatos = screen.getByText('Tus datos');

    const lista = [
      bloqueFormato,
      bloqueEquipos,
      bloqueDuracion,
      bloqueDesempate,
      bloqueEmparejamiento,
      bloqueCapacidad,
      bloqueFases,
      bloqueGuardados,
      bloqueDatos,
    ];

    for (let i = 0; i < lista.length - 1; i++) {
      const posicion = lista[i].compareDocumentPosition(lista[i + 1]);
      expect(posicion & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('sin sección en modo cancha y en cumpleaños: muestra Día, Horario y Tus datos (e Invitados en cumpleaños)', () => {
    const { unmount } = render(
      <ReservasProvider>
        <TestHarness modo="cancha" />
      </ReservasProvider>
    );

    expect(screen.getByText('Día')).toBeInTheDocument();
    expect(screen.getByText('Horario')).toBeInTheDocument();
    expect(screen.getByText('Tus datos')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Invitados/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Formato del torneo')).not.toBeInTheDocument();

    unmount();

    render(
      <ReservasProvider>
        <TestHarness modo="cumpleanos" />
      </ReservasProvider>
    );

    expect(screen.getByText('Día')).toBeInTheDocument();
    expect(screen.getByText('Horario')).toBeInTheDocument();
    expect(screen.getByText('Tus datos')).toBeInTheDocument();
    expect(screen.getByLabelText(/Invitados/i)).toBeInTheDocument();
    expect(screen.queryByText('Formato del torneo')).not.toBeInTheDocument();
  });

  it('seccion="formato": solo equipos, duración con su nota y desempate', () => {
    render(
      <ReservasProvider>
        <TestHarness
          modo="torneo"
          seccion="formato"
          canchasIniciales={['futbol-1', 'futbol-2']}
          guardarTorneoPrevio={true}
        />
      </ReservasProvider>
    );

    expect(screen.getByText(/Cantidad de equipos/i)).toBeInTheDocument();
    expect(screen.getByText(/Duración por partido/i)).toBeInTheDocument();
    expect(screen.getByText(/min por turno/i)).toBeInTheDocument();
    expect(screen.getByText(/^Desempate\b/i)).toBeInTheDocument();

    expect(screen.queryByText(/Emparejamiento de 1\.ª ronda/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Capacidad y tiempo estimado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Programación por fases/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Torneos reservados/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Tus datos')).not.toBeInTheDocument();
  });

  it('seccion="fechas": solo calendario por fases, Capacidad y tiempo estimado y AlertaTiempo cuando la franja no alcanza', () => {
    render(
      <ReservasProvider>
        <TestHarness
          modo="torneo"
          seccion="fechas"
          canchasIniciales={['futbol-1', 'futbol-2']}
          horasIniciales={['08:00']}
          guardarTorneoPrevio={true}
        />
      </ReservasProvider>
    );

    expect(screen.getByText(/Programación por fases/i)).toBeInTheDocument();
    expect(screen.getByText(/Capacidad y tiempo estimado/i)).toBeInTheDocument();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/faltan \d+ min/i).length).toBeGreaterThan(0);

    expect(screen.queryByText(/Cantidad de equipos/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Duración por partido' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Desempate\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Emparejamiento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Torneos reservados/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Tus datos')).not.toBeInTheDocument();
  });

  it('seccion="llaves": solo emparejamiento (Aleatorio/Manual, Volver a sortear llaves, AsignacionManual)', () => {
    render(
      <ReservasProvider>
        <TestHarness
          modo="torneo"
          seccion="llaves"
          canchasIniciales={['futbol-1', 'futbol-2']}
          guardarTorneoPrevio={true}
        />
      </ReservasProvider>
    );

    expect(screen.getByRole('group', { name: 'Emparejamiento' })).toBeInTheDocument();
    expect(screen.getByText('Emparejamiento de 1.ª ronda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aleatorio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manual' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver a sortear llaves/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Manual' }));
    expect(screen.getByText(/Si eliges un equipo que ya está en otra llave/i)).toBeInTheDocument();

    expect(screen.queryByText(/Cantidad de equipos/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Duración por partido' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Desempate\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Capacidad y tiempo estimado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Programación por fases/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Torneos reservados/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Tus datos')).not.toBeInTheDocument();
  });

  it('seccion="datos": solo Tus datos (nombre y teléfono)', () => {
    render(
      <ReservasProvider>
        <TestHarness
          modo="torneo"
          seccion="datos"
          canchasIniciales={['futbol-1', 'futbol-2']}
          guardarTorneoPrevio={true}
        />
      </ReservasProvider>
    );

    expect(screen.getByText('Tus datos')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();

    expect(screen.queryByText('Formato del torneo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Cantidad de equipos/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Duración por partido' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Desempate\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Emparejamiento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Capacidad y tiempo estimado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Programación por fases/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Torneos reservados/i)).not.toBeInTheDocument();
  });

  it('seccion="guardados": solo Torneos reservados si hay torneos; si no hay, no renderiza ningún bloque', () => {
    const { unmount } = render(
      <ReservasProvider>
        <TestHarness
          modo="torneo"
          seccion="guardados"
          canchasIniciales={['futbol-1', 'futbol-2']}
          guardarTorneoPrevio={true}
        />
      </ReservasProvider>
    );

    expect(screen.getByText(/Torneos reservados/i)).toBeInTheDocument();
    expect(screen.queryByText('Formato del torneo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Emparejamiento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Programación por fases/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Tus datos')).not.toBeInTheDocument();

    unmount();
    window.localStorage.clear();

    const { container } = render(
      <ReservasProvider>
        <TestHarness
          modo="torneo"
          seccion="guardados"
          canchasIniciales={['futbol-1', 'futbol-2']}
          guardarTorneoPrevio={false}
        />
      </ReservasProvider>
    );

    expect(screen.queryByText(/Torneos reservados/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Formato del torneo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Emparejamiento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Programación por fases/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Tus datos')).not.toBeInTheDocument();
    expect(container.querySelector('fieldset')).toBeNull();
    expect(container.querySelector('details')).toBeNull();
  });
});

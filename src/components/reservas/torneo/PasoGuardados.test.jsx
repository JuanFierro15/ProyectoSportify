import React, { useEffect, useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReservasProvider, useReservas } from '../../../context/ReservasContext';
import { armarTorneo } from '../../../lib/torneo';
import { fechaCompleta } from '../../../lib/fechas';
import PasoGuardados from './PasoGuardados';

function GuardarYMostrarTorneo({ incluirJornadasEnTorneo = true }) {
  const { dias, canchas, reservarEvento, reservas } = useReservas();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (listo) return;
    const f1 = dias[1];
    const f2 = dias[2];
    const jornadas = {
      1: { fecha: f1, horas: ['14:00', '15:00'] },
      2: { fecha: f2, horas: ['16:00', '17:00'] },
    };
    const datosTorneo = armarTorneo({
      deporte: 'futbol',
      equipos: 4,
      duracionPartido: 20,
      emparejamiento: 'aleatorio',
      orden: [1, 2, 3, 4],
      canchaIds: ['futbol-1', 'futbol-2'],
      jornadas: incluirJornadasEnTorneo ? jornadas : null,
    });

    reservarEvento({
      subtipo: 'torneo',
      fecha: f1,
      canchaIds: ['futbol-1', 'futbol-2'],
      horas: ['14:00', '15:00'],
      bloques: [
        {
          ronda: 1,
          nombreRonda: 'Semifinal',
          fecha: f1,
          canchaIds: ['futbol-1', 'futbol-2'],
          horas: ['14:00', '15:00'],
        },
        {
          ronda: 2,
          nombreRonda: 'Final',
          fecha: f2,
          canchaIds: ['futbol-1'],
          horas: ['16:00', '17:00'],
        },
      ],
      equipos: 4,
      canchasNecesarias: 2,
      torneo: datosTorneo,
      nombre: 'Laura Gómez',
      telefono: '3001234567',
    });
    setListo(true);
  }, [dias, incluirJornadasEnTorneo, listo, reservarEvento]);

  const torneosGuardados = reservas.filter(
    (r) => r.tipo === 'evento' && r.subtipo === 'torneo' && r.torneo
  );

  return <PasoGuardados torneosGuardados={torneosGuardados} canchas={canchas} />;
}

describe('PasoGuardados', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('muestra fecha legible con fechaCompleta, hora de fin con finDeFranja y todas las fases de un torneo de 2 fases', () => {
    let diasCapturados = [];
    function CapturarDias() {
      const { dias } = useReservas();
      diasCapturados = dias;
      return null;
    }

    const { container } = render(
      <ReservasProvider>
        <CapturarDias />
        <GuardarYMostrarTorneo incluirJornadasEnTorneo={false} />
      </ReservasProvider>
    );

    const fechaFase1 = fechaCompleta(diasCapturados[1]);
    const fechaFase2 = fechaCompleta(diasCapturados[2]);

    expect(screen.getByText('Torneos reservados (1)')).toBeInTheDocument();

    const textoCompleto = container.textContent;
    expect(textoCompleto).toContain(fechaFase1);
    expect(textoCompleto).toContain(fechaFase2);
    expect(textoCompleto).not.toContain(diasCapturados[1]);
    expect(textoCompleto).not.toContain(diasCapturados[2]);

    expect(textoCompleto).toContain('14:00 a 16:00');
    expect(textoCompleto).toContain('16:00 a 18:00');
    expect(textoCompleto).not.toContain('14:00 a 15:00');
    expect(textoCompleto).not.toContain('16:00 a 17:00');

    expect(screen.getByText(/^Semifinal:$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Final:$/i)).toBeInTheDocument();
  });
});

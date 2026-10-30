import React, { useEffect, useRef } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ReservasProvider, useReservas } from '../../context/ReservasContext';
import useReserva from './useReserva';
import FormularioReserva from './FormularioReserva';
import VoucherReserva from './VoucherReserva';
import ConfirmacionReserva from './ConfirmacionReserva';
import { fechaCompleta } from '../../lib/fechas';

/**
 * Componente auxiliar para probar el flujo de integración de Torneo.
 * Conecta useReserva con FormularioReserva, VoucherReserva y ConfirmacionReserva.
 */
function FlujoTorneoPrueba({ canchasIniciales = [], diaInicialIndex = null }) {
  const { dias, canchas } = useReservas();
  const reserva = useReserva({
    activo: true,
    modoInicial: 'torneo',
  });

  const inicializadoRef = useRef(false);
  useEffect(() => {
    if (!inicializadoRef.current) {
      inicializadoRef.current = true;
      if (diaInicialIndex != null && dias[diaInicialIndex]) {
        reserva.cambiarFecha(dias[diaInicialIndex]);
      }
      if (canchasIniciales.length > 0) {
        canchasIniciales.forEach((id) => reserva.alternarCancha(id));
      }
    }
  }, [canchasIniciales, diaInicialIndex, dias, reserva]);

  return (
    <div data-testid="flujo-torneo">
      <div data-testid="canchas-selector">
        {canchas.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => reserva.alternarCancha(c.id)}
            aria-pressed={reserva.canchaIds.includes(c.id)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {reserva.confirmado ? (
        <ConfirmacionReserva
          codigo={reserva.confirmado.codigo}
          textoQr={reserva.confirmado.textoQr}
          resumen={reserva.confirmado.resumen}
          onListo={reserva.reiniciar}
        />
      ) : (
        <>
          <FormularioReserva reserva={reserva} dias={dias} />
          <VoucherReserva
            tipoEtiqueta={reserva.modoInfo.tipoEtiqueta}
            fechaTexto={fechaCompleta(reserva.fecha)}
            horas={reserva.horasSel}
            precio={reserva.precio}
            puedeConfirmar={reserva.puedeConfirmar}
            motivoBloqueo={reserva.motivoBloqueo}
            onConfirmar={reserva.confirmar}
            onCancelar={reserva.reiniciar}
            torneo={reserva.modo === 'torneo' ? reserva.torneoPlan : null}
          />
        </>
      )}
    </div>
  );
}

describe('Modo Torneo - Pruebas de integración', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    });
  });

  it('1. Configuración inicial y bracket (FR-002, FR-007, AC-007, FR-008)', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba />
      </ReservasProvider>
    );

    // Muestra las opciones de equipos
    const btn4 = screen.getByRole('button', { name: /4 equipos \(3 partidos\)/i });
    const btn8 = screen.getByRole('button', { name: /8 equipos \(7 partidos\)/i });
    const btn16 = screen.getByRole('button', { name: /16 equipos \(15 partidos\)/i });

    expect(btn4).toBeInTheDocument();
    expect(btn8).toBeInTheDocument();
    expect(btn16).toBeInTheDocument();

    // Muestra la regla de desempate del deporte (FR-008)
    expect(screen.getByText(/Desempate \(Penales\):/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Penales: 3 por equipo y, si sigue el empate, muerte súbita/i)
    ).toBeInTheDocument();

    // Al elegir 4 equipos (3 partidos), el bracket muestra Semifinal y Final con 3 partidos (R1-P1, R1-P2, R2-P1)
    fireEvent.click(btn4);

    expect(screen.getByRole('heading', { name: /^Semifinal$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Final$/i })).toBeInTheDocument();

    expect(screen.getByText('R1-P1')).toBeInTheDocument();
    expect(screen.getByText('R1-P2')).toBeInTheDocument();
    expect(screen.getByText('R2-P1')).toBeInTheDocument();

    const insignias = screen.getAllByText(/^R\d+-P\d+$/);
    expect(insignias).toHaveLength(3);
  });

  it('2. Alerta de insuficiencia de tiempo y bloqueo de reserva (AC-002, FR-006, DD-009)', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
          diaInicialIndex={1}
        />
      </ReservasProvider>
    );

    // Con 8 equipos, 3 canchas y partidos de 20 min, se selecciona una franja de solo 1 hora (60 min)
    const btnHora = screen.getByRole('button', { name: /^14:00/i });
    fireEvent.click(btnHora);

    // Aparece la alerta indicando que tomará ~120 min y que faltan 60 min
    const alerta = screen.getByRole('alert');
    expect(alerta).toBeInTheDocument();
    expect(alerta).toHaveTextContent('~120 min');
    expect(alerta).toHaveTextContent('faltan 60 min');

    // El botón Confirmar reserva permanece disabled
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeDisabled();
  });

  it('3. Emparejamiento manual y validación de equipos repetidos (AC-006, FR-004)', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
        />
      </ReservasProvider>
    );

    // Cambiar a emparejamiento Manual
    const btnManual = screen.getByRole('button', { name: /^Manual$/i });
    fireEvent.click(btnManual);

    // Aparecen los selectores de la primera ronda
    const selectorLocalR1P1 = screen.getByRole('combobox', {
      name: 'Llave R1-P1 equipo local',
    });
    const selectorVisitanteR1P1 = screen.getByRole('combobox', {
      name: 'Llave R1-P1 equipo visitante',
    });

    expect(selectorLocalR1P1).toBeInTheDocument();
    expect(selectorVisitanteR1P1).toBeInTheDocument();

    // Asignar el mismo equipo en dos posiciones (Equipo 1 contra Equipo 1)
    fireEvent.change(selectorLocalR1P1, { target: { value: '1' } });
    fireEvent.change(selectorVisitanteR1P1, { target: { value: '1' } });

    // Aparece el mensaje de error y el botón Confirmar reserva está disabled
    expect(
      screen.getByText('Hay equipos repetidos en los cruces.')
    ).toBeInTheDocument();

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeDisabled();
  });

  it('4. Confirmación exitosa en 3 canchas y persistencia tras recargar (AC-001, AC-008, FR-009)', () => {
    const { unmount } = render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
          diaInicialIndex={1}
        />
      </ReservasProvider>
    );

    // Seleccionar franja de 2 horas consecutivas (14:00 y 15:00 = 120 min)
    fireEvent.click(screen.getByRole('button', { name: /^14:00/i }));
    fireEvent.click(screen.getByRole('button', { name: /^15:00/i }));

    // Ingresar nombre válido
    const inputNombre = screen.getByLabelText(/Nombre/i);
    fireEvent.change(inputNombre, { target: { value: 'Juan Perez' } });

    // El botón Confirmar reserva se habilita
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeEnabled();

    // Confirmar la reserva
    fireEvent.click(btnConfirmar);

    // Se muestra en ConfirmacionReserva
    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
    expect(screen.getByText(/Código de reserva/i)).toBeInTheDocument();
    expect(
      screen.getByText(/8 equipos · Eliminación directa \(7 partidos\)/i)
    ).toBeInTheDocument();

    // Se guarda en localStorage con los 7 partidos programados
    const storageItem = window.localStorage.getItem('sportify_reservas_v2');
    expect(storageItem).toBeTruthy();
    const dataGuardada = JSON.parse(storageItem);
    const torneoGuardado = dataGuardada.reservas.find((r) => r.subtipo === 'torneo');
    expect(torneoGuardado).toBeDefined();
    expect(torneoGuardado.torneo.partidos).toHaveLength(7);

    // Simular recarga de página: desmontar y volver a montar ReservasProvider
    unmount();

    render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
        />
      </ReservasProvider>
    );

    // El torneo guardado aparece en Torneos reservados (1)
    const summary = screen.getByText('Torneos reservados (1)');
    expect(summary).toBeInTheDocument();

    // Verificar el mismo bracket dentro de la sección de torneos guardados
    const contenedorGuardado = summary.closest('details');
    expect(contenedorGuardado).toBeInTheDocument();
    const dentroTorneo = within(contenedorGuardado);

    expect(dentroTorneo.getByText('R1-P1')).toBeInTheDocument();
    expect(dentroTorneo.getByText('R1-P2')).toBeInTheDocument();
    expect(dentroTorneo.getByText('R1-P3')).toBeInTheDocument();
    expect(dentroTorneo.getByText('R1-P4')).toBeInTheDocument();
    expect(dentroTorneo.getByText('R2-P1')).toBeInTheDocument();
    expect(dentroTorneo.getByText('R2-P2')).toBeInTheDocument();
    expect(dentroTorneo.getByText('R3-P1')).toBeInTheDocument();
  });
});

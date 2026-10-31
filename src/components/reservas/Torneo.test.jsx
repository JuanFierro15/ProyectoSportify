import React, { useEffect, useRef } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ReservasProvider, useReservas } from '../../context/ReservasContext';
import useReserva from './useReserva';
import FormularioReserva from './FormularioReserva';
import VoucherReserva from './VoucherReserva';
import ConfirmacionReserva from './ConfirmacionReserva';
import { fechaCompleta } from '../../lib/fechas';

// En los tests de integración de torneos, las 3 canchas de fútbol se configuran
// a $90.000/h sin horas ocupadas por defecto para validar limpiamente los cobros
// por canchas efectivas (3 + 2 + 1 = 6 horas-cancha = $540.000) y la navegación multi-día.
vi.mock('../../data/canchas.json', async (importOriginal) => {
  const actual = await importOriginal();
  const base = actual.default || actual;
  const modificado = {
    ...base,
    canchas: base.canchas.map((c) =>
      c.deporte === 'futbol'
        ? {
            ...c,
            precioHora: 90000,
            ocupadosSemilla: [[], [], [], [], [], [], []],
          }
        : c
    ),
  };
  return {
    ...modificado,
    default: modificado,
  };
});

/**
 * Componente auxiliar para probar el flujo de integración de Torneo multi-día.
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

  it('1. Configuración inicial, fases con canchas efectivas y bracket (FR-002, FR-007, FR-008, AC-009)', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
        />
      </ReservasProvider>
    );

    // Muestra los botones de opciones de equipos (FR-002)
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

    // Tarjetas de fase en CalendarioTorneo (FR-007)
    expect(screen.getByLabelText('Fase 1: Cuartos de final')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase 2: Semifinal')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase 3: Final')).toBeInTheDocument();

    // Con 8 equipos y 3 canchas, Cuartos usa 3 canchas, Semifinal 2 canchas y Final 1 cancha (AC-009)
    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    expect(within(seccionCuartos).getByText(/3 canchas efectivas/i)).toBeInTheDocument();

    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    expect(within(seccionSemi).getByText(/2 canchas efectivas/i)).toBeInTheDocument();

    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    expect(within(seccionFinal).getByText(/1 cancha efectiva/i)).toBeInTheDocument();

    // Resumen en Capacidad y tiempo estimado con detalle de canchas por fase
    expect(screen.getByText(/Cuartos: 3 canchas/i)).toBeInTheDocument();
    expect(screen.getByText(/Semifinal: 2 canchas/i)).toBeInTheDocument();
    expect(screen.getByText(/Final: 1 cancha/i)).toBeInTheDocument();

    // Al cambiar a 4 equipos, las fases se adaptan a Semifinal y Final
    fireEvent.click(btn4);
    expect(screen.queryByLabelText('Fase 1: Cuartos de final')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Fase 1: Semifinal')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase 2: Final')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /^Semifinal$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Final$/i })).toBeInTheDocument();
    expect(screen.getByText('R1-P1')).toBeInTheDocument();
    expect(screen.getByText('R1-P2')).toBeInTheDocument();
    expect(screen.getByText('R2-P1')).toBeInTheDocument();
  });

  it('2. Alerta de insuficiencia de tiempo en una fase y bloqueo (AC-002, FR-006)', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
        />
      </ReservasProvider>
    );

    // Con 8 equipos y 3 canchas, Cuartos requiere 60 min con duración de 20 min.
    // Cambiamos a duración de 30 min por partido (minutosTurno = 30 + 5 + 5 = 40 min).
    // Cuartos tiene 4 partidos en 3 canchas -> ceil(4/3) = 2 turnos * 40 = 80 min.
    const btn30 = screen.getByRole('button', { name: '30 min' });
    fireEvent.click(btn30);

    // Seleccionamos día 2 (dias[1], "Mañana") para Cuartos de final
    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const btnDia1Cuartos = within(seccionCuartos).getAllByRole('button')[1];
    fireEvent.click(btnDia1Cuartos);

    // Seleccionamos solo 1 hora (14:00 = 60 min disponibles) en Cuartos de final
    const btnHoraCuartos = screen.getByRole('button', { name: 'Cuartos de final 14:00' });
    fireEvent.click(btnHoraCuartos);

    // Aparece la alerta de déficit indicando que faltan 20 min
    expect(screen.getAllByText(/faltan 20 min/i).length).toBeGreaterThanOrEqual(1);

    // El botón Confirmar reserva permanece disabled
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeDisabled();
  });

  it('3. Validación de orden cronológico entre fases (AC-010, AC-011, FR-011)', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
        />
      </ReservasProvider>
    );

    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    const seccionFinal = screen.getByLabelText('Fase 3: Final');

    // Programar Cuartos en el tercer día (dias[2])
    const btnDia2Cuartos = within(seccionCuartos).getAllByRole('button')[2];
    fireEvent.click(btnDia2Cuartos);

    // Los botones de días anteriores (dias[0] y dias[1]) en Semifinal y Final quedan disabled y muestran "bloqueado"
    const diasSemi = within(seccionSemi).getAllByRole('button').slice(0, 7);
    expect(diasSemi[0]).toBeDisabled();
    expect(diasSemi[0]).toHaveTextContent(/bloqueado/i);
    expect(diasSemi[1]).toBeDisabled();
    expect(diasSemi[1]).toHaveTextContent(/bloqueado/i);

    // La fecha seleccionada en Semifinal avanza en cascada a dias[2]
    expect(diasSemi[2]).not.toBeDisabled();
    expect(diasSemi[2]).toHaveAttribute('aria-pressed', 'true');

    // En Final también quedan bloqueados los días anteriores y avanza a dias[2]
    const diasFinal = within(seccionFinal).getAllByRole('button').slice(0, 7);
    expect(diasFinal[0]).toBeDisabled();
    expect(diasFinal[0]).toHaveTextContent(/bloqueado/i);
    expect(diasFinal[1]).toBeDisabled();
    expect(diasFinal[1]).toHaveTextContent(/bloqueado/i);
    expect(diasFinal[2]).not.toBeDisabled();
    expect(diasFinal[2]).toHaveAttribute('aria-pressed', 'true');

    // Cuartos de final selecciona 14:00 en dias[2]
    const btnHoraCuartos14 = screen.getByRole('button', { name: 'Cuartos de final 14:00' });
    fireEvent.click(btnHoraCuartos14);

    // En Semifinal (mismo día dias[2]), los botones de hora <= 14:00 están disabled
    const btnHoraSemi14 = screen.getByRole('button', { name: 'Semifinal 14:00' });
    expect(btnHoraSemi14).toBeDisabled();

    // Semifinal 15:00 está habilitado y permite programar la fase sin errores
    const btnHoraSemi15 = screen.getByRole('button', { name: 'Semifinal 15:00' });
    expect(btnHoraSemi15).not.toBeDisabled();
    fireEvent.click(btnHoraSemi15);
    expect(btnHoraSemi15).toHaveAttribute('aria-pressed', 'true');

    // Sin alertas de orden cronológico en Semifinal ni en el resto del formulario
    expect(
      screen.queryByText(/Semifinal debe jugarse después de que termine Cuartos de final/i)
    ).not.toBeInTheDocument();
    expect(within(seccionSemi).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('4. Emparejamiento manual y validación de equipos repetidos (AC-006, FR-004)', () => {
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
    const errores = screen.getAllByText('Hay equipos repetidos en los cruces.');
    expect(errores.length).toBeGreaterThanOrEqual(1);

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeDisabled();
  });

  it('5. Confirmación exitosa multi-día, cobro de canchas efectivas y persistencia (AC-001, AC-012, AC-013, AC-014)', () => {
    let diasCapturados = [];
    function CapturadorDias() {
      const { dias } = useReservas();
      diasCapturados = dias;
      return null;
    }

    const { unmount } = render(
      <ReservasProvider>
        <CapturadorDias />
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']}
        />
      </ReservasProvider>
    );

    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    const seccionFinal = screen.getByLabelText('Fase 3: Final');

    // 1. Cuartos en el día 2 (diasCapturados[1]) a las 14:00 (requiere 1 h con 3 canchas)
    const btnDia1Cuartos = within(seccionCuartos).getAllByRole('button')[1];
    fireEvent.click(btnDia1Cuartos);
    fireEvent.click(screen.getByRole('button', { name: 'Cuartos de final 14:00' }));

    // 2. Semifinal en el día 3 (diasCapturados[2]) a las 15:00 (requiere 1 h con 2 canchas)
    const btnDia2Semi = within(seccionSemi).getAllByRole('button')[2];
    fireEvent.click(btnDia2Semi);
    fireEvent.click(screen.getByRole('button', { name: 'Semifinal 15:00' }));

    // 3. Final en el día 4 (diasCapturados[3]) a las 16:00 (requiere 1 h con 1 cancha)
    const btnDia3Final = within(seccionFinal).getAllByRole('button')[3];
    fireEvent.click(btnDia3Final);
    fireEvent.click(screen.getByRole('button', { name: 'Final 16:00' }));

    // Verificación de cobro por canchas efectivas (AC-013):
    // Cuartos: 3 canchas × 1 h = 3 horas-cancha ($270.000)
    // Semifinal: 2 canchas × 1 h = 2 horas-cancha ($180.000)
    // Final: 1 cancha × 1 h = 1 hora-cancha ($90.000)
    // Total: 3 + 2 + 1 = 6 horas-cancha ($540.000)
    const valorTotal = document.querySelector('.voucher-reserva__valor-total');
    expect(valorTotal).toHaveTextContent('540.000');

    // El voucher muestra el desglose de fases programadas
    expect(screen.getByText(/Cuartos de final:.*14:00 a 15:00 \(3 canchas\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Semifinal:.*15:00 a 16:00 \(2 canchas\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Final:.*16:00 a 17:00 \(1 cancha\)/i)).toBeInTheDocument();

    // Ingresar nombre de contacto
    const inputNombre = screen.getByLabelText(/Nombre/i);
    fireEvent.change(inputNombre, { target: { value: 'Carlos Mendoza' } });

    // Confirmar la reserva (AC-001)
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeEnabled();
    fireEvent.click(btnConfirmar);

    // Pantalla de confirmación con el desglose de fases y bracket (AC-012)
    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
    expect(screen.getByText(/Código de reserva/i)).toBeInTheDocument();
    expect(
      screen.getByText(/8 equipos · Eliminación directa \(7 partidos\)/i)
    ).toBeInTheDocument();

    // En confirmación se listan las fases con fecha, horario y canchas efectivas
    expect(screen.getByText(/Programación por fases:/i)).toBeInTheDocument();

    // Persistencia en localStorage (AC-014)
    const storageItem = window.localStorage.getItem('sportify_reservas_v2');
    expect(storageItem).toBeTruthy();
    const dataGuardada = JSON.parse(storageItem);
    const torneoGuardado = dataGuardada.reservas.find((r) => r.subtipo === 'torneo');
    expect(torneoGuardado).toBeDefined();

    // Se guardaron 3 bloques en distintos días
    expect(torneoGuardado.bloques).toHaveLength(3);
    expect(torneoGuardado.bloques[0].fecha).toBe(diasCapturados[1]);
    expect(torneoGuardado.bloques[0].canchaIds).toEqual(['futbol-1', 'futbol-2', 'futbol-3']);
    expect(torneoGuardado.bloques[1].fecha).toBe(diasCapturados[2]);
    expect(torneoGuardado.bloques[1].canchaIds).toEqual(['futbol-1', 'futbol-2']);
    expect(torneoGuardado.bloques[2].fecha).toBe(diasCapturados[3]);
    expect(torneoGuardado.bloques[2].canchaIds).toEqual(['futbol-1']);

    // Ocupación atómica: solo bloquea las canchas efectivas en cada fecha/horario
    // Día 2 (diasCapturados[1]): 3 canchas ocupadas a las 14:00
    expect(dataGuardada.ocupados['futbol-1'][diasCapturados[1]]).toContain('14:00');
    expect(dataGuardada.ocupados['futbol-2'][diasCapturados[1]]).toContain('14:00');
    expect(dataGuardada.ocupados['futbol-3'][diasCapturados[1]]).toContain('14:00');

    // Día 3 (diasCapturados[2]): 2 canchas ocupadas a las 15:00 (futbol-1 y futbol-2, no futbol-3)
    expect(dataGuardada.ocupados['futbol-1'][diasCapturados[2]]).toContain('15:00');
    expect(dataGuardada.ocupados['futbol-2'][diasCapturados[2]]).toContain('15:00');
    expect(dataGuardada.ocupados['futbol-3'][diasCapturados[2]]).not.toContain('15:00');

    // Día 4 (diasCapturados[3]): 1 cancha ocupada a las 16:00 (futbol-1, no futbol-2 ni futbol-3)
    expect(dataGuardada.ocupados['futbol-1'][diasCapturados[3]]).toContain('16:00');
    expect(dataGuardada.ocupados['futbol-2'][diasCapturados[3]]).not.toContain('16:00');
    expect(dataGuardada.ocupados['futbol-3'][diasCapturados[3]]).not.toContain('16:00');

    // Simular recarga de página: desmontar y volver a montar
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

    // Verificar que el bracket y los partidos se restauraron
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

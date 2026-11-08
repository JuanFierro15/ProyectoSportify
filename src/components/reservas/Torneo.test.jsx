import React, { useEffect, useRef } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, renderHook, act } from '@testing-library/react';
import { ReservasProvider, useReservas } from '../../context/ReservasContext';
import useReserva from './useReserva';
import FormularioReserva from './FormularioReserva';
import VoucherReserva from './VoucherReserva';
import ConfirmacionReserva from './ConfirmacionReserva';
import AlertaTiempo from './torneo/AlertaTiempo';
import CalendarioTorneo from './torneo/CalendarioTorneo';
import IndicadorPasos from './torneo/IndicadorPasos';
import SeccionLlaves from './torneo/SeccionLlaves';
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
          {reserva.modo === 'torneo' && <IndicadorPasos reserva={reserva} />}
          <FormularioReserva reserva={reserva} dias={dias} />
          {reserva.modo === 'torneo' && (
            <SeccionLlaves reserva={reserva} canchas={canchas} />
          )}
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
    expect(screen.getByText(/^Partido 1\b/i)).toBeInTheDocument();
    expect(screen.getByText(/^Partido 2\b/i)).toBeInTheDocument();
    expect(screen.getByText(/^Partido 3\b/i)).toBeInTheDocument();
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

  it('4. Emparejamiento manual con intercambio automático y validación de incompletos (AC-006, FR-004)', () => {
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
      name: 'Partido 1, equipo local',
    });
    const selectorVisitanteR1P1 = screen.getByRole('combobox', {
      name: 'Partido 1, equipo visitante',
    });

    expect(selectorLocalR1P1).toBeInTheDocument();
    expect(selectorVisitanteR1P1).toBeInTheDocument();

    const valLocalInicial = selectorLocalR1P1.value;
    const valVisitanteInicial = selectorVisitanteR1P1.value;

    // Poner en R1-P1 local el equipo que está en el visitante -> se intercambian
    fireEvent.change(selectorLocalR1P1, { target: { value: valVisitanteInicial } });

    expect(selectorLocalR1P1.value).toBe(valVisitanteInicial);
    expect(selectorVisitanteR1P1.value).toBe(valLocalInicial);
    expect(screen.queryByText('Hay equipos repetidos en los cruces.')).not.toBeInTheDocument();

    // Dejar una posición vacía ('') -> aparece el error de cruces incompletos
    fireEvent.change(selectorLocalR1P1, { target: { value: '' } });

    const erroresIncompletos = screen.getAllByText(
      'Asigna un equipo en cada posición de la primera ronda.'
    );
    expect(erroresIncompletos.length).toBeGreaterThanOrEqual(1);

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

    expect(dentroTorneo.getByText(/^Partido 1\b/i)).toBeInTheDocument();
    expect(dentroTorneo.getByText(/^Partido 2\b/i)).toBeInTheDocument();
    expect(dentroTorneo.getByText(/^Partido 3\b/i)).toBeInTheDocument();
    expect(dentroTorneo.getByText(/^Partido 4\b/i)).toBeInTheDocument();
    expect(dentroTorneo.getByText(/^Partido 5\b/i)).toBeInTheDocument();
    expect(dentroTorneo.getByText(/^Partido 6\b/i)).toBeInTheDocument();
    expect(dentroTorneo.getByText(/^Partido 7\b/i)).toBeInTheDocument();
  });

  it('6. En torneo con fútbol, cancha de pádel queda bloqueada y no se agrega', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(
      () => useReserva({ activo: true, modoInicial: 'torneo' }),
      { wrapper }
    );

    act(() => {
      result.current.alternarCancha('futbol-1');
    });

    expect(result.current.canchaIds).toEqual(['futbol-1']);
    expect(result.current.motivoNoAgregable('padel-1')).toBe('Solo canchas de Fútbol');

    act(() => {
      result.current.alternarCancha('padel-1');
    });

    expect(result.current.canchaIds).toEqual(['futbol-1']);
  });

  it('7. Sin canchas elegidas, contarLibresFase retorna undefined y ningún día queda lleno', () => {
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(
      () => useReserva({ activo: true, modoInicial: 'torneo' }),
      { wrapper }
    );

    expect(result.current.canchaIds).toEqual([]);
    expect(result.current.contarLibresFase(1)).toBeUndefined();
  });

  it('8. AlertaTiempo con duracionPartido={20} y onCambiarDuracion muestra botón de cambio rápido a 15 min', () => {
    const onCambiarDuracion = vi.fn();

    const { rerender } = render(
      <AlertaTiempo
        equipos={8}
        canchasCount={1}
        minutosRequeridos={120}
        disponibles={60}
        deficit={60}
        duracionPartido={20}
        onCambiarDuracion={onCambiarDuracion}
      />
    );

    const btnAccion = screen.getByRole('button', { name: 'Cambiar a 15 min por partido' });
    expect(btnAccion).toBeInTheDocument();
    fireEvent.click(btnAccion);
    expect(onCambiarDuracion).toHaveBeenCalledWith(15);

    rerender(
      <AlertaTiempo
        equipos={8}
        canchasCount={1}
        minutosRequeridos={120}
        disponibles={60}
        deficit={60}
        duracionPartido={15}
        onCambiarDuracion={onCambiarDuracion}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Cambiar a 15 min por partido' })
    ).not.toBeInTheDocument();
  });

  it('9. En cumpleaños, 150 invitados bloquea con "Máximo 100 invitados."', () => {
    let diasRef = [];
    function ProbarHook() {
      const { dias } = useReservas();
      diasRef = dias;
      return useReserva({ activo: true, modoInicial: 'cumpleanos' });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => ProbarHook(), { wrapper });

    act(() => {
      result.current.cambiarFecha(diasRef[1]);
      result.current.alternarCancha('futbol-1');
    });

    act(() => {
      result.current.elegirHora('14:00');
      result.current.setInvitados('150');
    });

    expect( result.current.horasSel).toEqual(['14:00']);
    expect(result.current.motivoBloqueo).toBe('Máximo 100 invitados.');
    expect(result.current.puedeConfirmar).toBe(false);
  });

  it('9b. En cumpleaños, invitados decimales (2.5) se rechaza y el input tiene step="1"', () => {
    function FlujoCumplePrueba() {
      const { dias } = useReservas();
      const reserva = useReserva({
        activo: true,
        modoInicial: 'cumpleanos',
      });

      const initRef = useRef(false);
      useEffect(() => {
        if (!initRef.current) {
          initRef.current = true;
          reserva.cambiarFecha(dias[1]);
          reserva.alternarCancha('futbol-1');
        }
      }, [dias, reserva]);

      return (
        <div>
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
            invitados={reserva.invitados}
          />
        </div>
      );
    }

    render(
      <ReservasProvider>
        <FlujoCumplePrueba />
      </ReservasProvider>
    );

    const inputInvitados = screen.getByLabelText(/^Invitados$/i);
    expect(inputInvitados).toHaveAttribute('step', '1');

    fireEvent.click(screen.getByRole('button', { name: /14:00/i }));
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Ana Gómez' } });
    fireEvent.change(inputInvitados, { target: { value: '2.5' } });

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeDisabled();
    expect(screen.getByText('Indica cuántos invitados vienen.')).toBeInTheDocument();

    fireEvent.change(inputInvitados, { target: { value: '20' } });
    expect(btnConfirmar).toBeEnabled();
  });

  it('9c. "Limpiar selección" limpia los datos conservando el modo actual en vez de volver a modoInicial', () => {
    function FlujoCambioModo() {
      const { dias, canchas } = useReservas();
      const reserva = useReserva({
        activo: true,
        modoInicial: 'torneo',
        canchaInicial: canchas.find((c) => c.id === 'futbol-1') || null,
      });

      return (
        <div>
          <div data-testid="modo-actual">{reserva.modo}</div>
          <button type="button" onClick={() => reserva.cambiarModo('cancha')}>
            Ir a Cancha
          </button>
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
          />
        </div>
      );
    }

    render(
      <ReservasProvider>
        <FlujoCambioModo />
      </ReservasProvider>
    );

    expect(screen.getByTestId('modo-actual')).toHaveTextContent('torneo');

    fireEvent.click(screen.getByRole('button', { name: 'Ir a Cancha' }));
    expect(screen.getByTestId('modo-actual')).toHaveTextContent('cancha');

    const inputNombre = screen.getByLabelText(/Nombre/i);
    fireEvent.change(inputNombre, { target: { value: 'Carlos Ruiz' } });
    expect(inputNombre).toHaveValue('Carlos Ruiz');

    fireEvent.click(screen.getByRole('button', { name: /Limpiar selección/i }));

    expect(screen.getByTestId('modo-actual')).toHaveTextContent('cancha');
    expect(screen.getByLabelText(/Nombre/i)).toHaveValue('');
  });

  it('9d. Renueva la ventana de 7 días al cruzar la medianoche y recuperar el foco o visibilidad: "Hoy" es el nuevo día y ayer desaparece', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-08T10:00:00'));

    try {
      let ctxRef = null;
      let reservaRef = null;
      function VistaConSelector() {
        const ctx = useReservas();
        ctxRef = ctx;
        const reserva = useReserva({
          activo: true,
          modoInicial: 'cancha',
          canchaInicial: ctx.canchas[0],
        });
        reservaRef = reserva;
        return <FormularioReserva reserva={reserva} dias={ctx.dias} />;
      }

      const removeWindowSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(
        <ReservasProvider>
          <VistaConSelector />
        </ReservasProvider>
      );

      expect(ctxRef.dias[0]).toBe('2026-11-08');
      const btnHoy8 = screen.getByRole('button', { name: /Hoy 8 de nov/i });
      expect(btnHoy8).toBeInTheDocument();
      expect(btnHoy8).toHaveAttribute('aria-pressed', 'true');

      // Elegimos una hora de hoy (2026-11-08) antes de cruzar la medianoche
      fireEvent.click(screen.getByRole('button', { name: '20:00' }));
      expect(reservaRef.horasSel).toEqual(['20:00']);
      expect(reservaRef.jornadas[1].fecha).toBe('2026-11-08');

      // Reservamos una hora mañana (2026-11-09) para comprobar que se conserva tras renovar la ventana
      act(() => {
        ctxRef.reservar({
          canchaId: 'futbol-1',
          fecha: '2026-11-09',
          horas: ['14:00'],
          nombre: 'Pedro',
        });
      });

      // Cruzamos la medianoche al 9 de noviembre y recuperamos el foco
      vi.setSystemTime(new Date('2026-11-09T00:05:00'));
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });

      expect(ctxRef.dias[0]).toBe('2026-11-09');
      expect(ctxRef.dias).not.toContain('2026-11-08');
      expect(ctxRef.dias).toHaveLength(7);

      // El día seleccionado pasa al nuevo hoy y las horas elegidas de ayer se limpian
      const btnHoy9 = screen.getByRole('button', { name: /Hoy 9 de nov/i });
      expect(btnHoy9).toBeInTheDocument();
      expect(btnHoy9).toHaveAttribute('aria-pressed', 'true');
      expect(reservaRef.fecha).toBe('2026-11-09');
      expect(reservaRef.horasSel).toEqual([]);
      expect(reservaRef.jornadas[1]).toEqual({ fecha: '2026-11-09', horas: [] });
      expect(screen.queryByRole('button', { name: /8 de nov/i })).not.toBeInTheDocument();

      // Las franjas de ayer no se ofrecen como disponibles y no se puede reservar ayer
      expect(
        ctxRef.disponibilidad('futbol-1', '2026-11-08').some((s) => s.disponible)
      ).toBe(false);
      const guardado = JSON.parse(window.localStorage.getItem('sportify_reservas_v2'));
      expect(guardado.ocupados['futbol-1']['2026-11-08']).toBeUndefined();
      expect(guardado.ocupados['futbol-1']['2026-11-09']).toContain('14:00');
      expect(
        ctxRef.reservar({
          canchaId: 'futbol-1',
          fecha: '2026-11-08',
          horas: ['20:00'],
          nombre: 'Pedro',
        }).ok
      ).toBe(false);

      // Segundo cruce de medianoche al 10 de noviembre con visibilitychange (incluyendo fase de torneo con horas en el día que vence)
      act(() => {
        reservaRef.cambiarModo('torneo');
      });
      act(() => {
        reservaRef.elegirHoraFase(1, '10:00');
        reservaRef.elegirHoraFase(1, '11:00');
      });
      expect(reservaRef.jornadas[1]).toEqual({
        fecha: '2026-11-09',
        horas: ['10:00', '11:00'],
      });

      vi.setSystemTime(new Date('2026-11-10T00:10:00'));
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(ctxRef.dias[0]).toBe('2026-11-10');
      expect(reservaRef.fecha).toBe('2026-11-10');
      expect(reservaRef.jornadas[1]).toEqual({
        fecha: '2026-11-10',
        horas: [],
      });
      expect(
        ctxRef.disponibilidad('futbol-1', '2026-11-09').some((s) => s.disponible)
      ).toBe(false);

      unmount();
      expect(removeWindowSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    } finally {
      vi.useRealTimers();
    }
  });

  it('10. En cumpleaños muestra la cantidad de invitados en voucher y confirmación; en cancha y torneo no', () => {
    function FlujoModosPrueba({ modoInicial }) {
      const { dias, canchas } = useReservas();
      const reserva = useReserva({
        activo: true,
        modoInicial,
        canchaInicial: canchas.find((c) => c.id === 'futbol-1') || null,
      });

      const initRef = useRef(false);
      useEffect(() => {
        if (!initRef.current) {
          initRef.current = true;
          reserva.cambiarFecha(dias[1]);
          if (modoInicial !== 'cancha') {
            reserva.alternarCancha('futbol-1');
          }
        }
      }, [dias, modoInicial, reserva]);

      return (
        <div>
          {reserva.confirmado ? (
            <ConfirmacionReserva
              codigo={reserva.confirmado.codigo}
              textoQr={reserva.confirmado.textoQr}
              resumen={reserva.confirmado.resumen}
              onListo={reserva.reiniciar}
            />
          ) : (
            <>
              {reserva.modo === 'torneo' && <IndicadorPasos reserva={reserva} />}
              <FormularioReserva reserva={reserva} dias={dias} />
              {reserva.modo === 'torneo' && (
                <SeccionLlaves reserva={reserva} canchas={canchas} />
              )}
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
                invitados={reserva.modo === 'cumpleanos' ? reserva.invitados : null}
              />
            </>
          )}
        </div>
      );
    }

    // 1) Cumpleaños: muestra Invitados en voucher y confirmación
    const { unmount: unmountCumple } = render(
      <ReservasProvider>
        <FlujoModosPrueba modoInicial="cumpleanos" />
      </ReservasProvider>
    );

    const inputInvitados = screen.getByLabelText(/^Invitados$/i);
    fireEvent.change(inputInvitados, { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /14:00/i }));
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Ana Gómez' } });

    const voucherCumple = screen.getByLabelText('Resumen de tu reserva');
    expect(within(voucherCumple).getByText('Invitados')).toBeInTheDocument();
    expect(within(voucherCumple).getByText('20')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar reserva/i }));
    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
    expect(screen.getByText(/Invitados:/i)).toHaveTextContent('Invitados: 20');
    unmountCumple();

    // 2) Cancha: no muestra Invitados en voucher ni en confirmación
    window.localStorage.clear();
    const { unmount: unmountCancha } = render(
      <ReservasProvider>
        <FlujoModosPrueba modoInicial="cancha" />
      </ReservasProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /14:00/i }));
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Ana Gómez' } });

    const voucherCancha = screen.getByLabelText('Resumen de tu reserva');
    expect(within(voucherCancha).queryByText('Invitados')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar reserva/i }));
    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
    expect(screen.queryByText(/Invitados:/i)).not.toBeInTheDocument();
    unmountCancha();

    // 3) Torneo: no muestra Invitados en voucher ni en confirmación
    window.localStorage.clear();
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']} />
      </ReservasProvider>
    );

    const voucherTorneo = screen.getByLabelText('Resumen de tu reserva');
    expect(within(voucherTorneo).queryByText('Invitados')).not.toBeInTheDocument();
  });

  it('11. Rondas siguientes muestran "Ganador del partido N" y la final tiene trofeo y premiación', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']} />
      </ReservasProvider>
    );

    expect(screen.getByText('Ganador del partido 1')).toBeInTheDocument();
    expect(screen.getByText('Ganador del partido 2')).toBeInTheDocument();
    expect(screen.getByText('Ganador del partido 3')).toBeInTheDocument();
    expect(screen.getByText('Ganador del partido 4')).toBeInTheDocument();
    expect(screen.getByText('Ganador del partido 5')).toBeInTheDocument();
    expect(screen.getByText('Ganador del partido 6')).toBeInTheDocument();
    expect(screen.getByText('Trofeo y premiación al terminar.')).toBeInTheDocument();
  });

  it('12. Indicador de pasos resalta el paso actual con aria-current="step" y avanza al elegir canchas', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba canchasIniciales={[]} />
      </ReservasProvider>
    );

    const listaPasos = screen.getByRole('list', { name: 'Pasos del torneo' });
    expect(listaPasos).toBeInTheDocument();

    const pasoCanchas = within(listaPasos).getByText('Canchas').closest('li');
    expect(pasoCanchas).toHaveAttribute('aria-current', 'step');

    // Al elegir una cancha, Canchas queda completo y el paso actual avanza a Fechas por fase
    const btnCancha1 = screen.getByRole('button', { name: /Cancha Fútbol 1/i });
    fireEvent.click(btnCancha1);

    expect(pasoCanchas).not.toHaveAttribute('aria-current');
    const pasoFechas = within(listaPasos).getByText('Fechas por fase').closest('li');
    expect(pasoFechas).toHaveAttribute('aria-current', 'step');
  });

  it('13. S1: quita horas de fase que dejan de estar libres (canchas, equipos, disponibilidad o fallo al confirmar) con aviso y nunca deshabilita una hora elegida', () => {
    const { unmount } = render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['voley-1']}
          diaInicialIndex={1}
        />
      </ReservasProvider>
    );

    // a) Cambio de canchas: en dias[1], voley-1 tiene 14:00, 15:00 y 16:00 libres; voley-2 tiene 14:00 y 15:00 ocupadas y 16:00 libre.
    const btn14 = screen.getByRole('button', { name: /Cuartos de final 14:00/i });
    const btn16 = screen.getByRole('button', { name: /Cuartos de final 16:00/i });
    fireEvent.click(btn14);
    fireEvent.click(btn16);
    expect(btn14).toHaveAttribute('aria-pressed', 'true');
    expect(btn16).toHaveAttribute('aria-pressed', 'true');

    // Al agregar voley-2, donde 14:00 y 15:00 están ocupadas, se limpia toda la franja de la fase y se muestra el aviso
    fireEvent.click(screen.getByRole('button', { name: 'Cancha Voley Playa 2' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ese horario ya no está libre en las canchas elegidas. Elige otro.'
    );
    expect(
      screen.getByRole('button', { name: /Cuartos de final 14:00/i })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('button', { name: /Cuartos de final 15:00/i })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('button', { name: /Cuartos de final 16:00/i })
    ).toHaveAttribute('aria-pressed', 'false');

    unmount();

    // b) Cambio de equipos y de disponibilidad + limpieza tras fallo al confirmar
    let ctxRef = null;
    function ProbarHookConContexto() {
      ctxRef = useReservas();
      return useReserva({ activo: true, modoInicial: 'torneo' });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result, unmount: unmountHook } = renderHook(() => ProbarHookConContexto(), {
      wrapper,
    });

    // Con 4 equipos y ['voley-1', 'voley-2']: Fase 1 (Semifinal) usa 2 canchas; Fase 2 (Final) usa solo 1 ('voley-1').
    // En dias[1], 14:00 está libre en voley-1 y ocupada en voley-2 -> libre en Fase 2 con 4 equipos.
    act(() => {
      result.current.cambiarEquiposTorneo(4);
      result.current.alternarCancha('voley-1');
      result.current.alternarCancha('voley-2');
      result.current.cambiarFechaFase(1, ctxRef.dias[1]);
      result.current.cambiarFechaFase(2, ctxRef.dias[1]);
    });

    act(() => {
      result.current.elegirHoraFase(2, '14:00');
    });
    expect(result.current.jornadas[2].horas).toEqual(['14:00']);

    // Al subir a 8 equipos, la ronda 2 pasa a ser Semifinal (2 canchas: voley-1 y voley-2), donde 14:00 está ocupada en voley-2
    act(() => {
      result.current.cambiarEquiposTorneo(8);
    });
    expect(result.current.jornadas[2].horas).toEqual([]);
    expect(result.current.error).toBe(
      'Ese horario ya no está libre en las canchas elegidas. Elige otro.'
    );

    // c) Cambio de disponibilidad externa en la hora intermedia de un rango de 3 horas:
    // en dias[1], 10:00, 11:00 y 12:00 están libres en voley-1 y voley-2; al ocuparse 11:00 (hora del medio) se limpia todo el rango (sin dejar hueco)
    act(() => {
      result.current.elegirHoraFase(1, '10:00');
    });
    act(() => {
      result.current.elegirHoraFase(1, '12:00');
    });
    expect(result.current.jornadas[1].horas).toEqual(['10:00', '11:00', '12:00']);

    act(() => {
      ctxRef.reservar({
        canchaId: 'voley-2',
        fecha: ctxRef.dias[1],
        horas: ['11:00'],
        nombre: 'Laura Perez',
      });
    });
    expect(result.current.jornadas[1].horas).toEqual([]);
    expect(result.current.error).toBe(
      'Ese horario ya no está libre en las canchas elegidas. Elige otro.'
    );

    unmountHook();

    // d) En CalendarioTorneo una hora ya elegida nunca queda disabled aunque esLibreFase devuelva false
    const onElegirHoraFase = vi.fn();
    const { unmount: unmountCal } = render(
      <CalendarioTorneo
        fases={[
          {
            ronda: 1,
            nombreRonda: 'Semifinal',
            partidos: 2,
            canchasEfectivas: 2,
            canchaIds: ['voley-1', 'voley-2'],
            turnos: 1,
            minutosRequeridos: 30,
            horasMinimas: 1,
          },
        ]}
        jornadas={{ 1: { fecha: '2026-11-10', horas: ['14:00'] } }}
        validacionesJornadas={[]}
        dias={['2026-11-10']}
        horasBase={['14:00', '15:00']}
        canchas={[]}
        canchaIds={['voley-1', 'voley-2']}
        duracionPartido={20}
        onElegirHoraFase={onElegirHoraFase}
        esLibreFase={() => false}
      />
    );

    const btnElegidaOcupada = screen.getByRole('button', { name: /Semifinal 14:00/i });
    const btnNoElegidaOcupada = screen.getByRole('button', { name: /Semifinal 15:00/i });
    expect(btnElegidaOcupada).not.toBeDisabled();
    expect(btnNoElegidaOcupada).toBeDisabled();
    fireEvent.click(btnElegidaOcupada);
    expect(onElegirHoraFase).toHaveBeenCalledWith(1, '14:00');
    unmountCal();

    // e) Tras un fallo al confirmar en torneo, limpia también las horas en conflicto de jornadas
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-08T07:00:00'));
    window.localStorage.clear();

    const { result: resConfirm, unmount: unmountConfirm } = renderHook(
      () => ProbarHookConContexto(),
      { wrapper }
    );

    act(() => {
      resConfirm.current.cambiarEquiposTorneo(4);
      resConfirm.current.alternarCancha('futbol-1');
      resConfirm.current.alternarCancha('futbol-2');
      resConfirm.current.cambiarFechaFase(1, ctxRef.dias[0]);
      resConfirm.current.cambiarFechaFase(2, ctxRef.dias[1]);
    });

    act(() => {
      resConfirm.current.elegirHoraFase(1, '10:00');
    });
    act(() => {
      resConfirm.current.elegirHoraFase(1, '11:00');
      resConfirm.current.elegirHoraFase(2, '15:00');
      resConfirm.current.cambiarNombre('Carlos Ruiz');
    });

    expect(resConfirm.current.jornadas[1].horas).toEqual(['10:00', '11:00']);
    expect(resConfirm.current.puedeConfirmar).toBe(true);

    // Avanza el reloj a las 10:30 del mismo día sin re-renderizar antes de confirmar:
    // 10:00 en dias[0] ya empezó, por lo que reservarEvento falla y confirmar limpia toda la franja de la fase 1 en conflicto
    vi.setSystemTime(new Date('2026-11-08T10:30:00'));

    act(() => {
      resConfirm.current.confirmar();
    });

    expect(resConfirm.current.confirmado).toBeNull();
    expect(resConfirm.current.error).toBe(
      'Alguna cancha u horario del evento ya no está disponible. No se reservó nada.'
    );
    expect(resConfirm.current.jornadas[1].horas).toEqual([]);
    expect(resConfirm.current.jornadas[2].horas).toEqual(['15:00']);
    expect(ctxRef.reservas).toHaveLength(0);

    unmountConfirm();
    vi.useRealTimers();
  });

  it('14. S2: al pasar de Torneo a Cumpleaños, cambiar el día y volver a Torneo, revalida las horas de la fase 1 contra el nuevo día y limpia el rango si hay conflicto', () => {
    let diasRef = [];
    function ProbarHook() {
      const { dias } = useReservas();
      diasRef = dias;
      return useReserva({ activo: true, modoInicial: 'torneo' });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => ProbarHook(), { wrapper });

    // En voley-1: en dias[1] 15:00, 16:00 y 17:00 están libres; en dias[2] la hora del medio (16:00) está ocupada.
    act(() => {
      result.current.alternarCancha('voley-1');
      result.current.cambiarFechaFase(1, diasRef[1]);
    });

    act(() => {
      result.current.elegirHoraFase(1, '15:00');
    });
    act(() => {
      result.current.elegirHoraFase(1, '17:00');
    });
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[1],
      horas: ['15:00', '16:00', '17:00'],
    });

    // Pasa a Cumpleaños, cambia el día a dias[2] y vuelve a Torneo
    act(() => {
      result.current.cambiarModo('cumpleanos');
    });
    act(() => {
      result.current.cambiarFecha(diasRef[2]);
    });
    expect(result.current.error).toBeNull();
    act(() => {
      result.current.cambiarModo('torneo');
    });

    // La fase 1 tiene la nueva fecha dias[2] y su rango completo queda vacío (no 2 horas con hueco)
    expect(result.current.modo).toBe('torneo');
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[2],
      horas: [],
    });
  });

  it('15. En modo Cumpleaños no aparece aviso de torneo ni se tocan las fases hasta volver a Torneo (entonces corre la limpieza)', () => {
    let ctxRef = null;
    function ProbarHookConContexto() {
      ctxRef = useReservas();
      return useReserva({ activo: true, modoInicial: 'torneo' });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => ProbarHookConContexto(), { wrapper });

    // En Torneo: elegimos voley-1 en dias[1] y un rango de 3 horas (14:00, 15:00, 16:00) en la fase 1
    act(() => {
      result.current.alternarCancha('voley-1');
      result.current.cambiarFechaFase(1, ctxRef.dias[1]);
    });
    act(() => {
      result.current.elegirHoraFase(1, '14:00');
    });
    act(() => {
      result.current.elegirHoraFase(1, '16:00');
    });
    expect(result.current.jornadas[1].horas).toEqual(['14:00', '15:00', '16:00']);

    // Cambiamos a modo Cumpleaños
    act(() => {
      result.current.cambiarModo('cumpleanos');
    });
    expect(result.current.modo).toBe('cumpleanos');
    expect(result.current.error).toBeNull();

    // Estando en Cumpleaños, se ocupa la hora intermedia (15:00) de la fase 1:
    // no debe aparecer el aviso de torneo ni deben tocarse las fases mientras estemos fuera de Torneo
    act(() => {
      ctxRef.reservar({
        canchaId: 'voley-1',
        fecha: ctxRef.dias[1],
        horas: ['15:00'],
        nombre: 'Mario Gomez',
      });
    });

    expect(result.current.modo).toBe('cumpleanos');
    expect(result.current.error).toBeNull();
    expect(result.current.jornadas[1].horas).toEqual(['14:00', '15:00', '16:00']);

    // Al volver a Torneo, el efecto de limpieza corre, limpia el rango completo de la fase 1 y muestra el aviso
    act(() => {
      result.current.cambiarModo('torneo');
    });

    expect(result.current.modo).toBe('torneo');
    expect(result.current.jornadas[1].horas).toEqual([]);
    expect(result.current.error).toBe(
      'Ese horario ya no está libre en las canchas elegidas. Elige otro.'
    );
  });

  it('16. S6: con 4 equipos no permite agregar una tercera cancha y explica el motivo; al bajar de 8 a 4 equipos con 3 canchas deja las primeras 2 con aviso y solo guarda/cobra esas 2', () => {
    let diasCapturados = [];
    function CapturadorDias() {
      const { dias } = useReservas();
      diasCapturados = dias;
      return null;
    }

    // Parte A: En el hook, con 4 equipos el tope es 2 canchas (alternarCancha, alternarDeporte, motivoNoAgregable, topeCanchasAlcanzado)
    let diasHook = [];
    function ProbarHookS6() {
      const { dias } = useReservas();
      diasHook = dias;
      return useReserva({ activo: true, modoInicial: 'torneo' });
    }
    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result, unmount: unmountHook } = renderHook(
      () => ProbarHookS6(),
      { wrapper }
    );

    act(() => {
      result.current.cambiarEquiposTorneo(4);
      result.current.alternarCancha('futbol-1');
      result.current.alternarCancha('futbol-2');
    });

    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2']);
    expect(result.current.topeCanchasAlcanzado).toBe(true);
    expect(result.current.motivoNoAgregable('futbol-3')).toBe(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: elige hasta 2 canchas.'
    );

    // Intentar agregar una tercera cancha no la agrega y muestra el aviso
    act(() => {
      result.current.alternarCancha('futbol-3');
    });
    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2']);
    expect(result.current.error).toBe(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: elige hasta 2 canchas.'
    );

    // alternarDeporte con 4 equipos tampoco supera 2 canchas
    act(() => {
      result.current.alternarCancha('futbol-1');
      result.current.alternarCancha('futbol-2');
    });
    expect(result.current.canchaIds).toEqual([]);
    act(() => {
      result.current.alternarDeporte('futbol');
    });
    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2']);

    // Cumpleaños conserva sus reglas (permite las 3 canchas sin límite de torneo)
    act(() => {
      result.current.cambiarModo('cumpleanos');
    });
    act(() => {
      result.current.alternarCancha('futbol-3');
    });
    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2', 'futbol-3']);

    // Al volver a Torneo con 4 equipos, recorta a 2 canchas
    act(() => {
      result.current.cambiarModo('torneo');
    });
    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2']);

    // Al bajar de 8 a 4 equipos con 3 canchas en el hook, deja las primeras 2 y al confirmar el QR solo lleva esas 2
    act(() => {
      result.current.cambiarEquiposTorneo(8);
    });
    act(() => {
      result.current.alternarCancha('futbol-3');
    });
    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2', 'futbol-3']);

    act(() => {
      result.current.cambiarEquiposTorneo(4);
    });
    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2']);
    expect(result.current.error).toBe(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: se dejaron las primeras 2 canchas elegidas.'
    );

    // Confirmar en el hook y verificar que resumen.canchas y textoQr solo contienen las 2 canchas usadas
    act(() => {
      result.current.cambiarFechaFase(1, diasHook[1]);
      result.current.cambiarFechaFase(2, diasHook[2]);
    });
    act(() => {
      result.current.elegirHoraFase(1, '14:00');
      result.current.elegirHoraFase(2, '15:00');
      result.current.cambiarNombre('Elena Vargas');
    });
    act(() => {
      result.current.confirmar();
    });
    expect(result.current.confirmado).not.toBeNull();
    expect(result.current.confirmado.resumen.canchas).toEqual([
      'Cancha Fútbol 1',
      'Cancha Fútbol 2',
    ]);
    expect(result.current.confirmado.textoQr).toContain('Cancha Fútbol 1');
    expect(result.current.confirmado.textoQr).toContain('Cancha Fútbol 2');
    expect(result.current.confirmado.textoQr).not.toContain('Cancha Fútbol 3');

    unmountHook();
    window.localStorage.clear();

    // Parte B: En la UI, pasar de 8 a 4 equipos con 3 canchas conserva las primeras 2 en orden de selección,
    // quita la tercera con aviso, y al confirmar solo guarda y muestra en confirmación/QR las 2 canchas usadas
    render(
      <ReservasProvider>
        <CapturadorDias />
        <FlujoTorneoPrueba
          canchasIniciales={['futbol-2', 'futbol-3', 'futbol-1']}
        />
      </ReservasProvider>
    );

    const btnCancha1 = screen.getByRole('button', { name: 'Cancha Fútbol 1' });
    const btnCancha2 = screen.getByRole('button', { name: 'Cancha Fútbol 2' });
    const btnCancha3 = screen.getByRole('button', { name: 'Cancha Fútbol 3' });

    expect(btnCancha2).toHaveAttribute('aria-pressed', 'true');
    expect(btnCancha3).toHaveAttribute('aria-pressed', 'true');
    expect(btnCancha1).toHaveAttribute('aria-pressed', 'true');

    // Bajar de 8 a 4 equipos
    fireEvent.click(screen.getByRole('button', { name: /4 equipos \(3 partidos\)/i }));

    // Conserva las primeras 2 en orden de selección ('futbol-2', 'futbol-3') y quita la extra ('futbol-1')
    expect(btnCancha2).toHaveAttribute('aria-pressed', 'true');
    expect(btnCancha3).toHaveAttribute('aria-pressed', 'true');
    expect(btnCancha1).toHaveAttribute('aria-pressed', 'false');

    // Muestra aviso explicando por qué se dejaron 2 canchas
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: se dejaron las primeras 2 canchas elegidas.'
    );

    // Intentar volver a agregar la tercera cancha ('futbol-1') con 4 equipos no la agrega y muestra el aviso de tope
    fireEvent.click(btnCancha1);
    expect(btnCancha1).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: elige hasta 2 canchas.'
    );

    // Programar Semifinal y Final y confirmar
    const seccionSemi = screen.getByLabelText('Fase 1: Semifinal');
    const seccionFinal = screen.getByLabelText('Fase 2: Final');
    fireEvent.click(within(seccionSemi).getAllByRole('button')[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Semifinal 14:00' }));
    fireEvent.click(within(seccionFinal).getAllByRole('button')[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Final 15:00' }));

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Elena Vargas' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar reserva/i }));

    const confirmacion = screen
      .getByText('Reserva confirmada')
      .closest('.confirmacion-reserva');
    expect(confirmacion).toBeInTheDocument();
    // La confirmación muestra solo Cancha Fútbol 2 y Cancha Fútbol 3, nunca Cancha Fútbol 1
    expect(within(confirmacion).getAllByText(/Cancha Fútbol 2/i).length).toBeGreaterThan(0);
    expect(within(confirmacion).getAllByText(/Cancha Fútbol 3/i).length).toBeGreaterThan(0);
    expect(within(confirmacion).queryByText(/Cancha Fútbol 1/i)).not.toBeInTheDocument();

    const dataGuardada = JSON.parse(
      window.localStorage.getItem('sportify_reservas_v2')
    );
    const torneoGuardado = dataGuardada.reservas.find(
      (r) => r.subtipo === 'torneo'
    );
    expect(torneoGuardado.canchaIds).toEqual(['futbol-2', 'futbol-3']);
    expect(torneoGuardado.bloques[0].canchaIds).toEqual(['futbol-2', 'futbol-3']);
    expect(torneoGuardado.bloques[0].fecha).toBe(diasCapturados[1]);
    expect(torneoGuardado.bloques[1].canchaIds).toEqual(['futbol-2']);
    expect(torneoGuardado.bloques[1].fecha).toBe(diasCapturados[2]);
  });
});

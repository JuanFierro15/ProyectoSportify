import React, { useEffect, useMemo, useRef } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, renderHook, act } from '@testing-library/react';
import ReservasContext, { ReservasProvider, useReservas } from '../../context/ReservasContext';
import useReserva from './useReserva';
import FormularioReserva from './FormularioReserva';
import VoucherReserva from './VoucherReserva';
import ConfirmacionReserva from './ConfirmacionReserva';
import AlertaTiempo from './torneo/AlertaTiempo';
import CalendarioTorneo from './torneo/CalendarioTorneo';
import IndicadorPasos from './torneo/IndicadorPasos';
import SeccionLlaves from './torneo/SeccionLlaves';
import DialogoHorasSinPartido from './torneo/DialogoHorasSinPartido';
import { fechaCompleta } from '../../lib/fechas';

// En los tests de integración de torneos, las 3 canchas de fútbol se configuran
// a $90.000/h sin horas ocupadas por defecto para validar limpiamente los cobros
// por canchas efectivas (6 horas-cancha a $75.000/h con dto torneo = $450.000) y la navegación multi-día.
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
            canchas={canchas}
          />
          <DialogoHorasSinPartido
            abierto={Boolean(reserva.avisoHorasDeMas)}
            mensajes={(reserva.torneoPlan?.fasesConHorasDeMas || [])
              .map((r) => reserva.torneoPlan?.horasSinPartidoPorFase?.[r]?.mensaje)
              .filter(Boolean)}
            onRevisar={reserva.revisarHorasDeMas}
            onReservarIgual={reserva.reservarIgual}
            onCerrar={reserva.cerrarAvisoHorasDeMas}
          />
        </>
      )}
    </div>
  );
}

// Flujos completos de reserva: bajo la carga del suite pasan de los 5 s por defecto.
describe('Modo Torneo - Pruebas de integración', { timeout: 15000 }, () => {
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
    expect(within(seccionCuartos).getByText(/Mínimo:.*con 3 canchas/i)).toBeInTheDocument();

    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    expect(within(seccionSemi).getByText(/Mínimo:.*con 2 canchas/i)).toBeInTheDocument();

    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    expect(within(seccionFinal).getByText(/Mínimo:.*con 1 cancha\b/i)).toBeInTheDocument();

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

    // Seleccionamos 1 hora (14:00) en las 3 canchas de Cuartos de final -> 3 turnos max (1 por cancha) = 3 partidos de 4 requeridos (falta 1 partido / 40 min)
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 2, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 3, 14:00' })
    );

    // Aparece la alerta de déficit indicando exactamente que falta 1 partido por ubicar
    expect(
      screen.getByText(
        'Con las horas marcadas faltan turnos para 1 partido (cada turno incluye desempate y transición).'
      )
    ).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const diasSemi = within(seccionSemi).getAllByRole('button').slice(0, 7);
    expect(diasSemi[0]).toBeDisabled();
    expect(diasSemi[0]).toHaveTextContent(/bloqueado/i);
    expect(diasSemi[1]).toBeDisabled();
    expect(diasSemi[1]).toHaveTextContent(/bloqueado/i);

    // La fecha seleccionada en Semifinal avanza en cascada a dias[2]
    expect(diasSemi[2]).not.toBeDisabled();
    expect(diasSemi[2]).toHaveAttribute('aria-pressed', 'true');

    // En Final también quedan bloqueados los días anteriores y avanza a dias[2]
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const diasFinal = within(seccionFinal).getAllByRole('button').slice(0, 7);
    expect(diasFinal[0]).toBeDisabled();
    expect(diasFinal[0]).toHaveTextContent(/bloqueado/i);
    expect(diasFinal[1]).toBeDisabled();
    expect(diasFinal[1]).toHaveTextContent(/bloqueado/i);
    expect(diasFinal[2]).not.toBeDisabled();
    expect(diasFinal[2]).toHaveAttribute('aria-pressed', 'true');

    // Cuartos de final selecciona 14:00 en dias[2] en Cancha 1
    fireEvent.click(screen.getByRole('tab', { name: /Cuartos de final/i }));
    const btnHoraCuartos14 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 14:00',
    });
    fireEvent.click(btnHoraCuartos14);

    // En Semifinal (mismo día dias[2]), los botones de hora <= 14:00 están disabled en sus canchas
    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const btnHoraSemi14 = screen.getByRole('button', {
      name: 'Semifinal, Cancha 1, 14:00',
    });
    expect(btnHoraSemi14).toBeDisabled();

    // Semifinal 15:00 está habilitado y permite programar la fase sin errores
    const btnHoraSemi15 = screen.getByRole('button', {
      name: 'Semifinal, Cancha 1, 15:00',
    });
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

    // 1. Cuartos en el día 2 (diasCapturados[1]) a las 14:00 en las 3 canchas
    const btnDia1Cuartos = within(seccionCuartos).getAllByRole('button')[1];
    fireEvent.click(btnDia1Cuartos);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 2, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 3, 14:00' })
    );

    // 2. Semifinal en el día 3 (diasCapturados[2]) a las 15:00 en 2 canchas
    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const btnDia2Semi = within(seccionSemi).getAllByRole('button')[2];
    fireEvent.click(btnDia2Semi);
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 15:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 2, 15:00' })
    );

    // 3. Final en el día 4 (diasCapturados[3]) a las 16:00 en Cancha 1
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const btnDia3Final = within(seccionFinal).getAllByRole('button')[3];
    fireEvent.click(btnDia3Final);
    fireEvent.click(
      screen.getByRole('button', { name: 'Final, Cancha 1, 16:00' })
    );

    // Verificación de cobro por canchas efectivas (AC-013)
    const valorTotal = document.querySelector('.voucher-reserva__valor-total');
    expect(valorTotal).toHaveTextContent('450.000');
    expect(
      within(screen.getByLabelText('Resumen de tu reserva')).getByText(
        'Descuento de torneo por hora'
      )
    ).toBeInTheDocument();

    // El voucher muestra el desglose de fases programadas por cancha
    expect(
      screen.getByText(/Cuartos de final:.*Fútbol 1: 14:00 · Fútbol 2: 14:00 · Fútbol 3: 14:00/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Semifinal:.*Fútbol 1: 15:00 · Fútbol 2: 15:00/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Final:.*Fútbol 1: 16:00/i)
    ).toBeInTheDocument();

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

    // Se guardaron 6 bloques (uno por cancha y fase) en distintos días
    expect(torneoGuardado.bloques).toHaveLength(6);
    expect(torneoGuardado.bloques[0].fecha).toBe(diasCapturados[1]);
    expect(torneoGuardado.bloques[0].canchaIds).toEqual(['futbol-1']);
    expect(torneoGuardado.bloques[1].canchaIds).toEqual(['futbol-2']);
    expect(torneoGuardado.bloques[2].canchaIds).toEqual(['futbol-3']);
    expect(torneoGuardado.bloques[3].fecha).toBe(diasCapturados[2]);
    expect(torneoGuardado.bloques[3].canchaIds).toEqual(['futbol-1']);
    expect(torneoGuardado.bloques[4].canchaIds).toEqual(['futbol-2']);
    expect(torneoGuardado.bloques[5].fecha).toBe(diasCapturados[3]);
    expect(torneoGuardado.bloques[5].canchaIds).toEqual(['futbol-1']);

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

  it('8. AlertaTiempo muestra detalle exacto para 1 y 2 partidos, se oculta con 0 y botón de cambio rápido a 15 min', () => {
    const onCambiarDuracion = vi.fn();

    const { rerender, container } = render(
      <AlertaTiempo
        equipos={8}
        canchasCount={2}
        minutosRequeridos={80}
        disponibles={80}
        deficit={40}
        partidosSinUbicar={1}
        duracionPartido={20}
        onCambiarDuracion={onCambiarDuracion}
      />
    );

    expect(
      screen.getByText('Con 8 equipos y 2 canchas, el torneo tomará ~80 min en el peor caso.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Con las horas marcadas faltan turnos para 1 partido (cada turno incluye desempate y transición).'
      )
    ).toBeInTheDocument();

    const btnAccion = screen.getByRole('button', { name: 'Cambiar a 15 min por partido' });
    expect(btnAccion).toBeInTheDocument();
    fireEvent.click(btnAccion);
    expect(onCambiarDuracion).toHaveBeenCalledWith(15);

    rerender(
      <AlertaTiempo
        equipos={8}
        canchasCount={2}
        minutosRequeridos={80}
        disponibles={40}
        deficit={80}
        partidosSinUbicar={2}
        duracionPartido={15}
        onCambiarDuracion={onCambiarDuracion}
      />
    );

    expect(
      screen.getByText(
        'Con las horas marcadas faltan turnos para 2 partidos (cada turno incluye desempate y transición).'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cambiar a 15 min por partido' })
    ).not.toBeInTheDocument();

    rerender(
      <AlertaTiempo
        equipos={8}
        canchasCount={2}
        minutosRequeridos={80}
        disponibles={80}
        deficit={40}
        partidosSinUbicar={0}
        duracionPartido={15}
        onCambiarDuracion={onCambiarDuracion}
      />
    );

    expect(container).toBeEmptyDOMElement();
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

    expect(result.current.horasSel).toEqual(['14:00']);
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
      expect(reservaRef.jornadas[1]).toEqual({
        fecha: '2026-11-09',
        horasPorCancha: {},
      });
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
        reservaRef.elegirHoraFase(1, ctxRef.canchas[0].id, '10:00');
        reservaRef.elegirHoraFase(1, ctxRef.canchas[0].id, '11:00');
      });
      expect(reservaRef.jornadas[1]).toEqual({
        fecha: '2026-11-09',
        horasPorCancha: { [ctxRef.canchas[0].id]: ['10:00', '11:00'] },
      });

      vi.setSystemTime(new Date('2026-11-10T00:10:00'));
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(ctxRef.dias[0]).toBe('2026-11-10');
      expect(reservaRef.fecha).toBe('2026-11-10');
      expect(reservaRef.jornadas[1]).toEqual({
        fecha: '2026-11-10',
        horasPorCancha: {},
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

    // a) Cambio de canchas: en dias[1], voley-1 tiene 14:00 y 16:00 libres; voley-2 tiene 16:00 libre.
    // Al marcar horas en voley-1 y voley-2 y luego quitar voley-2, solo se limpian las horas de voley-2 y voley-1 conserva las suyas.
    const btnV1_14 = screen.getByRole('button', {
      name: /Cuartos de final, Cancha 1, 14:00/i,
    });
    const btnV1_16 = screen.getByRole('button', {
      name: /Cuartos de final, Cancha 1, 16:00/i,
    });
    fireEvent.click(btnV1_14);
    fireEvent.click(btnV1_16);
    expect(btnV1_14).toHaveAttribute('aria-pressed', 'true');
    expect(btnV1_16).toHaveAttribute('aria-pressed', 'true');

    const btnCanchaV2 = screen.getByRole('button', { name: 'Cancha Voley Playa 2' });
    fireEvent.click(btnCanchaV2);

    const btnV2_16 = screen.getByRole('button', {
      name: /Cuartos de final, Cancha 2, 16:00/i,
    });
    fireEvent.click(btnV2_16);
    expect(btnV2_16).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /Cuartos de final, Cancha 1, 14:00/i })
    ).toHaveAttribute('aria-pressed', 'true');

    // Al quitar voley-2, voley-1 conserva sus horas
    fireEvent.click(btnCanchaV2);
    expect(
      screen.getByRole('button', { name: /Cuartos de final, Cancha 1, 14:00/i })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /Cuartos de final, Cancha 1, 16:00/i })
    ).toHaveAttribute('aria-pressed', 'true');

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

    // Con 8 equipos y 3 canchas (voley-1, voley-2, voley-3): al bajar a 4 equipos se recorta a 2 canchas y limpia voley-3 de las jornadas
    act(() => {
      result.current.cambiarEquiposTorneo(8);
      result.current.alternarCancha('voley-1');
      result.current.alternarCancha('voley-2');
      result.current.alternarCancha('voley-3');
      result.current.cambiarFechaFase(1, ctxRef.dias[1]);
      result.current.cambiarFechaFase(2, ctxRef.dias[1]);
    });

    act(() => {
      result.current.elegirHoraFase(2, 'voley-1', '16:00');
      result.current.elegirHoraFase(2, 'voley-3', '16:00');
    });
    expect(result.current.jornadas[2].horasPorCancha).toEqual({
      'voley-1': ['16:00'],
      'voley-3': ['16:00'],
    });

    // Al bajar a 4 equipos, maxCanchasTorneo(4)=2 quita 'voley-3' de las fases y de jornadas[2].horasPorCancha
    act(() => {
      result.current.cambiarEquiposTorneo(4);
    });
    expect(result.current.jornadas[2].horasPorCancha).toEqual({
      'voley-1': ['16:00'],
    });

    // c) Cambio de disponibilidad externa: en dias[1], se ocupa 11:00 en voley-2.
    // Solo se quita 11:00 en voley-2 y quedan las demás horas de voley-2 y voley-1.
    act(() => {
      result.current.elegirHoraFase(1, 'voley-1', '10:00');
      result.current.elegirHoraFase(1, 'voley-1', '12:00');
      result.current.elegirHoraFase(1, 'voley-2', '11:00');
      result.current.elegirHoraFase(1, 'voley-2', '12:00');
    });
    expect(result.current.jornadas[1].horasPorCancha).toEqual({
      'voley-1': ['10:00', '12:00'],
      'voley-2': ['11:00', '12:00'],
    });

    act(() => {
      ctxRef.reservar({
        canchaId: 'voley-2',
        fecha: ctxRef.dias[1],
        horas: ['11:00'],
        nombre: 'Laura Perez',
      });
    });
    expect(result.current.jornadas[1].horasPorCancha).toEqual({
      'voley-1': ['10:00', '12:00'],
      'voley-2': ['12:00'],
    });
    expect(result.current.error).toContain('11:00');

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
        jornadas={{
          1: { fecha: '2026-11-10', horasPorCancha: { 'voley-1': ['14:00'] } },
        }}
        validacionesJornadas={[]}
        dias={['2026-11-10']}
        horasBase={['14:00', '15:00']}
        canchas={[
          { id: 'voley-1', nombre: 'Cancha Voley Playa 1' },
          { id: 'voley-2', nombre: 'Cancha Voley Playa 2' },
        ]}
        canchaIds={['voley-1', 'voley-2']}
        duracionPartido={20}
        onElegirHoraFase={onElegirHoraFase}
        esLibreFase={() => false}
      />
    );

    const btnElegidaOcupada = screen.getByRole('button', {
      name: /Semifinal, Cancha 1, 14:00/i,
    });
    const btnNoElegidaOcupada = screen.getByRole('button', {
      name: /Semifinal, Cancha 1, 15:00/i,
    });
    expect(btnElegidaOcupada).not.toBeDisabled();
    expect(btnNoElegidaOcupada).toBeDisabled();
    fireEvent.click(btnElegidaOcupada);
    expect(onElegirHoraFase).toHaveBeenCalledWith(1, 'voley-1', '14:00');
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
      resConfirm.current.setDuracionPartido(30);
      resConfirm.current.cambiarEquiposTorneo(4);
      resConfirm.current.alternarCancha('futbol-1');
      resConfirm.current.alternarCancha('futbol-2');
      resConfirm.current.cambiarFechaFase(1, ctxRef.dias[0]);
      resConfirm.current.cambiarFechaFase(2, ctxRef.dias[1]);
    });

    act(() => {
      resConfirm.current.elegirHoraFase(1, 'futbol-1', '10:00');
      resConfirm.current.elegirHoraFase(1, 'futbol-1', '12:00');
      resConfirm.current.elegirHoraFase(2, 'futbol-1', '15:00');
      resConfirm.current.cambiarNombre('Carlos Ruiz');
    });

    expect(resConfirm.current.jornadas[1].horasPorCancha).toEqual({
      'futbol-1': ['10:00', '12:00'],
    });
    expect(resConfirm.current.puedeConfirmar).toBe(true);

    // Avanza el reloj a las 10:30 del mismo día sin re-renderizar antes de confirmar:
    // 10:00 en dias[0] ya empezó, por lo que reservarEvento falla y confirmar limpia la hora en conflicto
    vi.setSystemTime(new Date('2026-11-08T10:30:00'));

    act(() => {
      resConfirm.current.confirmar();
    });

    expect(resConfirm.current.confirmado).toBeNull();
    expect(resConfirm.current.error).toBe(
      'Alguna cancha u horario del evento ya no está disponible. No se reservó nada.'
    );
    expect(resConfirm.current.jornadas[1].horasPorCancha).toEqual({
      'futbol-1': ['12:00'],
    });
    expect(resConfirm.current.jornadas[2].horasPorCancha).toEqual({
      'futbol-1': ['15:00'],
    });
    expect(ctxRef.reservas).toHaveLength(0);

    unmountConfirm();
    vi.useRealTimers();

    // f) Si confirmar falla sin que haya choque de disponibilidad (p. ej. error de orden entre fases),
    // muestra el error devuelto y NO borra las horas elegidas de ninguna fase
    const errorOrden =
      'Final debe jugarse después de que termine Semifinal (2026-11-10 a las 15:00).';
    function WrapperRechazoSinChoque({ children }) {
      return (
        <ReservasProvider>
          <InterceptarReservarEvento>{children}</InterceptarReservarEvento>
        </ReservasProvider>
      );
    }
    let diasSinChoque = [];
    function InterceptarReservarEvento({ children }) {
      const ctx = useReservas();
      diasSinChoque = ctx.dias;
      const valor = useMemo(
        () => ({
          ...ctx,
          reservarEvento: () => ({ ok: false, error: errorOrden }),
        }),
        [ctx]
      );
      return (
        <ReservasContext.Provider value={valor}>
          {children}
        </ReservasContext.Provider>
      );
    }

    const { result: resSinChoque, unmount: unmountSinChoque } = renderHook(
      () => useReserva({ activo: true, modoInicial: 'torneo' }),
      { wrapper: WrapperRechazoSinChoque }
    );

    act(() => {
      resSinChoque.current.cambiarEquiposTorneo(4);
      resSinChoque.current.alternarCancha('futbol-1');
      resSinChoque.current.cambiarFechaFase(1, diasSinChoque[1]);
      resSinChoque.current.cambiarFechaFase(2, diasSinChoque[2]);
    });
    act(() => {
      resSinChoque.current.elegirHoraFase(1, 'futbol-1', '10:00');
      resSinChoque.current.elegirHoraFase(2, 'futbol-1', '14:00');
      resSinChoque.current.cambiarNombre('Carlos Ruiz');
    });

    expect(resSinChoque.current.puedeConfirmar).toBe(true);

    act(() => {
      resSinChoque.current.confirmar();
    });

    expect(resSinChoque.current.confirmado).toBeNull();
    expect(resSinChoque.current.error).toBe(errorOrden);
    expect(resSinChoque.current.jornadas[1].horasPorCancha).toEqual({
      'futbol-1': ['10:00'],
    });
    expect(resSinChoque.current.jornadas[2].horasPorCancha).toEqual({
      'futbol-1': ['14:00'],
    });

    unmountSinChoque();
  });

  it('14. S2: cambiarFecha en modo torneo avisa y limpia el rango si la fase 1 tiene conflicto en el nuevo día', () => {
    let diasRef = [];
    function ProbarHook() {
      const { dias } = useReservas();
      diasRef = dias;
      return useReserva({ activo: true, modoInicial: 'torneo' });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => ProbarHook(), { wrapper });

    // En voley-1, dias[1] tiene 15:00-17:00 libres y en dias[2] 16:00 está ocupada.
    act(() => {
      result.current.alternarCancha('voley-1');
      result.current.cambiarFechaFase(1, diasRef[1]);
    });
    act(() => {
      result.current.elegirHoraFase(1, 'voley-1', '15:00');
      result.current.elegirHoraFase(1, 'voley-1', '16:00');
      result.current.elegirHoraFase(1, 'voley-1', '17:00');
    });
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[1],
      horasPorCancha: { 'voley-1': ['15:00', '16:00', '17:00'] },
    });

    act(() => {
      result.current.cambiarFecha(diasRef[2]);
    });
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[2],
      horasPorCancha: { 'voley-1': ['15:00', '17:00'] },
    });
    expect(result.current.error).toContain('16:00');
  });

  it('14b. S2: fuera de modo torneo (Cumpleaños o Cancha) cambiarFecha actualiza la fecha de la fase 1 y conserva sus horas; al volver a Torneo revalida y avisa si hay choque', () => {
    let diasRef = [];
    function ProbarHook() {
      const { dias, canchas } = useReservas();
      diasRef = dias;
      return useReserva({
        activo: true,
        modoInicial: 'torneo',
        canchaInicial: canchas.find((c) => c.id === 'voley-1') || null,
      });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => ProbarHook(), { wrapper });

    // a) En Cumpleaños: cambiarFecha actualiza la fecha de la fase 1 pero conserva sus horas sin aviso;
    // al volver a Torneo, el efecto revalida, quita la hora en conflicto (16:00) y muestra el aviso.
    act(() => {
      result.current.alternarCancha('voley-1');
      result.current.cambiarFechaFase(1, diasRef[1]);
    });
    act(() => {
      result.current.elegirHoraFase(1, 'voley-1', '15:00');
      result.current.elegirHoraFase(1, 'voley-1', '16:00');
      result.current.elegirHoraFase(1, 'voley-1', '17:00');
    });
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[1],
      horasPorCancha: { 'voley-1': ['15:00', '16:00', '17:00'] },
    });

    act(() => {
      result.current.cambiarModo('cumpleanos');
    });
    act(() => {
      result.current.cambiarFecha(diasRef[2]);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[2],
      horasPorCancha: { 'voley-1': ['15:00', '16:00', '17:00'] },
    });

    act(() => {
      result.current.cambiarModo('torneo');
    });

    expect(result.current.modo).toBe('torneo');
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[2],
      horasPorCancha: { 'voley-1': ['15:00', '17:00'] },
    });
    expect(result.current.error).toContain('16:00');

    // b) En modo cancha (incluso con canchaIds vacío) cambiar a un día libre (dias[4]) conserva las horas de la fase 1
    // Además, cambiarFechaFase y elegirHoraFase en el mismo lote act() no se pisan entre sí (Point 4)
    act(() => {
      result.current.cambiarFechaFase(1, diasRef[1]);
      result.current.elegirHoraFase(1, 'voley-1', '14:00');
      result.current.elegirHoraFase(1, 'voley-1', '15:00');
    });
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[1],
      horasPorCancha: { 'voley-1': ['14:00', '15:00'] },
    });

    act(() => {
      result.current.cambiarModo('cumpleanos');
    });
    act(() => {
      result.current.alternarCancha('voley-1'); // deja canchaIds vacío fuera de torneo
      result.current.cambiarModo('cancha');
    });
    expect(result.current.canchaIds).toEqual([]);

    act(() => {
      result.current.cambiarFecha(diasRef[4]);
    });
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[4],
      horasPorCancha: { 'voley-1': ['14:00', '15:00'] },
    });

    act(() => {
      result.current.cambiarModo('torneo');
    });
    expect(result.current.canchaIds).toEqual(['voley-1']);
    expect(result.current.jornadas[1]).toEqual({
      fecha: diasRef[4],
      horasPorCancha: { 'voley-1': ['14:00', '15:00'] },
    });
    expect(result.current.error).toBeNull();
  });

  it('15. En modo Cumpleaños no aparece aviso de torneo ni se tocan las fases hasta volver a Torneo (entonces corre la limpieza)', () => {
    let ctxRef = null;
    function ProbarHookConContexto() {
      ctxRef = useReservas();
      return useReserva({ activo: true, modoInicial: 'torneo' });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => ProbarHookConContexto(), { wrapper });

    // En Torneo: elegimos voley-1 en dias[1] y 3 horas (14:00, 15:00, 16:00) en la fase 1
    act(() => {
      result.current.alternarCancha('voley-1');
      result.current.cambiarFechaFase(1, ctxRef.dias[1]);
    });
    act(() => {
      result.current.elegirHoraFase(1, 'voley-1', '14:00');
      result.current.elegirHoraFase(1, 'voley-1', '15:00');
      result.current.elegirHoraFase(1, 'voley-1', '16:00');
    });
    expect(result.current.jornadas[1].horasPorCancha).toEqual({
      'voley-1': ['14:00', '15:00', '16:00'],
    });

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
    expect(result.current.jornadas[1].horasPorCancha).toEqual({
      'voley-1': ['14:00', '15:00', '16:00'],
    });

    // Al volver a Torneo, el efecto de limpieza corre, quita solo la hora ocupada (15:00) y muestra el aviso
    act(() => {
      result.current.cambiarModo('torneo');
    });

    expect(result.current.modo).toBe('torneo');
    expect(result.current.jornadas[1].horasPorCancha).toEqual({
      'voley-1': ['14:00', '16:00'],
    });
    expect(result.current.error).toContain('15:00');
  });

  it('16. S6: con 4 equipos no permite agregar una tercera cancha y explica el motivo; al bajar de 8 a 4 equipos con 3 canchas deja las primeras 2 con aviso y solo guarda/cobra esas 2', () => {
    let diasCapturados = [];
    function CapturadorDias() {
      const { dias } = useReservas();
      diasCapturados = dias;
      return null;
    }

    // Parte A: En el hook, con 4 equipos el tope es 2 canchas (alternarCancha, alternarDeporte, motivoNoAgregable)
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

    // Al volver a Torneo con 4 equipos, recorta a 2 canchas y muestra el aviso S6
    act(() => {
      result.current.cambiarModo('torneo');
    });
    expect(result.current.canchaIds).toEqual(['futbol-1', 'futbol-2']);
    expect(result.current.error).toBe(
      'Con 4 equipos se juegan como máximo 2 partidos a la vez: se dejaron las primeras 2 canchas elegidas.'
    );

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
      result.current.elegirHoraFase(1, 'futbol-1', '14:00');
      result.current.elegirHoraFase(1, 'futbol-2', '14:00');
      result.current.elegirHoraFase(2, 'futbol-1', '15:00');
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
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 2, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 3, 14:00' })
    );
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    fireEvent.click(within(seccionFinal).getAllByRole('button')[2]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Final, Cancha 2, 15:00' })
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Elena Vargas' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar reserva/i }));

    const confirmacion = screen
      .getByText('Reserva confirmada')
      .closest('.confirmacion-reserva');
    expect(confirmacion).toBeInTheDocument();
    // La confirmación muestra solo Cancha Fútbol 2 y Cancha Fútbol 3, nunca Cancha Fútbol 1
    expect(within(confirmacion).getAllByText(/Fútbol 2/i).length).toBeGreaterThan(0);
    expect(within(confirmacion).getAllByText(/Fútbol 3/i).length).toBeGreaterThan(0);
    expect(within(confirmacion).queryByText(/Fútbol 1/i)).not.toBeInTheDocument();

    const dataGuardada = JSON.parse(
      window.localStorage.getItem('sportify_reservas_v2')
    );
    const torneoGuardado = dataGuardada.reservas.find(
      (r) => r.subtipo === 'torneo'
    );
    expect(torneoGuardado.canchaIds).toEqual(['futbol-2', 'futbol-3']);
    expect(torneoGuardado.bloques).toHaveLength(3);
    expect(torneoGuardado.bloques[0].canchaIds).toEqual(['futbol-2']);
    expect(torneoGuardado.bloques[0].fecha).toBe(diasCapturados[1]);
    expect(torneoGuardado.bloques[1].canchaIds).toEqual(['futbol-3']);
    expect(torneoGuardado.bloques[1].fecha).toBe(diasCapturados[1]);
    expect(torneoGuardado.bloques[2].canchaIds).toEqual(['futbol-2']);
    expect(torneoGuardado.bloques[2].fecha).toBe(diasCapturados[2]);
  });

  it('17. Horas salteadas por cancha (Pádel 1 16:00 y 18:00, Pádel 2 19:00), desmarcar segunda y última y bloqueo independiente en Pádel 2', () => {
    let ctxRef = null;
    function CapturadorCtx() {
      ctxRef = useReservas();
      return null;
    }

    let hookRef = null;
    function HarnessPadel() {
      const { dias, canchas } = useReservas();
      const reserva = useReserva({ activo: true, modoInicial: 'torneo' });
      hookRef = reserva;

      const initRef = useRef(false);
      useEffect(() => {
        if (!initRef.current) {
          initRef.current = true;
          // dia 3 (padel-1 solo ocupa 12:00 y 13:00; padel-2 ocupa 11:00..14:00 en semilla)
          reserva.cambiarFecha(dias[3]);
          reserva.alternarCancha('padel-1');
          reserva.alternarCancha('padel-2');
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
            torneo={reserva.modo === 'torneo' ? reserva.torneoPlan : null}
            canchas={canchas}
          />
        </div>
      );
    }

    render(
      <ReservasProvider>
        <CapturadorCtx />
        <HarnessPadel />
      </ReservasProvider>
    );

    // Ocupar 16:00 solo en Pádel 2 el día 3 (dias[3]) para verificar bloqueo independiente
    act(() => {
      ctxRef.reservar({
        canchaId: 'padel-2',
        fecha: ctxRef.dias[3],
        horas: ['16:00'],
        nombre: 'Ocupante P2',
      });
    });

    const btnP1_13 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 16:00',
    });
    const btnP2_13 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 2, 16:00, reservada',
    });
    expect(btnP1_13).not.toBeDisabled();
    expect(btnP2_13).toBeDisabled();

    // Elegir Cuartos en Pádel 1 a las 16:00 y 18:00 y en Pádel 2 a las 19:00
    const btnP1_16 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 16:00',
    });
    const btnP1_18 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 18:00',
    });
    const btnP2_19 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 2, 19:00',
    });

    fireEvent.click(btnP1_16);
    fireEvent.click(btnP1_18);
    fireEvent.click(btnP2_19);

    expect(btnP1_16).toHaveAttribute('aria-pressed', 'true');
    expect(btnP1_18).toHaveAttribute('aria-pressed', 'true');
    expect(btnP2_19).toHaveAttribute('aria-pressed', 'true');

    // Resumen en calendario y voucher muestra el detalle por cancha
    expect(
      screen.getByText(/Cancha 1: 16:00, 18:00 · Cancha 2: 19:00 \(3 horas\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cuartos de final:.*Pádel 1: 16:00, 18:00 · Pádel 2: 19:00/i)
    ).toBeInTheDocument();

    const bloquesR1 = hookRef.torneoPlan.bloques.filter((b) => b.ronda === 1);
    expect(bloquesR1).toHaveLength(2);
    expect(bloquesR1[0]).toMatchObject({
      ronda: 1,
      canchaIds: ['padel-1'],
      horas: ['16:00', '18:00'],
    });
    expect(bloquesR1[1]).toMatchObject({
      ronda: 1,
      canchaIds: ['padel-2'],
      horas: ['19:00'],
    });

    // Tocar dos veces 17:00 la marca y la desmarca; luego desmarcar segunda y última de [16, 17, 18, 19]
    const btnP1_17 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 17:00',
    });
    const btnP1_19 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 19:00',
    });
    fireEvent.click(btnP1_17);
    expect(btnP1_17).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btnP1_17);
    expect(btnP1_17).toHaveAttribute('aria-pressed', 'false');

    // Ahora P1 queda con [16:00, 17:00, 18:00, 19:00]
    fireEvent.click(btnP1_17);
    fireEvent.click(btnP1_19);
    expect(hookRef.jornadas[1].horasPorCancha['padel-1']).toEqual([
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ]);

    // Desmarcar segunda (17:00) y última (19:00) deja 16:00 y 18:00 intactas
    fireEvent.click(btnP1_17);
    fireEvent.click(btnP1_19);
    expect(btnP1_16).toHaveAttribute('aria-pressed', 'true');
    expect(btnP1_17).toHaveAttribute('aria-pressed', 'false');
    expect(btnP1_18).toHaveAttribute('aria-pressed', 'true');
    expect(btnP1_19).toHaveAttribute('aria-pressed', 'false');
    expect(hookRef.jornadas[1].horasPorCancha['padel-1']).toEqual(['16:00', '18:00']);
  });

  it('18. Semifinal antes del fin de Cuartos por la cancha 2: bloqueo preventivo en useReserva y error de orden con Confirmar bloqueado', () => {
    // a) Bloqueo preventivo: si Cuartos usa Pádel 1 a las 16:00 y Pádel 2 a las 19:00 (termina 20:00),
    // Semifinal el mismo día deshabilita 17:00, 18:00 y 19:00 aunque Pádel 1 terminó a las 17:00.
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba
          canchasIniciales={['padel-1', 'padel-2']}
          diaInicialIndex={3}
        />
      </ReservasProvider>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 16:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 2, 19:00' })
    );

    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    expect(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 17:00' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 18:00' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 19:00' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Semifinal, Cancha 2, 19:00' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 20:00' })
    ).not.toBeDisabled();

    // b) Cuando validacionesJornadas tiene ordenValido: false en Semifinal, muestra error de orden y bloquea Confirmar
    const errorOrden =
      'Semifinal debe jugarse después de que termine Cuartos de final (2026-11-12 a las 20:00).';
    render(
      <div data-testid="orden-invalido-probe">
        <CalendarioTorneo
          fases={[
            {
              ronda: 1,
              nombreRonda: 'Cuartos de final',
              partidos: 4,
              canchasEfectivas: 2,
              canchaIds: ['padel-1', 'padel-2'],
              turnos: 2,
              minutosRequeridos: 60,
              horasMinimas: 1,
            },
            {
              ronda: 2,
              nombreRonda: 'Semifinal',
              partidos: 2,
              canchasEfectivas: 2,
              canchaIds: ['padel-1', 'padel-2'],
              turnos: 1,
              minutosRequeridos: 30,
              horasMinimas: 1,
            },
          ]}
          jornadas={{
            1: {
              fecha: '2026-11-12',
              horasPorCancha: { 'padel-1': ['16:00'], 'padel-2': ['19:00'] },
            },
            2: {
              fecha: '2026-11-12',
              horasPorCancha: { 'padel-1': ['18:00'] },
            },
          }}
          validacionesJornadas={[
            { ronda: 1, nombreRonda: 'Cuartos de final', completa: true, alcanza: true, ordenValido: true, error: null },
            { ronda: 2, nombreRonda: 'Semifinal', completa: true, alcanza: true, ordenValido: false, error: errorOrden },
          ]}
          dias={['2026-11-12', '2026-11-13']}
          horasBase={['16:00', '17:00', '18:00', '19:00', '20:00']}
          canchas={[
            { id: 'padel-1', nombre: 'Cancha Pádel 1' },
            { id: 'padel-2', nombre: 'Cancha Pádel 2' },
          ]}
          canchaIds={['padel-1', 'padel-2']}
          duracionPartido={20}
          esLibreFase={() => true}
        />
        <VoucherReserva
          tipoEtiqueta="Torneo"
          fechaTexto="jue 12 de nov"
          horas={[]}
          precio={{ subtotal: 260000, descuento: 0, ahorro: 0, packsAgua: 0, total: 260000, lineas: [] }}
          puedeConfirmar={false}
          motivoBloqueo={errorOrden}
          onConfirmar={() => {}}
          onCancelar={() => {}}
          torneo={{ equipos: 8, duracionPartido: 20 }}
        />
      </div>
    );

    const probe = screen.getByTestId('orden-invalido-probe');
    expect(within(probe).getAllByText(errorOrden).length).toBeGreaterThanOrEqual(1);
    expect(
      within(probe).getByRole('button', { name: /Confirmar reserva/i })
    ).toBeDisabled();
  });

  it('19. Final con 5 horas: aviso visible, diálogo, Escape devuelve foco, Revisar horas enfoca la Final y Reservar igual reserva una sola vez sin duplicar', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba canchasIniciales={['padel-1', 'padel-2']} />
      </ReservasProvider>
    );

    // Programar Cuartos día 1, Semifinal día 2 y Final día 5 (vacío en semilla para Pádel 1) con 5 horas
    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    fireEvent.click(within(seccionCuartos).getAllByRole('button')[1]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 2, 14:00' })
    );

    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    fireEvent.click(within(seccionSemi).getAllByRole('button')[2]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 14:00' })
    );

    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    fireEvent.click(within(seccionFinal).getAllByRole('button')[5]);
    ['08:00', '09:00', '10:00', '11:00', '12:00'].forEach((h) => {
      fireEvent.click(
        screen.getByRole('button', { name: `Final, Cancha 1, ${h}` })
      );
    });

    const msgEsperado =
      'La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.';
    expect(within(seccionFinal).getByRole('status')).toHaveTextContent(msgEsperado);

    // Ir a otra pestaña y completar nombre para confirmar
    const tabCuartos = screen.getByRole('tab', { name: /Cuartos de final/i });
    fireEvent.click(tabCuartos);
    expect(tabCuartos).toHaveAttribute('aria-selected', 'true');

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Andrés Morales' },
    });

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    btnConfirmar.focus();
    fireEvent.click(btnConfirmar);

    // Abre diálogo sin reservar y enfoca Revisar horas
    let dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByText(msgEsperado)).toBeInTheDocument();
    expect(document.activeElement).toBe(
      within(dialogo).getByRole('button', { name: 'Revisar horas' })
    );
    const estadoSinReservar = JSON.parse(
      window.localStorage.getItem('sportify_reservas_v2')
    );
    expect(estadoSinReservar.reservas).toEqual([]);

    // Escape cierra el diálogo y devuelve el foco al botón Confirmar reserva
    fireEvent.keyDown(dialogo, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(btnConfirmar);
    expect(screen.queryByText('Reserva confirmada')).not.toBeInTheDocument();

    // Volver a pulsar Confirmar y pulsar Revisar horas activa la pestaña Final y enfoca su panel sin reservar
    fireEvent.click(btnConfirmar);
    dialogo = screen.getByRole('dialog');
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Revisar horas' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Final\b/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(document.activeElement).toBe(seccionFinal);
    expect(screen.queryByText('Reserva confirmada')).not.toBeInTheDocument();

    // Volver a pulsar Confirmar y pulsar Reservar igual reserva UNA sola vez
    fireEvent.click(btnConfirmar);
    dialogo = screen.getByRole('dialog');
    const btnReservarIgual = within(dialogo).getByRole('button', {
      name: 'Reservar igual',
    });
    fireEvent.click(btnReservarIgual);

    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
    const guardado = JSON.parse(window.localStorage.getItem('sportify_reservas_v2'));
    const torneos = guardado.reservas.filter((r) => r.subtipo === 'torneo');
    expect(torneos).toHaveLength(1);
  });

  it('20. Hora ocupada por otra reserva después se quita sola con el mensaje exacto y deja las demás', () => {
    let ctxRef = null;
    function ProbarOcupacionPosterior() {
      ctxRef = useReservas();
      return useReserva({ activo: true, modoInicial: 'torneo' });
    }

    const wrapper = ({ children }) => <ReservasProvider>{children}</ReservasProvider>;
    const { result } = renderHook(() => ProbarOcupacionPosterior(), { wrapper });

    act(() => {
      result.current.alternarCancha('padel-1');
      result.current.alternarCancha('padel-2');
      result.current.cambiarFechaFase(1, ctxRef.dias[3]);
    });

    act(() => {
      result.current.elegirHoraFase(1, 'padel-1', '16:00');
      result.current.elegirHoraFase(1, 'padel-1', '18:00');
      result.current.elegirHoraFase(1, 'padel-2', '19:00');
    });

    // Otra reserva ocupa padel-2 a las 19:00 en dias[3]
    act(() => {
      ctxRef.reservar({
        canchaId: 'padel-2',
        fecha: ctxRef.dias[3],
        horas: ['19:00'],
        nombre: 'Sofía Rojas',
      });
    });

    expect(result.current.jornadas[1].horasPorCancha).toEqual({
      'padel-1': ['16:00', '18:00'],
    });
    expect(result.current.error).toBe(
      'La hora de las 19:00 en Cancha 2 (Cuartos de final) ya no está libre: la quitamos.'
    );
  });

  it('21. Dos clics síncronos en Confirmar reserva en el mismo tick crean una sola reserva y el código mostrado coincide con el guardado', () => {
    render(
      <ReservasProvider>
        <FlujoTorneoPrueba canchasIniciales={['futbol-1', 'futbol-2', 'futbol-3']} />
      </ReservasProvider>
    );

    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    fireEvent.click(within(seccionCuartos).getAllByRole('button')[1]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 2, 14:00' })
    );

    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    fireEvent.click(within(seccionSemi).getAllByRole('button')[2]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 15:00' })
    );

    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    fireEvent.click(within(seccionFinal).getAllByRole('button')[3]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Final, Cancha 1, 16:00' })
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Camila Duarte' },
    });

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    expect(btnConfirmar).toBeEnabled();

    act(() => {
      btnConfirmar.click();
      btnConfirmar.click();
    });

    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();
    const guardado = JSON.parse(window.localStorage.getItem('sportify_reservas_v2'));
    expect(guardado.reservas).toHaveLength(1);
    const codigoGuardado = guardado.reservas[0].codigo;
    expect(screen.getByText(codigoGuardado)).toBeInTheDocument();
  });

  it('22. Torneo con 3 canchas elegidas y horas solo en 2: payload, confirmación y QR nombran solo las 2 en orden', () => {
    let textoQrCapturado = '';
    function FlujoConQrCapturado() {
      const { dias, canchas } = useReservas();
      const reserva = useReserva({ activo: true, modoInicial: 'torneo' });
      const initRef = useRef(false);

      useEffect(() => {
        if (!initRef.current) {
          initRef.current = true;
          reserva.alternarCancha('futbol-3');
          reserva.alternarCancha('futbol-2');
          reserva.alternarCancha('futbol-1');
        }
      }, [reserva]);

      textoQrCapturado = reserva.confirmado?.textoQr || '';

      if (reserva.confirmado) {
        return (
          <ConfirmacionReserva
            codigo={reserva.confirmado.codigo}
            textoQr={reserva.confirmado.textoQr}
            resumen={reserva.confirmado.resumen}
            onListo={reserva.reiniciar}
          />
        );
      }

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
            torneo={reserva.torneoPlan}
            canchas={canchas}
          />
        </div>
      );
    }

    const { container } = render(
      <ReservasProvider>
        <FlujoConQrCapturado />
      </ReservasProvider>
    );

    // Cuartos (4 partidos, 30 min/turno -> 2 turnos en 1 hora si hay 2 canchas): marcar en Cancha 3 y Cancha 1, sin Cancha 2
    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    fireEvent.click(within(seccionCuartos).getAllByRole('button')[1]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 3, 14:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 14:00' })
    );

    // Semifinal: marcar solo Cancha 1
    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    fireEvent.click(within(seccionSemi).getAllByRole('button')[2]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 15:00' })
    );

    // Final: marcar solo Cancha 3
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    fireEvent.click(within(seccionFinal).getAllByRole('button')[3]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Final, Cancha 3, 16:00' })
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Mateo Castro' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar reserva/i }));

    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();

    const guardado = JSON.parse(window.localStorage.getItem('sportify_reservas_v2'));
    expect(guardado.reservas).toHaveLength(1);
    const torneoGuardado = guardado.reservas[0];
    expect(torneoGuardado.canchaIds).toEqual(['futbol-3', 'futbol-1']);
    expect(torneoGuardado.canchasNecesarias).toBe(2);

    const lineaCanchas = container.querySelector('.confirmacion-reserva__canchas');
    expect(lineaCanchas).toHaveTextContent('Cancha Fútbol 3 · Cancha Fútbol 1');
    expect(lineaCanchas).not.toHaveTextContent('Cancha Fútbol 2');

    expect(textoQrCapturado).toContain('Canchas: Cancha Fútbol 3, Cancha Fútbol 1');
    expect(textoQrCapturado).not.toContain('Cancha Fútbol 2');
  });

  it('23. En cumpleaños con 2 horas seguidas el voucher muestra "Descuento por horas seguidas"', () => {
    function FlujoCumpleDescuento() {
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
        <FlujoCumpleDescuento />
      </ReservasProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /14:00/i }));
    const voucher = screen.getByLabelText('Resumen de tu reserva');
    expect(
      within(voucher).queryByText('Descuento por horas seguidas')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /15:00/i }));
    expect(
      within(voucher).getByText('Descuento por horas seguidas')
    ).toBeInTheDocument();
  });

  it('24. Torneo de 4 equipos con todas las fases el mismo día no repite la fecha en confirmación ni QR', () => {
    let diasCapturados = [];
    let confirmadoCapturado = null;
    function FlujoMismoDia() {
      const { dias, canchas } = useReservas();
      diasCapturados = dias;
      const reserva = useReserva({
        activo: true,
        modoInicial: 'torneo',
      });

      const initRef = useRef(false);
      useEffect(() => {
        if (!initRef.current) {
          initRef.current = true;
          reserva.alternarCancha('futbol-1');
          reserva.alternarCancha('futbol-2');
        }
      }, [reserva]);

      confirmadoCapturado = reserva.confirmado;

      if (reserva.confirmado) {
        return (
          <ConfirmacionReserva
            codigo={reserva.confirmado.codigo}
            textoQr={reserva.confirmado.textoQr}
            resumen={reserva.confirmado.resumen}
            onListo={reserva.reiniciar}
          />
        );
      }

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
            torneo={reserva.torneoPlan}
            canchas={canchas}
          />
        </div>
      );
    }

    const { container } = render(
      <ReservasProvider>
        <FlujoMismoDia />
      </ReservasProvider>
    );

    // Elegir 4 equipos (Semifinal y Final)
    fireEvent.click(screen.getByRole('button', { name: /4 equipos \(3 partidos\)/i }));

    // Programar Semifinal en dias[1] a las 14:00 en Cancha 1 (cubre los 2 partidos de 20 min)
    const seccionSemi = screen.getByLabelText('Fase 1: Semifinal');
    fireEvent.click(within(seccionSemi).getAllByRole('button')[1]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 14:00' })
    );

    // Programar Final el mismo día (dias[1]) a las 15:00 en Cancha 1
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const seccionFinal = screen.getByLabelText('Fase 2: Final');
    fireEvent.click(within(seccionFinal).getAllByRole('button')[1]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Final, Cancha 1, 15:00' })
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Laura Gómez' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar reserva/i }));

    expect(screen.getByText('Reserva confirmada')).toBeInTheDocument();

    const fechaEsperada = fechaCompleta(diasCapturados[1]);
    expect(confirmadoCapturado).not.toBeNull();
    expect(confirmadoCapturado.resumen.fechaTexto).toBe(fechaEsperada);

    const meta = container.querySelector('.confirmacion-reserva__meta');
    expect(meta).toHaveTextContent(`Torneo · ${fechaEsperada} · 2 jornadas`);
    expect(container.textContent).not.toContain(`${fechaEsperada} a ${fechaEsperada}`);

    expect(confirmadoCapturado.textoQr).toContain(`Fecha: ${fechaEsperada}`);
    expect(confirmadoCapturado.textoQr).not.toContain(
      `${fechaEsperada} a ${fechaEsperada}`
    );
  });
});

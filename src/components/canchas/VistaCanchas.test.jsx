import React, { useEffect, useRef } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import {
  ReservasProvider,
  STORAGE_KEY,
  useReservas,
} from '../../context/ReservasContext';
import { VistaCanchasProvider } from '../../context/VistaCanchasContext';
import AvisoConflictoReserva from '../shared/AvisoConflictoReserva';
import VistaCanchas from './VistaCanchas';

vi.mock('../../data/canchas.json', async (importOriginal) => {
  const actual = await importOriginal();
  const base = actual.default || actual;
  const canchasModificadas = base.canchas.map((c) =>
    c.id === 'padel-3'
      ? {
          ...c,
          ocupadosSemilla: [
            base.horas, // todas las horas ocupadas en el día 0
            ...c.ocupadosSemilla.slice(1),
          ],
        }
      : c
  );
  return {
    ...base,
    canchas: canchasModificadas,
    default: {
      ...base,
      canchas: canchasModificadas,
    },
  };
});

function renderVistaCanchas(ruta = '/reservar/padel') {
  window.history.pushState({}, '', ruta);
  return render(
    <ReservasProvider>
      <VistaCanchasProvider>
        <VistaCanchas />
      </VistaCanchasProvider>
    </ReservasProvider>
  );
}

describe('VistaCanchas — Auditoría (#15)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T07:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.pushState({}, '', '/');
  });

  describe('S11 — Carrusel con filtro de disponibilidad', () => {
    it('al activar "Solo con horarios libres ese día" mantiene una tarjeta activa con su acción visible', async () => {
      renderVistaCanchas('/reservar/padel');

      // Seleccionamos padel-3 (que no tiene horarios libres hoy)
      const dots = screen.getAllByRole('button', { name: /ir a la cancha/i });
      expect(dots).toHaveLength(3);
      await act(async () => {
        fireEvent.click(dots[2]);
      });

      // Buscamos el switch de filtro "Solo con horarios libres ese día"
      const switchFiltro = screen.getByRole('switch', {
        name: /solo con horarios libres ese día/i,
      });
      expect(switchFiltro).not.toBeChecked();

      // Activamos el filtro (padel-3 no tiene horarios libres hoy, la lista pasa de 3 a 2 canchas)
      await act(async () => {
        fireEvent.click(switchFiltro);
      });

      expect(switchFiltro).toBeChecked();

      // Con el carrusel actualizado, debe haber una tarjeta activa con su acción visible ("Cancha elegida" o botón del visor)
      const accion =
        screen.queryByText('Cancha elegida') ||
        screen.queryByRole('button', { name: /ver cancha/i });
      expect(accion).toBeInTheDocument();
    });
  });

  describe('S13 — Pestañas de deporte con patrón ARIA', () => {
    it('cada pestaña de deporte tiene aria-controls que apunta a un elemento role="tabpanel" con aria-labelledby igual al id de la pestaña activa', () => {
      renderVistaCanchas('/reservar/padel');

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      const tabPadel = tabs.find((t) => t.textContent.includes('Pádel'));
      expect(tabPadel).toBeDefined();
      expect(tabPadel).toHaveAttribute('aria-selected', 'true');
      expect(tabPadel).toHaveAttribute('id');

      const idPadel = tabPadel.getAttribute('id');
      expect(idPadel).toBeTruthy();

      const panelId = tabPadel.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();

      const panel = screen.getByRole('tabpanel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('id', panelId);
      expect(panel).toHaveAttribute('aria-labelledby', idPadel);

      // Todas las pestañas apuntan a este panel
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-controls', panelId);
        expect(tab).toHaveAttribute('id');
      });
    });

    it('la navegación por teclado con flechas sigue funcionando y actualiza el panel', async () => {
      renderVistaCanchas('/reservar/padel');

      const tabs = screen.getAllByRole('tab');
      const tabPadel = tabs.find((t) => t.textContent.includes('Pádel'));
      const idxPadel = tabs.indexOf(tabPadel);

      // Flecha derecha para ir a la siguiente pestaña
      await act(async () => {
        fireEvent.keyDown(tabPadel, { key: 'ArrowRight' });
      });

      const tabsActualizadas = screen.getAllByRole('tab');
      const siguienteIdx = (idxPadel + 1) % tabs.length;
      const siguienteTab = tabsActualizadas[siguienteIdx];

      expect(siguienteTab).toHaveAttribute('aria-selected', 'true');

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute(
        'aria-labelledby',
        siguienteTab.getAttribute('id')
      );
    });
  });
});

function CapturarReservasApi({ onListo }) {
  const api = useReservas();
  const listoRef = useRef(false);
  useEffect(() => {
    if (!listoRef.current) {
      listoRef.current = true;
      onListo(api);
    }
  }, [api, onListo]);
  return null;
}

function renderVistaConAviso(ruta = '/reservar/padel', onApiListo = null) {
  window.history.pushState({}, '', ruta);
  return render(
    <ReservasProvider>
      <VistaCanchasProvider>
        <AvisoConflictoReserva />
        <VistaCanchas />
        {onApiListo && <CapturarReservasApi onListo={onApiListo} />}
      </VistaCanchasProvider>
    </ReservasProvider>
  );
}

function despacharChoqueStorage({
  setItemOriginal,
  base,
  canchaId,
  fecha,
  hora,
  codigoExterno = 'SPF-EXT99',
}) {
  const otroEstado = structuredClone(base);
  if (!otroEstado.ocupados[canchaId][fecha].includes(hora)) {
    otroEstado.ocupados[canchaId][fecha].push(hora);
  }
  otroEstado.reservas.push({
    id: `${canchaId}__${fecha}__${hora}__9999`,
    codigo: codigoExterno,
    tipo: 'individual',
    canchaId,
    fecha,
    hora,
    horas: [hora],
    nombre: 'Otra Persona',
  });
  const jsonOtro = JSON.stringify(otroEstado);
  setItemOriginal.call(window.localStorage, STORAGE_KEY, jsonOtro);
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', { key: STORAGE_KEY, newValue: jsonOtro })
    );
  });
}

describe('VistaCanchas — Confirmación descartada por choque (#61)', () => {
  const setItemOriginal = Storage.prototype.setItem;

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T07:00:00'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.history.pushState({}, '', '/');
  });

  it('reemplaza la confirmación con QR por "Tu reserva no pudo completarse", enfoca el título y no revierte al cerrar el aviso', () => {
    const { container } = renderVistaConAviso('/reservar/padel');

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const fechaDia0 = '2026-11-09';

    // Elegir la primera hora libre de padel-1
    const botonesLibres = container.querySelectorAll(
      '.formulario-reserva__hora:not(:disabled)'
    );
    expect(botonesLibres.length).toBeGreaterThanOrEqual(2);
    const horaReservada = botonesLibres[0].getAttribute('data-hora');

    fireEvent.click(botonesLibres[0]);
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Laura Gómez' },
    });
    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), {
      target: { value: '3105551234' },
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(
      screen.getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();
    const codigoEl = container.querySelector('.confirmacion-reserva__codigo');
    expect(codigoEl).not.toBeNull();
    const codigoDescartado = codigoEl.textContent.trim();
    expect(codigoDescartado).toMatch(/^SPF-/);
    expect(container.querySelector('.confirmacion-reserva__qr canvas')).not.toBeNull();

    despacharChoqueStorage({
      setItemOriginal,
      base,
      canchaId: 'padel-1',
      fecha: fechaDia0,
      hora: horaReservada,
    });

    // Desaparecen el código grande y el QR
    expect(screen.queryByRole('heading', { name: 'Reserva confirmada' })).toBeNull();
    expect(container.querySelector('.confirmacion-reserva__codigo')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();

    // Aparece el bloque "no se pudo completar" con foco en el título y botón
    const bloqueDescartada = container.querySelector('.vista-canchas__descartada');
    expect(bloqueDescartada).not.toBeNull();
    expect(bloqueDescartada).not.toHaveTextContent(codigoDescartado);
    expect(bloqueDescartada.textContent).not.toMatch(
      /guardar|pestaña|almacenamiento|localStorage/i
    );

    const tituloDescartada = screen.getByRole('heading', {
      name: 'Tu reserva no pudo completarse',
    });
    expect(tituloDescartada).toBeInTheDocument();
    expect(tituloDescartada).toHaveFocus();
    expect(
      screen.getByRole('button', { name: 'Elegir otro horario' })
    ).toBeInTheDocument();

    // El aviso global sigue visible con el código descartado
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(codigoDescartado);

    // Cerrar el aviso global no hace volver el QR ni el código
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(codigoDescartado)).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Tu reserva no pudo completarse' })
    ).toBeInTheDocument();
  });

  it('no cambia la confirmación visible cuando llega un aviso de conflicto con otro código', () => {
    let api;
    const { container } = renderVistaConAviso('/reservar/padel', (ctx) => {
      api = ctx;
    });

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const fechaDia0 = api.dias[0];

    const botonesLibres = container.querySelectorAll(
      '.formulario-reserva__hora:not(:disabled)'
    );
    expect(botonesLibres.length).toBeGreaterThanOrEqual(2);
    const horaVisible = botonesLibres[0].getAttribute('data-hora');

    // Simular cuota llena antes de ambas reservas
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    // Otra reserva pendiente en otra cancha (padel-2) que luego chocará
    let resOtra;
    act(() => {
      resOtra = api.reservar({
        canchaId: 'padel-2',
        fecha: fechaDia0,
        horas: ['16:00'],
        nombre: 'Carlos Otro',
      });
    });
    expect(resOtra.ok).toBe(true);

    // Reserva visible en VistaCanchas (padel-1)
    fireEvent.click(botonesLibres[0]);
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Laura Gómez' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    const codigoVisible = container
      .querySelector('.confirmacion-reserva__codigo')
      .textContent.trim();
    expect(codigoVisible).not.toBe(resOtra.codigo);
    expect(container.querySelector('canvas')).not.toBeNull();

    // Choca únicamente la reserva de padel-2 (otro código)
    despacharChoqueStorage({
      setItemOriginal,
      base,
      canchaId: 'padel-2',
      fecha: fechaDia0,
      hora: '16:00',
      codigoExterno: 'SPF-OTRA1',
    });

    // El aviso global es del otro código, pero la confirmación actual sigue intacta
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(resOtra.codigo);
    expect(
      screen.getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();
    expect(
      container.querySelector('.confirmacion-reserva__codigo')
    ).toHaveTextContent(codigoVisible);
    expect(container.querySelector('canvas')).not.toBeNull();
    expect(
      screen.queryByRole('heading', { name: 'Tu reserva no pudo completarse' })
    ).toBeNull();
    expect(horaVisible).toBeTruthy();
  });

  it('"Elegir otro horario" conserva modalidad, cancha, fecha, nombre y teléfono sin la hora ocupada y permite confirmar otra hora con código nuevo', () => {
    let api;
    const { container } = renderVistaConAviso('/reservar/padel', (ctx) => {
      api = ctx;
    });

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

    // Seleccionar la segunda cancha (padel-2) y el tercer día (dias[2])
    const dots = screen.getAllByRole('button', { name: /ir a la cancha/i });
    fireEvent.click(dots[1]);

    const fieldsetDia = screen.getByText('Día').closest('fieldset');
    const botonesDia = within(fieldsetDia).getAllByRole('button');
    fireEvent.click(botonesDia[2]);
    const fechaElegida = api.dias[2];

    const botonesLibres = container.querySelectorAll(
      '.formulario-reserva__hora:not(:disabled)'
    );
    expect(botonesLibres.length).toBeGreaterThanOrEqual(2);
    const hora1 = botonesLibres[0].getAttribute('data-hora');
    const hora2 = botonesLibres[1].getAttribute('data-hora');

    fireEvent.click(botonesLibres[0]);
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Laura Gómez' },
    });
    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), {
      target: { value: '3105551234' },
    });

    const espiaSetItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    const codigoDescartado = container
      .querySelector('.confirmacion-reserva__codigo')
      .textContent.trim();

    despacharChoqueStorage({
      setItemOriginal,
      base,
      canchaId: 'padel-2',
      fecha: fechaElegida,
      hora: hora1,
    });

    // Restauramos setItem para la segunda reserva
    espiaSetItem.mockRestore();

    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro horario' }));

    // Conserva modalidad (Cancha), cancha (Cancha Pádel 2), fecha (día 2), nombre y teléfono
    expect(screen.getByRole('button', { name: 'Cancha' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    const fieldsetDiaTrasVolver = screen.getByText('Día').closest('fieldset');
    const botonesDiaTrasVolver = within(fieldsetDiaTrasVolver).getAllByRole('button');
    expect(botonesDiaTrasVolver[2]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Laura Gómez');
    expect(screen.getByLabelText('Teléfono (opcional)')).toHaveValue('3105551234');
    expect(
      screen.getByRole('button', { name: /ver cancha 2 de pádel en grande/i })
    ).toBeInTheDocument();

    // La hora ocupada no está seleccionada y aparece deshabilitada
    const botonHoraOcupada = container.querySelector(
      `.formulario-reserva__hora[data-hora="${hora1}"]`
    );
    expect(botonHoraOcupada).toBeDisabled();
    expect(botonHoraOcupada).toHaveAttribute('aria-pressed', 'false');

    // Elegir otra hora libre y confirmar
    const botonHoraNueva = container.querySelector(
      `.formulario-reserva__hora[data-hora="${hora2}"]`
    );
    expect(botonHoraNueva).not.toBeDisabled();
    fireEvent.click(botonHoraNueva);
    expect(screen.getByText('Cancha Pádel 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(
      screen.getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();
    expect(
      container.querySelector('.confirmacion-reserva__canchas')
    ).toHaveTextContent('Cancha Pádel 2');
    const codigoNuevo = container
      .querySelector('.confirmacion-reserva__codigo')
      .textContent.trim();
    expect(codigoNuevo).toMatch(/^SPF-/);
    expect(codigoNuevo).not.toBe(codigoDescartado);
    expect(container.querySelector('.confirmacion-reserva__qr canvas')).not.toBeNull();
  });

  it('un evento (cumpleaños) descartado por un choque también cambia a "Tu reserva no pudo completarse"', () => {
    const { container } = renderVistaConAviso('/reservar/padel');

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const fechaDia0 = '2026-11-09';

    // Cambiar a modo Cumpleaños (conserva padel-1 en canchaIds)
    fireEvent.click(screen.getByRole('button', { name: 'Cumpleaños' }));

    const botonesLibres = container.querySelectorAll(
      '.formulario-reserva__hora:not(:disabled)'
    );
    expect(botonesLibres.length).toBeGreaterThanOrEqual(1);
    const horaEvento = botonesLibres[0].getAttribute('data-hora');

    fireEvent.click(botonesLibres[0]);
    fireEvent.change(screen.getByLabelText('Invitados'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Sofía Fiesta' },
    });
    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), {
      target: { value: '3119998877' },
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(
      screen.getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();
    const codigoEvento = container
      .querySelector('.confirmacion-reserva__codigo')
      .textContent.trim();
    expect(container.querySelector('canvas')).not.toBeNull();

    despacharChoqueStorage({
      setItemOriginal,
      base,
      canchaId: 'padel-1',
      fecha: fechaDia0,
      hora: horaEvento,
      codigoExterno: 'SPF-EVCHO',
    });

    expect(screen.queryByRole('heading', { name: 'Reserva confirmada' })).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
    const tituloDescartada = screen.getByRole('heading', {
      name: 'Tu reserva no pudo completarse',
    });
    expect(tituloDescartada).toBeInTheDocument();
    expect(tituloDescartada).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent(codigoEvento);

    // Volver al formulario conserva modalidad Cumpleaños, invitados y contacto
    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro horario' }));
    expect(screen.getByRole('button', { name: 'Cumpleaños' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByLabelText('Invitados')).toHaveValue(20);
    expect(screen.getByLabelText('Nombre')).toHaveValue('Sofía Fiesta');
    expect(screen.getByLabelText('Teléfono (opcional)')).toHaveValue('3119998877');
    expect(
      container.querySelector(`.formulario-reserva__hora[data-hora="${horaEvento}"]`)
    ).toBeDisabled();
  });

  function programarTorneoPadel1({ container, nombre = 'Laura Gómez', telefono = '3105551234' }) {
    // Agregar Cancha Pádel 1 (tarjeta activa inicial)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al evento' }));

    // Cuartos: 2.º día a las 11:00 y 12:00
    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const diasCuartos = within(seccionCuartos)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    fireEvent.click(diasCuartos[1]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 11:00' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 12:00' })
    );

    // Semifinal: 3.er día a las 11:00
    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    const diasSemi = within(seccionSemi)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    fireEvent.click(diasSemi[2]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 11:00' })
    );

    // Final: 4.º día a las 11:00
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    const diasFinal = within(seccionFinal)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    fireEvent.click(diasFinal[3]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Final, Cancha 1, 11:00' })
    );

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: nombre },
    });
    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), {
      target: { value: telefono },
    });

    expect(container.querySelector('.formulario-reserva__error')).toBeNull();
  }

  it('torneo descartado por choque en Cuartos: "Elegir otro horario" quita solo la hora chocada y conserva las demás horas de Cuartos, Semifinal, Final y contacto', () => {
    let api;
    const { container } = renderVistaConAviso('/reservar/padel?modo=torneo', (ctx) => {
      api = ctx;
    });

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    programarTorneoPadel1({ container });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    expect(
      screen.getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();

    // Otra pestaña ocupa Pádel 1, 2.º día, 11:00
    despacharChoqueStorage({
      setItemOriginal,
      base,
      canchaId: 'padel-1',
      fecha: api.dias[1],
      hora: '11:00',
    });

    expect(
      screen.getByRole('heading', { name: 'Tu reserva no pudo completarse' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro horario' }));

    // Cuartos (1.ª fase visible por defecto): 11:00 deshabilitada y sin elegir, 12:00 sigue elegida
    fireEvent.click(screen.getByRole('tab', { name: /Cuartos de final/i }));
    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const diasCuartos = within(seccionCuartos)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    expect(diasCuartos[1]).toHaveAttribute('aria-pressed', 'true');
    const btnCuartos11 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 11:00, reservada',
    });
    expect(btnCuartos11).toBeDisabled();
    expect(btnCuartos11).toHaveAttribute('aria-pressed', 'false');
    const btnCuartos12 = screen.getByRole('button', {
      name: 'Cuartos de final, Cancha 1, 12:00',
    });
    expect(btnCuartos12).not.toBeDisabled();
    expect(btnCuartos12).toHaveAttribute('aria-pressed', 'true');

    // Semifinal conserva 3.er día y 11:00
    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    const diasSemi = within(seccionSemi)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    expect(diasSemi[2]).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 11:00' })
    ).toHaveAttribute('aria-pressed', 'true');

    // Final conserva 4.º día y 11:00
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    const diasFinal = within(seccionFinal)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    expect(diasFinal[3]).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Final, Cancha 1, 11:00' })
    ).toHaveAttribute('aria-pressed', 'true');

    // Nombre y teléfono conservados
    expect(screen.getByLabelText('Nombre')).toHaveValue('Laura Gómez');
    expect(screen.getByLabelText('Teléfono (opcional)')).toHaveValue('3105551234');
  });

  it('torneo descartado por choque en la última fase (Final): Cuartos y Semifinal conservan todas sus horas y Final queda sin la hora que chocó', () => {
    let api;
    const { container } = renderVistaConAviso('/reservar/padel?modo=torneo', (ctx) => {
      api = ctx;
    });

    const base = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    programarTorneoPadel1({ container });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    expect(
      screen.getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();

    // Otra pestaña ocupa Pádel 1, 4.º día, 11:00 (Final)
    despacharChoqueStorage({
      setItemOriginal,
      base,
      canchaId: 'padel-1',
      fecha: api.dias[3],
      hora: '11:00',
      codigoExterno: 'SPF-FIN99',
    });

    expect(
      screen.getByRole('heading', { name: 'Tu reserva no pudo completarse' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro horario' }));

    // Cuartos conserva 11:00 y 12:00 del 2.º día
    fireEvent.click(screen.getByRole('tab', { name: /Cuartos de final/i }));
    const seccionCuartos = screen.getByLabelText('Fase 1: Cuartos de final');
    const diasCuartos = within(seccionCuartos)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    expect(diasCuartos[1]).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 11:00' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Cuartos de final, Cancha 1, 12:00' })
    ).toHaveAttribute('aria-pressed', 'true');

    // Semifinal conserva 11:00 del 3.er día
    fireEvent.click(screen.getByRole('tab', { name: /Semifinal/i }));
    const seccionSemi = screen.getByLabelText('Fase 2: Semifinal');
    const diasSemi = within(seccionSemi)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    expect(diasSemi[2]).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Semifinal, Cancha 1, 11:00' })
    ).toHaveAttribute('aria-pressed', 'true');

    // Final queda sin 11:00 (deshabilitada y sin elegir)
    fireEvent.click(screen.getByRole('tab', { name: /^Final\b/i }));
    const seccionFinal = screen.getByLabelText('Fase 3: Final');
    const diasFinal = within(seccionFinal)
      .getByRole('group', { name: 'Elige el día' })
      .querySelectorAll('button');
    expect(diasFinal[3]).toHaveAttribute('aria-pressed', 'true');
    const btnFinal11 = screen.getByRole('button', {
      name: 'Final, Cancha 1, 11:00, reservada',
    });
    expect(btnFinal11).toBeDisabled();
    expect(btnFinal11).toHaveAttribute('aria-pressed', 'false');
  });

  it('camino exitoso de torneo: confirma con código y QR sin mostrar mensajes de error', () => {
    const { container } = renderVistaConAviso('/reservar/padel?modo=torneo');
    programarTorneoPadel1({ container });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(
      screen.getByRole('heading', { name: 'Reserva confirmada' })
    ).toBeInTheDocument();
    const codigoEl = container.querySelector('.confirmacion-reserva__codigo');
    expect(codigoEl).not.toBeNull();
    expect(codigoEl.textContent.trim()).toMatch(/^SPF-/);
    expect(container.querySelector('.confirmacion-reserva__qr canvas')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(/ya no está libre/i)).toBeNull();
  });
});

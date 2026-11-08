import React, { useEffect, useRef, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ReservasProvider, useReservas } from '../../context/ReservasContext';
import MisReservas from './MisReservas';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

function ComponentePrueba({ onReservaCreada, abiertoInicial = true }) {
  const { reservar, dias, canchas } = useReservas();
  const [abierto, setAbierto] = useState(abiertoInicial);
  const yaReservoRef = useRef(false);
  const botonRef = useRef(null);

  useEffect(() => {
    if (yaReservoRef.current) return;
    yaReservoRef.current = true;
    // Se reserva en dias[2] a las 14:00 (futura con margen > 6 horas para ser cancelable)
    const fecha = dias[2] || '2026-11-05';
    const cancha = canchas[0] || { id: 'voley-1' };
    const res = reservar({
      canchaId: cancha.id,
      fecha,
      horas: ['14:00', '15:00'],
      nombre: 'Carlos Mendoza',
      telefono: '3101234567',
    });
    if (onReservaCreada) {
      onReservaCreada(res);
    }
  }, [reservar, dias, canchas, onReservaCreada]);

  return (
    <div>
      <button
        ref={botonRef}
        id="btn-navbar"
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
      >
        Mis reservas
      </button>
      <MisReservas
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        botonDisparadorRef={botonRef}
      />
    </div>
  );
}

describe('MisReservas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('busca una reserva por código, muestra sus datos, el QR y permite cancelarla en dos pasos', () => {
    let reservaCreada = null;

    render(
      <ReservasProvider>
        <ComponentePrueba
          onReservaCreada={(res) => {
            reservaCreada = res;
          }}
        />
      </ReservasProvider>
    );

    expect(reservaCreada).toBeTruthy();
    expect(reservaCreada.ok).toBe(true);
    const codigo = reservaCreada.codigo;

    // Buscar por código
    const inputCodigo = screen.getByPlaceholderText('SPF-XXXXXX');
    fireEvent.change(inputCodigo, { target: { value: codigo } });

    const btnBuscar = screen.getByRole('button', { name: /buscar/i });
    fireEvent.click(btnBuscar);

    // Debe mostrar la tarjeta con el código y el tipo
    expect(screen.getByText(codigo)).toBeInTheDocument();
    expect(screen.getByText('Cancha')).toBeInTheDocument();

    // Ver QR
    const btnVerQr = screen.getByRole('button', { name: /ver qr/i });
    fireEvent.click(btnVerQr);
    expect(
      screen.getByTitle(new RegExp(`Código QR de la reserva ${codigo}`, 'i'))
    ).toBeInTheDocument();

    // Intentar cancelar: primer paso muestra confirmación sin confirm nativo
    const btnCancelar = screen.getByRole('button', { name: /cancelar reserva/i });
    fireEvent.click(btnCancelar);

    expect(
      screen.getByText('¿Seguro? Esta acción libera el horario.')
    ).toBeInTheDocument();

    // Segundo paso: confirmar
    const btnConfirmar = screen.getByRole('button', { name: /sí, cancelar/i });
    fireEvent.click(btnConfirmar);

    // Mensaje de éxito
    expect(
      screen.getByText(/tu reserva ha sido cancelada exitosamente/i)
    ).toBeInTheDocument();
  });

  test('busca una reserva por nombre y teléfono normalizados y la encuentra', () => {
    let reservaCreada = null;

    render(
      <ReservasProvider>
        <ComponentePrueba
          onReservaCreada={(res) => {
            reservaCreada = res;
          }}
        />
      </ReservasProvider>
    );

    expect(reservaCreada.ok).toBe(true);

    // Cambiar a la pestaña de nombre y teléfono
    const pestanaDatos = screen.getByRole('tab', { name: /por nombre y teléfono/i });
    fireEvent.click(pestanaDatos);

    const inputNombre = screen.getByPlaceholderText(/como registraste la reserva/i);
    const inputTelefono = screen.getByPlaceholderText(/300 123 4567/i);

    // Escribir en minúsculas y con espacios en el teléfono
    fireEvent.change(inputNombre, { target: { value: 'carlos mendoza' } });
    fireEvent.change(inputTelefono, { target: { value: '310 123 4567' } });

    const btnBuscar = screen.getByRole('button', { name: /buscar reservas/i });
    fireEvent.click(btnBuscar);

    // Debe encontrar la reserva
    expect(screen.getByText(reservaCreada.codigo)).toBeInTheDocument();
  });

  test('muestra aviso si no encuentra reservas', () => {
    render(
      <ReservasProvider>
        <ComponentePrueba />
      </ReservasProvider>
    );

    const inputCodigo = screen.getByPlaceholderText('SPF-XXXXXX');
    fireEvent.change(inputCodigo, { target: { value: 'SPF-999999' } });

    const btnBuscar = screen.getByRole('button', { name: /buscar/i });
    fireEvent.click(btnBuscar);

    expect(
      screen.getByText('No encontramos reservas con esos datos.')
    ).toBeInTheDocument();
  });

  test('muestra errores de validación si los campos requeridos están vacíos o incompletos', () => {
    render(
      <ReservasProvider>
        <ComponentePrueba />
      </ReservasProvider>
    );

    // Formulario por código vacío
    const btnBuscar = screen.getByRole('button', { name: /buscar/i });
    fireEvent.click(btnBuscar);
    expect(
      screen.getByText('Por favor, escribe el código de tu reserva.')
    ).toBeInTheDocument();

    // Formulario por datos con teléfono inválido
    const pestanaDatos = screen.getByRole('tab', { name: /por nombre y teléfono/i });
    fireEvent.click(pestanaDatos);

    const inputNombre = screen.getByPlaceholderText(/como registraste la reserva/i);
    const inputTelefono = screen.getByPlaceholderText(/300 123 4567/i);
    fireEvent.change(inputNombre, { target: { value: 'Carlos' } });
    fireEvent.change(inputTelefono, { target: { value: '123' } });

    const btnBuscarDatos = screen.getByRole('button', { name: /buscar reservas/i });
    fireEvent.click(btnBuscarDatos);

    expect(
      screen.getByText(/debe empezar por 3 y tener 10 dígitos/i)
    ).toBeInTheDocument();
  });

  test('el botón cerrar invoca onCerrar', () => {
    const handleCerrar = vi.fn();
    render(
      <ReservasProvider>
        <MisReservas abierto={true} onCerrar={handleCerrar} />
      </ReservasProvider>
    );

    const btnCerrar = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(btnCerrar);

    expect(handleCerrar).toHaveBeenCalledTimes(1);
  });

  test('S6: montado cerrado no enfoca el disparador; al abrir y cerrar sí devuelve el foco', () => {
    render(
      <ReservasProvider>
        <ComponentePrueba abiertoInicial={false} />
      </ReservasProvider>
    );

    const btnNavbar = screen.getByRole('button', { name: /mis reservas/i });
    expect(document.activeElement).not.toBe(btnNavbar);

    // Abrir modal
    fireEvent.click(btnNavbar);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Cerrar modal
    const btnCerrar = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(btnCerrar);

    // El foco debe volver al disparador
    expect(document.activeElement).toBe(btnNavbar);
  });

  test('S7: al cerrar y volver a abrir se reinicia el estado y vuelve a la pestaña inicial', () => {
    let reservaCreada = null;
    render(
      <ReservasProvider>
        <ComponentePrueba
          abiertoInicial={true}
          onReservaCreada={(res) => {
            reservaCreada = res;
          }}
        />
      </ReservasProvider>
    );

    const codigo = reservaCreada.codigo;

    // Buscar por código
    const inputCodigo = screen.getByPlaceholderText('SPF-XXXXXX');
    fireEvent.change(inputCodigo, { target: { value: codigo } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(screen.getByText(codigo)).toBeInTheDocument();

    // Cerrar el modal
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reabrir
    fireEvent.click(screen.getByRole('button', { name: /mis reservas/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // No debe aparecer la búsqueda anterior ni el código escrito
    expect(screen.queryByText(codigo)).not.toBeInTheDocument();
    const inputCodigoReabierto = screen.getByPlaceholderText('SPF-XXXXXX');
    expect(inputCodigoReabierto.value).toBe('');

    // Cambiar a la pestaña de datos, escribir algo y cerrar
    const tabDatos = screen.getByRole('tab', { name: /por nombre y teléfono/i });
    fireEvent.click(tabDatos);
    const inputNombre = screen.getByPlaceholderText(/como registraste la reserva/i);
    fireEvent.change(inputNombre, { target: { value: 'Carlos' } });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    // Reabrir: debe estar en la pestaña inicial ('codigo')
    fireEvent.click(screen.getByRole('button', { name: /mis reservas/i }));
    const tabCodigo = screen.getByRole('tab', { name: /por código/i });
    expect(tabCodigo).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByPlaceholderText(/como registraste la reserva/i)).not.toBeInTheDocument();
  });

  test('S8: pestañas con patrón ARIA completo (aria-controls, tabpanel, aria-labelledby, tabIndex móvil y navegación por teclado)', () => {
    render(
      <ReservasProvider>
        <ComponentePrueba abiertoInicial={true} />
      </ReservasProvider>
    );

    const tabCodigo = screen.getByRole('tab', { name: /por código/i });
    const tabDatos = screen.getByRole('tab', { name: /por nombre y teléfono/i });

    // aria-selected y tabIndex móvil inicial
    expect(tabCodigo).toHaveAttribute('aria-selected', 'true');
    expect(tabCodigo).toHaveAttribute('tabIndex', '0');
    expect(tabDatos).toHaveAttribute('aria-selected', 'false');
    expect(tabDatos).toHaveAttribute('tabIndex', '-1');

    // aria-controls solo apunta a un panel existente en el DOM con role="tabpanel"
    const pestanasIniciales = screen.getAllByRole('tab');
    pestanasIniciales.forEach((tab) => {
      const controlsId = tab.getAttribute('aria-controls');
      if (controlsId) {
        const panel = document.getElementById(controlsId);
        expect(panel).toBeInTheDocument();
        expect(panel).toHaveAttribute('role', 'tabpanel');
      }
    });

    const panelCodigoId = tabCodigo.getAttribute('aria-controls');
    expect(panelCodigoId).toBeTruthy();
    const panelCodigo = document.getElementById(panelCodigoId);
    expect(panelCodigo).toBeInTheDocument();
    expect(panelCodigo).toHaveAttribute('role', 'tabpanel');
    expect(panelCodigo).toHaveAttribute('aria-labelledby', tabCodigo.id);

    // Navegación por teclado: ArrowRight activa la siguiente pestaña
    fireEvent.keyDown(tabCodigo, { key: 'ArrowRight' });
    expect(tabDatos).toHaveAttribute('aria-selected', 'true');
    expect(tabDatos).toHaveAttribute('tabIndex', '0');
    expect(tabCodigo).toHaveAttribute('aria-selected', 'false');
    expect(tabCodigo).toHaveAttribute('tabIndex', '-1');
    expect(document.activeElement).toBe(tabDatos);

    // El panel cambia a datos
    screen.getAllByRole('tab').forEach((tab) => {
      const controlsId = tab.getAttribute('aria-controls');
      if (controlsId) {
        const panel = document.getElementById(controlsId);
        expect(panel).toBeInTheDocument();
        expect(panel).toHaveAttribute('role', 'tabpanel');
      }
    });

    const panelDatosId = tabDatos.getAttribute('aria-controls');
    expect(panelDatosId).toBeTruthy();
    const panelDatos = document.getElementById(panelDatosId);
    expect(panelDatos).toBeInTheDocument();
    expect(panelDatos).toHaveAttribute('role', 'tabpanel');
    expect(panelDatos).toHaveAttribute('aria-labelledby', tabDatos.id);

    // ArrowRight circular: de la última vuelve a la primera
    fireEvent.keyDown(tabDatos, { key: 'ArrowRight' });
    expect(tabCodigo).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabCodigo);

    // ArrowLeft circular: de la primera va a la última
    fireEvent.keyDown(tabCodigo, { key: 'ArrowLeft' });
    expect(tabDatos).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabDatos);

    // Home va a la primera
    fireEvent.keyDown(tabDatos, { key: 'Home' });
    expect(tabCodigo).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabCodigo);

    // End va a la última
    fireEvent.keyDown(tabDatos, { key: 'End' });
    expect(tabDatos).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(tabDatos);
  });
});

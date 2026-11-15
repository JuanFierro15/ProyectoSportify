import React, { useRef, useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DialogoHorasSinPartido from './DialogoHorasSinPartido';

describe('DialogoHorasSinPartido', () => {
  it('no renderiza diálogo cuando abierto es false', () => {
    render(
      <DialogoHorasSinPartido
        abierto={false}
        mensajes={['La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.']}
        onRevisar={() => {}}
        onReservarIgual={() => {}}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra título, mensajes, pregunta de cobro y enfoca Revisar horas al abrir', () => {
    const mensaje =
      'La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.';
    render(
      <DialogoHorasSinPartido
        abierto={true}
        mensajes={[mensaje]}
        onRevisar={() => {}}
        onReservarIgual={() => {}}
      />
    );

    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    const labelledBy = dialogo.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy)).toHaveTextContent('Hay horas sin partido');

    expect(screen.getByText(mensaje)).toBeInTheDocument();
    expect(
      screen.getByText('¿Quieres reservar igual? Esas horas se cobran.')
    ).toBeInTheDocument();

    const btnRevisar = screen.getByRole('button', { name: 'Revisar horas' });
    expect(document.activeElement).toBe(btnRevisar);
  });

  it('atrapa Tab y Shift+Tab entre Revisar horas y Reservar igual', () => {
    render(
      <DialogoHorasSinPartido
        abierto={true}
        mensajes={['La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.']}
        onRevisar={() => {}}
        onReservarIgual={() => {}}
      />
    );

    const dialogo = screen.getByRole('dialog');
    const btnRevisar = screen.getByRole('button', { name: 'Revisar horas' });
    const btnReservarIgual = screen.getByRole('button', { name: 'Reservar igual' });

    expect(document.activeElement).toBe(btnRevisar);

    fireEvent.keyDown(dialogo, { key: 'Escape', shiftKey: false });
    // Shift+Tab desde el primer botón vuelve al último
    fireEvent.keyDown(btnRevisar, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btnReservarIgual);

    // Tab desde el último botón vuelve al primero
    fireEvent.keyDown(btnReservarIgual, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(btnRevisar);
  });

  it('Escape equivale a Revisar horas y al cerrar devuelve el foco al botón disparador', () => {
    const onReservarIgual = vi.fn();

    function WrapperConDisparador() {
      const [abierto, setAbierto] = useState(false);
      const btnRef = useRef(null);

      return (
        <div>
          <button
            ref={btnRef}
            type="button"
            onClick={() => setAbierto(true)}
          >
            Confirmar reserva
          </button>
          <DialogoHorasSinPartido
            abierto={abierto}
            mensajes={['La Final es 1 partido de 20 min. Marcaste 5 horas y 4 quedarían sin partido.']}
            onRevisar={() => setAbierto(false)}
            onReservarIgual={() => {
              onReservarIgual();
              setAbierto(false);
            }}
          />
        </div>
      );
    }

    render(<WrapperConDisparador />);
    const disparador = screen.getByRole('button', { name: 'Confirmar reserva' });
    disparador.focus();
    expect(document.activeElement).toBe(disparador);

    fireEvent.click(disparador);
    const btnRevisar = screen.getByRole('button', { name: 'Revisar horas' });
    expect(document.activeElement).toBe(btnRevisar);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(disparador);
    expect(onReservarIgual).not.toHaveBeenCalled();

    // Al volver a abrir y elegir Reservar igual, invoca onReservarIgual y restaura foco
    fireEvent.click(disparador);
    fireEvent.click(screen.getByRole('button', { name: 'Reservar igual' }));
    expect(onReservarIgual).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(disparador);
  });
});

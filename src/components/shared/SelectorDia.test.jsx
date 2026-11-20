import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import SelectorDia from './SelectorDia';

const DIAS = [
  '2026-11-19',
  '2026-11-20',
  '2026-11-21',
  '2026-11-22',
  '2026-11-23',
  '2026-11-24',
  '2026-11-25',
];

describe('SelectorDia', () => {
  it('muestra "bloqueado", deshabilita el botón, termina aria-label en ", bloqueado" y no dispara onChange', () => {
    const onChange = vi.fn();

    render(
      <SelectorDia
        dias={DIAS}
        valor={DIAS[1]}
        onChange={onChange}
        contarLibres={() => 11}
        esDiaBloqueado={(iso) => iso === DIAS[0]}
      />
    );

    const botonBloqueado = screen.getByRole('button', {
      name: /Hoy 19 de nov, bloqueado$/,
    });
    expect(botonBloqueado).toBeDisabled();
    expect(botonBloqueado.getAttribute('aria-label')).toMatch(/, bloqueado$/);
    expect(within(botonBloqueado).getByText('bloqueado')).toBeInTheDocument();

    fireEvent.click(botonBloqueado);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('deshabilita un día lleno no seleccionado con "completo", pero mantiene habilitado el día lleno seleccionado', () => {
    const onChange = vi.fn();

    render(
      <SelectorDia
        dias={DIAS}
        valor={DIAS[2]}
        onChange={onChange}
        contarLibres={(iso) => (iso === DIAS[2] || iso === DIAS[4] ? 0 : 8)}
      />
    );

    const botonLlenoNoSel = screen.getByRole('button', {
      name: /lun 23 de nov, sin horarios libres$/,
    });
    expect(botonLlenoNoSel).toBeDisabled();
    expect(botonLlenoNoSel).toHaveAttribute('aria-pressed', 'false');
    expect(within(botonLlenoNoSel).getByText('completo')).toBeInTheDocument();

    fireEvent.click(botonLlenoNoSel);
    expect(onChange).not.toHaveBeenCalled();

    const botonLlenoSel = screen.getByRole('button', {
      name: /sáb 21 de nov, sin horarios libres$/,
    });
    expect(botonLlenoSel).toBeEnabled();
    expect(botonLlenoSel).toHaveAttribute('aria-pressed', 'true');
    expect(within(botonLlenoSel).getByText('completo')).toBeInTheDocument();

    fireEvent.click(botonLlenoSel);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(DIAS[2]);
  });

  it('muestra "13 libres" habilitado y llama onChange con la fecha ISO en el segundo y el último día de la tira', () => {
    const onChange = vi.fn();

    render(
      <SelectorDia
        dias={DIAS}
        valor={DIAS[0]}
        onChange={onChange}
        contarLibres={(iso) => (iso === DIAS[1] ? 13 : iso === DIAS[6] ? 7 : 10)}
      />
    );

    const segundoDia = screen.getByRole('button', {
      name: /Mañana 20 de nov, 13 libres$/,
    });
    expect(segundoDia).toBeEnabled();
    expect(within(segundoDia).getByText('13 libres')).toBeInTheDocument();

    const ultimoDia = screen.getByRole('button', {
      name: /mié 25 de nov, 7 libres$/,
    });
    expect(ultimoDia).toBeEnabled();
    expect(within(ultimoDia).getByText('7 libres')).toBeInTheDocument();

    fireEvent.click(segundoDia);
    expect(onChange).toHaveBeenNthCalledWith(1, DIAS[1]);

    fireEvent.click(ultimoDia);
    expect(onChange).toHaveBeenNthCalledWith(2, DIAS[6]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

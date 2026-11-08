import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DepthCarousel from './DepthCarousel';

describe('DepthCarousel (S11)', () => {
  it('con 5 ítems e initialIndex={2} deja activa la tercera tarjeta', () => {
    const items = [
      { id: '1', image: '1.jpg' },
      { id: '2', image: '2.jpg' },
      { id: '3', image: '3.jpg' },
      { id: '4', image: '4.jpg' },
      { id: '5', image: '5.jpg' },
    ];
    render(
      <DepthCarousel
        items={items}
        initialIndex={2}
        renderOverlay={(item, _i, esActiva) => (
          <span>{esActiva ? `activa-${item.id}` : `inactiva-${item.id}`}</span>
        )}
      />
    );

    expect(screen.getByText('activa-3')).toBeInTheDocument();
    const dots = screen.getAllByRole('button', { name: /ir a la cancha/i });
    expect(dots[2]).toHaveAttribute('aria-pressed', 'true');
  });

  it('acota el índice cuando disminuye el número de ítems para que siempre haya exactamente una tarjeta activa', () => {
    const items5 = [
      { id: '1', image: '1.jpg' },
      { id: '2', image: '2.jpg' },
      { id: '3', image: '3.jpg' },
      { id: '4', image: '4.jpg' },
      { id: '5', image: '5.jpg' },
    ];
    const items2 = [
      { id: '1', image: '1.jpg' },
      { id: '2', image: '2.jpg' },
    ];

    const { rerender } = render(
      <DepthCarousel
        items={items5}
        initialIndex={4}
        renderOverlay={(_item, _i, esActiva) => (esActiva ? <span>activa</span> : null)}
      />
    );

    expect(screen.getByText('activa')).toBeInTheDocument();
    const dotsIniciales = screen.getAllByRole('button', { name: /ir a la cancha/i });
    expect(dotsIniciales[4]).toHaveAttribute('aria-pressed', 'true');

    // Al volver a renderizar con 2 ítems:
    rerender(
      <DepthCarousel
        items={items2}
        initialIndex={4}
        renderOverlay={(_item, _i, esActiva) => (esActiva ? <span>activa</span> : null)}
      />
    );

    const activas = screen.queryAllByText('activa');
    expect(activas).toHaveLength(1);

    const dotsActualizados = screen.getAllByRole('button', { name: /ir a la cancha/i });
    const dotsPresionados = dotsActualizados.filter((dot) => dot.getAttribute('aria-pressed') === 'true');
    expect(dotsPresionados).toHaveLength(1);
  });
});

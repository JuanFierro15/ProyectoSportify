import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('al arrastrar de la última tarjeta a la primera, el último onChange coincide con la tarjeta activa', () => {
    const items = [
      { id: '1', image: '1.jpg' },
      { id: '2', image: '2.jpg' },
      { id: '3', image: '3.jpg' },
    ];
    const onChange = vi.fn();
    render(
      <DepthCarousel
        items={items}
        initialIndex={2}
        autoScale={false}
        onChange={onChange}
        renderOverlay={(item, _i, esActiva) => (esActiva ? <span>activa-{item.id}</span> : null)}
      />
    );

    const carrusel = document.querySelector('.depth-carousel');
    carrusel.setPointerCapture = () => {};
    // Movimiento lento (velocidad casi nula) para que la posición final dependa solo del recorrido.
    let reloj = 0;
    const ahora = vi.spyOn(performance, 'now').mockImplementation(() => (reloj += 1000));
    // Arrastre hacia la izquierda de algo más de una tarjeta (paso de 165 px con cardWidth 300):
    // con loop, la posición queda en ~3,1, por encima de count.
    fireEvent.pointerDown(carrusel, { clientX: 1000, pointerId: 1 });
    fireEvent.pointerMove(carrusel, { clientX: 900, pointerId: 1 });
    fireEvent.pointerMove(carrusel, { clientX: 818, pointerId: 1 });
    fireEvent.pointerUp(carrusel, { clientX: 818, pointerId: 1 });
    ahora.mockRestore();

    expect(onChange).toHaveBeenCalled();
    const [indiceFinal] = onChange.mock.calls.at(-1);
    const activa = screen.getByText(/^activa-/);
    expect(activa).toHaveTextContent(`activa-${items[indiceFinal].id}`);
    const dots = screen.getAllByRole('button', { name: /ir a la cancha/i });
    expect(dots[indiceFinal]).toHaveAttribute('aria-pressed', 'true');
  });
});

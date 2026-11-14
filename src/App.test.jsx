import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

afterEach(() => {
  window.history.pushState({}, '', '/');
});

test('la aplicación se renderiza sin errores con landmark main y skip link en inicio', () => {
  render(<App />);

  const skipLink = screen.getByRole('link', { name: 'Saltar al contenido principal' });
  expect(skipLink).toHaveAttribute('href', '#contenido-principal');

  const mains = screen.getAllByRole('main');
  expect(mains).toHaveLength(1);
  expect(mains[0]).toHaveAttribute('id', 'contenido-principal');

  fireEvent.click(skipLink);
  expect(document.activeElement).toBe(mains[0]);
  expect(window.location.hash).toBe('');

  skipLink.focus();
  fireEvent.click(skipLink);
  expect(document.activeElement).toBe(mains[0]);
  expect(window.location.hash).toBe('');
});

test('renderiza la página de reserva con un único landmark main al entrar en /reservar/padel', () => {
  window.history.pushState({}, '', '/reservar/padel');
  render(<App />);

  const mains = screen.getAllByRole('main');
  expect(mains).toHaveLength(1);
  expect(mains[0]).toHaveAttribute('id', 'contenido-principal');

  expect(
    screen.getByRole('heading', { name: 'Reserva tu cancha' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /volver al inicio/i })
  ).toBeInTheDocument();
});

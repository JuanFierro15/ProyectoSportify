import { render, screen } from '@testing-library/react';
import App from './App';

afterEach(() => {
  window.history.pushState({}, '', '/');
});

test('la aplicación se renderiza sin errores', () => {
  expect(() => render(<App />)).not.toThrow();
});

test('renderiza la página de reserva al entrar en /reservar/padel', () => {
  window.history.pushState({}, '', '/reservar/padel');
  render(<App />);

  expect(
    screen.getByRole('heading', { name: 'Reserva tu cancha' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /volver al inicio/i })
  ).toBeInTheDocument();
});

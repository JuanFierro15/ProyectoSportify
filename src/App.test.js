import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza los placeholders de la estructura base', () => {
  render(<App />);
  expect(screen.getByText(/Catálogo de canchas/i)).toBeInTheDocument();
  expect(screen.getByText(/Sistema de reservas/i)).toBeInTheDocument();
});

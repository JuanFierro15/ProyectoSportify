import { render } from '@testing-library/react';
import App from './App';

test('la aplicación se renderiza sin errores', () => {
  expect(() => render(<App />)).not.toThrow();
});

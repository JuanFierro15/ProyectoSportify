import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig([
  // Salidas de build, cobertura y recursos estáticos
  globalIgnores(['dist', 'build', 'coverage', 'public']),

  // Código de la aplicación (navegador)
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Como CRA: sin revisar argumentos ni errores de catch, y `React` cuenta
      // como usado (el JSX automático ya no lo necesita en scope)
      'no-unused-vars': [
        'warn',
        { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^React$' },
      ],
      // Solo las reglas clásicas de hooks, sin las del React Compiler
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Tests con Vitest (globals: true)
  {
    files: ['src/**/*.test.{js,jsx}', 'src/setupTests.js'],
    languageOptions: {
      globals: globals.vitest,
    },
  },

  // Función de servidor, scripts y archivos de configuración (Node)
  {
    files: ['api/**/*.js', 'scripts/**/*.mjs', 'vite.config.mjs', 'eslint.config.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
]);

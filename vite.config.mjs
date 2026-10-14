import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // CHOKIDAR_USEPOLLING=true en .env: polling del watcher (en Windows evita EBUSY
  // al copiar archivos pesados a public/ con el servidor corriendo).
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: env.CHOKIDAR_USEPOLLING === 'true' ? { watch: { usePolling: true, interval: 300 } } : {},
    // foundation.min.css trae un hack viejo de IE (`@media ... (min-width:0\0)`)
    // que lightningcss no acepta al minificar; con errorRecovery lo descarta.
    css: { lightningcss: { errorRecovery: true } },
    test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js' },
  };
});

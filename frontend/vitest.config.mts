import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Pruebas del frontend (npm test): lógica pura de lib/, el proxy y la configuración de seguridad.
 * Sin navegador ni backend: la API se simula reemplazando fetch.
 */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});

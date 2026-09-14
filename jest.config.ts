import type { Config } from 'jest';

/**
 * Pruebas automatizadas (Sprint 7).
 * - tests/unit:        funciones puras y middlewares con contexto simulado (rápidas).
 * - tests/integration: política de propiedad por universidad contra Strapi real + PostgreSQL.
 * - tests/api:         endpoints públicos y de seguridad con supertest.
 *
 * Las pruebas de integración/API arrancan Strapi contra la base `foro_posgrado_test`
 * (ver tests/helpers/strapi.ts). Ejecutar `npm run db:up` antes.
 */
const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json', diagnostics: false }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 90_000,
  // Strapi solo puede arrancar una instancia por proceso: sin paralelismo entre archivos
  maxWorkers: 1,
  setupFiles: ['<rootDir>/tests/helpers/env.ts'],
  // Cobertura sobre la lógica propia del Foro (no sobre lo que genera Strapi)
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/security/**/*.ts',
    'src/middlewares/**/*.ts',
    'src/api/contact/controllers/*.ts',
    'src/api/forum-summary/services/*.ts',
    'src/api/*/content-types/*/lifecycles.ts',
    '!src/security/university-editor-role.ts',
    '!src/security/public-permissions.ts',
    '!src/security/ownership-condition.ts',
  ],
  coverageThreshold: { global: { lines: 70, statements: 70, functions: 70, branches: 60 } },
  coverageDirectory: 'coverage',
  verbose: true,
};

export default config;

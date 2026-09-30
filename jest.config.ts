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
/**
 * sanitize-html ≥ 2.17.6 depende de htmlparser2 12 y su familia, publicados solo como ESM.
 * En producción Node 24 los carga con require(esm); Jest no (salvo con --experimental-vm-modules),
 * así que se transpilan a CommonJS solo estos paquetes. El resto de node_modules y el `dist/`
 * que compila Strapi para las pruebas de integración se cargan tal cual.
 */
const ESM_ONLY = [
  'htmlparser2',
  'domhandler',
  'domutils',
  'domelementtype',
  'dom-serializer',
  'entities',
];

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json', diagnostics: false }],
    '^.+\\.js$': ['ts-jest', { tsconfig: { allowJs: true }, diagnostics: false }],
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(?:sanitize-html/node_modules/)?(?:${ESM_ONLY.join('|')})/)`,
    '<rootDir>/dist/',
  ],
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

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Código generado o externo: no se lintea
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.strapi/**',
      '.tmp/**',
      'types/generated/**',
      'public/**',
      'coverage/**',
      'frontend/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,js,mjs}'],
    rules: {
      // Strapi usa `any` en varias firmas (ctx, strapi.*); se permite pero se avisa
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Pruebas: Jest expone globales y se usan aserciones no nulas a propósito
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Scripts de línea de comandos: la salida por consola es su interfaz
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  // Desactiva reglas de formato que chocan con Prettier (siempre al final)
  prettier
);

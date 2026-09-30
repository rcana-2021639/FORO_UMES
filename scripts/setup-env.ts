/**
 * Prepara los archivos de entorno para desarrollo local en una computadora nueva:
 *
 * - `.env` (backend): copia `.env.example` y llena cada secreto de Strapi y las contraseñas de
 *   PostgreSQL con valores aleatorios distintos. Las contraseñas van en hexadecimal porque
 *   `docker/init/01-app-user.sh` las escribe entre comillas dentro de SQL.
 * - `frontend/.env.local`: copia `frontend/.env.example` (apunta a http://127.0.0.1:1337).
 * - `FRONTEND_API_TOKEN`: el mismo valor en los dos (el servidor de Next se identifica con él
 *   ante el límite de tasa del backend).
 *
 * Nunca sobrescribe un archivo que ya existe: si ya hay `.env`, lo deja tal cual. Lo único que
 * agrega a un archivo existente es una variable compartida que le falte (al final, sin tocar el resto).
 *
 * Uso: npm run setup:env
 */
import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const secret = () => randomBytes(32).toString('base64');
const password = () => randomBytes(18).toString('hex');

const envPath = join(root, '.env');
const frontEnv = join(root, 'frontend', '.env.local');

/** Valor de `key` en un archivo .env, o undefined si no existe o está vacío. */
function readVar(path: string, key: string): string | undefined {
  if (!existsSync(path)) return undefined;
  const match = readFileSync(path, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match?.[1].trim() || undefined;
}

// Compartido entre ambos archivos: se reutiliza el que ya exista en cualquiera de los dos
const frontendToken =
  readVar(envPath, 'FRONTEND_API_TOKEN') ??
  readVar(frontEnv, 'FRONTEND_API_TOKEN') ??
  randomBytes(32).toString('hex');

const GENERATED: Record<string, () => string> = {
  APP_KEYS: () => [secret(), secret(), secret(), secret()].join(','),
  API_TOKEN_SALT: secret,
  ADMIN_JWT_SECRET: secret,
  JWT_SECRET: secret,
  TRANSFER_TOKEN_SALT: secret,
  ENCRYPTION_KEY: secret,
  DATABASE_PASSWORD: password,
  POSTGRES_ADMIN_PASSWORD: password,
  FRONTEND_API_TOKEN: () => frontendToken,
};

/** Copia la plantilla llenando las variables vacías que aparecen en `generated`. */
function fromTemplate(template: string, generated: Record<string, () => string>): string {
  const example = readFileSync(template, 'utf8');
  return example.replace(/^([A-Z_]+)=\s*$/gm, (line, key) =>
    key in generated ? `${key}=${generated[key]()}` : line
  );
}

/** A un archivo existente solo se le agrega lo que le falta, al final. */
function ensureVar(path: string, key: string, value: string, label: string) {
  if (readVar(path, key)) return;
  const content = readFileSync(path, 'utf8');
  appendFileSync(path, `${content.endsWith('\n') ? '' : '\n'}${key}=${value}\n`);
  console.log(`✓ ${label}: se agregó ${key}.`);
}

if (existsSync(envPath)) {
  console.log('· .env ya existe: no se toca.');
  ensureVar(envPath, 'FRONTEND_API_TOKEN', frontendToken, '.env');
} else {
  const filled = fromTemplate(join(root, '.env.example'), GENERATED);
  writeFileSync(envPath, filled);
  const missing = Object.keys(GENERATED).filter((k) => !new RegExp(`^${k}=.+$`, 'm').test(filled));
  if (missing.length) {
    console.error(`✗ No se pudieron generar: ${missing.join(', ')}. Revisa .env.example.`);
    process.exit(1);
  }
  console.log('✓ .env creado con secretos y contraseñas aleatorios.');
}

if (existsSync(frontEnv)) {
  console.log('· frontend/.env.local ya existe: no se toca.');
  ensureVar(frontEnv, 'FRONTEND_API_TOKEN', frontendToken, 'frontend/.env.local');
} else {
  const filled = fromTemplate(join(root, 'frontend', '.env.example'), {
    FRONTEND_API_TOKEN: () => frontendToken,
  });
  writeFileSync(frontEnv, filled);
  console.log('✓ frontend/.env.local creado (NEXT_PUBLIC_API_URL=http://127.0.0.1:1337).');
}

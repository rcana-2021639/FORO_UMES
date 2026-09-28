/**
 * Prepara los archivos de entorno para desarrollo local en una computadora nueva:
 *
 * - `.env` (backend): copia `.env.example` y llena cada secreto de Strapi y las contraseñas de
 *   PostgreSQL con valores aleatorios distintos. Las contraseñas van en hexadecimal porque
 *   `docker/init/01-app-user.sh` las escribe entre comillas dentro de SQL.
 * - `frontend/.env.local`: copia `frontend/.env.example` (apunta a http://127.0.0.1:1337).
 *
 * Nunca sobrescribe un archivo que ya existe: si ya hay `.env`, lo deja tal cual.
 *
 * Uso: npm run setup:env
 */
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const secret = () => randomBytes(32).toString('base64');
const password = () => randomBytes(18).toString('hex');

const GENERATED: Record<string, () => string> = {
  APP_KEYS: () => [secret(), secret(), secret(), secret()].join(','),
  API_TOKEN_SALT: secret,
  ADMIN_JWT_SECRET: secret,
  JWT_SECRET: secret,
  TRANSFER_TOKEN_SALT: secret,
  ENCRYPTION_KEY: secret,
  DATABASE_PASSWORD: password,
  POSTGRES_ADMIN_PASSWORD: password,
};

const envPath = join(root, '.env');
if (existsSync(envPath)) {
  console.log('· .env ya existe: no se toca.');
} else {
  const example = readFileSync(join(root, '.env.example'), 'utf8');
  const filled = example.replace(/^([A-Z_]+)=\s*$/gm, (line, key) =>
    key in GENERATED ? `${key}=${GENERATED[key]()}` : line
  );
  writeFileSync(envPath, filled);
  const missing = Object.keys(GENERATED).filter((k) => !new RegExp(`^${k}=.+$`, 'm').test(filled));
  if (missing.length) {
    console.error(`✗ No se pudieron generar: ${missing.join(', ')}. Revisa .env.example.`);
    process.exit(1);
  }
  console.log('✓ .env creado con secretos y contraseñas aleatorios.');
}

const frontEnv = join(root, 'frontend', '.env.local');
if (existsSync(frontEnv)) {
  console.log('· frontend/.env.local ya existe: no se toca.');
} else {
  copyFileSync(join(root, 'frontend', '.env.example'), frontEnv);
  console.log('✓ frontend/.env.local creado (NEXT_PUBLIC_API_URL=http://127.0.0.1:1337).');
}

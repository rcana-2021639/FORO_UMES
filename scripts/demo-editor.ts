/**
 * Cuenta de editor de prueba (solo para desarrollo local): "Editor de Universidad" de la USAC con
 * su perfil de editor, para revisar el panel con los permisos reales de una universidad y para
 * las capturas de la guía de editores (public/guia/).
 *
 *   npx tsx scripts/demo-editor.ts
 *
 * Idempotente. La contraseña se genera al azar y se guarda en scripts/.cuentas-demo.local.json
 * (ignorado por git). Nunca usar en producción.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createStrapi, compileStrapi } from '@strapi/strapi';
import { UNIVERSITY_EDITOR_ROLE } from '../src/security/university-editor-role';

const EMAIL = 'editor.usac@foro.test';
const FILE = path.join(__dirname, '.cuentas-demo.local.json');

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('solo para desarrollo local');
  const app = createStrapi(await compileStrapi());
  await app.load();
  try {
    const role = await app.db
      .query('admin::role')
      .findOne({ where: { code: UNIVERSITY_EDITOR_ROLE.code } });
    if (!role) throw new Error('no existe el rol de editor (arranca Strapi una vez)');
    const usac = await app.db
      .query('api::university.university')
      .findOne({ where: { acronym: 'USAC' } });
    if (!usac) throw new Error('no hay universidades (npm run seed)');

    const password = `Demo-${crypto.randomBytes(9).toString('base64url')}9a`;
    const users = app.service('admin::user');
    let user = await app.db.query('admin::user').findOne({ where: { email: EMAIL } });
    if (user) {
      await users.updateById(user.id, { password, isActive: true });
    } else {
      user = await users.create({
        email: EMAIL,
        firstname: 'Ana',
        lastname: 'Editora (prueba)',
        password,
        isActive: true,
        registrationToken: null,
        roles: [role.id],
      });
    }
    const profile = await app.db
      .query('api::editor-profile.editor-profile')
      .findOne({ where: { adminUser: user.id } });
    if (!profile) {
      await app.documents('api::editor-profile.editor-profile').create({
        data: { adminUser: user.id, university: usac.documentId, notes: 'Cuenta de prueba local' },
      });
    }
    await fs.writeFile(FILE, JSON.stringify({ email: EMAIL, password }, null, 2) + '\n');
    app.log.info(`[demo] cuenta ${EMAIL} lista; contraseña en scripts/.cuentas-demo.local.json`);
  } finally {
    await new Promise((r) => setTimeout(r, 1500));
    await app.destroy();
  }
}

main().catch((err) => {
  console.error('[demo] falló:', err);
  process.exit(1);
});

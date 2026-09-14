import { createStrapi, compileStrapi } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import { randomBytes } from 'node:crypto';
import request from 'supertest';

let instance: Core.Strapi | null = null;

/** Arranca Strapi contra la base de pruebas (una vez por archivo de pruebas). */
export async function setupStrapi(): Promise<Core.Strapi> {
  if (instance) return instance;
  const app = createStrapi(await compileStrapi());
  await app.load();
  await app.server.mount();
  instance = app;
  return app;
}

export async function teardownStrapi(): Promise<void> {
  if (!instance) return;
  // Deja terminar tareas internas (relaciones de medios, etc.) antes de cerrar el pool
  await new Promise((r) => setTimeout(r, 500));
  await instance.destroy();
  instance = null;
}

export const api = () => request(instance!.server.httpServer);

/** Borra TODO el contenido del Foro y de auditoría en la base de pruebas. */
export async function cleanContent(strapi: Core.Strapi): Promise<void> {
  const uids = [
    'api::audit-log.audit-log',
    'api::editor-profile.editor-profile',
    'api::contact-message.contact-message',
    'api::gallery-item.gallery-item',
    'api::contribution.contribution',
    'api::activity.activity',
    'api::news.news',
    'api::academic-program.academic-program',
    'api::representative.representative',
    'api::university.university',
  ] as const;
  for (const uid of uids) {
    await strapi.db.query(uid).deleteMany({});
  }
  await strapi.db
    .query('admin::user')
    .deleteMany({ where: { email: { $endsWith: '@test.local' } } });
}

export type TestUniversity = { id: number; documentId: string; acronym: string };

export async function createUniversity(
  strapi: Core.Strapi,
  acronym: string,
  order = 100
): Promise<TestUniversity> {
  const u = await strapi.documents('api::university.university').create({
    data: { name: `Universidad ${acronym}`, acronym, displayOrder: order },
  });
  return { id: Number(u.id), documentId: u.documentId, acronym };
}

export type TestEditor = {
  id: number;
  email: string;
  password: string;
  university: TestUniversity;
};

/** Crea un usuario del panel con rol Editor de Universidad y su perfil. */
export async function createEditor(
  strapi: Core.Strapi,
  university: TestUniversity
): Promise<TestEditor> {
  const role = await strapi.service('admin::role').findOne({ code: 'university-editor' });
  const email = `editor.${university.acronym.toLowerCase()}.${randomBytes(3).toString('hex')}@test.local`;
  const password = `Tst!${randomBytes(9).toString('base64url')}aA1`;
  const user = await strapi.service('admin::user').create({
    email,
    firstname: 'Editor',
    lastname: university.acronym,
    password,
    roles: [role.id],
    isActive: true,
  });
  await strapi.documents('api::editor-profile.editor-profile').create({
    data: { adminUser: user.id, university: university.documentId },
  });
  return { id: user.id, email, password, university };
}

/** Usuario del panel con rol Editor de Universidad pero SIN perfil (sin universidad). */
export async function createEditorWithoutProfile(
  strapi: Core.Strapi
): Promise<{ email: string; password: string }> {
  const role = await strapi.service('admin::role').findOne({ code: 'university-editor' });
  const email = `sinperfil.${randomBytes(3).toString('hex')}@test.local`;
  const password = `Tst!${randomBytes(9).toString('base64url')}aA1`;
  await strapi.service('admin::user').create({
    email,
    firstname: 'Sin',
    lastname: 'Perfil',
    password,
    roles: [role.id],
    isActive: true,
  });
  return { email, password };
}

export async function login(user: { email: string; password: string }): Promise<string> {
  const res = await api().post('/admin/login').send({ email: user.email, password: user.password });
  if (res.status !== 200)
    throw new Error(`login falló (${res.status}): ${JSON.stringify(res.body)}`);
  return res.body.data.token as string;
}

export const CM = '/content-manager/collection-types';

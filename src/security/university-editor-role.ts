import type { Core } from '@strapi/strapi';
import { OWNERSHIP_CONDITION_ID } from './ownership-condition';

export const UNIVERSITY_EDITOR_ROLE = {
  name: 'Editor de Universidad',
  code: 'university-editor',
  description:
    'Gestiona únicamente el representante, los programas académicos y las actividades de su propia universidad.',
};

const CM = 'plugin::content-manager.explorer';
// Condición nativa de Strapi: el registro fue creado por el propio usuario
const CREATOR_CONDITION_ID = 'admin::is-creator';

type Perm = {
  action: string;
  subject?: string | null;
  properties?: { fields?: string[] };
  conditions?: string[];
};

const fieldsOf = (strapi: Core.Strapi, uid: string): string[] =>
  Object.keys(
    (strapi.contentTypes as unknown as Record<string, { attributes: object }>)[uid].attributes
  );

/**
 * Matriz de permisos del rol (fuente de verdad, se sincroniza en cada arranque).
 * Ver SEGURIDAD.md para la versión legible.
 */
function buildPermissions(strapi: Core.Strapi): Perm[] {
  const owned = (uid: string, actions: string[], withConditionOn: string[]) =>
    actions.map((action) => ({
      action: `${CM}.${action}`,
      subject: uid,
      properties: { fields: fieldsOf(strapi, uid) },
      conditions: withConditionOn.includes(action) ? [OWNERSHIP_CONDITION_ID] : [],
    }));

  const own = (uid: string) =>
    ['create', 'read', 'update', 'delete'].map((action) => ({
      action: `${CM}.${action}`,
      subject: uid,
      properties: { fields: fieldsOf(strapi, uid) },
      conditions: action === 'create' ? [] : [CREATOR_CONDITION_ID],
    }));

  return [
    // Su universidad: solo lectura (la ficha institucional la administra el Super Admin)
    ...owned('api::university.university', ['read'], ['read']),
    // Representante y programas: CRUD completo, pero solo sobre su universidad.
    // "create" no lleva condición (no hay registro aún): lo valida admin-guard.ts.
    ...owned(
      'api::representative.representative',
      ['create', 'read', 'update', 'delete'],
      ['read', 'update', 'delete']
    ),
    ...owned(
      'api::academic-program.academic-program',
      ['create', 'read', 'update', 'delete'],
      ['read', 'update', 'delete']
    ),
    // Actividades: puede proponer (create) y editar las que incluyan a su universidad; no borrar.
    ...owned('api::activity.activity', ['create', 'read', 'update'], ['read', 'update']),
    // Noticias y aportes: redacta borradores y edita/borra solo los que él mismo creó.
    // Publicar (explorer.publish) queda reservado al Super Admin.
    ...own('api::news.news'),
    ...own('api::contribution.contribution'),
    // Biblioteca de medios: subir y ver archivos (fotos de representantes, portadas)
    { action: 'plugin::upload.read' },
    { action: 'plugin::upload.assets.create' },
    { action: 'plugin::upload.assets.update' },
    { action: 'plugin::upload.assets.download' },
    { action: 'plugin::upload.assets.copy-link' },
  ];
}

/**
 * Crea (si no existe) el rol "Editor de Universidad" y sincroniza sus permisos con la
 * matriz definida arriba. Idempotente: se ejecuta en cada arranque.
 */
export async function ensureUniversityEditorRole(strapi: Core.Strapi): Promise<void> {
  const roleService = strapi.service('admin::role');

  let role = await roleService.findOne({ code: UNIVERSITY_EDITOR_ROLE.code });
  if (!role) {
    role = await roleService.create(UNIVERSITY_EDITOR_ROLE);
    strapi.log.info(`[security] rol creado: ${UNIVERSITY_EDITOR_ROLE.name}`);
  }

  await roleService.assignPermissions(role.id, buildPermissions(strapi));
  strapi.log.info(`[security] permisos del rol "${UNIVERSITY_EDITOR_ROLE.name}" sincronizados`);
}

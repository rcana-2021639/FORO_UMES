import type { Core } from '@strapi/strapi';

/**
 * Permisos del rol Public (visitantes sin autenticar) sobre la API REST.
 * Solo lectura sobre el contenido del sitio. Nada de escritura.
 *
 * Deliberadamente NO se habilita `create` sobre contact-message: el formulario de contacto
 * usará el endpoint personalizado POST /api/contact (Sprint 4) con honeypot y límite de tasa;
 * abrir el endpoint genérico permitiría saltarse esas protecciones.
 */
const PUBLIC_READ_UIDS = [
  'api::university.university',
  'api::representative.representative',
  'api::academic-program.academic-program',
  'api::activity.activity',
  'api::contribution.contribution',
  'api::news.news',
  'api::gallery-item.gallery-item',
];

export const PUBLIC_ACTIONS = PUBLIC_READ_UIDS.flatMap((uid) => [`${uid}.find`, `${uid}.findOne`]);

export async function ensurePublicPermissions(strapi: Core.Strapi): Promise<void> {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[security] rol Public no encontrado; se omite configuración de permisos');
    return;
  }

  const existing = (await strapi.db.query('plugin::users-permissions.permission').findMany({
    where: { role: publicRole.id },
    select: ['id', 'action'],
  })) as Array<{ id: number; action: string }>;

  const existingActions = new Set(existing.map((p) => p.action));
  const wanted = new Set(PUBLIC_ACTIONS);

  const toCreate = PUBLIC_ACTIONS.filter((a) => !existingActions.has(a));
  // Cualquier permiso público sobre nuestra API que no esté en la lista blanca se revoca
  const toDelete = existing.filter((p) => p.action.startsWith('api::') && !wanted.has(p.action));

  for (const action of toCreate) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .create({ data: { action, role: publicRole.id } });
  }
  for (const perm of toDelete) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .delete({ where: { id: perm.id } });
  }

  strapi.log.info(
    `[security] rol Public: ${PUBLIC_ACTIONS.length} permisos de lectura (+${toCreate.length} creados, -${toDelete.length} revocados)`
  );
}

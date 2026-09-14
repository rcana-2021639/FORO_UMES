import type { Context } from 'koa';

/**
 * Reglas comunes de la API pública (Sprint 4).
 *
 * - `status`: todo content-type con borrador/publicado se sirve SIEMPRE en su versión publicada,
 *   sin importar lo que pida el cliente (nadie puede leer borradores con `?status=draft`).
 * - `populate` por defecto: relaciones y medios mínimos que el frontend necesita, para no
 *   sobreexponer datos. El cliente puede pedir otro populate, pero la lista blanca
 *   (middleware query-whitelist) limita qué campos y relaciones son válidos.
 */
export const PUBLIC_DEFAULT_POPULATE: Record<string, unknown> = {
  'api::university.university': {
    logo: { fields: ['url', 'alternativeText', 'width', 'height', 'formats'] },
  },
  'api::representative.representative': {
    photo: { fields: ['url', 'alternativeText', 'width', 'height', 'formats'] },
    university: { fields: ['name', 'acronym', 'displayOrder'] },
  },
  'api::academic-program.academic-program': {
    university: { fields: ['name', 'acronym', 'displayOrder'] },
  },
  'api::activity.activity': {
    coverImage: { fields: ['url', 'alternativeText', 'width', 'height', 'formats'] },
    participatingUniversities: { fields: ['name', 'acronym', 'displayOrder'] },
  },
  'api::contribution.contribution': {
    relatedActivity: { fields: ['title', 'date', 'type'] },
  },
  'api::news.news': {
    coverImage: { fields: ['url', 'alternativeText', 'width', 'height', 'formats'] },
  },
  'api::gallery-item.gallery-item': {
    file: { fields: ['url', 'alternativeText', 'width', 'height', 'formats', 'mime'] },
    relatedActivity: { fields: ['title', 'date'] },
  },
};

export function applyPublicQueryDefaults(ctx: Context, uid: string): void {
  const query = ctx.query as Record<string, unknown>;
  query.status = 'published';
  if (query.populate === undefined && PUBLIC_DEFAULT_POPULATE[uid]) {
    query.populate = PUBLIC_DEFAULT_POPULATE[uid];
  }
}

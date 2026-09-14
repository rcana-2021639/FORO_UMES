import type { Core } from '@strapi/strapi';

/**
 * Propiedad por universidad: qué content-types están "amarrados" a una universidad
 * y por qué atributo. Es la única fuente de verdad para la condición RBAC del panel
 * (ownership-condition.ts) y para el guard de escrituras (admin-guard.ts).
 */
export const OWNED_CONTENT_TYPES = {
  'api::representative.representative': { attribute: 'university', many: false },
  'api::academic-program.academic-program': { attribute: 'university', many: false },
  'api::activity.activity': { attribute: 'participatingUniversities', many: true },
} as const;

export type OwnedUid = keyof typeof OWNED_CONTENT_TYPES;

export const isOwnedUid = (uid: string): uid is OwnedUid => uid in OWNED_CONTENT_TYPES;

export type EditorUniversity = { id: number; documentId: string; name: string };

/** Universidad asignada a un usuario del panel a través de su Perfil de editor (null si no tiene). */
export async function getEditorUniversity(
  strapi: Core.Strapi,
  adminUserId: number
): Promise<EditorUniversity | null> {
  const profile = (await strapi.db.query('api::editor-profile.editor-profile').findOne({
    where: { adminUser: adminUserId },
    populate: { university: { select: ['id', 'documentId', 'name'] } },
  })) as { university?: EditorUniversity | null } | null;

  return profile?.university ?? null;
}

/** ¿El usuario tiene el rol Super Admin? (código fijo de Strapi) */
export const isSuperAdmin = (user: { roles?: Array<{ code?: string }> } | undefined): boolean =>
  Boolean(user?.roles?.some((r) => r.code === 'strapi-super-admin'));

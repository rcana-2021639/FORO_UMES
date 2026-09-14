import type { Core } from '@strapi/strapi';
import { OWNED_CONTENT_TYPES, getEditorUniversity, isOwnedUid } from './ownership';

export const OWNERSHIP_CONDITION_ID = 'admin::is-university-owner';

type ConditionContext = {
  id: number;
  permission?: { subject?: string | null };
};

/**
 * Condición RBAC personalizada para el panel administrativo (Sprint 3, tarea 3).
 *
 * Strapi evalúa el handler con el usuario autenticado + el permiso que se está resolviendo.
 * Devolver un objeto = filtro que limita las filas visibles/editables; devolver `false` = sin acceso.
 * Así, un "Editor de Universidad" solo ve y modifica registros cuya universidad coincide con la de
 * su Perfil de editor. Es control de acceso a nivel de OBJETO, no solo de rol.
 */
export async function registerOwnershipCondition(strapi: Core.Strapi): Promise<void> {
  const provider = strapi.service('admin::permission').conditionProvider;

  if (provider.has(OWNERSHIP_CONDITION_ID)) return;

  await provider.register({
    displayName: 'Pertenece a la universidad del editor',
    name: 'is-university-owner',
    plugin: 'admin',
    async handler(ctx: ConditionContext) {
      const uid = ctx.permission?.subject ?? '';
      const university = await getEditorUniversity(strapi, ctx.id);
      if (!university) return false;

      // La ficha de su propia universidad
      if (uid === 'api::university.university') return { id: university.id };

      if (!isOwnedUid(uid)) return false;
      const { attribute } = OWNED_CONTENT_TYPES[uid];
      return { [`${attribute}.id`]: university.id };
    },
  });

  strapi.log.info(`[security] condición RBAC registrada: ${OWNERSHIP_CONDITION_ID}`);
}

import type { Core } from '@strapi/strapi';
import { ensureExtraIndexes } from '../database/indexes';
import { createAdminGuard } from './security/admin-guard';
import { registerOwnershipCondition } from './security/ownership-condition';
import { ensureUniversityEditorRole } from './security/university-editor-role';
import { ensurePublicPermissions } from './security/public-permissions';
import { CUSTOM_ROUTES_OPENAPI } from './openapi/custom-routes';

/**
 * Engancha el guard de propiedad/auditoría a todas las rutas del content-manager.
 * Se hace en `register` porque las rutas aún no se han montado en el servidor.
 */
function attachAdminGuard(strapi: Core.Strapi) {
  const guard = createAdminGuard(strapi);
  const routes = strapi.plugin('content-manager').routes as Record<
    string,
    { routes: Array<{ path: string; config?: { middlewares?: unknown[] } }> }
  >;

  let count = 0;
  for (const route of routes.admin?.routes ?? []) {
    if (!/^\/collection-types\//.test(route.path)) continue;
    route.config = route.config ?? {};
    route.config.middlewares = [...(route.config.middlewares ?? []), guard];
    count += 1;
  }
  strapi.log.info(`[security] guard de propiedad aplicado a ${count} rutas del content-manager`);
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    attachAdminGuard(strapi);
    // Documenta las rutas personalizadas en la especificación OpenAPI (/documentation)
    strapi.plugin('documentation').service('override').registerOverride(CUSTOM_ROUTES_OPENAPI);
  },

  /**
   * Corre después de sincronizar el esquema y antes de aceptar peticiones.
   * Todo lo de aquí es idempotente: el código es la fuente de verdad de índices, rol y permisos.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureExtraIndexes(strapi);
    await registerOwnershipCondition(strapi);
    await ensureUniversityEditorRole(strapi);
    await ensurePublicPermissions(strapi);
  },
};

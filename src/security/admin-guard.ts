import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { OWNED_CONTENT_TYPES, getEditorUniversity, isOwnedUid, isSuperAdmin } from './ownership';
import { readRelation, refMatches } from './relation-input';
import { recordAudit, type AuditAction } from './audit';

type AdminUser = { id: number; email?: string; roles?: Array<{ code?: string }> };

const forbid = (ctx: Context, message: string) => {
  ctx.status = 403;
  ctx.body = { error: { status: 403, name: 'ForbiddenError', code: 'NOT_OWNER', message } };
};

/**
 * Guard de escrituras del panel administrativo (Sprint 3, tareas 3-4 y 9).
 *
 * La condición RBAC (ownership-condition.ts) ya limita qué registros EXISTENTES puede ver/editar
 * un editor. Este middleware cubre lo que una condición no puede:
 *   1. En "crear", que el editor no pueda registrar contenido a nombre de otra universidad
 *      (ni omitiendo la universidad, ni enviando un `university.id` ajeno en el cuerpo).
 *   2. En "editar", que no pueda mover un registro propio a otra universidad, ni quitar a su
 *      universidad de una actividad para "regalársela" a otra.
 *   3. Registrar en la bitácora de auditoría toda escritura exitosa (quién, qué, cuándo).
 *
 * Se aplica como middleware de ruta sobre las rutas de content-manager, por lo que corre
 * DESPUÉS de la autenticación del panel (ctx.state.user disponible).
 */
export function createAdminGuard(strapi: Core.Strapi) {
  return async function adminGuard(ctx: Context, next: Next) {
    const user = ctx.state.user as AdminUser | undefined;
    const uid = String(ctx.params?.model ?? '');
    const method = ctx.method.toUpperCase();
    const isWrite = method === 'POST' || method === 'PUT' || method === 'DELETE';

    if (user && isWrite && !isSuperAdmin(user) && isOwnedUid(uid)) {
      const university = await getEditorUniversity(strapi, user.id);
      if (!university) {
        return forbid(
          ctx,
          'Su usuario no tiene una universidad asignada. Pida al Super Admin que cree su Perfil de editor.'
        );
      }

      const path = ctx.path;
      const body = (ctx.request.body ?? {}) as Record<string, unknown>;
      const { attribute, many } = OWNED_CONTENT_TYPES[uid];
      const isCreate = method === 'POST' && /\/collection-types\/[^/]+$/.test(path);
      const isUpdate = method === 'PUT' && /\/collection-types\/[^/]+\/[^/]+$/.test(path);
      const isClone = method === 'POST' && /\/(auto-)?clone\//.test(path);

      if (isClone) {
        return forbid(ctx, 'La duplicación de registros está reservada al Super Admin.');
      }

      if (isCreate || isUpdate) {
        const rel = readRelation(body[attribute]);

        if (isCreate && !rel.present) {
          // Sin universidad en el cuerpo: se asigna la del editor automáticamente
          body[attribute] = many ? [university.documentId] : university.documentId;
        } else if (rel.present) {
          const connectsOwn = rel.connect.some((r) => refMatches(r, university));
          const connectsOther = rel.connect.some((r) => !refMatches(r, university));
          const disconnectsOwn = rel.disconnect.some((r) => refMatches(r, university));

          if (!many && (connectsOther || (rel.replaces && !connectsOwn))) {
            return forbid(ctx, 'Solo puede registrar contenido para su propia universidad.');
          }
          if (many && ((rel.replaces && !connectsOwn) || disconnectsOwn)) {
            return forbid(
              ctx,
              'Su universidad debe permanecer entre las participantes de la actividad.'
            );
          }
          if (many && isCreate && !connectsOwn) {
            // Propone una actividad con otras universidades: la suya se agrega siempre
            rel.connect.push({ documentId: university.documentId });
            body[attribute] = rel.replaces
              ? rel.connect.map((r) => r.documentId ?? r.id)
              : { connect: rel.connect, disconnect: rel.disconnect };
          }
        }
      }
    }

    await next();

    if (user && isWrite && ctx.status < 400) {
      await recordAudit(strapi, {
        user,
        action: actionFromPath(method, ctx.path),
        contentType: uid || undefined,
        documentId: String(ctx.params?.id ?? extractDocumentId(ctx.body) ?? ''),
        summary: summarize(ctx.request.body) ?? summarize((ctx.body as { data?: unknown })?.data),
        ipAddress: ctx.ip,
        statusCode: ctx.status,
      });
    }
  };
}

function actionFromPath(method: string, path: string): AuditAction {
  if (/bulkDelete/.test(path)) return 'bulk-delete';
  if (/bulkPublish/.test(path)) return 'bulk-publish';
  if (/bulkUnpublish/.test(path)) return 'bulk-unpublish';
  if (/\/actions\/publish$/.test(path)) return 'publish';
  if (/\/actions\/unpublish$/.test(path)) return 'unpublish';
  if (method === 'DELETE') return 'delete';
  if (method === 'PUT') return 'update';
  if (method === 'POST' && /\/collection-types\/[^/]+$/.test(path)) return 'create';
  return 'other';
}

function extractDocumentId(body: unknown): string | undefined {
  const data = (body as { data?: { documentId?: string } } | undefined)?.data;
  return data?.documentId;
}

/**
 * Título/nombre del registro para leer la bitácora sin abrir el registro. Nunca campos sensibles.
 * Se toma del cuerpo de la petición: la respuesta del content-manager solo trae metadatos.
 */
function summarize(source: unknown): string | undefined {
  const data = source as Record<string, unknown> | null | undefined;
  if (!data || typeof data !== 'object') return undefined;
  const label = data.title ?? data.name ?? data.fullName;
  return typeof label === 'string' ? label.slice(0, 200) : undefined;
}

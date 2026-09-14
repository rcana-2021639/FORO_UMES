import type { Core } from '@strapi/strapi';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'login'
  | 'bulk-delete'
  | 'bulk-publish'
  | 'bulk-unpublish'
  | 'other';

export type AuditEntry = {
  user: { id: number; email?: string };
  action: AuditAction;
  contentType?: string;
  documentId?: string;
  summary?: string;
  ipAddress?: string;
  statusCode?: number;
};

/**
 * Escribe una entrada en la bitácora de auditoría (Sprint 3, tarea 9).
 * Strapi Community no incluye audit logs (es funcionalidad Enterprise), así que se implementa
 * con un content-type propio. Nunca debe romper la petición original: cualquier fallo se registra
 * en el log del servidor y se sigue.
 */
export async function recordAudit(strapi: Core.Strapi, entry: AuditEntry): Promise<void> {
  try {
    await strapi.db.query('api::audit-log.audit-log').create({
      data: {
        adminUserId: entry.user.id,
        adminUserEmail: entry.user.email,
        action: entry.action,
        contentType: entry.contentType,
        targetDocumentId: entry.documentId || null,
        summary: entry.summary,
        ipAddress: entry.ipAddress,
        statusCode: entry.statusCode,
      },
    });
  } catch (err) {
    strapi.log.error(`[audit] no se pudo registrar la acción ${entry.action}: ${String(err)}`);
  }
}

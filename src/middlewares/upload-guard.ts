import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { open } from 'node:fs/promises';
import { checkImageSignature } from '../lib/image-signature';

type UploadedFile = {
  filepath?: string;
  path?: string;
  mimetype?: string;
  originalFilename?: string;
  name?: string;
};

/**
 * Valida los archivos subidos al panel (POST /upload) antes de que Strapi los procese:
 * lee los primeros bytes y confirma que sean PNG/JPEG/WebP y que coincidan con el MIME y la
 * extensión declarados (Sprint 5, tarea 5). El límite de tamaño lo aplica el plugin upload
 * (config/plugins.ts → sizeLimit) y el renombrado con hash aleatorio es nativo de Strapi.
 */
export default (_config: unknown, _ctx: { strapi: Core.Strapi }) => {
  return async (ctx: Context, next: Next) => {
    if (ctx.method !== 'POST' || !/^\/(api\/)?upload\/?$/.test(ctx.path)) return next();

    const files = (ctx.request as { files?: { files?: UploadedFile | UploadedFile[] } }).files
      ?.files;
    const list = Array.isArray(files) ? files : files ? [files] : [];

    for (const file of list) {
      const filepath = file.filepath ?? file.path;
      if (!filepath) continue;

      const header = new Uint8Array(16);
      const fh = await open(filepath, 'r');
      try {
        await fh.read(header, 0, header.length, 0);
      } finally {
        await fh.close();
      }

      const check = checkImageSignature(header, file.mimetype, file.originalFilename ?? file.name);
      if (!check.ok) {
        ctx.status = 400;
        ctx.body = {
          error: {
            status: 400,
            name: 'ValidationError',
            code: 'INVALID_IMAGE',
            message: check.reason,
          },
        };
        return;
      }
    }

    return next();
  };
};

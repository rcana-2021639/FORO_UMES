import uploadErrors from '../../src/middlewares/upload-errors';
import { MAX_UPLOAD_MB } from '../../src/lib/upload-limits';

const strapi = { log: { error: jest.fn() } } as never;
const mw = uploadErrors(undefined, { strapi });

/** Simula una petición cuyo `next` (strapi::body) deja el ctx en cierto estado. */
const run = async (
  method: string,
  path: string,
  next: (ctx: { status: number; body: unknown }) => void
) => {
  const ctx = { method, path, status: 200, body: undefined as unknown } as never as {
    method: string;
    path: string;
    status: number;
    body: unknown;
  };
  await mw(ctx as never, async () => next(ctx));
  return ctx;
};

const fileTooBig = (ctx: { status: number; body: unknown }) => {
  ctx.status = 413;
  ctx.body = {
    data: null,
    error: { status: 413, name: 'PayloadTooLargeError', message: 'FileTooBig' },
  };
};

describe('upload-errors', () => {
  it('traduce FileTooBig a un mensaje claro en español con el límite, en /upload', async () => {
    const ctx = await run('POST', '/upload', fileTooBig);
    const err = (ctx.body as { error: { message: string; status: number } }).error;
    expect(err.status).toBe(413);
    expect(err.message).toContain(`${MAX_UPLOAD_MB} MB`);
    expect(err.message).not.toContain('FileTooBig');
    expect(err.message.toLowerCase()).toContain('supera');
  });

  it('también actúa en /api/upload y con mayúsculas/barra final de la ruta', async () => {
    for (const path of ['/api/upload', '/UPLOAD', '/upload/']) {
      const ctx = await run('POST', path, fileTooBig);
      const err = (ctx.body as { error: { message: string } }).error;
      expect(err.message).toContain(`${MAX_UPLOAD_MB} MB`);
    }
  });

  it('no toca otros 413 que no sean de tamaño de archivo (p. ej. cuerpo JSON grande)', async () => {
    const ctx = await run('POST', '/upload', (c) => {
      c.status = 413;
      c.body = {
        data: null,
        error: { status: 413, name: 'PayloadTooLargeError', message: 'Payload Too Large' },
      };
    });
    const err = (ctx.body as { error: { message: string } }).error;
    expect(err.message).toBe('Payload Too Large');
  });

  it('no toca rutas que no son de subida', async () => {
    const ctx = await run('POST', '/api/contact', fileTooBig);
    const err = (ctx.body as { error: { message: string } }).error;
    expect(err.message).toBe('FileTooBig');
  });

  it('deja pasar las subidas correctas (200) sin cambios', async () => {
    const ctx = await run('POST', '/upload', (c) => {
      c.status = 200;
      c.body = [{ id: 1 }];
    });
    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual([{ id: 1 }]);
  });
});

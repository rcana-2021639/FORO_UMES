import apiErrors from '../../src/middlewares/api-errors';

const strapi = { log: { error: jest.fn() } } as never;
const mw = apiErrors(undefined, { strapi });

const ctxWith = (path: string, status: number, body: unknown) =>
  ({ path, status, body, state: { requestId: 'rid-1' } }) as never;

const runWith = async (path: string, status: number, body: unknown) => {
  const ctx = ctxWith(path, status, body);
  await mw(ctx, async () => {});
  return ctx as unknown as { status: number; body: { error: Record<string, unknown> } | unknown };
};

describe('api-errors', () => {
  it('normaliza el formato de Strapi a { error: { status, code, message, requestId } }', async () => {
    const ctx = await runWith('/api/x', 404, {
      data: null,
      error: { status: 404, name: 'NotFoundError', message: 'Not Found', details: {} },
    });
    expect(ctx.body).toEqual({
      error: {
        status: 404,
        code: 'NOT_FOUND',
        message: 'El recurso solicitado no existe.',
        requestId: 'rid-1',
      },
    });
  });
  it('traduce nombres de error a códigos y conserva mensajes específicos y detalles', async () => {
    const ctx = await runWith('/api/x', 400, {
      data: null,
      error: {
        status: 400,
        name: 'ValidationError',
        message: 'Invalid parameter at "start"',
        details: { errors: [1] },
      },
    });
    const err = (ctx.body as { error: Record<string, unknown> }).error;
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid parameter at "start"');
    expect(err.details).toEqual({ errors: [1] });
  });
  it('en 5xx oculta el detalle interno y lo registra en el log', async () => {
    const ctx = await runWith('/api/x', 500, {
      data: null,
      error: {
        status: 500,
        name: 'InternalServerError',
        message: 'connect ECONNREFUSED 127.0.0.1:5432',
        details: { stack: '...' },
      },
    });
    const err = (ctx.body as { error: Record<string, unknown> }).error;
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.message).not.toContain('ECONNREFUSED');
    expect(err.details).toBeUndefined();
    expect((strapi as { log: { error: jest.Mock } }).log.error).toHaveBeenCalled();
  });
  it('respeta errores que ya vienen en formato estándar y les añade requestId', async () => {
    const ctx = await runWith('/api/x', 400, {
      error: { status: 400, code: 'QUERY_NOT_ALLOWED', message: 'm' },
    });
    expect((ctx.body as { error: Record<string, unknown> }).error).toEqual({
      status: 400,
      code: 'QUERY_NOT_ALLOWED',
      message: 'm',
      requestId: 'rid-1',
    });
  });
  it('no toca respuestas exitosas ni rutas del panel', async () => {
    const ok = await runWith('/api/x', 200, { data: [] });
    expect(ok.body).toEqual({ data: [] });
    const admin = await runWith('/admin/login', 400, {
      data: null,
      error: { status: 400, name: 'ValidationError', message: 'x' },
    });
    expect((admin.body as { data: unknown }).data).toBeNull();
  });
});

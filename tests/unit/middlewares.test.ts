import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import rateLimit, { resetRateLimiter } from '../../src/middlewares/rate-limit';
import queryWhitelist from '../../src/middlewares/query-whitelist';
import requestContext from '../../src/middlewares/request-context';
import uploadGuard from '../../src/middlewares/upload-guard';
import compress from '../../src/middlewares/compress';

const strapi = { log: { warn: jest.fn(), http: jest.fn(), error: jest.fn() } } as never;

type AnyCtx = Record<string, unknown> & { status: number; headers: Record<string, string> };
const ctxOf = (over: Record<string, unknown>): AnyCtx => {
  const headers: Record<string, string> = {};
  return {
    method: 'GET',
    path: '/',
    ip: '1.2.3.4',
    status: 200,
    query: {},
    state: {},
    request: { body: {} },
    headers,
    set: (k: string, v: string) => {
      headers[k.toLowerCase()] = v;
    },
    get: (k: string) =>
      (over.incoming as Record<string, string> | undefined)?.[k.toLowerCase()] ?? '',
    ...over,
  } as AnyCtx;
};

describe('rate-limit middleware', () => {
  const mw = rateLimit(undefined, { strapi });
  beforeEach(() => resetRateLimiter());

  it('ignora rutas fuera de /api', async () => {
    const next = jest.fn();
    await mw(ctxOf({ path: '/admin/init' }) as never, next);
    expect(next).toHaveBeenCalled();
  });
  it('POST /api/contact: 5 permitidos, el 6.º responde 429 con Retry-After y formato estándar', async () => {
    let ctx!: AnyCtx;
    for (let i = 0; i < 6; i++) {
      ctx = ctxOf({ method: 'POST', path: '/api/contact' });
      await mw(ctx as never, jest.fn());
    }
    expect(ctx.status).toBe(429);
    expect(ctx.headers['retry-after']).toBeDefined();
    expect((ctx.body as { error: { code: string } }).error.code).toBe('RATE_LIMITED');
    // el límite general de /api sigue disponible para la misma IP
    const other = ctxOf({ path: '/api/universities' });
    const next = jest.fn();
    await mw(other as never, next);
    expect(next).toHaveBeenCalled();
    expect(other.headers['x-ratelimit-limit']).toBe('120');
  });
});

describe('query-whitelist middleware', () => {
  const mw = queryWhitelist(undefined, { strapi });
  it('deja pasar métodos no GET y rutas sin reglas', async () => {
    const n1 = jest.fn();
    await mw(ctxOf({ method: 'POST', path: '/api/contact' }) as never, n1);
    const n2 = jest.fn();
    await mw(ctxOf({ path: '/api/forum-summary' }) as never, n2);
    expect(n1).toHaveBeenCalled();
    expect(n2).toHaveBeenCalled();
  });
  it('rechaza filtros/orden/populate no permitidos con 400 QUERY_NOT_ALLOWED', async () => {
    for (const query of [
      { filters: { createdBy: 1 } },
      { sort: 'createdAt' },
      { populate: 'createdBy' },
    ]) {
      const ctx = ctxOf({ path: '/api/academic-programs', query });
      const next = jest.fn();
      await mw(ctx as never, next);
      expect(next).not.toHaveBeenCalled();
      expect(ctx.status).toBe(400);
      expect((ctx.body as { error: { code: string; message: string } }).error.code).toBe(
        'QUERY_NOT_ALLOWED'
      );
      expect((ctx.body as { error: { message: string } }).error.message).toContain('Permitidos');
    }
  });
  it('sustituye populate=* por el populate mínimo del recurso', async () => {
    const ctx = ctxOf({ path: '/api/news-items/abc', query: { populate: '*' } });
    await mw(ctx as never, jest.fn());
    expect(ctx.query).toEqual({
      populate: expect.objectContaining({ coverImage: expect.anything() }),
    });
  });
});

describe('request-context middleware', () => {
  const mw = requestContext(undefined, { strapi });
  it('genera requestId, lo expone en cabecera/estado y registra la petición', async () => {
    const ctx = ctxOf({ path: '/api/universities' });
    await mw(ctx as never, async () => {
      ctx.status = 200;
    });
    const rid = (ctx.state as { requestId: string }).requestId;
    expect(rid).toMatch(/^[0-9a-f-]{36}$/);
    expect(ctx.headers['x-request-id']).toBe(rid);
    expect((strapi as { log: { http: jest.Mock } }).log.http).toHaveBeenCalled();
  });
  it('reutiliza un X-Request-Id válido del proxy y descarta uno inválido', async () => {
    const ok = ctxOf({ incoming: { 'x-request-id': 'proxy-12345678' } });
    await mw(ok as never, async () => {});
    expect(ok.headers['x-request-id']).toBe('proxy-12345678');
    const bad = ctxOf({ incoming: { 'x-request-id': '<script>' } });
    await mw(bad as never, async () => {});
    expect(bad.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('registra aunque el handler lance una excepción', async () => {
    (strapi as { log: { http: jest.Mock } }).log.http.mockClear();
    await expect(
      mw(ctxOf({}) as never, async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    expect((strapi as { log: { http: jest.Mock } }).log.http).toHaveBeenCalled();
  });
});

describe('upload-guard middleware', () => {
  const mw = uploadGuard(undefined, { strapi });
  const dir = mkdtempSync(join(tmpdir(), 'foro-upload-'));
  const png = join(dir, 'ok.png');
  const exe = join(dir, 'bad.png');
  writeFileSync(
    png,
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0])
  );
  writeFileSync(exe, Buffer.concat([Buffer.from('MZ'), Buffer.alloc(30)]));

  it('ignora peticiones que no son subidas', async () => {
    const next = jest.fn();
    await mw(ctxOf({ method: 'GET', path: '/upload' }) as never, next);
    expect(next).toHaveBeenCalled();
  });
  it('acepta imágenes válidas (uno o varios archivos) y rechaza las que no lo son', async () => {
    const okCtx = ctxOf({
      method: 'POST',
      path: '/upload',
      request: {
        files: { files: [{ filepath: png, mimetype: 'image/png', originalFilename: 'a.png' }] },
      },
    });
    const next = jest.fn();
    await mw(okCtx as never, next);
    expect(next).toHaveBeenCalled();

    const badCtx = ctxOf({
      method: 'POST',
      path: '/upload',
      request: {
        files: { files: { filepath: exe, mimetype: 'image/png', originalFilename: 'v.png' } },
      },
    });
    const next2 = jest.fn();
    await mw(badCtx as never, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(badCtx.status).toBe(400);
    expect((badCtx.body as { error: { code: string } }).error.code).toBe('INVALID_IMAGE');
  });
});

describe('compress middleware', () => {
  it('devuelve un middleware de koa-compress', () => {
    expect(typeof compress(undefined, { strapi })).toBe('function');
  });
});

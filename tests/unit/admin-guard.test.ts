import { createAdminGuard } from '../../src/security/admin-guard';

jest.mock('../../src/security/audit', () => ({
  recordAudit: jest.fn().mockResolvedValue(undefined),
}));
import { recordAudit } from '../../src/security/audit';

const UPC = { id: 1, documentId: 'upc', name: 'UPC' };
const UPN = { id: 2, documentId: 'upn', name: 'UPN' };

/** Strapi simulado: el perfil del usuario 10 apunta a UPC; el 99 no tiene perfil. */
const strapi = {
  db: {
    query: () => ({
      findOne: async ({ where }: { where: { adminUser?: number; documentId?: string } }) => {
        if (where.adminUser !== undefined)
          return where.adminUser === 10 ? { university: UPC } : null;
        // estado actual de una actividad compartida: participan UPC y UPN
        if (where.documentId) return { participatingUniversities: [UPC, UPN] };
        return null;
      },
    }),
  },
} as never;

const guard = createAdminGuard(strapi);
const PROG = 'api::academic-program.academic-program';
const ACT = 'api::activity.activity';

type Ctx = {
  method: string;
  path: string;
  ip: string;
  status: number;
  body: unknown;
  params: { model?: string; id?: string };
  state: { user?: { id: number; email?: string; roles?: Array<{ code?: string }> } };
  request: { body: Record<string, unknown> };
};

const editor = { id: 10, email: 'e@test.local', roles: [{ code: 'university-editor' }] };
const superAdmin = { id: 1, email: 'sa@test.local', roles: [{ code: 'strapi-super-admin' }] };

function ctxFor(
  method: string,
  uid: string,
  body: Record<string, unknown>,
  opts: { id?: string; user?: Ctx['state']['user']; path?: string } = {}
): Ctx {
  const base = `/content-manager/collection-types/${uid}`;
  return {
    method,
    path: opts.path ?? (opts.id ? `${base}/${opts.id}` : base),
    ip: '1.1.1.1',
    status: 200,
    body: undefined,
    params: { model: uid, id: opts.id },
    state: { user: opts.user ?? editor },
    request: { body },
  };
}

const run = async (ctx: Ctx, status = 201) => {
  const next = jest.fn().mockImplementation(async () => {
    ctx.status = status;
    ctx.body = { data: { documentId: 'nuevo' } };
  });
  await guard(ctx as never, next);
  return next;
};

beforeEach(() => (recordAudit as jest.Mock).mockClear());

describe('admin-guard: crear', () => {
  it('asigna la universidad del editor cuando no viene en el cuerpo', async () => {
    const ctx = ctxFor('POST', PROG, { name: 'x' });
    const next = await run(ctx);
    expect(next).toHaveBeenCalled();
    expect(ctx.request.body.university).toBe('upc');
  });
  it('rechaza crear a nombre de otra universidad (documentId, id o connect)', async () => {
    for (const university of ['upn', 2, { connect: [{ documentId: 'upn' }] }, [UPN.id]]) {
      const ctx = ctxFor('POST', PROG, { name: 'x', university });
      const next = await run(ctx);
      expect(next).not.toHaveBeenCalled();
      expect(ctx.status).toBe(403);
      expect((ctx.body as { error: { code: string } }).error.code).toBe('NOT_OWNER');
    }
  });
  it('acepta crear para la propia universidad', async () => {
    const ctx = ctxFor('POST', PROG, { name: 'x', university: { connect: [{ id: 1 }] } });
    expect(await run(ctx)).toHaveBeenCalled();
  });
  it('en actividades agrega siempre la universidad del editor', async () => {
    const ctx = ctxFor('POST', ACT, {
      title: 'x',
      participatingUniversities: { connect: [{ documentId: 'upn' }] },
    });
    expect(await run(ctx)).toHaveBeenCalled();
    const rel = ctx.request.body.participatingUniversities as {
      connect: Array<{ documentId?: string }>;
    };
    expect(rel.connect.map((r) => r.documentId)).toEqual(['upn', 'upc']);
    const ctx2 = ctxFor('POST', ACT, { title: 'x', participatingUniversities: ['upn'] });
    expect(await run(ctx2)).toHaveBeenCalled();
    expect(ctx2.request.body.participatingUniversities).toEqual(['upn', 'upc']);
  });
  it('rechaza actividad cuya lista final excluye a la universidad del editor (set vacío)', async () => {
    const ctx = ctxFor('POST', ACT, { title: 'x', participatingUniversities: { set: [] } });
    expect(await run(ctx)).toHaveBeenCalled(); // set vacío en create: se agrega la propia
    const rel = ctx.request.body.participatingUniversities as string[];
    expect(rel).toContain('upc');
  });
});

describe('admin-guard: editar', () => {
  it('impide mover un registro a otra universidad', async () => {
    const ctx = ctxFor(
      'PUT',
      PROG,
      { university: { connect: [{ documentId: 'upn' }], disconnect: [{ documentId: 'upc' }] } },
      { id: 'doc' }
    );
    expect(await run(ctx, 200)).not.toHaveBeenCalled();
    expect(ctx.status).toBe(403);
  });
  it('impide quitar a cualquier universidad de una actividad (propia o ajena)', async () => {
    const own = ctxFor(
      'PUT',
      ACT,
      { participatingUniversities: { disconnect: [{ id: 1 }] } },
      { id: 'doc' }
    );
    expect(await run(own, 200)).not.toHaveBeenCalled();
    const other = ctxFor(
      'PUT',
      ACT,
      { participatingUniversities: { disconnect: [{ documentId: 'upn' }] } },
      { id: 'doc' }
    );
    expect(await run(other, 200)).not.toHaveBeenCalled();
    const withoutOwn = ctxFor('PUT', ACT, { participatingUniversities: ['upn'] }, { id: 'doc' });
    expect(await run(withoutOwn, 200)).not.toHaveBeenCalled();
    const withoutOther = ctxFor(
      'PUT',
      ACT,
      { participatingUniversities: { set: [{ documentId: 'upc' }] } },
      { id: 'doc' }
    );
    expect(await run(withoutOther, 200)).not.toHaveBeenCalled();
    // superconjunto del estado actual: permitido
    const superset = ctxFor(
      'PUT',
      ACT,
      { participatingUniversities: ['upc', 'upn', 'otra'] },
      { id: 'doc' }
    );
    expect(await run(superset, 200)).toHaveBeenCalled();
  });
  it('bloquea borrar/despublicar noticias y aportes publicados; permite borrar borradores', async () => {
    const withPublished = {
      db: {
        query: () => ({
          findOne: async ({ where }: { where: { adminUser?: number; publishedAt?: unknown } }) =>
            where.adminUser !== undefined
              ? { university: UPC }
              : where.publishedAt
                ? { id: 1 }
                : null,
        }),
      },
    } as never;
    const g = createAdminGuard(withPublished);
    const del = ctxFor('DELETE', 'api::news.news', {}, { id: 'pub' });
    await g(del as never, jest.fn());
    expect(del.status).toBe(403);
    const unpub = ctxFor(
      'POST',
      'api::news.news',
      {},
      { id: 'pub', path: '/content-manager/collection-types/api::news.news/pub/actions/unpublish' }
    );
    await g(unpub as never, jest.fn());
    expect(unpub.status).toBe(403);
    const bulk = ctxFor(
      'POST',
      'api::contribution.contribution',
      { documentIds: ['pub'] },
      {
        path: '/content-manager/collection-types/api::contribution.contribution/actions/bulkDelete',
      }
    );
    await g(bulk as never, jest.fn());
    expect(bulk.status).toBe(403);

    const onlyDrafts = {
      db: {
        query: () => ({
          findOne: async ({ where }: { where: { adminUser?: number } }) =>
            where.adminUser !== undefined ? { university: UPC } : null,
        }),
      },
    } as never;
    const g2 = createAdminGuard(onlyDrafts);
    const delDraft = ctxFor('DELETE', 'api::news.news', {}, { id: 'draft' });
    const next = jest.fn();
    await g2(delDraft as never, next);
    expect(next).toHaveBeenCalled();
  });
  it('permite editar campos sin tocar la relación y agregar otras universidades', async () => {
    const ctx = ctxFor('PUT', PROG, { name: 'nuevo nombre' }, { id: 'doc' });
    expect(await run(ctx, 200)).toHaveBeenCalled();
    const ctx2 = ctxFor(
      'PUT',
      ACT,
      { participatingUniversities: { connect: [{ documentId: 'upn' }] } },
      { id: 'doc' }
    );
    expect(await run(ctx2, 200)).toHaveBeenCalled();
  });
});

describe('admin-guard: otros casos', () => {
  it('bloquea clonar', async () => {
    const ctx = ctxFor(
      'POST',
      PROG,
      {},
      { path: `/content-manager/collection-types/${PROG}/clone/abc` }
    );
    expect(await run(ctx)).not.toHaveBeenCalled();
    expect(ctx.status).toBe(403);
  });
  it('editor sin perfil: 403 con mensaje claro', async () => {
    const ctx = ctxFor(
      'POST',
      PROG,
      { name: 'x' },
      { user: { id: 99, roles: [{ code: 'university-editor' }] } }
    );
    expect(await run(ctx)).not.toHaveBeenCalled();
    expect((ctx.body as { error: { message: string } }).error.message).toMatch(/Perfil de editor/);
  });
  it('el Super Admin no pasa por la política de propiedad', async () => {
    const ctx = ctxFor('POST', PROG, { name: 'x', university: 'upn' }, { user: superAdmin });
    expect(await run(ctx)).toHaveBeenCalled();
    expect(ctx.request.body.university).toBe('upn');
  });
  it('content-types sin dueño no se tocan (p. ej. noticias) y GET nunca se bloquea', async () => {
    const ctx = ctxFor('POST', 'api::news.news', { title: 'x' });
    expect(await run(ctx)).toHaveBeenCalled();
    const get = ctxFor('GET', PROG, {});
    expect(await run(get, 200)).toHaveBeenCalled();
  });
  it('audita escrituras exitosas con acción, tipo, documento y resumen', async () => {
    const ctx = ctxFor('POST', PROG, { name: 'Maestría X' });
    await run(ctx);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: 'create',
        contentType: PROG,
        documentId: 'nuevo',
        summary: 'Maestría X',
        statusCode: 201,
      })
    );
    const del = ctxFor('DELETE', PROG, {}, { id: 'doc9' });
    await run(del, 200);
    expect(recordAudit).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'delete', documentId: 'doc9' })
    );
    const pub = ctxFor(
      'POST',
      'api::news.news',
      {},
      { path: '/content-manager/collection-types/api::news.news/doc/actions/publish', id: 'doc' }
    );
    await run(pub, 200);
    expect(recordAudit).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'publish' })
    );
  });
  it('no audita escrituras fallidas', async () => {
    const ctx = ctxFor('POST', PROG, { name: 'x' });
    await run(ctx, 400);
    expect(recordAudit).not.toHaveBeenCalled();
  });
});

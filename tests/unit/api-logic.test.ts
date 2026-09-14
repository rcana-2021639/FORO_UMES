import contactController from '../../src/api/contact/controllers/contact';
import forumSummaryService from '../../src/api/forum-summary/services/forum-summary';
import { recordAudit } from '../../src/security/audit';
import { getEditorUniversity, isSuperAdmin } from '../../src/security/ownership';
import galleryLifecycles from '../../src/api/gallery-item/content-types/gallery-item/lifecycles';
import activityLifecycles from '../../src/api/activity/content-types/activity/lifecycles';

const ctxOf = (body: unknown) =>
  ({ request: { body }, status: 200, body: undefined as unknown, state: {} }) as never;

describe('controlador POST /api/contact', () => {
  const create = jest.fn().mockResolvedValue({});
  const strapi = { log: { info: jest.fn() }, documents: () => ({ create }) } as never;
  const controller = contactController({ strapi });

  beforeEach(() => create.mockClear());

  it('guarda un mensaje válido y responde 201', async () => {
    const ctx = ctxOf({
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Mensaje suficientemente largo.',
    });
    await controller.submit(ctx);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: 'ana@example.com', handled: false }),
    });
    expect((ctx as { status: number }).status).toBe(201);
  });
  it('honeypot: responde 201 sin guardar', async () => {
    const ctx = ctxOf({
      name: 'Bot',
      email: 'b@x.com',
      message: 'spam spam spam spam',
      website: 'x',
    });
    await controller.submit(ctx);
    expect(create).not.toHaveBeenCalled();
    expect((ctx as { status: number }).status).toBe(201);
  });
  it('inválido: 400 VALIDATION_ERROR con campos', async () => {
    const ctx = ctxOf({});
    await controller.submit(ctx);
    expect((ctx as { status: number }).status).toBe(400);
    expect(
      (ctx as { body: { error: { code: string; details: { fields: unknown[] } } } }).body.error
        .details.fields
    ).toHaveLength(3);
  });
});

describe('servicio forum-summary', () => {
  const count = jest.fn().mockResolvedValue(3);
  const findMany = jest.fn().mockResolvedValue([{ title: 'x' }]);
  const strapi = { documents: () => ({ count, findMany }) } as never;

  it('agrega contadores y listas, y cachea 60 s', async () => {
    const service = forumSummaryService({ strapi });
    const first = await service.get();
    expect(first.counts).toEqual({
      universities: 3,
      academicPrograms: 3,
      activitiesThisYear: 3,
      contributions: 3,
    });
    expect(first.latestNews).toEqual([{ title: 'x' }]);
    const calls = count.mock.calls.length;
    await service.get();
    expect(count.mock.calls.length).toBe(calls); // sirvió desde cache
    service.invalidate();
    await service.get();
    expect(count.mock.calls.length).toBeGreaterThan(calls);
  });
});

describe('auditoría y propiedad', () => {
  it('recordAudit escribe en la bitácora y nunca rompe la petición si falla', async () => {
    const create = jest.fn().mockResolvedValue({});
    const strapi = { db: { query: () => ({ create }) }, log: { error: jest.fn() } } as never;
    await recordAudit(strapi, {
      user: { id: 1, email: 'a@b.c' },
      action: 'create',
      contentType: 'api::x.x',
      documentId: 'd',
      statusCode: 201,
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ adminUserId: 1, action: 'create', targetDocumentId: 'd' }),
    });

    const failing = {
      db: { query: () => ({ create: jest.fn().mockRejectedValue(new Error('db down')) }) },
      log: { error: jest.fn() },
    } as never;
    await expect(
      recordAudit(failing, { user: { id: 1 }, action: 'login' })
    ).resolves.toBeUndefined();
    expect((failing as { log: { error: jest.Mock } }).log.error).toHaveBeenCalled();
  });
  it('getEditorUniversity devuelve la universidad del perfil o null; isSuperAdmin por código de rol', async () => {
    const strapi = {
      db: {
        query: () => ({
          findOne: async ({ where }: { where: { adminUser: number } }) =>
            where.adminUser === 1 ? { university: { id: 9, documentId: 'u9', name: 'U' } } : null,
        }),
      },
    } as never;
    expect(await getEditorUniversity(strapi, 1)).toEqual({ id: 9, documentId: 'u9', name: 'U' });
    expect(await getEditorUniversity(strapi, 2)).toBeNull();
    expect(isSuperAdmin({ roles: [{ code: 'strapi-super-admin' }] })).toBe(true);
    expect(isSuperAdmin({ roles: [{ code: 'university-editor' }] })).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });
});

describe('lifecycles', () => {
  it('galería: Foto requiere archivo, Video requiere enlace (create y update)', async () => {
    expect(() => galleryLifecycles.beforeCreate({ params: { data: { type: 'Foto' } } })).toThrow(
      /archivo/
    );
    expect(() => galleryLifecycles.beforeCreate({ params: { data: { type: 'Video' } } })).toThrow(
      /enlace/
    );
    expect(() =>
      galleryLifecycles.beforeCreate({ params: { data: { type: 'Video', videoUrl: 'https://v' } } })
    ).not.toThrow();

    (global as { strapi?: unknown }).strapi = {
      db: { query: () => ({ findOne: async () => ({ type: 'Foto', file: { id: 1 } }) }) },
    };
    await expect(
      galleryLifecycles.beforeUpdate({ params: { data: {}, where: { id: 1 } } })
    ).resolves.toBeUndefined();
    await expect(
      galleryLifecycles.beforeUpdate({ params: { data: { file: null }, where: { id: 1 } } })
    ).rejects.toThrow(/archivo/);
  });
  it('actividad: al menos una universidad participante (create y update con connect/disconnect)', async () => {
    expect(() =>
      activityLifecycles.beforeCreate({ params: { data: { participatingUniversities: [] } } })
    ).toThrow(/al menos una/);
    expect(() =>
      activityLifecycles.beforeCreate({
        params: { data: { participatingUniversities: { connect: [] } } },
      })
    ).toThrow();
    expect(() =>
      activityLifecycles.beforeCreate({ params: { data: { participatingUniversities: ['a'] } } })
    ).not.toThrow();
    expect(() =>
      activityLifecycles.beforeCreate({
        params: { data: { participatingUniversities: { connect: [{ id: 1 }] } } },
      })
    ).not.toThrow();

    (global as { strapi?: unknown }).strapi = {
      db: {
        query: () => ({
          findOne: async () => ({ participatingUniversities: [{ id: 1 }, { id: 2 }] }),
        }),
      },
    };
    await expect(
      activityLifecycles.beforeUpdate({ params: { data: {}, where: { id: 1 } } })
    ).resolves.toBeUndefined();
    await expect(
      activityLifecycles.beforeUpdate({
        params: {
          data: { participatingUniversities: { disconnect: [{ id: 1 }] } },
          where: { id: 1 },
        },
      })
    ).resolves.toBeUndefined();
    await expect(
      activityLifecycles.beforeUpdate({
        params: { data: { participatingUniversities: { disconnect: [1, 2] } }, where: { id: 1 } },
      })
    ).rejects.toThrow(/al menos una/);
    await expect(
      activityLifecycles.beforeUpdate({
        params: { data: { participatingUniversities: { set: [] } }, where: { id: 1 } },
      })
    ).rejects.toThrow();
  });
});

describe('valores por defecto de la API pública', () => {
  it('fuerza status=published y aplica populate mínimo solo si el cliente no lo pidió', async () => {
    const { applyPublicQueryDefaults } = await import('../../src/lib/public-api');
    const ctx = { query: { status: 'draft' } } as never;
    applyPublicQueryDefaults(ctx, 'api::news.news');
    expect((ctx as { query: Record<string, unknown> }).query.status).toBe('published');
    expect((ctx as { query: Record<string, unknown> }).query.populate).toHaveProperty('coverImage');
    const ctx2 = { query: { populate: 'coverImage' } } as never;
    applyPublicQueryDefaults(ctx2, 'api::news.news');
    expect((ctx2 as { query: Record<string, unknown> }).query.populate).toBe('coverImage');
  });
});

describe('sanitizador de richtext como middleware de documentos', () => {
  it('sanitiza los campos richtext de api::* en create/update y deja el resto intacto', async () => {
    const { registerRichTextSanitizer } = await import('../../src/security/richtext-sanitizer');
    let mw!: (ctx: unknown, next: () => Promise<unknown>) => Promise<unknown>;
    const strapi = {
      contentTypes: {
        'api::news.news': {
          attributes: { title: { type: 'string' }, content: { type: 'richtext' } },
        },
        'admin::user': { attributes: { bio: { type: 'richtext' } } },
      },
      documents: { use: (fn: typeof mw) => (mw = fn) },
      log: { info: jest.fn() },
    } as never;
    registerRichTextSanitizer(strapi);
    const params = {
      data: { title: '<script>t</script>', content: 'a <script>x</script><b>b</b>' },
    };
    await mw({ uid: 'api::news.news', action: 'update', params }, async () => 'ok');
    expect(params.data.content).toBe('a <b>b</b>');
    expect(params.data.title).toBe('<script>t</script>'); // no es richtext: no se toca
    const other = { data: { content: '<script>x</script>' } };
    await mw({ uid: 'api::news.news', action: 'delete', params: other }, async () => 'ok');
    expect(other.data.content).toBe('<script>x</script>');
  });
});

describe('lifecycle de mensaje de contacto (notificación)', () => {
  const load = async () =>
    (await import('../../src/api/contact-message/content-types/contact-message/lifecycles'))
      .default;
  const result = {
    id: 1,
    documentId: 'd',
    name: 'Ana',
    email: 'ana@x.com',
    subject: 'Hola',
    message: 'Texto',
  };

  it('sin destinatario configurado avisa en el log y no envía', async () => {
    const send = jest.fn();
    (global as { strapi?: unknown }).strapi = {
      config: { get: () => '' },
      log: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
      plugin: () => ({ service: () => ({ send }) }),
    };
    await (await load()).afterCreate({ result });
    expect(send).not.toHaveBeenCalled();
  });
  it('sin SMTP simula el envío; con SMTP envía y tolera fallos del proveedor', async () => {
    delete process.env.SMTP_HOST;
    const send = jest.fn().mockResolvedValue({});
    const log = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };
    (global as { strapi?: unknown }).strapi = {
      config: { get: (k: string) => (k === 'contact.notifyEmail' ? 'foro@x.org' : '') },
      log,
      plugin: () => ({ service: () => ({ send }) }),
    };
    await (await load()).afterCreate({ result });
    expect(send).not.toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('simulada'));

    process.env.SMTP_HOST = 'smtp.test';
    await (await load()).afterCreate({ result });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'foro@x.org', replyTo: 'ana@x.com' })
    );
    expect(JSON.stringify(log.info.mock.calls)).not.toContain('Texto'); // el contenido no va al log

    send.mockRejectedValueOnce(new Error('smtp caído'));
    await expect((await load()).afterCreate({ result })).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalled();
    delete process.env.SMTP_HOST;
  });
});

/**
 * Pruebas de seguridad (Sprint 7, tareas 6-7): contacto, límite de tasa, autenticación del panel,
 * subida de archivos y sanitización de richtext.
 */
import type { Core } from '@strapi/strapi';
import zlib from 'node:zlib';
import {
  CM,
  api,
  cleanContent,
  createEditor,
  createUniversity,
  login,
  setupStrapi,
  teardownStrapi,
  type TestEditor,
} from '../helpers/strapi';

let strapi: Core.Strapi;
let editor: TestEditor;
let token: string;

/** PNG válido de 1×1 generado en memoria. */
function tinyPng(): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.from([0, 255, 0, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

beforeAll(async () => {
  strapi = await setupStrapi();
  await cleanContent(strapi);
  const u = await createUniversity(strapi, 'UVG', 3);
  editor = await createEditor(strapi, u);
  token = await login(editor);
});

afterAll(async () => {
  await cleanContent(strapi);
  await teardownStrapi();
});

describe('POST /api/contact', () => {
  const valid = {
    name: 'Ana',
    email: 'ana@example.com',
    message: 'Quiero información sobre maestrías.',
  };

  it('guarda un mensaje válido (201)', async () => {
    const res = await api().post('/api/contact').set('X-Forwarded-For', '10.0.0.1').send(valid);
    expect(res.status).toBe(201);
    const stored = await strapi.db.query('api::contact-message.contact-message').findMany({});
    expect(stored).toHaveLength(1);
    expect(stored[0].handled).toBe(false);
  });

  it('sin campos requeridos → 400 con el formato estándar y detalle por campo', async () => {
    const res = await api()
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      requestId: expect.any(String),
    });
    expect(res.body.error.details.fields.map((f: { field: string }) => f.field)).toEqual([
      'name',
      'email',
      'message',
    ]);
  });

  it('con el honeypot relleno responde 201 pero NO guarda nada', async () => {
    const before = await strapi.db.query('api::contact-message.contact-message').count({});
    const res = await api()
      .post('/api/contact')
      .set('X-Forwarded-For', '10.0.0.3')
      .send({ ...valid, website: 'http://spam' });
    expect(res.status).toBe(201);
    expect(await strapi.db.query('api::contact-message.contact-message').count({})).toBe(before);
  });

  it('a partir del 6.º envío por hora desde la misma IP → 429 con Retry-After', async () => {
    let last;
    for (let i = 0; i < 6; i++) {
      last = await api()
        .post('/api/contact')
        .set('X-Forwarded-For', '10.0.0.99')
        .send({ ...valid, website: 'x' });
    }
    expect(last!.status).toBe(429);
    expect(last!.body.error.code).toBe('RATE_LIMITED');
    expect(Number(last!.headers['retry-after'])).toBeGreaterThan(0);
    // otra IP no se ve afectada
    expect(
      (
        await api()
          .post('/api/contact')
          .set('X-Forwarded-For', '10.0.0.100')
          .send({ ...valid, website: 'x' })
      ).status
    ).toBe(201);
  });
});

describe('panel administrativo', () => {
  it('sin token → 401; con token inválido → 401', async () => {
    expect((await api().get(`${CM}/api::university.university`)).status).toBe(401);
    expect(
      (await api().get(`${CM}/api::university.university`).set('Authorization', 'Bearer invalido'))
        .status
    ).toBe(401);
  });
  it('rechaza contraseñas débiles al cambiar la propia (400 WEAK_PASSWORD)', async () => {
    const res = await api()
      .put('/admin/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: editor.password, password: 'corta123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WEAK_PASSWORD');
  });
  it('bloquea el login tras 5 intentos fallidos (429)', async () => {
    let last;
    for (let i = 0; i < 6; i++) {
      last = await api()
        .post('/admin/login')
        .set('X-Forwarded-For', '10.0.1.1')
        .send({ email: 'nadie@test.local', password: 'Wrong!Password123' });
    }
    expect(last!.status).toBe(429);
  });
});

describe('subida de archivos', () => {
  const upload = (bytes: Buffer, name: string, type: string) =>
    api()
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', bytes, { filename: name, contentType: type });

  it('rechaza un ejecutable renombrado como .png (400 INVALID_IMAGE)', async () => {
    const res = await upload(
      Buffer.concat([Buffer.from('MZ'), Buffer.alloc(300)]),
      'virus.png',
      'image/png'
    );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_IMAGE');
  });
  it('rechaza extensión no permitida (SVG) y extensión que no coincide', async () => {
    expect((await upload(Buffer.from('<svg/>'), 'a.svg', 'image/svg+xml')).status).toBe(400);
    expect((await upload(tinyPng(), 'foto.jpg', 'image/jpeg')).status).toBe(400);
  });
  it('rechaza archivos que exceden 5 MB', async () => {
    const big = Buffer.concat([tinyPng(), Buffer.alloc(6 * 1024 * 1024)]);
    const res = await upload(big, 'grande.png', 'image/png');
    expect([400, 413]).toContain(res.status);
  });
  it('acepta un PNG válido y lo renombra con hash', async () => {
    const res = await upload(tinyPng(), 'logo.png', 'image/png');
    expect(res.status).toBe(201);
    expect(res.body[0].hash).toMatch(/^logo_[a-f0-9]{10}$/);
    await strapi.plugin('upload').service('upload').remove(res.body[0]);
  });
});

describe('richtext', () => {
  it('se guarda sin scripts ni manejadores de eventos', async () => {
    const res = await api()
      .post(`${CM}/api::academic-program.academic-program`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Con richtext',
        level: 'Maestria',
        modality: 'Virtual',
        description: 'Hola <script>alert(1)</script><b onclick="x()">ok</b>',
      });
    expect(res.status).toBe(201);
    const doc = await strapi
      .documents('api::academic-program.academic-program')
      .findOne({ documentId: res.body.data.documentId });
    expect(doc!.description).toBe('Hola <b>ok</b>');
  });
});

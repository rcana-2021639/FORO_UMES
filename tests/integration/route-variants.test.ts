/**
 * Auditoría de producción (oct-2026): ataques con variantes de ruta, límites por IP del panel y
 * metadatos de las fotos.
 *
 * El enrutador de Strapi no distingue mayúsculas y acepta una barra final, pero los middlewares
 * comparaban la ruta exacta. Con `/CONTENT-MANAGER/...` o una "/" al final, un editor creaba
 * contenido a nombre de otra universidad, se subía un ejecutable disfrazado de foto y se esquivaban
 * la lista blanca de consultas y el límite del formulario de contacto (hallazgo A-1).
 */
import type { Core } from '@strapi/strapi';
import sharp from 'sharp';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { randomFillSync } from 'node:crypto';
import { ensureUploadSettings } from '../../src/security/upload-settings';
import {
  CM,
  api,
  cleanContent,
  createEditor,
  createUniversity,
  login,
  setupStrapi,
  teardownStrapi,
  type TestUniversity,
} from '../helpers/strapi';

let strapi: Core.Strapi;
let ua: TestUniversity;
let ub: TestUniversity;
let tokenA: string;
let tokenB: string;

const PROGRAM = 'api::academic-program.academic-program';
const ACTIVITY = 'api::activity.activity';
const NEWS = 'api::news.news';
const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(300)]);

beforeAll(async () => {
  strapi = await setupStrapi();
  await cleanContent(strapi);
  ua = await createUniversity(strapi, 'USAC', 1);
  ub = await createUniversity(strapi, 'URL', 2);
  tokenA = await login(await createEditor(strapi, ua));
  tokenB = await login(await createEditor(strapi, ub));
});

afterAll(async () => {
  await teardownStrapi();
});

describe('variantes de ruta (mayúsculas, barra final)', () => {
  const variants = (base: string) => [
    base,
    base.toUpperCase().replace(/API::[A-Z.-]+/, (uid) => uid.toLowerCase()),
    `${base}/`,
  ];

  it('un editor no crea contenido para otra universidad por ninguna variante', async () => {
    for (const route of variants(`${CM}/${PROGRAM}`)) {
      const res = await api()
        .post(route)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Programa intruso',
          level: 'Maestria',
          modality: 'Virtual',
          university: { connect: [{ documentId: ub.documentId }] },
        });
      expect({ route, status: res.status }).toEqual({ route, status: 403 });
      expect(res.body.error.code).toBe('NOT_OWNER');
    }
    const intrusos = await strapi.db.query(PROGRAM).count({ where: { name: 'Programa intruso' } });
    expect(intrusos).toBe(0);
  });

  it('nadie quita a otra universidad de una actividad compartida con barra final', async () => {
    const activity = await strapi.documents(ACTIVITY).create({
      data: {
        title: 'Encuentro compartido',
        type: 'Encuentro',
        date: '2026-11-10',
        participatingUniversities: [ua.documentId, ub.documentId],
      },
    });
    const res = await api()
      .put(`${CM}/${ACTIVITY}/${activity.documentId}/`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ participatingUniversities: { disconnect: [{ documentId: ub.documentId }] } });
    expect(res.status).toBe(403);
  });

  it('un editor no despublica su noticia publicada con la ruta en mayúsculas', async () => {
    const created = await api()
      .post(`${CM}/${NEWS}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Noticia de B', content: 'Texto de la noticia.' });
    expect(created.status).toBe(201);
    const documentId = created.body.data.documentId as string;
    await strapi.documents(NEWS).publish({ documentId });

    for (const action of ['ACTIONS/UNPUBLISH', 'actions/unpublish/', 'Actions/Discard']) {
      const res = await api()
        .post(`${CM}/${NEWS}/${documentId}/${action}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({});
      expect({ action, status: res.status }).toEqual({ action, status: 403 });
    }
    const stillPublished = await strapi.db
      .query(NEWS)
      .findOne({ where: { documentId, publishedAt: { $notNull: true } } });
    expect(stillPublished).not.toBeNull();
  });

  it('la verificación de imágenes no se salta con /UPLOAD ni /upload/', async () => {
    for (const route of ['/upload', '/UPLOAD', '/Upload', '/upload/']) {
      const res = await api()
        .post(route)
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('files', exe, { filename: 'virus.png', contentType: 'image/png' });
      expect({ route, status: res.status }).toEqual({ route, status: 400 });
      expect(res.body.error.code).toBe('INVALID_IMAGE');
    }
  });

  it('una imagen mayor a 5 MB da un error claro en español (no "FileTooBig")', async () => {
    const tooBig = Buffer.alloc(6 * 1024 * 1024); // 6 MB > límite de 5 MB
    for (const route of ['/upload', '/UPLOAD', '/upload/']) {
      const res = await api()
        .post(route)
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('files', tooBig, { filename: 'pesada.png', contentType: 'image/png' });
      expect({ route, status: res.status }).toEqual({ route, status: 413 });
      expect(res.body.error.message).toContain('5 MB');
      expect(res.body.error.message).not.toContain('FileTooBig');
    }
  });

  it('la lista blanca de consultas no se salta con /API/ en mayúsculas', async () => {
    const deep = 'populate[representatives][populate][university][populate]=*';
    for (const route of ['/api/universities', '/API/universities', '/Api/Universities/']) {
      const res = await api().get(`${route}?${deep}`);
      expect({ route, status: res.status }).toEqual({ route, status: 400 });
      expect(res.body.error.code).toBe('QUERY_NOT_ALLOWED');
    }
  });

  it('el límite del formulario de contacto es el mismo para todas las variantes', async () => {
    const body = { name: 'Ana', email: 'ana@ejemplo.org', message: 'Hola, quisiera información.' };
    const routes = [
      '/api/contact',
      '/api/contact/',
      '/API/CONTACT',
      '/Api/Contact',
      '/api/contact',
    ];
    for (const route of routes) {
      const res = await api().post(route).set('X-Forwarded-For', '10.20.0.1').send(body);
      expect(res.status).toBe(201);
    }
    const sixth = await api().post('/API/CONTACT/').set('X-Forwarded-For', '10.20.0.1').send(body);
    expect(sixth.status).toBe(429);
  });

  it('la política de contraseñas se aplica también en /ADMIN/USERS/ME', async () => {
    const res = await api()
      .put('/ADMIN/USERS/ME')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ password: 'abcdefgh', currentPassword: 'cualquiera' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WEAK_PASSWORD');
  });
});

describe('límites por IP del panel', () => {
  it('login: 30 intentos por IP aunque cada uno use un correo distinto (password spraying)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await api()
        .post(i % 2 ? '/admin/login' : '/ADMIN/LOGIN/')
        .set('X-Forwarded-For', '10.30.0.1')
        .send({ email: `persona${i}@ejemplo.test`, password: 'Contraseña-Comun-2026' });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 30).every((s) => s === 400)).toBe(true);
    expect(statuses[30]).toBe(429);
    // Otra IP no queda afectada
    const other = await api()
      .post('/admin/login')
      .set('X-Forwarded-For', '10.30.0.2')
      .send({ email: 'otra@ejemplo.test', password: 'x' });
    expect(other.status).toBe(400);
  });

  it('olvidé mi contraseña: 5 por hora por IP (no se puede agotar la cuota de correo)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await api()
        .post('/admin/forgot-password')
        .set('X-Forwarded-For', '10.31.0.1')
        .send({ email: `buzon${i}@ejemplo.test` });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 5)).toEqual([204, 204, 204, 204, 204]);
    expect(statuses[5]).toBe(429);
  });

  it('una red IPv6 cuenta como una sola (rotar direcciones del mismo /64 no sirve)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await api()
        .post('/admin/forgot-password')
        .set('X-Forwarded-For', `2001:db8:1234:5678::${(i + 1).toString(16)}`)
        .send({ email: `v6-${i}@ejemplo.test` });
      statuses.push(res.status);
    }
    expect(statuses[5]).toBe(429);
  });
});

describe('fotos sin ubicación GPS', () => {
  /** JPEG con EXIF de cámara y GPS (ruido aleatorio: la versión optimizada pesa MÁS que la original). */
  async function photoWithGps(): Promise<Buffer> {
    const noise = randomFillSync(Buffer.alloc(400 * 300 * 3));
    return sharp(noise, { raw: { width: 400, height: 300, channels: 3 } })
      .jpeg({ quality: 5 })
      .withExif({
        IFD0: { Make: 'CamaraDePrueba' },
        IFD3: {
          GPSLatitudeRef: 'N',
          GPSLatitude: '14/1 38/1 0/1',
          GPSLongitudeRef: 'W',
          GPSLongitude: '90/1 30/1 0/1',
        },
      })
      .toBuffer();
  }

  it('aunque alguien apague la optimización en el panel, el arranque la vuelve a encender', async () => {
    const store = strapi.store({ type: 'plugin', name: 'upload', key: 'settings' });
    const current = (await store.get({})) as Record<string, unknown>;
    await store.set({ value: { ...current, sizeOptimization: false, autoOrientation: false } });

    await ensureUploadSettings(strapi);
    expect(await store.get({})).toMatchObject({ sizeOptimization: true, autoOrientation: true });
  });

  it('las fotos subidas (original y miniaturas) no conservan EXIF ni GPS', async () => {
    const photo = await photoWithGps();
    expect((await sharp(photo).metadata()).exif).toBeDefined();

    const res = await api()
      .post('/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('files', photo, { filename: 'actividad.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(201);

    const file = res.body[0] as { url: string; formats?: Record<string, { url: string }> };
    const urls = [file.url, ...Object.values(file.formats ?? {}).map((f) => f.url)];
    for (const url of urls) {
      const stored = await readFile(path.join(process.cwd(), 'public', url));
      expect((await sharp(stored).metadata()).exif).toBeUndefined();
      expect(stored.includes(Buffer.from('CamaraDePrueba'))).toBe(false);
    }
  });
});

describe('panel en español', () => {
  it('los campos tienen etiqueta y ayuda en español', async () => {
    const service = strapi.plugin('content-manager').service('content-types');
    const config = await service.findConfiguration({ uid: 'api::representative.representative' });
    expect(config.metadatas.institutionalEmail.edit.label).toBe('Correo institucional');
    expect(config.metadatas.institutionalEmail.edit.description).toMatch(/PUBLICA/);
    expect(config.layouts.list).toEqual([
      'fullName',
      'position',
      'university',
      'institutionalEmail',
    ]);
  });
});

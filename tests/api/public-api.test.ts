/**
 * Endpoints públicos (Sprint 7, tarea 5): listados paginados, solo contenido publicado,
 * lista blanca de consultas y resumen de inicio.
 */
import type { Core } from '@strapi/strapi';
import {
  api,
  cleanContent,
  createUniversity,
  setupStrapi,
  teardownStrapi,
} from '../helpers/strapi';

let strapi: Core.Strapi;

beforeAll(async () => {
  strapi = await setupStrapi();
  await cleanContent(strapi);
  const usac = await createUniversity(strapi, 'USAC', 1);
  const url = await createUniversity(strapi, 'URL', 2);
  await strapi.documents('api::academic-program.academic-program').create({
    data: {
      name: 'Maestría A',
      level: 'Maestria',
      modality: 'Virtual',
      university: usac.documentId,
    },
  });
  await strapi.documents('api::academic-program.academic-program').create({
    data: {
      name: 'Doctorado B',
      level: 'Doctorado',
      modality: 'Presencial',
      university: url.documentId,
    },
  });
  await strapi
    .documents('api::news.news')
    .create({ data: { title: 'Publicada', content: 'x' }, status: 'published' });
  await strapi
    .documents('api::news.news')
    .create({ data: { title: 'Borrador secreto', content: 'x' }, status: 'draft' });
  await strapi.documents('api::contribution.contribution').create({
    data: {
      title: 'Aporte publicado',
      description: 'd',
      type: 'Resultado',
      publishedOn: '2026-01-01',
    },
    status: 'published',
  });
  await strapi.documents('api::activity.activity').create({
    data: {
      title: 'Encuentro',
      type: 'Encuentro',
      date: `${new Date().getFullYear()}-06-01`,
      participatingUniversities: [usac.documentId],
    },
  });
});

afterAll(async () => {
  await cleanContent(strapi);
  await teardownStrapi();
});

describe('listados públicos', () => {
  it('GET /api/universities responde 200 con lista paginada y orden por displayOrder', async () => {
    const res = await api().get('/api/universities?sort=displayOrder');
    expect(res.status).toBe(200);
    expect(res.body.meta.pagination).toMatchObject({ page: 1, total: 2 });
    expect(res.body.data.map((u: { acronym: string }) => u.acronym)).toEqual(['USAC', 'URL']);
    expect(res.body.data[0]).toHaveProperty('logo');
    expect(res.body.data[0]).not.toHaveProperty('createdBy');
  });

  it('fuerza el tamaño de página máximo de 50', async () => {
    const res = await api().get('/api/universities?pagination[pageSize]=5000');
    expect(res.body.meta.pagination.pageSize).toBe(50);
  });

  it('filtra programas por universidad y nivel (lista blanca)', async () => {
    const res = await api().get(
      '/api/academic-programs?filters[university][acronym][$eq]=USAC&filters[level][$eq]=Maestria'
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].university.acronym).toBe('USAC');
  });

  it('rechaza filtros, orden y populate fuera de la lista blanca', async () => {
    expect(
      (await api().get('/api/academic-programs?filters[createdBy][id][$eq]=1')).body.error.code
    ).toBe('QUERY_NOT_ALLOWED');
    expect((await api().get('/api/academic-programs?sort=createdAt')).status).toBe(400);
    expect((await api().get('/api/news-items?populate=createdBy')).status).toBe(400);
  });
});

describe('solo contenido publicado', () => {
  it('GET /api/news-items nunca incluye borradores, ni con status=draft', async () => {
    for (const q of ['', '?status=draft']) {
      const res = await api().get(`/api/news-items${q}`);
      expect(res.status).toBe(200);
      expect(res.body.data.map((n: { title: string }) => n.title)).toEqual(['Publicada']);
    }
    // parámetro de Strapi 4 ya no existe: se rechaza en lugar de ignorarse
    expect((await api().get('/api/news-items?publicationState=preview')).status).toBe(400);
  });
  it('GET /api/contributions solo publicados', async () => {
    const res = await api().get('/api/contributions');
    expect(res.body.data).toHaveLength(1);
  });
});

describe('sin escritura ni recursos privados', () => {
  it('no existen rutas de escritura en /api/*', async () => {
    expect(
      (
        await api()
          .post('/api/universities')
          .send({ data: { name: 'x' } })
      ).status
    ).toBe(405);
    expect((await api().delete('/api/universities/abc')).status).toBe(405);
  });
  it('mensajes de contacto, perfiles y bitácora no se exponen', async () => {
    for (const path of [
      '/api/contact-messages',
      '/api/editor-profiles',
      '/api/audit-logs',
      '/api/users',
      '/api/upload/files',
    ]) {
      const res = await api().get(path);
      expect([403, 404]).toContain(res.status);
    }
  });
});

describe('GET /api/forum-summary', () => {
  it('devuelve contadores, últimas noticias y próximas actividades', async () => {
    const res = await api().get('/api/forum-summary');
    expect(res.status).toBe(200);
    expect(res.body.data.counts).toEqual({
      universities: 2,
      academicPrograms: 2,
      activitiesThisYear: 1,
      contributions: 1,
    });
    expect(res.body.data.latestNews).toHaveLength(1);
    expect(res.body.data.latestNews[0].title).toBe('Publicada');
    expect(res.headers['cache-control']).toContain('max-age=60');
  });
});

describe('formato estándar de error', () => {
  it('404 con code, message en español y requestId', async () => {
    const res = await api().get('/api/universities/no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        status: 404,
        code: 'NOT_FOUND',
        message: expect.stringMatching(/no existe/),
        requestId: expect.any(String),
      },
    });
    expect(res.headers['x-request-id']).toBe(res.body.error.requestId);
  });
});

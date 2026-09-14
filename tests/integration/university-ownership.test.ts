/**
 * Política de propiedad por universidad (plan técnico, Sprint 7, tarea 4) contra Strapi real.
 * Editor A (UPC) y editor B (UPN) atacan la API del panel como lo haría un usuario malicioso.
 */
import type { Core } from '@strapi/strapi';
import {
  CM,
  api,
  cleanContent,
  createEditor,
  createEditorWithoutProfile,
  createUniversity,
  login,
  setupStrapi,
  teardownStrapi,
  type TestEditor,
} from '../helpers/strapi';

const PROG = `${CM}/api::academic-program.academic-program`;
const ACT = `${CM}/api::activity.activity`;
const UNI = `${CM}/api::university.university`;
const NEWS = `${CM}/api::news.news`;

let strapi: Core.Strapi;
let a: TestEditor;
let b: TestEditor;
let tokenA: string;
let tokenB: string;
let programOfB: string;

beforeAll(async () => {
  strapi = await setupStrapi();
  await cleanContent(strapi);
  const upc = await createUniversity(strapi, 'UPC', 1);
  const upn = await createUniversity(strapi, 'UPN', 2);
  a = await createEditor(strapi, upc);
  b = await createEditor(strapi, upn);
  tokenA = await login(a);
  tokenB = await login(b);

  const created = await strapi.documents('api::academic-program.academic-program').create({
    data: {
      name: 'Programa de UPN',
      level: 'Maestria',
      modality: 'Virtual',
      university: upn.documentId,
    },
  });
  programOfB = created.documentId;
  await strapi.documents('api::academic-program.academic-program').create({
    data: {
      name: 'Programa de UPC',
      level: 'Maestria',
      modality: 'Virtual',
      university: upc.documentId,
    },
  });
});

afterAll(async () => {
  await cleanContent(strapi);
  await teardownStrapi();
});

const asA = () => ({ Authorization: `Bearer ${tokenA}` });
const asB = () => ({ Authorization: `Bearer ${tokenB}` });

describe('lectura filtrada', () => {
  it('cada editor solo lista los programas y la universidad propios', async () => {
    const res = await api().get(`${PROG}?pageSize=100`).set(asA());
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].name).toBe('Programa de UPC');

    const unis = await api().get(`${UNI}?pageSize=100`).set(asA());
    expect(unis.status).toBe(200);
    expect(unis.body.results.map((u: { acronym: string }) => u.acronym)).toEqual(['UPC']);
  });
});

describe('escritura sobre contenido ajeno', () => {
  it('editar o borrar un programa de la otra universidad → 403', async () => {
    const put = await api().put(`${PROG}/${programOfB}`).set(asA()).send({ name: 'Hackeado' });
    expect(put.status).toBe(403);
    const del = await api().delete(`${PROG}/${programOfB}`).set(asA());
    expect(del.status).toBe(403);
    // sigue intacto
    const check = await api().get(`${PROG}/${programOfB}`).set(asB());
    expect(check.body.data.name).toBe('Programa de UPN');
  });

  it('crear un programa a nombre de la otra universidad → 403 NOT_OWNER', async () => {
    const res = await api()
      .post(PROG)
      .set(asA())
      .send({
        name: 'Intruso',
        level: 'Maestria',
        modality: 'Virtual',
        university: { connect: [{ documentId: b.university.documentId }] },
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NOT_OWNER');
  });

  it('crear sin universidad → se asigna la propia (201) y el mismo editor la ve; el otro no', async () => {
    const res = await api()
      .post(PROG)
      .set(asA())
      .send({ name: 'Nuevo de UPC', level: 'Diplomado', modality: 'Virtual' });
    expect(res.status).toBe(201);
    const doc = res.body.data.documentId;
    const own = await api().get(`${PROG}/${doc}`).set(asA());
    expect(own.status).toBe(200);
    expect(own.body.data.university.documentId).toBe(a.university.documentId);
    const other = await api().get(`${PROG}/${doc}`).set(asB());
    expect(other.status).toBe(403);
  });

  it('mover un programa propio a la otra universidad → 403', async () => {
    const res = await api()
      .put(`${PROG}/${programOfB}`)
      .set(asB())
      .send({
        university: {
          connect: [{ documentId: a.university.documentId }],
          disconnect: [{ documentId: b.university.documentId }],
        },
      });
    expect(res.status).toBe(403);
  });
});

describe('actividades compartidas', () => {
  let activity: string;

  it('A propone una actividad con B: ambas quedan participantes', async () => {
    const res = await api()
      .post(ACT)
      .set(asA())
      .send({
        title: 'Seminario conjunto',
        type: 'Seminario',
        date: '2030-01-01',
        participatingUniversities: { connect: [{ documentId: b.university.documentId }] },
      });
    expect(res.status).toBe(201);
    activity = res.body.data.documentId;
    const doc = await strapi
      .documents('api::activity.activity')
      .findOne({ documentId: activity, populate: ['participatingUniversities'] });
    const acronyms = (doc!.participatingUniversities as Array<{ acronym: string }>)
      .map((u) => u.acronym)
      .sort();
    expect(acronyms).toEqual(['UPC', 'UPN']);
  });

  it('B (participante) puede editar; A no puede quitarse ni borrar', async () => {
    const edit = await api()
      .put(`${ACT}/${activity}`)
      .set(asB())
      .send({ title: 'Seminario conjunto (editado por UPN)' });
    expect(edit.status).toBe(200);
    const leave = await api()
      .put(`${ACT}/${activity}`)
      .set(asA())
      .send({
        participatingUniversities: { disconnect: [{ documentId: a.university.documentId }] },
      });
    expect(leave.status).toBe(403);
    const del = await api().delete(`${ACT}/${activity}`).set(asA());
    expect(del.status).toBe(403);
  });
});

describe('noticias: borradores propios', () => {
  it('un editor crea un borrador, lo ve, el otro no; ninguno puede publicar', async () => {
    const res = await api()
      .post(NEWS)
      .set(asA())
      .send({ title: 'Borrador de UPC', content: 'Contenido' });
    expect(res.status).toBe(201);
    const doc = res.body.data.documentId;
    expect((await api().get(`${NEWS}/${doc}`).set(asA())).status).toBe(200);
    expect((await api().get(`${NEWS}/${doc}`).set(asB())).status).toBe(403);
    const publish = await api().post(`${NEWS}/${doc}/actions/publish`).set(asA());
    expect(publish.status).toBe(403);
    // nunca aparece en la API pública
    const pub = await api().get('/api/news-items');
    expect(pub.body.data.find((n: { documentId: string }) => n.documentId === doc)).toBeUndefined();
  });
});

describe('reservado al Super Admin', () => {
  it('perfiles de editor, mensajes de contacto y bitácora son inaccesibles para editores', async () => {
    for (const uid of [
      'api::editor-profile.editor-profile',
      'api::contact-message.contact-message',
      'api::audit-log.audit-log',
    ]) {
      expect((await api().get(`${CM}/${uid}`).set(asA())).status).toBe(403);
    }
  });
  it('un editor sin perfil no puede escribir', async () => {
    const orphan = await createEditorWithoutProfile(strapi);
    const token = await login(orphan);
    const res = await api()
      .post(PROG)
      .set({ Authorization: `Bearer ${token}` })
      .send({ name: 'x', level: 'Maestria', modality: 'Virtual' });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/Perfil de editor/);
  });
});

describe('bitácora de auditoría', () => {
  it('registra las escrituras exitosas con usuario y acción', async () => {
    const logs = await strapi.db
      .query('api::audit-log.audit-log')
      .findMany({ where: { adminUserEmail: a.email } });
    const actions = logs.map((l: { action: string }) => l.action);
    expect(actions).toEqual(expect.arrayContaining(['login', 'create']));
    expect(logs.every((l: { statusCode: number }) => l.statusCode < 400)).toBe(true);
  });
});

/**
 * Ataques y casos límite multi-universidad que NO cubre university-ownership.test.ts.
 * Objetivo: que nada de esto tenga que descubrirse en producción.
 */
import type { Core } from '@strapi/strapi';
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

const PROG = `${CM}/api::academic-program.academic-program`;
const REP = `${CM}/api::representative.representative`;
const ACT = `${CM}/api::activity.activity`;
const NEWS = `${CM}/api::news.news`;
const CONTRIB = `${CM}/api::contribution.contribution`;

let strapi: Core.Strapi;
let a: TestEditor;
let b: TestEditor;
let c: TestEditor;
let tA: string;
let tB: string;
let tC: string;
const H = (t: string) => ({ Authorization: `Bearer ${t}` });

async function programFor(u: TestEditor, name: string) {
  const d = await strapi.documents('api::academic-program.academic-program').create({
    data: { name, level: 'Maestria', modality: 'Virtual', university: u.university.documentId },
  });
  return d.documentId;
}

beforeAll(async () => {
  strapi = await setupStrapi();
  await cleanContent(strapi);
  a = await createEditor(strapi, await createUniversity(strapi, 'UA', 1));
  b = await createEditor(strapi, await createUniversity(strapi, 'UB', 2));
  c = await createEditor(strapi, await createUniversity(strapi, 'UC', 3));
  [tA, tB, tC] = await Promise.all([login(a), login(b), login(c)]);
});

afterAll(async () => {
  await cleanContent(strapi);
  await teardownStrapi();
});

describe('acciones masivas (bulk)', () => {
  it('bulkDelete con documentIds de otra universidad no borra nada', async () => {
    const mine = await programFor(a, 'A bulk');
    const theirs = await programFor(b, 'B bulk');
    const res = await api()
      .post(`${PROG}/actions/bulkDelete`)
      .set(H(tA))
      .send({ documentIds: [mine, theirs] });
    expect([200, 403]).toContain(res.status);
    const stillB = await strapi
      .documents('api::academic-program.academic-program')
      .findOne({ documentId: theirs });
    expect(stillB).not.toBeNull();
  });
  it('bulkPublish de noticias por un editor → 403', async () => {
    const draft = await api().post(NEWS).set(H(tA)).send({ title: 'bulk', content: 'x' });
    const res = await api()
      .post(`${NEWS}/actions/bulkPublish`)
      .set(H(tA))
      .send({ documentIds: [draft.body.data.documentId] });
    expect(res.status).toBe(403);
    const pub = await strapi
      .documents('api::news.news')
      .findOne({ documentId: draft.body.data.documentId, status: 'published' });
    expect(pub).toBeNull();
  });
});

describe('formatos de relación en el cuerpo', () => {
  it('university: null al crear → se asigna la propia (no 403)', async () => {
    const res = await api()
      .post(PROG)
      .set(H(tA))
      .send({ name: 'nulo', level: 'Maestria', modality: 'Virtual', university: null });
    expect(res.status).toBe(201);
  });
  it('university con set:[otra] o id numérico como texto → 403', async () => {
    for (const university of [
      { set: [{ documentId: b.university.documentId }] },
      String(b.university.id),
      [b.university.id],
    ]) {
      const res = await api()
        .post(PROG)
        .set(H(tA))
        .send({ name: 'x', level: 'Maestria', modality: 'Virtual', university });
      expect(res.status).toBe(403);
    }
  });
  it('representante: mismas reglas que programa', async () => {
    const res = await api().post(REP).set(H(tA)).send({
      fullName: 'Intruso',
      institutionalEmail: 'i@x.com',
      university: b.university.documentId,
    });
    expect(res.status).toBe(403);
    const ok = await api()
      .post(REP)
      .set(H(tA))
      .send({ fullName: 'Propio', institutionalEmail: 'p@x.com' });
    expect(ok.status).toBe(201);
    expect((await api().get(`${REP}/${ok.body.data.documentId}`).set(H(tB))).status).toBe(403);
  });
});

describe('actividades compartidas: nadie expulsa a otra universidad', () => {
  let shared: string;
  beforeAll(async () => {
    const d = await strapi.documents('api::activity.activity').create({
      data: {
        title: 'Compartida ABC',
        type: 'Reunion',
        date: '2030-05-05',
        participatingUniversities: [
          a.university.documentId,
          b.university.documentId,
          c.university.documentId,
        ],
      },
    });
    shared = d.documentId;
  });
  const participants = async () => {
    const d = await strapi
      .documents('api::activity.activity')
      .findOne({ documentId: shared, populate: ['participatingUniversities'] });
    return (d!.participatingUniversities as Array<{ acronym: string }>)
      .map((u) => u.acronym)
      .sort();
  };
  it('A no puede quitar a B (disconnect) ni reemplazar la lista sin B (set/arreglo)', async () => {
    const r1 = await api()
      .put(`${ACT}/${shared}`)
      .set(H(tA))
      .send({
        participatingUniversities: { disconnect: [{ documentId: b.university.documentId }] },
      });
    expect(r1.status).toBe(403);
    const r2 = await api()
      .put(`${ACT}/${shared}`)
      .set(H(tA))
      .send({ participatingUniversities: [a.university.documentId, c.university.documentId] });
    expect(r2.status).toBe(403);
    const r3 = await api()
      .put(`${ACT}/${shared}`)
      .set(H(tA))
      .send({ participatingUniversities: { set: [{ documentId: a.university.documentId }] } });
    expect(r3.status).toBe(403);
    expect(await participants()).toEqual(['UA', 'UB', 'UC']);
  });
  it('A sí puede agregar a otra universidad y editar campos', async () => {
    const extra = await createUniversity(strapi, 'UD', 4);
    const r = await api()
      .put(`${ACT}/${shared}`)
      .set(H(tA))
      .send({
        title: 'Compartida ABCD',
        participatingUniversities: { connect: [{ documentId: extra.documentId }] },
      });
    expect(r.status).toBe(200);
    expect(await participants()).toEqual(['UA', 'UB', 'UC', 'UD']);
  });
  it('un editor que no participa no ve ni edita la actividad', async () => {
    const solo = await strapi.documents('api::activity.activity').create({
      data: {
        title: 'Solo A',
        type: 'Reunion',
        date: '2030-01-01',
        participatingUniversities: [a.university.documentId],
      },
    });
    expect((await api().get(`${ACT}/${solo.documentId}`).set(H(tB))).status).toBe(403);
    expect(
      (await api().put(`${ACT}/${solo.documentId}`).set(H(tB)).send({ title: 'x' })).status
    ).toBe(403);
    // ni siquiera "invitándose" a sí mismo
    const r = await api()
      .put(`${ACT}/${solo.documentId}`)
      .set(H(tB))
      .send({ participatingUniversities: { connect: [{ documentId: b.university.documentId }] } });
    expect(r.status).toBe(403);
  });
});

describe('contenido publicado', () => {
  it('un editor no puede borrar ni despublicar su noticia una vez publicada', async () => {
    const draft = await api()
      .post(NEWS)
      .set(H(tA))
      .send({ title: 'Publicada por SA', content: 'x' });
    const id = draft.body.data.documentId;
    await strapi.documents('api::news.news').publish({ documentId: id });
    expect((await api().delete(`${NEWS}/${id}`).set(H(tA))).status).toBe(403);
    expect((await api().post(`${NEWS}/${id}/actions/unpublish`).set(H(tA))).status).toBe(403);
    expect(
      await strapi.documents('api::news.news').findOne({ documentId: id, status: 'published' })
    ).not.toBeNull();
    // sí puede seguir editando el borrador (el SA decide si republica)
    expect((await api().put(`${NEWS}/${id}`).set(H(tA)).send({ title: 'Editada' })).status).toBe(
      200
    );
    const pub = await api().get('/api/news-items');
    expect(pub.body.data.find((n: { documentId: string }) => n.documentId === id).title).toBe(
      'Publicada por SA'
    );
  });
  it('lo mismo para aportes', async () => {
    const draft = await api()
      .post(CONTRIB)
      .set(H(tA))
      .send({ title: 'Aporte', description: 'd', type: 'Resultado', publishedOn: '2026-01-01' });
    const id = draft.body.data.documentId;
    await strapi.documents('api::contribution.contribution').publish({ documentId: id });
    expect((await api().delete(`${CONTRIB}/${id}`).set(H(tA))).status).toBe(403);
  });
  it('un borrador propio sí se puede borrar', async () => {
    const draft = await api().post(NEWS).set(H(tA)).send({ title: 'Borrador', content: 'x' });
    expect((await api().delete(`${NEWS}/${draft.body.data.documentId}`).set(H(tA))).status).toBe(
      200
    );
  });
});

describe('biblioteca de medios', () => {
  it('un editor no puede modificar ni borrar archivos subidos por otro', async () => {
    const file = await strapi.db.query('plugin::upload.file').create({
      data: {
        name: 'logo-b.png',
        hash: 'logo_b_abc',
        ext: '.png',
        mime: 'image/png',
        size: 1,
        url: '/uploads/logo_b_abc.png',
        provider: 'local',
        createdBy: b.id,
      },
    });
    const upd = await api()
      .post(`/upload?id=${file.id}`)
      .set(H(tA))
      .field('fileInfo', JSON.stringify({ name: 'renombrado' }));
    expect([403, 404]).toContain(upd.status);
    const del = await api().delete(`/upload/files/${file.id}`).set(H(tA));
    expect([403, 404]).toContain(del.status);
    expect(
      await strapi.db.query('plugin::upload.file').findOne({ where: { id: file.id } })
    ).not.toBeNull();
  });
});

describe('escalada de privilegios en el panel', () => {
  it('no puede asignarse roles ni listar/crear usuarios', async () => {
    const me = await api()
      .put('/admin/users/me')
      .set(H(tA))
      .send({ roles: [1] });
    expect([200, 400]).toContain(me.status);
    const user = await strapi.db
      .query('admin::user')
      .findOne({ where: { id: a.id }, populate: ['roles'] });
    expect((user.roles as Array<{ code: string }>).map((r) => r.code)).toEqual([
      'university-editor',
    ]);
    expect((await api().get('/admin/users').set(H(tA))).status).toBe(403);
    expect(
      (
        await api()
          .post('/admin/users')
          .set(H(tA))
          .send({ email: 'x@test.local', firstname: 'x', lastname: 'y', roles: [1] })
      ).status
    ).toBe(403);
    expect((await api().get('/admin/roles').set(H(tA))).status).toBe(403);
    expect((await api().get('/content-type-builder/content-types').set(H(tA))).status).toBe(403);
    expect((await api().get('/admin/api-tokens').set(H(tA))).status).toBe(403);
  });
  it('un perfil de editor no puede apuntar a dos universidades ni un usuario tener dos perfiles', async () => {
    await expect(
      strapi
        .documents('api::editor-profile.editor-profile')
        .create({ data: { adminUser: a.id, university: b.university.documentId } })
    ).rejects.toThrow();
  });
  it('si el Super Admin cambia la universidad del perfil, el acceso cambia de inmediato', async () => {
    const profile = await strapi
      .documents('api::editor-profile.editor-profile')
      .findFirst({ filters: { adminUser: { id: c.id } } });
    await strapi
      .documents('api::editor-profile.editor-profile')
      .update({ documentId: profile!.documentId, data: { university: a.university.documentId } });
    const res = await api().get(`${PROG}?pageSize=100`).set(H(tC));
    expect(
      res.body.results.every(
        (p: { university: { documentId: string } }) =>
          p.university.documentId === a.university.documentId
      )
    ).toBe(true);
    await strapi
      .documents('api::editor-profile.editor-profile')
      .update({ documentId: profile!.documentId, data: { university: c.university.documentId } });
  });
});

describe('API pública: sondeos de fuga de datos', () => {
  it('populate anidado no expone autores ni relaciones internas', async () => {
    for (const q of [
      'populate[university][populate]=createdBy',
      'populate[logo][populate]=related',
      'populate[university][populate][representatives][populate]=createdBy',
      'populate[createdBy]=true',
      'fields[0]=password',
      'populate[university][fields][0]=createdBy',
    ]) {
      const res = await api().get(`/api/academic-programs?${q}`);
      const text = JSON.stringify(res.body.data ?? {});
      expect(text).not.toMatch(
        /"password":|"email":"editor|resetPasswordToken|registrationToken|"roles":/
      );
      expect(text).not.toMatch(/"createdBy":\{|"updatedBy":\{/);
    }
  });
  it('filtros por relaciones internas de universidad → 400', async () => {
    const res = await api().get('/api/representatives?filters[university][createdBy][id][$eq]=1');
    expect(res.status).toBe(400);
  });
  it('un id inexistente o de otro tipo no revela nada', async () => {
    expect((await api().get('/api/universities/999999')).status).toBe(404);
    expect(
      (await api().get(`/api/universities/${a.university.documentId}%27%20OR%201=1`)).status
    ).toBe(404);
  });
});

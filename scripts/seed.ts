/**
 * Siembra de datos de prueba para desarrollo.
 *
 * Uso:   npm run seed
 * Reset: npm run seed -- --reset   (borra primero lo sembrado por este script)
 *
 * Usa la API de documentos de Strapi (no SQL directo) para que se apliquen las
 * validaciones del modelo y los lifecycles. Es idempotente: si una universidad ya
 * existe (por nombre) no la duplica.
 *
 * Las universidades son las reales del Foro; representantes y programas son provisionales.
 */
import { createStrapi, compileStrapi } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';

type Level = 'Maestria' | 'Doctorado' | 'Especializacion' | 'Diplomado';
type Modality = 'Presencial' | 'Virtual' | 'Hibrida';

type SeedUniversity = {
  name: string;
  acronym: string;
  displayOrder: number;
  shortDescription: string;
  website: string;
  joinedForumAt?: string;
  representative: { fullName: string; position: string; institutionalEmail: string };
  programs: Array<{ name: string; level: Level; modality: Modality; duration: string }>;
};

// Las 9 universidades integrantes del Foro, en el orden oficial en que se presentan (displayOrder).
// Sitio web, representante y programas son PROVISIONALES hasta que el Foro entregue los datos reales.
const PLACEHOLDER_REP = (acronym: string) => ({
  fullName: `Representante de ${acronym} (por confirmar)`,
  position: 'Por confirmar',
  institutionalEmail: `posgrado@${acronym.toLowerCase()}.example.edu`,
});
const PLACEHOLDER_PROGRAMS: SeedUniversity['programs'] = [
  {
    name: 'Programa de posgrado (por confirmar) 1',
    level: 'Maestria',
    modality: 'Presencial',
    duration: 'Por confirmar',
  },
  {
    name: 'Programa de posgrado (por confirmar) 2',
    level: 'Doctorado',
    modality: 'Hibrida',
    duration: 'Por confirmar',
  },
];

const UNIVERSITIES: SeedUniversity[] = [
  {
    name: 'Universidad de San Carlos de Guatemala',
    acronym: 'USAC',
    website: 'https://www.usac.edu.gt',
  },
  { name: 'Universidad Rafael Landívar', acronym: 'URL', website: 'https://www.url.edu.gt' },
  { name: 'Universidad del Valle de Guatemala', acronym: 'UVG', website: 'https://www.uvg.edu.gt' },
  {
    name: 'Universidad Mariano Gálvez de Guatemala',
    acronym: 'UMG',
    website: 'https://www.umg.edu.gt',
  },
  { name: 'Universidad del Istmo', acronym: 'UNIS', website: 'https://unis.edu.gt' },
  { name: 'Universidad Panamericana', acronym: 'UPANA', website: 'https://upana.edu.gt' },
  { name: 'Universidad Mesoamericana', acronym: 'UMES', website: 'https://www.umes.edu.gt' },
  { name: 'Universidad Galileo', acronym: 'Galileo', website: 'https://www.galileo.edu' },
  { name: 'Universidad InterNaciones', acronym: 'UNI', website: 'https://uni.edu.gt' },
].map((u, i) => ({
  ...u,
  displayOrder: i + 1,
  shortDescription: `${u.name}, universidad integrante del Foro Interuniversitario de Estudios de Posgrado. (Descripción por confirmar.)`,
  joinedForumAt: undefined,
  representative: PLACEHOLDER_REP(u.acronym),
  programs: PLACEHOLDER_PROGRAMS,
}));

const SEED_MARK = '[seed]'; // marca en descripciones para poder identificar/borrar lo sembrado

async function reset(strapi: Core.Strapi) {
  strapi.log.info('[seed] borrando datos sembrados...');
  const uids = [
    'api::gallery-item.gallery-item',
    'api::contribution.contribution',
    'api::activity.activity',
    'api::news.news',
    'api::academic-program.academic-program',
    'api::representative.representative',
    'api::university.university',
  ] as const;

  for (const uid of uids) {
    const docs = await strapi.documents(uid).findMany({ fields: ['documentId'], limit: 1000 });
    for (const doc of docs) {
      await strapi.documents(uid).delete({ documentId: doc.documentId });
    }
    strapi.log.info(`[seed]   ${uid}: ${docs.length} eliminados`);
  }
}

async function seed(strapi: Core.Strapi) {
  const universityDocs: Array<{ documentId: string; name: string }> = [];

  for (const u of UNIVERSITIES) {
    const existing = await strapi
      .documents('api::university.university')
      .findFirst({ filters: { name: u.name } });

    if (existing) {
      strapi.log.info(`[seed] ya existe: ${u.name}`);
      universityDocs.push({ documentId: existing.documentId, name: u.name });
      continue;
    }

    const university = await strapi.documents('api::university.university').create({
      data: {
        name: u.name,
        acronym: u.acronym,
        displayOrder: u.displayOrder,
        shortDescription: u.shortDescription,
        website: u.website,
        joinedForumAt: u.joinedForumAt,
      },
    });
    universityDocs.push({ documentId: university.documentId, name: u.name });

    await strapi.documents('api::representative.representative').create({
      data: {
        ...u.representative,
        shortBio: `${SEED_MARK} Representante ficticio de ${u.acronym}.`,
        university: university.documentId,
      },
    });

    for (const p of u.programs) {
      await strapi.documents('api::academic-program.academic-program').create({
        data: {
          ...p,
          description: `${SEED_MARK} Programa ficticio para pruebas.`,
          university: university.documentId,
        },
      });
    }

    strapi.log.info(`[seed] creada: ${u.name} (1 representante, ${u.programs.length} programas)`);
  }

  // Actividades (varias universidades participantes), aportes, galería y noticias
  const alreadySeeded = await strapi
    .documents('api::activity.activity')
    .findFirst({ filters: { title: 'Encuentro Anual del Foro 2025' } });
  if (alreadySeeded) {
    strapi.log.info('[seed] actividades/noticias ya existen; se omiten');
    return;
  }

  const [u1, u2, u3, u4] = universityDocs;
  if (!u4) throw new Error('[seed] se esperaban al menos 4 universidades');

  const activity1 = await strapi.documents('api::activity.activity').create({
    data: {
      title: 'Encuentro Anual del Foro 2025',
      type: 'Encuentro',
      date: '2025-10-15',
      description: `${SEED_MARK} Encuentro ficticio de todas las universidades.`,
      participatingUniversities: universityDocs.map((d) => d.documentId),
    },
  });

  const activity2 = await strapi.documents('api::activity.activity').create({
    data: {
      title: 'Seminario de Investigación en Posgrado',
      type: 'Seminario',
      date: '2026-03-20',
      description: `${SEED_MARK} Seminario ficticio.`,
      participatingUniversities: [u1.documentId, u2.documentId, u3.documentId],
    },
  });

  await strapi.documents('api::activity.activity').create({
    data: {
      title: 'Proyecto conjunto de movilidad académica',
      type: 'Proyecto',
      date: '2026-06-01',
      description: `${SEED_MARK} Proyecto ficticio.`,
      participatingUniversities: [u2.documentId, u4.documentId],
    },
  });

  await strapi.documents('api::contribution.contribution').create({
    data: {
      title: 'Acuerdo de reconocimiento mutuo de créditos',
      description: `${SEED_MARK} Resultado ficticio del encuentro anual.`,
      type: 'Resultado',
      publishedOn: '2025-11-01',
      relatedActivity: activity1.documentId,
    },
    status: 'published',
  });

  await strapi.documents('api::contribution.contribution').create({
    data: {
      title: 'Red interuniversitaria de tutores de tesis',
      description: `${SEED_MARK} Iniciativa ficticia.`,
      type: 'Iniciativa',
      publishedOn: '2026-04-10',
      relatedActivity: activity2.documentId,
    },
    status: 'published',
  });

  await strapi.documents('api::gallery-item.gallery-item').create({
    data: {
      title: 'Video resumen del Encuentro 2025',
      type: 'Video',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      date: '2025-10-16',
      relatedActivity: activity1.documentId,
    },
  });

  // Noticias: una publicada y una en borrador, para probar que el público solo ve la publicada
  await strapi.documents('api::news.news').create({
    data: {
      title: 'El Foro celebra su Encuentro Anual 2025',
      summary:
        'Representantes de las nueve universidades se reunieron para definir la agenda conjunta.',
      content: `${SEED_MARK} Contenido ficticio de la noticia publicada.`,
    },
    status: 'published',
  });

  await strapi.documents('api::news.news').create({
    data: {
      title: 'Borrador: convocatoria a becas 2027',
      summary: 'Esta noticia está en borrador y NO debe verse en el sitio público.',
      content: `${SEED_MARK} Contenido ficticio en borrador.`,
    },
    status: 'draft',
  });

  strapi.log.info(
    '[seed] 3 actividades, 2 aportes, 1 elemento de galería, 2 noticias (1 publicada, 1 borrador)'
  );
}

async function main() {
  const app = createStrapi(await compileStrapi());
  await app.load();
  app.log.level = 'info';

  try {
    if (process.argv.includes('--reset')) {
      await reset(app);
    }
    await seed(app);
    app.log.info('[seed] listo ✔');
  } finally {
    // Strapi dispara tareas internas asíncronas tras cada create (p. ej. relaciones de medios);
    // si se destruye la app de inmediato, esas tareas fallan al no encontrar conexión en el pool.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await app.destroy();
  }
}

main().catch((err) => {
  console.error('[seed] falló:', err);
  process.exit(1);
});

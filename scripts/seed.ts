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
 * ⚠️ Los datos son FICTICIOS hasta recibir la lista real de universidades del Foro.
 */
import { createStrapi, compileStrapi } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';

type Level = 'Maestria' | 'Doctorado' | 'Especializacion' | 'Diplomado';
type Modality = 'Presencial' | 'Virtual' | 'Hibrida';

type SeedUniversity = {
  name: string;
  acronym: string;
  shortDescription: string;
  website: string;
  joinedForumAt: string;
  representative: { fullName: string; position: string; institutionalEmail: string };
  programs: Array<{ name: string; level: Level; modality: Modality; duration: string }>;
};

// 8 universidades ficticias (el plan pide entre 6 y 10)
const UNIVERSITIES: SeedUniversity[] = [
  {
    name: 'Universidad de Prueba Central',
    acronym: 'UPC',
    shortDescription: 'Universidad ficticia usada para desarrollo. Reemplazar con datos reales.',
    website: 'https://upc.example.edu',
    joinedForumAt: '2020-03-15',
    representative: {
      fullName: 'María López',
      position: 'Directora de Posgrados',
      institutionalEmail: 'posgrados@upc.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Docencia Universitaria',
        level: 'Maestria',
        modality: 'Hibrida',
        duration: '18 meses',
      },
      {
        name: 'Doctorado en Educación',
        level: 'Doctorado',
        modality: 'Presencial',
        duration: '4 años',
      },
    ],
  },
  {
    name: 'Universidad de Prueba del Norte',
    acronym: 'UPN',
    shortDescription: 'Universidad ficticia usada para desarrollo.',
    website: 'https://upn.example.edu',
    joinedForumAt: '2020-03-15',
    representative: {
      fullName: 'Carlos Pérez',
      position: 'Coordinador de Estudios de Posgrado',
      institutionalEmail: 'posgrado@upn.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Administración de Empresas',
        level: 'Maestria',
        modality: 'Virtual',
        duration: '2 años',
      },
      {
        name: 'Especialización en Finanzas',
        level: 'Especializacion',
        modality: 'Presencial',
        duration: '1 año',
      },
    ],
  },
  {
    name: 'Universidad de Prueba del Sur',
    acronym: 'UPS',
    shortDescription: 'Universidad ficticia usada para desarrollo.',
    website: 'https://ups.example.edu',
    joinedForumAt: '2021-01-20',
    representative: {
      fullName: 'Ana Ramírez',
      position: 'Decana de Posgrados',
      institutionalEmail: 'decanato.posgrados@ups.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Salud Pública',
        level: 'Maestria',
        modality: 'Presencial',
        duration: '2 años',
      },
      {
        name: 'Diplomado en Gestión Hospitalaria',
        level: 'Diplomado',
        modality: 'Virtual',
        duration: '6 meses',
      },
    ],
  },
  {
    name: 'Universidad de Prueba de Oriente',
    acronym: 'UPO',
    shortDescription: 'Universidad ficticia usada para desarrollo.',
    website: 'https://upo.example.edu',
    joinedForumAt: '2021-08-05',
    representative: {
      fullName: 'Jorge Castillo',
      position: 'Director de Investigación y Posgrado',
      institutionalEmail: 'investigacion@upo.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Ingeniería de Software',
        level: 'Maestria',
        modality: 'Hibrida',
        duration: '2 años',
      },
      {
        name: 'Doctorado en Ciencias de la Computación',
        level: 'Doctorado',
        modality: 'Presencial',
        duration: '4 años',
      },
    ],
  },
  {
    name: 'Universidad de Prueba de Occidente',
    acronym: 'UPOc',
    shortDescription: 'Universidad ficticia usada para desarrollo.',
    website: 'https://upoc.example.edu',
    joinedForumAt: '2022-02-10',
    representative: {
      fullName: 'Lucía Hernández',
      position: 'Coordinadora Académica de Posgrado',
      institutionalEmail: 'coordinacion.posgrado@upoc.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Derecho Constitucional',
        level: 'Maestria',
        modality: 'Presencial',
        duration: '2 años',
      },
      {
        name: 'Especialización en Derecho Laboral',
        level: 'Especializacion',
        modality: 'Hibrida',
        duration: '1 año',
      },
    ],
  },
  {
    name: 'Universidad Tecnológica de Prueba',
    acronym: 'UTP',
    shortDescription: 'Universidad ficticia usada para desarrollo.',
    website: 'https://utp.example.edu',
    joinedForumAt: '2022-09-01',
    representative: {
      fullName: 'Roberto Méndez',
      position: 'Vicerrector Académico',
      institutionalEmail: 'vicerrectoria@utp.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Ciencia de Datos',
        level: 'Maestria',
        modality: 'Virtual',
        duration: '18 meses',
      },
      {
        name: 'Diplomado en Ciberseguridad',
        level: 'Diplomado',
        modality: 'Virtual',
        duration: '4 meses',
      },
    ],
  },
  {
    name: 'Universidad Humanista de Prueba',
    acronym: 'UHP',
    shortDescription: 'Universidad ficticia usada para desarrollo.',
    website: 'https://uhp.example.edu',
    joinedForumAt: '2023-03-12',
    representative: {
      fullName: 'Patricia Morales',
      position: 'Directora de Escuela de Posgrado',
      institutionalEmail: 'escuela.posgrado@uhp.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Psicología Clínica',
        level: 'Maestria',
        modality: 'Presencial',
        duration: '2 años',
      },
      {
        name: 'Maestría en Trabajo Social',
        level: 'Maestria',
        modality: 'Hibrida',
        duration: '2 años',
      },
    ],
  },
  {
    name: 'Universidad Rural de Prueba',
    acronym: 'URP',
    shortDescription: 'Universidad ficticia usada para desarrollo.',
    website: 'https://urp.example.edu',
    joinedForumAt: '2024-01-25',
    representative: {
      fullName: 'Diego Ortiz',
      position: 'Coordinador de Posgrados',
      institutionalEmail: 'posgrados@urp.example.edu',
    },
    programs: [
      {
        name: 'Maestría en Desarrollo Rural',
        level: 'Maestria',
        modality: 'Presencial',
        duration: '2 años',
      },
      {
        name: 'Especialización en Agronegocios',
        level: 'Especializacion',
        modality: 'Hibrida',
        duration: '1 año',
      },
    ],
  },
];

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
  });

  await strapi.documents('api::contribution.contribution').create({
    data: {
      title: 'Red interuniversitaria de tutores de tesis',
      description: `${SEED_MARK} Iniciativa ficticia.`,
      type: 'Iniciativa',
      publishedOn: '2026-04-10',
      relatedActivity: activity2.documentId,
    },
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
      summary: 'Representantes de ocho universidades se reunieron para definir la agenda conjunta.',
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

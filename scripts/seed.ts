/**
 * Siembra de datos de simulación para desarrollo: las nueve universidades con su oferta real de
 * posgrado, representantes ficticios, actividades, aportes, noticias y galería con fotos y videos.
 *
 * Uso:   npm run seed
 * Reset: npm run seed -- --reset   (borra el contenido del sitio y lo vuelve a sembrar)
 *
 * - Usa la API de documentos de Strapi (no SQL directo) para que se apliquen validaciones y
 *   lifecycles. La única excepción es la fecha de publicación de noticias y aportes, que se
 *   ajusta después para que la simulación tenga fechas verosímiles.
 * - Imágenes: fotos de Wikimedia Commons (licencias libres, ver seed-data/CREDITOS.md), avatares
 *   ilustrados de DiceBear (CC0, sin fondo: el perfil pone detrás el color de la universidad) y
 *   sellos de universidad generados aquí con sharp. Se suben a la carpeta "Datos de prueba" de la
 *   biblioteca de medios; el reset borra solo esa carpeta, nunca archivos subidos a mano.
 * - No necesita internet: las fotos y los avatares están en `seed-data/media` (versionados). Solo
 *   si falta alguno se descarga de su origen a `.tmp/seed-cache`.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createStrapi, compileStrapi } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import { UNIVERSITIES, type SeedProgram, type SeedUniversity } from './seed-data/universities';
import { PHOTOS, VIDEOS, type PhotoKey } from './seed-data/media';
import { ACTIVITIES, CONTRIBUTIONS, GALLERY_PHOTOS, NEWS } from './seed-data/forum';

const CACHE = path.join(process.cwd(), '.tmp', 'seed-cache');
/** Fuentes versionadas: con ellas el seed da exactamente el mismo resultado en cualquier equipo. */
const SOURCES = path.join(process.cwd(), 'scripts', 'seed-data', 'media');
const FOLDER_NAME = 'Datos de prueba';
const UA = 'ForoPosgradoSeed/1.0 (datos de prueba para desarrollo local)';

const CONTENT_UIDS = [
  'api::gallery-item.gallery-item',
  'api::contribution.contribution',
  'api::news.news',
  'api::activity.activity',
  'api::academic-program.academic-program',
  'api::representative.representative',
  'api::university.university',
] as const;

const log = (strapi: Core.Strapi, msg: string) => strapi.log.info(`[seed] ${msg}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Reset                                                               */
/* ------------------------------------------------------------------ */

async function reset(strapi: Core.Strapi) {
  log(strapi, 'borrando el contenido del sitio...');
  for (const uid of CONTENT_UIDS) {
    const docs = await strapi.documents(uid).findMany({ fields: ['documentId'], limit: 5000 });
    for (const doc of docs) await strapi.documents(uid).delete({ documentId: doc.documentId });
    log(strapi, `  ${uid}: ${docs.length} eliminados`);
  }
  // Solo la carpeta propia del seed; los archivos subidos a mano se conservan
  const folder = await strapi.db
    .query('plugin::upload.folder')
    .findOne({ where: { name: FOLDER_NAME, parent: null } });
  if (folder) {
    await strapi.plugin('upload').service('folder').deleteByIds([folder.id]);
    log(strapi, `  carpeta "${FOLDER_NAME}" de la biblioteca de medios eliminada`);
  }
}

/* ------------------------------------------------------------------ */
/* Archivos: descarga con caché, sellos y subida                        */
/* ------------------------------------------------------------------ */

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Descarga con reintentos (Commons responde 429 si se le pide demasiado rápido). */
async function download(url: string, dest: string): Promise<string | null> {
  if (await exists(dest)) return dest;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (res.status === 429 || res.status >= 500) {
        await sleep(3000 * attempt);
        continue;
      }
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(dest, buf);
      await sleep(400); // cortesía con el servidor de origen
      return dest;
    } catch {
      await sleep(2000 * attempt);
    }
  }
  return null;
}

const commonsUrl = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`;

/*
 * Avatares ilustrados (DiceBear "Notionists", CC0). Se piden en SVG y se rasterizan aquí a
 * 640 px (la API entrega PNG de 256 px como máximo). El peinado se elige según el nombre para
 * que el avatar sea coherente con la persona.
 */
const HAIR_F = [2, 4, 10, 23, 28, 36, 37, 39, 41, 47, 48, 57];
const HAIR_M = [1, 5, 6, 13, 15, 16, 21, 24, 25, 31, 34, 35, 38, 49, 53, 54, 55, 56, 60];
const FEMALE = new Set([
  'María',
  'Ana',
  'Gabriela',
  'Carla',
  'Paola',
  'Sandra',
  'Lucía',
  'Julia',
  'Karla',
  'Ingrid',
  'Mónica',
  'Daniela',
]);
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function avatarUrl(seed: string, fullName: string) {
  // El primer nombre es la primera palabra que no es un título (Dra., M.Sc., Lic., P.…)
  const first = fullName.split(/\s+/).find((w) => !w.includes('.')) ?? '';
  const female = FEMALE.has(first);
  const pool = female ? HAIR_F : HAIR_M;
  const hair = `variant${String(pool[hash(seed) % pool.length]).padStart(2, '0')}`;
  return (
    `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&hair=${hair}` +
    `&beardProbability=${female ? 0 : 35}&glassesProbability=30`
  );
}

/** Avatar en PNG de 640 px con fondo transparente (desde el SVG versionado o, si falta, de la API). */
async function makeAvatar(seed: string, fullName: string): Promise<string | null> {
  const png = path.join(CACHE, `avatar-${seed}-v2.png`);
  if (await exists(png)) return png;
  const local = path.join(SOURCES, 'avatares', `${seed}.svg`);
  const svg = (await exists(local))
    ? local
    : await download(avatarUrl(seed, fullName), path.join(CACHE, `avatar-${seed}-v2.svg`));
  if (!svg) return null;
  await sharp(await fs.readFile(svg), { density: 144 })
    .resize(640, 640)
    .png()
    .toFile(png);
  return png;
}

/** Foto de Commons: la versionada si está; si no, se descarga (una vez) a la caché. */
async function photoFile(key: string, file: string): Promise<string | null> {
  const local = path.join(SOURCES, 'fotos', `${key}.jpg`);
  if (await exists(local)) return local;
  return download(commonsUrl(file), path.join(CACHE, `${key}.jpg`));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Nombre de la universidad en arco sobre el borde del sello. El rasterizador de sharp no
 * soporta textPath, así que cada letra se coloca y gira por separado.
 */
function arcText(text: string, color: string) {
  const R = 292;
  let fs = 27;
  const adv = (c: string, f: number) => (c === ' ' ? f * 0.42 : f * 0.74) + 2.5;
  let total = [...text].reduce((t, c) => t + adv(c, fs), 0) / R;
  const max = (215 * Math.PI) / 180; // no más de 215° de arco
  if (total > max) {
    fs = (fs * max) / total;
    total = max;
  }
  let theta = -total / 2;
  return [...text]
    .map((c) => {
      const w = adv(c, fs) / R;
      const a = theta + w / 2;
      theta += w;
      if (c === ' ') return '';
      const x = 400 + R * Math.sin(a);
      const y = 400 - R * Math.cos(a);
      const deg = (a * 180) / Math.PI;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" transform="rotate(${deg.toFixed(2)} ${x.toFixed(1)} ${y.toFixed(1)})" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fs.toFixed(1)}" fill="${color}">${esc(c)}</text>`;
    })
    .join('');
}

/** Sello circular con la sigla y los colores de la universidad (PNG 800×800 con fondo transparente). */
async function makeSeal(u: SeedUniversity, dest: string) {
  if (await exists(dest)) return dest;
  const [primary, accent] = u.colors;
  const acr = u.acronym.toUpperCase();
  const size = acr.length >= 6 ? 112 : acr.length === 5 ? 132 : acr.length === 4 ? 150 : 176;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <radialGradient id="g" cx="35%" cy="28%" r="80%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.35"/>
    </radialGradient>
  </defs>
  <circle cx="400" cy="400" r="392" fill="${primary}"/>
  <circle cx="400" cy="400" r="392" fill="url(#g)"/>
  <circle cx="400" cy="400" r="352" fill="none" stroke="${accent}" stroke-width="4"/>
  <circle cx="400" cy="400" r="252" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="2 9" opacity="0.85"/>
  ${arcText(u.name.toUpperCase(), '#ffffff')}
  <text x="400" y="${(400 + size * 0.3).toFixed(0)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="700" fill="#ffffff" letter-spacing="-2">${esc(acr)}</text>
  <line x1="318" y1="502" x2="482" y2="502" stroke="${accent}" stroke-width="3"/>
  <text x="400" y="556" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="32" letter-spacing="8" fill="${accent}">${u.founded}</text>
  <circle cx="400" cy="660" r="7" fill="${accent}"/>
  <circle cx="370" cy="664" r="4" fill="${accent}" opacity="0.7"/>
  <circle cx="430" cy="664" r="4" fill="${accent}" opacity="0.7"/>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(dest);
  return dest;
}

interface Uploaded {
  id: number;
}

async function ensureFolder(strapi: Core.Strapi): Promise<number> {
  const found = await strapi.db
    .query('plugin::upload.folder')
    .findOne({ where: { name: FOLDER_NAME, parent: null } });
  if (found) return found.id;
  const created = await strapi
    .plugin('upload')
    .service('folder')
    .create({ name: FOLDER_NAME, parent: null });
  return created.id;
}

async function upload(
  strapi: Core.Strapi,
  filepath: string,
  info: { name: string; alt: string; caption?: string; folder: number }
): Promise<Uploaded | null> {
  const stat = await fs.stat(filepath);
  const ext = path.extname(filepath).toLowerCase();
  const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg';
  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      data: {
        fileInfo: {
          name: info.name,
          alternativeText: info.alt,
          caption: info.caption,
          folder: info.folder,
        },
      },
      files: {
        filepath,
        originalFilename: `${info.name}${ext}`,
        mimetype,
        size: stat.size,
      },
    });
  return file ?? null;
}

/* ------------------------------------------------------------------ */
/* Textos generados                                                    */
/* ------------------------------------------------------------------ */

const LEVEL_TEXT: Record<SeedProgram['level'], { intro: string; audience: string }> = {
  Maestria: {
    intro:
      'Combina fundamentos teóricos, estudio de casos y un trabajo de graduación orientado a problemas reales de Guatemala y la región.',
    audience: 'Profesionales con licenciatura en áreas afines que buscan profundizar en su campo.',
  },
  Doctorado: {
    intro:
      'Forma investigadores capaces de generar conocimiento original. Culmina con una tesis doctoral defendida ante un tribunal examinador.',
    audience: 'Profesionales con grado de maestría y experiencia o interés en la investigación.',
  },
  Especializacion: {
    intro:
      'Formación aplicada y concentrada en un área concreta de la profesión, con proyectos prácticos en cada módulo.',
    audience: 'Profesionales con licenciatura que necesitan una competencia técnica específica.',
  },
  Diplomado: {
    intro:
      'Actualización breve y práctica. Otorga un diploma universitario, no un grado académico.',
    audience: 'Profesionales y docentes que buscan actualizarse sin interrumpir su trabajo.',
  },
};

const MODALITY_TEXT = { Presencial: 'Presencial', Virtual: 'Virtual', Hibrida: 'Híbrida' };

function programDescription(u: SeedUniversity, p: SeedProgram) {
  const t = LEVEL_TEXT[p.level];
  return [
    `La **${p.name}** de la ${u.name} se imparte en la ${p.unit}. ${t.intro}`,
    `**Ejes del programa**\n\n${p.focus.map((f) => `- ${f}`).join('\n')}`,
    `**Dirigido a:** ${t.audience}`,
    `**Modalidad:** ${MODALITY_TEXT[p.modality]} · **Duración:** ${p.duration}`,
  ].join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Siembra                                                             */
/* ------------------------------------------------------------------ */

async function seed(strapi: Core.Strapi) {
  const already = await strapi.documents('api::university.university').count({});
  if (already > 0) {
    log(strapi, `ya hay ${already} universidades; usa "npm run seed -- --reset" para regenerar`);
    return;
  }

  await fs.mkdir(CACHE, { recursive: true });
  const folder = await ensureFolder(strapi);

  // 1) Fotos: una sola subida por foto, reutilizada en portadas y galería
  log(strapi, 'subiendo fotografías...');
  const photos = new Map<PhotoKey, number>();
  for (const [key, p] of Object.entries(PHOTOS) as [PhotoKey, (typeof PHOTOS)[PhotoKey]][]) {
    const local = await photoFile(key, p.file);
    if (!local) {
      strapi.log.warn(`[seed]   no se pudo descargar "${p.file}"; se omite`);
      continue;
    }
    const up = await upload(strapi, local, {
      name: key,
      alt: p.alt,
      caption: `Foto: ${p.author} · ${p.license} · Wikimedia Commons`,
      folder,
    });
    if (up) photos.set(key, up.id);
  }
  log(strapi, `  ${photos.size} fotografías listas`);
  const photo = (k?: PhotoKey) => (k ? (photos.get(k) ?? null) : null);

  // 2) Universidades, representantes y programas
  const uniDocs = new Map<string, string>(); // sigla → documentId
  let programCount = 0;
  let repCount = 0;
  for (const [i, u] of UNIVERSITIES.entries()) {
    const sealPath = await makeSeal(u, path.join(CACHE, `sello-${u.acronym.toLowerCase()}.png`));
    const logo = await upload(strapi, sealPath, {
      name: `sello-${u.acronym.toLowerCase()}`,
      alt: `Sello de ${u.name}`,
      caption: 'Sello generado para datos de prueba (no es el logotipo oficial)',
      folder,
    });

    const uni = await strapi.documents('api::university.university').create({
      data: {
        name: u.name,
        acronym: u.acronym,
        displayOrder: i + 1,
        shortDescription: u.shortDescription,
        website: u.website,
        joinedForumAt: u.joinedForumAt,
        logo: logo?.id,
      },
    });
    uniDocs.set(u.acronym, uni.documentId);

    for (const r of u.representatives) {
      const avatar = await makeAvatar(r.seed, r.fullName);
      const pic = avatar
        ? await upload(strapi, avatar, {
            name: `avatar-${r.seed}`,
            alt: `Avatar ilustrado de ${r.fullName}`,
            caption: 'Avatar: DiceBear “Notionists” (CC0)',
            folder,
          })
        : null;
      await strapi.documents('api::representative.representative').create({
        data: {
          fullName: r.fullName,
          position: r.position,
          institutionalEmail: r.email,
          shortBio: r.bio,
          photo: pic?.id,
          university: uni.documentId,
        },
      });
      repCount++;
    }

    for (const p of u.programs) {
      await strapi.documents('api::academic-program.academic-program').create({
        data: {
          name: p.name,
          level: p.level,
          modality: p.modality,
          duration: p.duration,
          description: programDescription(u, p),
          infoUrl: u.postgradUrl,
          university: uni.documentId,
        },
      });
      programCount++;
    }
    log(
      strapi,
      `  ${u.acronym}: ${u.representatives.length} representantes, ${u.programs.length} programas`
    );
  }

  // 3) Actividades
  const actDocs = new Map<string, string>();
  for (const a of ACTIVITIES) {
    const doc = await strapi.documents('api::activity.activity').create({
      data: {
        title: a.title,
        type: a.type,
        date: a.date,
        description: `**Sede:** ${a.place}\n\n${a.description}`,
        coverImage: photo(a.cover),
        participatingUniversities: a.unis.map((acr) => uniDocs.get(acr)!).filter(Boolean),
      },
    });
    actDocs.set(a.key, doc.documentId);
  }
  log(strapi, `${ACTIVITIES.length} actividades`);

  // 4) Aportes (con fecha de publicación de la simulación)
  for (const c of CONTRIBUTIONS) {
    const doc = await strapi.documents('api::contribution.contribution').create({
      data: {
        title: c.title,
        type: c.type,
        publishedOn: c.publishedOn,
        description: c.description,
        relatedActivity: c.activity ? actDocs.get(c.activity) : undefined,
      },
      status: 'published',
    });
    await backdate(strapi, 'contributions', doc.documentId, c.publishedOn);
  }
  log(strapi, `${CONTRIBUTIONS.length} aportes`);

  // 5) Noticias
  for (const n of NEWS) {
    const doc = await strapi.documents('api::news.news').create({
      data: {
        title: n.title,
        summary: n.summary,
        content: n.content,
        coverImage: photo(n.cover),
      },
      status: 'published',
    });
    await backdate(strapi, 'news', doc.documentId, n.date);
  }
  log(strapi, `${NEWS.length} noticias`);

  // 6) Galería: fotos y videos
  let galleryCount = 0;
  for (const g of GALLERY_PHOTOS) {
    const id = photo(g.photo);
    if (!id) continue;
    await strapi.documents('api::gallery-item.gallery-item').create({
      data: {
        title: g.title,
        type: 'Foto',
        file: id,
        date: g.date,
        relatedActivity: g.activity ? actDocs.get(g.activity) : undefined,
      },
    });
    galleryCount++;
  }
  // Fotos de campus que no están ya en la galería: una por foto, con su pie de foto
  const inGallery = new Set(GALLERY_PHOTOS.map((g) => g.photo));
  for (const u of UNIVERSITIES) {
    for (const key of u.campusPhotos) {
      const id = photo(key);
      if (!id || inGallery.has(key)) continue;
      inGallery.add(key);
      await strapi.documents('api::gallery-item.gallery-item').create({
        data: { title: PHOTOS[key].alt, type: 'Foto', file: id },
      });
      galleryCount++;
    }
  }
  const videoDates = ['2025-10-16', '2024-06-21', '2023-05-19', '2022-10-14', '2021-08-27'];
  for (const [i, v] of VIDEOS.entries()) {
    await strapi.documents('api::gallery-item.gallery-item').create({
      data: {
        title: v.title,
        type: 'Video',
        videoUrl: v.url,
        date: videoDates[i % videoDates.length],
      },
    });
    galleryCount++;
  }
  log(strapi, `${galleryCount} elementos de galería (${VIDEOS.length} videos)`);

  log(
    strapi,
    `resumen: ${UNIVERSITIES.length} universidades, ${repCount} representantes, ${programCount} programas`
  );
}

/**
 * Strapi fija la fecha de publicación al momento de publicar. Para la simulación se ajusta a la
 * fecha del hecho.
 */
async function backdate(strapi: Core.Strapi, table: string, documentId: string, date: string) {
  const when = new Date(`${date}T15:00:00Z`);
  const rows = strapi.db.connection(table).where({ document_id: documentId });
  // Borrador y publicada con la misma fecha: así el panel no la marca como "modificada"
  await rows.clone().update({ created_at: when, updated_at: when });
  await rows.clone().whereNotNull('published_at').update({ published_at: when });
}

async function main() {
  const app = createStrapi(await compileStrapi());
  await app.load();
  app.log.level = 'info';

  try {
    if (process.argv.includes('--reset')) await reset(app);
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

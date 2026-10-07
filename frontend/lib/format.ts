import type {
  ActivityType,
  ContributionType,
  ProgramLevel,
  ProgramModality,
  UniversityRef,
} from './types';

export const LEVEL_LABEL: Record<ProgramLevel, string> = {
  Maestria: 'Maestría',
  Doctorado: 'Doctorado',
  Especializacion: 'Especialización',
  Diplomado: 'Diplomado',
};

export const MODALITY_LABEL: Record<ProgramModality, string> = {
  Presencial: 'Presencial',
  Virtual: 'Virtual',
  Hibrida: 'Híbrida',
};

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  Encuentro: 'Encuentro',
  Conferencia: 'Conferencia',
  Seminario: 'Seminario',
  Reunion: 'Reunión',
  Proyecto: 'Proyecto',
};

export const CONTRIBUTION_LABEL: Record<ContributionType, string> = {
  Resultado: 'Resultado',
  Iniciativa: 'Iniciativa',
  Beneficio: 'Beneficio',
};

const LONG = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
const SHORT = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
const MONTH_YEAR = new Intl.DateTimeFormat('es-GT', { month: 'short', year: 'numeric' });

function parse(iso?: string | null) {
  if (!iso) return null;
  // Las fechas "date" llegan como YYYY-MM-DD: se interpretan en hora local, no UTC
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const formatDate = (iso?: string | null) => {
  const d = parse(iso);
  return d ? LONG.format(d) : '';
};

export const formatDateShort = (iso?: string | null) => {
  const d = parse(iso);
  return d ? SHORT.format(d).replace('.', '') : '';
};

export const formatMonthYear = (iso?: string | null) => {
  const d = parse(iso);
  return d ? MONTH_YEAR.format(d).replace('.', '') : '';
};

export const yearOf = (iso?: string | null) => parse(iso)?.getFullYear() ?? null;

/** "01", "02"… para el foliado de capítulos. */
export const folio = (n: number) => String(n).padStart(2, '0');

export const acronymOf = (u?: UniversityRef | null) => u?.acronym ?? u?.name ?? '';

/** Cuántos programas publica cada universidad (documentId de la universidad → cantidad). */
export function countByUniversity(programs: { university?: UniversityRef | null }[]) {
  const counts: Record<string, number> = {};
  for (const p of programs) {
    const id = p.university?.documentId;
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

/** Cuántos programas hay de cada nivel (para el espectro de la oferta). */
export type LevelCounts = Record<ProgramLevel, number>;

export const emptyLevels = (): LevelCounts => ({
  Maestria: 0,
  Doctorado: 0,
  Especializacion: 0,
  Diplomado: 0,
});

export function countByLevel(programs: { level: ProgramLevel }[]): LevelCounts {
  const out = emptyLevels();
  for (const p of programs) if (p.level in out) out[p.level] += 1;
  return out;
}

/** Programas por nivel de cada universidad (documentId → conteo por nivel). */
export function levelsByUniversity(
  programs: { level: ProgramLevel; university?: UniversityRef | null }[]
): Record<string, LevelCounts> {
  const out: Record<string, LevelCounts> = {};
  for (const p of programs) {
    const id = p.university?.documentId;
    if (!id || !(p.level in emptyLevels())) continue;
    (out[id] ??= emptyLevels())[p.level] += 1;
  }
  return out;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/**
 * Las entidades HTML básicas a su carácter. El backend guardaba el Markdown escapado (`&amp;`,
 * `&gt;`) y en un resumen de texto plano se veían tal cual. Solo para texto que React escapa.
 */
export const decodeEntities = (text: string) =>
  text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTITIES[e] ?? e);

/**
 * Texto plano a partir del Markdown del backend, recortado en el último espacio antes de `max`.
 * Las imágenes se quitan, los enlaces dejan solo su texto y el HTML embebido desaparece.
 */
export function excerpt(text?: string | null, max = 160) {
  if (!text) return '';
  const clean = decodeEntities(
    text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[#*_>`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/** Ids válidos: YouTube usa 11 caracteres [A-Za-z0-9_-]; Vimeo, solo dígitos. */
const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d+$/;

/**
 * Proveedor e id de un video de YouTube o Vimeo a partir de su URL (la galería solo guarda el
 * enlace). null si no es de uno de ellos o el id no tiene un formato posible: nada raro (como
 * `?v=../../algo`) llega a armar la dirección del reproductor.
 */
export function parseVideo(
  url?: string | null
): { provider: 'youtube' | 'vimeo'; id: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/'))
        id = u.pathname.split('/')[2];
    }
    if (id) return YOUTUBE_ID.test(id) ? { provider: 'youtube', id } : null;
    if (host === 'vimeo.com') {
      const v = u.pathname.split('/').filter(Boolean)[0];
      if (v && VIMEO_ID.test(v)) return { provider: 'vimeo', id: v };
    }
  } catch {
    /* URL inválida */
  }
  return null;
}

/** Miniatura del video (pasa por el optimizador de Next). null si no se reconoce. */
export function videoThumbnail(url?: string | null): string | null {
  const v = parseVideo(url);
  if (!v) return null;
  return v.provider === 'youtube'
    ? `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`
    : `https://vumbnail.com/${v.id}.jpg`;
}

/** URL para incrustar el video (YouTube sin cookies; reproducción automática al abrir). */
export function videoEmbed(url?: string | null): string | null {
  const v = parseVideo(url);
  if (!v) return null;
  return v.provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${v.id}?autoplay=1`;
}

/** Cuántos programas presenciales, virtuales e híbridos tiene cada universidad. */
export type ModalityCounts = Record<ProgramModality, number>;

export function modalitiesByUniversity(
  programs: { modality: ProgramModality; university?: UniversityRef | null }[]
): Record<string, ModalityCounts> {
  const out: Record<string, ModalityCounts> = {};
  for (const p of programs) {
    const id = p.university?.documentId;
    if (!id || !(p.modality in MODALITY_LABEL)) continue;
    (out[id] ??= { Presencial: 0, Virtual: 0, Hibrida: 0 })[p.modality] += 1;
  }
  return out;
}

/**
 * Minutos de lectura de un texto en Markdown, a 200 palabras por minuto (lectura atenta en
 * español); como mínimo 1. Las marcas de Markdown y las URL no cuentan como palabras.
 */
export function readingMinutes(markdown?: string | null): number {
  if (!markdown) return 1;
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#>*_`~|-]+/g, ' ');
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / 200));
}

export interface ProgramBrief {
  /** Dónde se imparte ("Facultad de Humanidades"), si la descripción lo dice. */
  where: string | null;
  /** Qué es o qué forma, en una o dos frases. */
  lead: string | null;
  /** Ejes o temas del programa (hasta cuatro). */
  axes: string[];
  /** A quién va dirigido. */
  audience: string | null;
}

const plain = (s: string) =>
  decodeEntities(s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, ''))
    .replace(/[*_`#>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Campos propios del programa en Strapi que alimentan la ficha abierta (pueden venir vacíos). */
export interface ProgramBriefFields {
  faculty?: string | null;
  /** Un tema por línea. */
  topics?: string | null;
  audience?: string | null;
}

/**
 * Las partes de un programa para la ficha abierta de la portada. Mandan los campos propios que
 * llena cada universidad en Strapi (facultad, temas, dirigido a); lo que quede vacío se busca en
 * la descripción, que puede seguir una plantilla (frase con la facultad, "Ejes del programa" en
 * lista, "Dirigido a:"). Lo que no se reconoce queda como `lead` (recortado): nada se inventa ni
 * se pierde.
 */
export function programBrief(markdown?: string | null, own: ProgramBriefFields = {}): ProgramBrief {
  const out = briefFromText(markdown);
  const faculty = own.faculty?.trim();
  if (faculty) out.where = faculty;
  const topics = (own.topics ?? '')
    .split(/\r?\n/)
    .map((l) => plain(l.replace(/^\s*[-*•]\s*/, '')))
    .filter(Boolean);
  if (topics.length) out.axes = topics.slice(0, 4);
  const audience = own.audience?.trim();
  if (audience) out.audience = audience;
  return out;
}

function briefFromText(markdown?: string | null): ProgramBrief {
  const out: ProgramBrief = { where: null, lead: null, axes: [], audience: null };
  if (!markdown) return out;
  const loose: string[] = [];
  for (const block of markdown.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;
    const items = lines.filter((l) => /^[-*•]\s+/.test(l));
    if (items.length && items.length === lines.length) {
      out.axes.push(...items.map((l) => plain(l.replace(/^[-*•]\s+/, ''))).filter(Boolean));
      continue;
    }
    const text = plain(block);
    const audience = text.match(/^dirigido a:?\s*(.+)$/i);
    if (audience) {
      out.audience = audience[1];
      continue;
    }
    // Encabezados de lista ("Ejes del programa") y la línea de modalidad/duración ya están en la ficha
    if (/^ejes( del programa)?:?$/i.test(text) || /^modalidad:/i.test(text)) continue;
    loose.push(text);
  }
  out.axes = out.axes.slice(0, 4);
  const first = loose.shift() ?? '';
  const sentences = first.split(/(?<=\.)\s+/);
  const at = sentences.findIndex((s) => /\bse imparte en\b/i.test(s));
  if (at >= 0) {
    // "se imparte en la Facultad de Humanidades" → "Facultad de Humanidades"
    const where = sentences[at]
      .replace(/^.*?\bse imparte en\s+/i, '')
      .replace(/^(la|el|los|las)\s+/i, '')
      .replace(/\.$/, '');
    out.where = where ? where[0].toUpperCase() + where.slice(1) : null;
    sentences.splice(0, at + 1);
  }
  const lead = [...sentences, ...loose].join(' ').trim();
  out.lead = lead ? excerpt(lead, 220) : null;
  return out;
}

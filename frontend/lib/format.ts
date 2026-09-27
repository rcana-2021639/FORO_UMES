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

/** Recorta un texto largo en el último espacio antes de `max`. */
export function excerpt(text?: string | null, max = 160) {
  if (!text) return '';
  const clean = text
    .replace(/[#*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/**
 * Miniatura de un video de YouTube o Vimeo a partir de su URL (la galería solo guarda el enlace).
 * Devuelve null si no se reconoce el proveedor.
 */
export function videoThumbnail(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/'))
        id = u.pathname.split('/')[2];
    }
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    if (host === 'vimeo.com') {
      const v = u.pathname.split('/').filter(Boolean)[0];
      if (v && /^\d+$/.test(v)) return `https://vumbnail.com/${v}.jpg`;
    }
  } catch {
    /* URL inválida */
  }
  return null;
}

/** URL para incrustar un video de YouTube o Vimeo (reproducción automática al abrir). */
export function videoEmbed(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/'))
        id = u.pathname.split('/')[2];
    }
    if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    if (host === 'vimeo.com') {
      const v = u.pathname.split('/').filter(Boolean)[0];
      if (v && /^\d+$/.test(v)) return `https://player.vimeo.com/video/${v}?autoplay=1`;
    }
  } catch {
    /* URL inválida */
  }
  return null;
}

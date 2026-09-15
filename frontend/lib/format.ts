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

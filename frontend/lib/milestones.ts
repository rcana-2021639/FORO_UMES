import { mediaUrl } from './api';
import { ACTIVITY_LABEL, acronymOf, excerpt, formatDateShort, yearOf } from './format';
import type { Activity, ActivityType, University } from './types';

export interface Milestone {
  key: string;
  date: string;
  kicker: string;
  title: string;
  href?: string;
  kind: 'university' | 'activity';
  /** Tipo de actividad (solo actividades). */
  type?: ActivityType;
  /** Rótulo corto del tipo: "Ingreso", "Encuentro", "Seminario"… */
  label: string;
  /** Portada de la actividad o logo de la universidad. */
  image?: string;
  /** Siglas de las universidades que participan (o la que ingresa). */
  unis: string[];
  summary?: string;
}

export function buildMilestones(
  universities: University[],
  activities: Activity[],
  limit = 10
): Milestone[] {
  const u = universities
    .filter((x) => x.joinedForumAt)
    .map<Milestone>((x) => ({
      key: `u-${x.documentId}`,
      date: x.joinedForumAt!,
      kicker: `Ingreso · ${yearOf(x.joinedForumAt)}`,
      title: x.name,
      href: `/universidades/${x.documentId}`,
      kind: 'university',
      label: 'Ingreso',
      image: mediaUrl(x.logo?.formats?.small?.url ?? x.logo?.url),
      unis: [x.acronym ?? x.name],
      summary: x.shortDescription ? excerpt(x.shortDescription, 120) : undefined,
    }));
  const a = activities.map<Milestone>((x) => ({
    key: `a-${x.documentId}`,
    date: x.date,
    kicker: `${ACTIVITY_LABEL[x.type]} · ${formatDateShort(x.date)}`,
    title: x.title,
    href: `/actividades/${x.documentId}`,
    kind: 'activity',
    type: x.type,
    label: ACTIVITY_LABEL[x.type],
    image: mediaUrl(
      x.coverImage?.formats?.medium?.url ?? x.coverImage?.formats?.small?.url ?? x.coverImage?.url
    ),
    unis: (x.participatingUniversities ?? []).map(acronymOf).filter(Boolean),
    // La primera línea suele ser la sede ("**Sede:** …"): el resumen empieza después
    summary: x.description
      ? excerpt(x.description.replace(/^\*\*Sede:\*\*[^\n]*\n+/, ''), 120)
      : undefined,
  }));
  return [...u, ...a].sort((p, q) => p.date.localeCompare(q.date)).slice(-limit);
}

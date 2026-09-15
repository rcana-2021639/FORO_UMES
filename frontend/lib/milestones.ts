import { ACTIVITY_LABEL, formatDateShort, yearOf } from './format';
import type { Activity, University } from './types';

export interface Milestone {
  key: string;
  date: string;
  kicker: string;
  title: string;
  href?: string;
  kind: 'university' | 'activity';
}

export function buildMilestones(universities: University[], activities: Activity[]): Milestone[] {
  const u = universities
    .filter((x) => x.joinedForumAt)
    .map<Milestone>((x) => ({
      key: `u-${x.documentId}`,
      date: x.joinedForumAt!,
      kicker: `Ingreso · ${yearOf(x.joinedForumAt)}`,
      title: x.name,
      href: `/universidades/${x.documentId}`,
      kind: 'university',
    }));
  const a = activities.map<Milestone>((x) => ({
    key: `a-${x.documentId}`,
    date: x.date,
    kicker: `${ACTIVITY_LABEL[x.type]} · ${formatDateShort(x.date)}`,
    title: x.title,
    href: `/actividades/${x.documentId}`,
    kind: 'activity',
  }));
  return [...u, ...a].sort((p, q) => p.date.localeCompare(q.date)).slice(-10);
}

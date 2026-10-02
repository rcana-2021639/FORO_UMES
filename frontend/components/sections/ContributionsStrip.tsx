import Link from 'next/link';
import { CONTRIBUTION_LABEL, excerpt, formatDate } from '@/lib/format';
import type { Contribution, ContributionType } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';
import { HandHeartIcon, RocketLaunchIcon, SealCheckIcon } from '@phosphor-icons/react/dist/ssr';

const TONE: Record<
  ContributionType,
  { rule: string; hint: string; Icon: typeof SealCheckIcon; gesture: string }
> = {
  Resultado: {
    rule: 'var(--color-sage)',
    hint: 'Ya ocurrió y se puede medir',
    Icon: SealCheckIcon,
    gesture: 'stamp',
  },
  Iniciativa: {
    rule: 'var(--color-lilac)',
    hint: 'Está en marcha',
    Icon: RocketLaunchIcon,
    gesture: 'launch',
  },
  Beneficio: {
    rule: 'var(--color-clay-2)',
    hint: 'Lo ganan estudiantes y programas',
    Icon: HandHeartIcon,
    gesture: 'beat',
  },
};

/**
 * Lo que sale de la mesa: los aportes más recientes, justo debajo de "cómo trabaja" porque son
 * su resultado. Cada tarjeta dice de qué tipo es y qué significa ese tipo, sin leyenda aparte.
 */
export function ContributionsStrip({ contributions }: { contributions: Contribution[] }) {
  const items = contributions.slice(0, 3);

  if (!items.length) {
    return (
      <p className="max-w-[48ch] text-fg-muted">
        Todavía no hay aportes publicados. El primero aparecerá aquí en cuanto el Foro lo apruebe.
      </p>
    );
  }

  return (
    <ul data-reveal-stagger="tilt" className="grid gap-3 md:grid-cols-3">
      {items.map((c) => {
        const tone = TONE[c.type];
        const inner = (
          <>
            {/* Filete de su tipo: al pasar el cursor baja y tiñe la ficha */}
            <span aria-hidden className="contrib-card__wash" />
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="contrib-card__icon" data-gesture={tone.gesture}>
                  <tone.Icon weight="duotone" />
                </span>
                <span className="chip" style={{ color: tone.rule, borderColor: 'currentColor' }}>
                  {CONTRIBUTION_LABEL[c.type]}
                </span>
              </span>
              <span className="mono-label text-fg-muted">{formatDate(c.publishedOn)}</span>
            </span>
            <span className="ui-label mt-1 block text-fg-muted">{tone.hint}</span>
            <span className="mt-4 block font-display text-[1.3rem] leading-tight text-fg [font-variation-settings:'opsz'_36]">
              {c.title}
            </span>
            <span className="mt-2 line-clamp-3 block text-[0.95rem] leading-relaxed text-fg-muted">
              {excerpt(c.description, 180)}
            </span>
            {c.relatedActivity && (
              <span className="ui-label mt-4 inline-flex items-center gap-2 text-fg">
                Salió de: {c.relatedActivity.title ?? 'una actividad del Foro'} <Arrow />
              </span>
            )}
          </>
        );
        return (
          <li key={c.documentId}>
            {c.relatedActivity ? (
              <Link
                href={`/actividades/${c.relatedActivity.documentId}`}
                className="contrib-card group"
                style={{ '--tone': tone.rule } as React.CSSProperties}
              >
                {inner}
              </Link>
            ) : (
              <div className="contrib-card" style={{ '--tone': tone.rule } as React.CSSProperties}>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

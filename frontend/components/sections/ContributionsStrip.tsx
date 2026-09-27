'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { CONTRIBUTION_LABEL, excerpt, formatDate } from '@/lib/format';
import { EASE, stagger } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Contribution, ContributionType } from '@/lib/types';

const TONE: Record<ContributionType, { rule: string; hint: string }> = {
  Resultado: { rule: 'var(--color-sage)', hint: 'Ya ocurrió y se puede medir' },
  Iniciativa: { rule: 'var(--color-lilac)', hint: 'Está en marcha' },
  Beneficio: { rule: 'var(--color-clay-2)', hint: 'Lo ganan estudiantes y programas' },
};

/**
 * Lo que sale de la mesa: los aportes más recientes, justo debajo de "cómo trabaja" porque son
 * su resultado. Cada tarjeta dice de qué tipo es y qué significa ese tipo, sin leyenda aparte.
 */
export function ContributionsStrip({ contributions }: { contributions: Contribution[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();
  const items = contributions.slice(0, 3);

  if (!items.length) {
    return (
      <p className="max-w-[48ch] text-fg-muted">
        Todavía no hay aportes publicados. El primero aparecerá aquí en cuanto el Foro lo apruebe.
      </p>
    );
  }

  return (
    <ul ref={ref} className="grid gap-3 md:grid-cols-3">
      {items.map((c, i) => {
        const tone = TONE[c.type];
        const inner = (
          <>
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: tone.rule }}
            />
            <span className="flex items-center justify-between gap-3">
              <span className="chip" style={{ color: tone.rule, borderColor: 'currentColor' }}>
                {CONTRIBUTION_LABEL[c.type]}
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
                Salió de: {c.relatedActivity.title ?? 'una actividad del Foro'}{' '}
                <span aria-hidden>→</span>
              </span>
            )}
          </>
        );
        return (
          <motion.li
            key={c.documentId}
            initial={reduced ? false : { opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.9, ease: EASE.premium, delay: stagger(i, 0.07) }}
          >
            {c.relatedActivity ? (
              <Link href={`/actividades/${c.relatedActivity.documentId}`} className="contrib-card">
                {inner}
              </Link>
            ) : (
              <div className="contrib-card">{inner}</div>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}

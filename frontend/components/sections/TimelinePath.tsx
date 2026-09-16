'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { formatMonthYear } from '@/lib/format';
import type { Milestone } from '@/lib/milestones';

/**
 * Capítulo 05 · Línea de tiempo. SVG path que se dibuja con el scroll (scroll anim #5, DrawSVG
 * scrubbed) y cada hito aparece cuando la línea lo alcanza.
 */
export function TimelinePath({ milestones }: { milestones: Milestone[] }) {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = root.current;
    const p = path.current;
    if (!el || !p) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        p,
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 60%', scrub: 0.5 },
        }
      );
      gsap.utils.toArray<HTMLElement>('[data-milestone]', el).forEach((item) => {
        gsap.from(item, {
          autoAlpha: 0,
          x: -16,
          duration: 0.8,
          scrollTrigger: { trigger: item, start: 'top 68%', once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [milestones.length]);

  if (!milestones.length) {
    return (
      <p className="text-fg-muted">
        La línea de tiempo empieza con la primera actividad publicada. Todavía no hay ninguna.
      </p>
    );
  }

  // Path ondulado vertical: 100 unidades de ancho, alto proporcional a los hitos
  const H = milestones.length * 100;
  const d = milestones
    .map((_, i) => {
      const y = i * 100 + 50;
      const cx = i % 2 === 0 ? 30 : 70;
      return i === 0 ? `M 50 0 Q ${cx} ${y - 25} 50 ${y}` : `Q ${cx} ${y - 25} 50 ${y}`;
    })
    .join(' ');

  return (
    <div
      ref={root}
      className="relative grid grid-cols-[3rem_1fr] gap-6 md:grid-cols-[8rem_1fr] md:gap-12"
    >
      <svg
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <path
          d={d}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={path}
          d={d}
          fill="none"
          stroke="var(--color-jade)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <ol className="space-y-0">
        {milestones.map((m, i) => (
          <li
            key={m.key}
            data-milestone
            className="flex min-h-[6.25rem] items-center border-b border-line py-5 last:border-b-0"
          >
            <div className="grid w-full gap-1 md:grid-cols-12 md:items-baseline md:gap-6">
              <span className="mono-label text-fg-muted md:col-span-3">
                {m.kind === 'university' ? m.kicker : formatMonthYear(m.date)}
              </span>
              <div className="md:col-span-9">
                {m.kind === 'activity' && <span className="ui-label text-accent">{m.kicker}</span>}
                <h3 className="mt-1 text-[1.3rem] text-fg">
                  {m.href ? (
                    <Link
                      href={m.href}
                      className="transition-colors duration-300 hover:text-accent-jade"
                      data-cursor="Abrir"
                    >
                      {m.title}
                    </Link>
                  ) : (
                    m.title
                  )}
                </h3>
              </div>
            </div>
            <span className="sr-only">Hito {i + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { CONTRIBUTION_LABEL, excerpt, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Contribution, ContributionType } from '@/lib/types';

const TYPES: { type: ContributionType; blurb: string }[] = [
  {
    type: 'Resultado',
    blurb: 'Lo que ya ocurrió y se puede medir: convenios, estudios, publicaciones.',
  },
  {
    type: 'Iniciativa',
    blurb: 'Lo que está en marcha: proyectos conjuntos, pilotos, mesas de trabajo.',
  },
  {
    type: 'Beneficio',
    blurb: 'Lo que ganan estudiantes y programas: movilidad, reconocimiento, acceso.',
  },
];

/**
 * Capítulo 06 · Aportes. Sticky narrativa (scroll anim #10): la columna izquierda queda fija y
 * marca el tipo activo mientras la derecha recorre los aportes agrupados. Fondo "noche"
 * (scroll anim #9, tema por sección) y retícula que se revela cerca del cursor (patrón
 * Rare UI "Grid Reveal", reimplementado con una máscara radial CSS).
 */
export function ContributionsSticky({ contributions }: { contributions: Contribution[] }) {
  const [active, setActive] = useState<ContributionType>('Resultado');
  const root = useRef<HTMLDivElement>(null);

  const groups = TYPES.map((t) => ({
    ...t,
    items: contributions.filter((c) => c.type === t.type),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const triggers = Array.from(el.querySelectorAll<HTMLElement>('[data-group]')).map((g) =>
      ScrollTrigger.create({
        trigger: g,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(g.dataset.group as ContributionType),
      })
    );
    return () => triggers.forEach((t) => t.kill());
  }, [groups.length]);

  return (
    <div
      ref={root}
      className="relative"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--gx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--gy', `${e.clientY - r.top}px`);
      }}
    >
      {/* Retícula revelada por el cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[var(--gutter)] inset-y-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklab, var(--fg) 14%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--fg) 14%, transparent) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(320px circle at var(--gx, -100px) var(--gy, -100px), #000 0%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(320px circle at var(--gx, -100px) var(--gy, -100px), #000 0%, transparent 70%)',
        }}
      />

      {groups.length === 0 ? (
        <p className="text-fg-muted">Los aportes del Foro se publicarán aquí.</p>
      ) : (
        <div className="relative grid gap-10 md:grid-cols-12 md:gap-8">
          <aside className="md:sticky md:top-32 md:col-span-5 md:self-start">
            <ol className="space-y-5">
              {TYPES.map((t) => {
                const on = active === t.type;
                return (
                  <li
                    key={t.type}
                    className="border-l pl-5 transition-colors duration-500"
                    style={{ borderColor: on ? 'var(--color-amber)' : 'var(--line)' }}
                  >
                    <p
                      className={cn(
                        'font-display text-[clamp(1.8rem,3.2vw,2.8rem)] leading-none transition-colors duration-500',
                        on ? 'text-fg' : 'text-fg-muted'
                      )}
                      style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 20" }}
                    >
                      {CONTRIBUTION_LABEL[t.type]}
                    </p>
                    <p
                      className={cn(
                        'mt-2 max-w-[38ch] text-[0.95rem] leading-relaxed text-fg-muted transition-[opacity,transform] duration-500',
                        on ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                      )}
                    >
                      {t.blurb}
                    </p>
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="md:col-span-7">
            {groups.map((g) => (
              <div key={g.type} data-group={g.type} className="mb-16 last:mb-0">
                <p className="mono-label mb-4 text-accent md:hidden">
                  {CONTRIBUTION_LABEL[g.type]}
                </p>
                <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {g.items.map((c) => (
                    <li key={c.documentId} className="group py-6">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="mono-label text-fg-muted">
                          {formatDate(c.publishedOn)}
                        </span>
                        {c.relatedActivity?.documentId && (
                          <Link
                            href={`/actividades/${c.relatedActivity.documentId}`}
                            className="mono-label text-accent-jade underline-offset-4 hover:underline"
                          >
                            actividad →
                          </Link>
                        )}
                      </div>
                      <h3 className="mt-3 text-[1.4rem] text-fg transition-colors duration-300 group-hover:text-accent-jade">
                        {c.title}
                      </h3>
                      <p className="mt-2 max-w-[60ch] leading-relaxed text-fg-muted">
                        {excerpt(c.description, 220)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

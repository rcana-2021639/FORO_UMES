'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { LEVEL_LABEL, MODALITY_LABEL, acronymOf } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AcademicProgram, ProgramLevel } from '@/lib/types';

const LEVELS: ProgramLevel[] = ['Maestria', 'Doctorado', 'Especializacion', 'Diplomado'];

/**
 * Capítulo 03 · Programas. Scroll horizontal (scroll anim #4): la sección se fija y el scroll
 * vertical desplaza el riel de tarjetas. Bajo 768 px o con reduced-motion es un carrusel nativo
 * con scroll-snap (no se esconde nada).
 */
export function ProgramsRail({ programs }: { programs: AcademicProgram[] }) {
  const [level, setLevel] = useState<ProgramLevel | 'all'>('all');
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => (level === 'all' ? programs : programs.filter((p) => p.level === level)),
    [programs, level]
  );

  useEffect(() => {
    const el = root.current;
    const rail = track.current;
    if (!el || !rail) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const distance = () => rail.scrollWidth - el.clientWidth;
      const tween = gsap.to(rail, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top+=96',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      return () => tween.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, [visible.length]);

  useEffect(() => {
    // Cambió el filtro: el riel cambia de ancho → recalcular
    if (!prefersReducedMotion()) ScrollTrigger.refresh();
  }, [visible.length]);

  return (
    <div ref={root} className="relative">
      <div
        className="container-x mb-8 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrar por nivel"
      >
        <Chip active={level === 'all'} onClick={() => setLevel('all')}>
          Todos
        </Chip>
        {LEVELS.map((l) => (
          <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
            {LEVEL_LABEL[l]}
          </Chip>
        ))}
        <span className="ui-label ml-auto text-fg-muted">
          {visible.length} programa{visible.length === 1 ? '' : 's'}
        </span>
      </div>

      <div
        ref={track}
        data-cursor="Desliza"
        className={cn(
          'flex gap-4 px-[var(--gutter)] will-change-transform',
          'max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:pb-6 max-md:[scrollbar-width:none]',
          'md:w-max md:pr-[40vw]'
        )}
      >
        {visible.map((p) => (
          <ProgramCard key={p.documentId} program={p} />
        ))}
        {visible.length === 0 && (
          <p className="max-w-[40ch] text-fg-muted">
            Ningún programa de este nivel está publicado todavía. Prueba otro nivel o vuelve al
            catálogo completo.
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'ui-label relative isolate overflow-hidden rounded-full border px-3.5 py-1.5 transition-[color,border-color] duration-300 ease-(--ease-snap)',
        'before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-fg before:transition-transform before:duration-500 before:ease-(--ease-snap) hover:before:scale-x-100 hover:text-bg',
        active
          ? 'border-fg bg-fg text-bg before:scale-x-100'
          : 'border-line text-fg hover:border-fg'
      )}
    >
      {children}
    </button>
  );
}

function ProgramCard({ program: p }: { program: AcademicProgram }) {
  return (
    <article
      className={cn(
        'group relative flex w-[78vw] shrink-0 snap-start flex-col justify-between border-t border-fg/70 pt-5 pb-2 sm:w-[22rem] md:w-[24rem]',
        'lift hover:lift-on hover:bg-[color-mix(in_oklab,var(--fg)_4%,var(--bg))] hover:px-4 rounded-[4px]'
      )}
    >
      <div className="flex items-start justify-between">
        <span className="ui-label text-fg-muted">{acronymOf(p.university)}</span>
        <span
          className={cn(
            'ui-label rounded-full px-2.5 py-0.5',
            p.level === 'Doctorado' ? 'bg-fg text-bg' : 'border border-line text-fg'
          )}
        >
          {LEVEL_LABEL[p.level]}
        </span>
      </div>
      <h3 className="mt-10 text-[1.35rem] leading-tight text-fg">{p.name}</h3>
      <dl className="ui-label mt-6 flex flex-wrap gap-x-4 gap-y-1 text-fg-muted">
        <div>
          <dt className="sr-only">Modalidad</dt>
          <dd>{MODALITY_LABEL[p.modality]}</dd>
        </div>
        {p.duration && (
          <div>
            <dt className="sr-only">Duración</dt>
            <dd>{p.duration}</dd>
          </div>
        )}
      </dl>
      {(p.infoUrl || p.university) && (
        <Link
          href={p.infoUrl ?? `/universidades/${p.university?.documentId}`}
          target={p.infoUrl ? '_blank' : undefined}
          rel={p.infoUrl ? 'noopener noreferrer' : undefined}
          className="ui-label mt-6 inline-flex items-center gap-2 text-accent-jade underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-current"
        >
          {p.infoUrl ? 'Ficha oficial del programa ↗' : 'Ir a la universidad →'}
        </Link>
      )}
    </article>
  );
}

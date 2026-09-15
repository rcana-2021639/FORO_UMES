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
        <span className="mono-label ml-auto text-fg-muted">
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
        {visible.map((p, i) => (
          <ProgramCard key={p.documentId} program={p} index={i} />
        ))}
        {visible.length === 0 && (
          <p className="text-fg-muted">Aún no hay programas publicados en este nivel.</p>
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
        'mono-label rounded-full border px-3 py-1.5 transition-colors duration-300',
        active ? 'border-fg bg-fg text-bg' : 'border-line text-fg hover:border-fg'
      )}
    >
      {children}
    </button>
  );
}

function ProgramCard({ program: p, index }: { program: AcademicProgram; index: number }) {
  return (
    <article
      className={cn(
        'group relative flex w-[78vw] shrink-0 snap-start flex-col justify-between rounded-[3px] border border-line bg-bg p-6 sm:w-[22rem] md:w-[24rem]',
        'transition-[border-color] duration-500 hover:border-fg/40'
      )}
    >
      <div className="flex items-start justify-between">
        <span className="mono-label text-fg-muted">{String(index + 1).padStart(2, '0')}</span>
        <span
          className={cn(
            'mono-label rounded-full px-2 py-0.5',
            p.level === 'Doctorado' ? 'bg-amber text-paper' : 'border border-line text-fg'
          )}
        >
          {LEVEL_LABEL[p.level]}
        </span>
      </div>
      <h3 className="mt-10 text-[1.35rem] leading-tight text-fg">{p.name}</h3>
      <dl className="mono-label mt-6 flex flex-wrap gap-x-4 gap-y-1 text-fg-muted">
        <div>
          <dt className="sr-only">Universidad</dt>
          <dd className="text-fg">{acronymOf(p.university)}</dd>
        </div>
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
          className="mono-label mt-6 inline-flex items-center gap-2 text-jade underline-offset-4 hover:underline"
        >
          {p.infoUrl ? 'Más información ↗' : 'Ver universidad →'}
        </Link>
      )}
    </article>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { mediaUrl } from '@/lib/api';
import { yearOf } from '@/lib/format';
import { cn } from '@/lib/cn';
import { EASE, stagger } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { University } from '@/lib/types';

/**
 * Las nueve universidades. Bento asimétrico (la primera del orden ocupa 2×2) sin bordes: cada
 * celda es una losa de piedra más oscura que se "coloca sobre la mesa" con un barrido de
 * máscara (clip-path) y stagger irregular (scroll anim #7). En hover la losa se levanta con
 * sombra tintada de tinta, el spotlight jade sigue al cursor y la flecha entra deslizándose.
 * Patrón de React Bits `MagicBento`, reescrito sin glow morado ni partículas.
 */
export function UniversitiesBento({ universities }: { universities: University[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px' });
  const reduced = useReducedMotion();

  return (
    <ul
      ref={ref}
      className="grid auto-rows-[minmax(11rem,auto)] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
    >
      {universities.length === 0 && (
        <li className="col-span-full max-w-[44ch] text-fg-muted">
          Todavía no hay universidades publicadas. Cuando el Foro cargue la primera, ocupará esta
          silla.
        </li>
      )}
      {universities.map((u, i) => {
        const big = i === 0;
        const joined = yearOf(u.joinedForumAt);
        const logo = mediaUrl(u.logo?.formats?.small?.url ?? u.logo?.url);
        return (
          <motion.li
            key={u.documentId}
            initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }}
            animate={inView ? { clipPath: 'inset(0 0% 0 0)', opacity: 1 } : undefined}
            transition={{ duration: 1.1, ease: EASE.premium, delay: stagger(i, 0.06) }}
            className={cn('group relative', big && 'col-span-2 md:row-span-2')}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
            }}
          >
            <Link
              href={`/universidades/${u.documentId}`}
              data-cursor="Abrir perfil"
              className={cn(
                'lift hover:lift-on focus-visible:lift-on relative flex h-full flex-col justify-between overflow-hidden rounded-[4px] p-5',
                big
                  ? 'bg-[color-mix(in_oklab,var(--fg)_6%,var(--bg))] md:p-8'
                  : 'bg-[color-mix(in_oklab,var(--fg)_4%,var(--bg))]'
              )}
            >
              {/* Spotlight jade que sigue al cursor */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-(--ease-out-premium) group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-jade) 14%, transparent), transparent 72%)',
                }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <span className="mono-label text-fg-muted">{u.displayOrder}</span>
                {joined && <span className="ui-label text-accent">desde {joined}</span>}
              </div>

              <div className="relative mt-6">
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={big ? 160 : 72}
                    height={big ? 160 : 72}
                    className={cn(
                      'object-contain mix-blend-multiply',
                      big ? 'h-24 w-auto' : 'h-10 w-auto'
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      'block font-display leading-none font-light tracking-[-0.03em] text-fg',
                      big ? 'text-[clamp(3.2rem,7.5vw,6.5rem)]' : 'text-[2.1rem]'
                    )}
                    style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
                  >
                    {u.acronym ?? u.name.slice(0, 3)}
                  </span>
                )}
                <p
                  className={cn(
                    'mt-3 leading-snug text-fg',
                    big ? 'max-w-[26ch] text-[1.25rem]' : 'text-[0.92rem]'
                  )}
                >
                  {u.name}
                </p>
                {big && u.shortDescription && (
                  <p className="mt-4 hidden max-w-[44ch] text-[0.95rem] leading-relaxed text-fg-muted md:block">
                    {u.shortDescription}
                  </p>
                )}
              </div>

              {/* Flecha que entra deslizándose desde la derecha */}
              <span
                aria-hidden
                className="absolute right-4 bottom-4 flex items-center gap-2 text-fg-muted"
              >
                <span className="ui-label translate-x-2 opacity-0 transition-[transform,opacity] duration-500 ease-(--ease-snap) group-hover:translate-x-0 group-hover:opacity-100">
                  perfil
                </span>
                <Arrow />
              </span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 overflow-visible"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <path
        d="M3 10h13"
        strokeLinecap="round"
        className="origin-left scale-x-0 transition-transform duration-500 ease-(--ease-snap) group-hover:scale-x-100"
      />
      <path
        d="M11 5l5 5-5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="-translate-x-2 transition-transform duration-500 ease-(--ease-snap) group-hover:translate-x-0"
      />
    </svg>
  );
}

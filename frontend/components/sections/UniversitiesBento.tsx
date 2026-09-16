'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { mediaUrl } from '@/lib/api';
import { yearOf } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { University } from '@/lib/types';

/**
 * Capítulo 02 · Universidades. Bento asimétrico (la primera del orden oficial ocupa 2×2) con
 * reveal escalonado por celda (scroll anim #7) y spotlight por celda que sigue al cursor.
 * Patrón de React Bits `Components/MagicBento`, reescrito sin glow morado ni partículas.
 */
export function UniversitiesBento({ universities }: { universities: University[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduced = useReducedMotion();

  return (
    <ul
      ref={ref}
      className="grid auto-rows-[minmax(11rem,auto)] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
    >
      {universities.length === 0 && (
        <li className="col-span-full text-fg-muted">
          Las universidades se cargarán desde el panel del Foro.
        </li>
      )}
      {universities.map((u, i) => {
        const big = i === 0;
        const joined = yearOf(u.joinedForumAt);
        const logo = mediaUrl(u.logo?.formats?.small?.url ?? u.logo?.url);
        return (
          <motion.li
            key={u.documentId}
            initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.06 * i }}
            className={cn('group relative', big && 'col-span-2 md:row-span-2')}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
            }}
          >
            <Link
              href={`/universidades/${u.documentId}`}
              data-cursor="Ver perfil"
              className={cn(
                'relative flex h-full flex-col justify-between overflow-hidden rounded-[3px] border border-line bg-bg p-5 transition-[border-color,background-color] duration-500',
                'hover:border-fg/40',
                big ? 'md:p-8' : ''
              )}
            >
              {/* Spotlight que sigue al cursor (solo hover) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-jade) 16%, transparent), transparent 70%)',
                }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <span className="mono-label text-fg-muted">
                  {String(u.displayOrder).padStart(2, '0')}
                </span>
                {joined && <span className="mono-label text-accent">desde {joined}</span>}
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
                      'block font-display leading-none tracking-tight text-fg',
                      big ? 'text-[clamp(3rem,7vw,6rem)]' : 'text-[2rem]'
                    )}
                    style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 20" }}
                  >
                    {u.acronym ?? u.name.slice(0, 3)}
                  </span>
                )}
                <p
                  className={cn(
                    'mt-3 leading-snug text-fg',
                    big ? 'max-w-[26ch] text-[1.25rem]' : 'text-[0.9rem]'
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

              <span
                aria-hidden
                className="absolute right-4 bottom-4 mono-label translate-y-2 text-fg-muted opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
              >
                perfil →
              </span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

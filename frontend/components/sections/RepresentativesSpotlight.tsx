'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { FlipCard } from '@/components/ui/FlipCard';
import { mediaUrl } from '@/lib/api';
import { acronymOf, excerpt } from '@/lib/format';
import { cn } from '@/lib/cn';
import { EASE, stagger } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Representative } from '@/lib/types';

/** Anverso sin foto: tres tintas que se alternan alrededor de la mesa. */
const FRONT = [
  'bg-[color-mix(in_oklab,var(--color-lilac)_16%,var(--bg))]',
  'bg-[color-mix(in_oklab,var(--color-sage)_16%,var(--bg))]',
  'bg-[color-mix(in_oklab,var(--fg)_8%,var(--bg))]',
];

/**
 * Capítulo 08 · Representantes. Antes era una linterna sobre siluetas; sin fotos publicadas
 * solo se veían bloques negros. Ahora cada silla es una tarjeta que se da la vuelta (React Bits
 * `FlipCard`): anverso con foto o iniciales, reverso violeta-tinta con nombre, cargo, universidad
 * y correo institucional.
 */
export function RepresentativesSpotlight({ reps }: { reps: Representative[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();

  if (!reps.length)
    return (
      <p className="max-w-[44ch] text-fg-muted">
        Las sillas siguen vacías: los representantes aparecerán cuando cada universidad publique el
        suyo.
      </p>
    );

  return (
    <ul ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {reps.map((r, i) => {
        const photo = mediaUrl(r.photo?.formats?.small?.url ?? r.photo?.url);
        const initials = r.fullName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s[0])
          .join('');
        const uni = acronymOf(r.university);
        return (
          <motion.li
            key={r.documentId}
            initial={reduced ? false : { opacity: 0, y: 28, rotateX: -12 }}
            animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : undefined}
            transition={{ duration: 1, ease: EASE.premium, delay: stagger(i, 0.07) }}
            className="aspect-[4/5] [perspective:1100px]"
          >
            <FlipCard
              label={`${r.fullName}, ${uni}. Dar vuelta para ver cargo y contacto.`}
              front={
                <span
                  className={cn(
                    'relative flex h-full w-full flex-col justify-between p-4',
                    FRONT[i % 3]
                  )}
                >
                  {photo ? (
                    <Image
                      src={photo}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 grid place-items-center font-display text-[clamp(3rem,6vw,4.5rem)] leading-none font-light text-fg/70"
                      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60, 'WONK' 1" }}
                    >
                      {initials}
                    </span>
                  )}
                  <span className="relative flex items-start justify-between">
                    <span className="ui-label text-accent">{uni}</span>
                    <span className="mono-label text-fg-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </span>
                  <span className="relative">
                    <span className="block text-[0.95rem] leading-tight text-fg">{r.fullName}</span>
                    <span className="ui-label mt-2 inline-flex items-center gap-1.5 text-fg-muted">
                      <Turn /> dar vuelta
                    </span>
                  </span>
                </span>
              }
              back={
                <span className="flex h-full w-full flex-col justify-between bg-lilac-3 p-4 text-paper">
                  <span className="ui-label text-lilac-2">{uni}</span>
                  <span>
                    <span
                      className="block font-display text-[1.15rem] leading-[1.15]"
                      style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 30" }}
                    >
                      {r.fullName}
                    </span>
                    {r.position && (
                      <span className="mt-1.5 block text-[0.82rem] text-paper/75">
                        {r.position}
                      </span>
                    )}
                    {r.shortBio && (
                      <span className="mt-2 hidden text-[0.78rem] leading-snug text-paper/60 lg:block">
                        {excerpt(r.shortBio, 90)}
                      </span>
                    )}
                  </span>
                  <a
                    href={`mailto:${r.institutionalEmail}`}
                    onClick={(e) => e.stopPropagation()}
                    className="ui-label mt-2 inline-block max-w-full truncate border-b border-lilac-2/40 pb-0.5 text-lilac-2 transition-colors hover:border-lilac-2"
                  >
                    {r.institutionalEmail}
                  </a>
                </span>
              }
            />
          </motion.li>
        );
      })}
    </ul>
  );
}

function Turn() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden
    >
      <path d="M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 8a5.5 5.5 0 0 1-9.4 3.9" strokeLinecap="round" />
      <path d="M11.5 1.5v3h-3M4.5 14.5v-3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

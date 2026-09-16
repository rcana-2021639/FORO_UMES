'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { mediaUrl } from '@/lib/api';
import { acronymOf } from '@/lib/format';
import { useFinePointer } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import type { Representative } from '@/lib/types';

/**
 * Capítulo 08 · Representantes. Spotlight: bajo una capa "tinta" solo se ven siluetas; el
 * cursor actúa como linterna (mask-image radial) y revela nombre, cargo y universidad.
 * En táctil o teclado se muestra todo (sin máscara).
 */
export function RepresentativesSpotlight({ reps }: { reps: Representative[] }) {
  const fine = useFinePointer();
  const root = useRef<HTMLDivElement>(null);

  if (!reps.length)
    return <p className="text-fg-muted">Los representantes se publicarán próximamente.</p>;

  const grid = (revealed: boolean) => (
    <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
      {reps.map((r) => {
        const photo = mediaUrl(r.photo?.formats?.small?.url ?? r.photo?.url);
        const initials = r.fullName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s[0])
          .join('');
        return (
          <li
            key={r.documentId}
            className={cn(
              'relative aspect-[4/5] overflow-hidden',
              revealed ? 'bg-paper' : 'bg-ink'
            )}
          >
            {photo ? (
              <Image
                src={photo}
                alt={revealed ? r.fullName : ''}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className={cn('object-cover', revealed ? '' : 'opacity-30 grayscale')}
              />
            ) : (
              <span
                aria-hidden
                className={cn(
                  'absolute inset-0 grid place-items-center font-display text-[3rem]',
                  revealed ? 'text-ink-3' : 'text-paper/15'
                )}
                style={{ fontVariationSettings: "'opsz' 96, 'WONK' 1" }}
              >
                {initials}
              </span>
            )}
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 p-4 transition-opacity duration-300',
                revealed
                  ? 'bg-gradient-to-t from-paper via-paper/90 to-transparent opacity-100'
                  : 'opacity-0'
              )}
            >
              <p className="mono-label text-accent">{acronymOf(r.university)}</p>
              <p className="mt-1 text-[0.98rem] leading-tight text-ink">{r.fullName}</p>
              {r.position && <p className="mt-1 text-[0.8rem] text-ink-3">{r.position}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );

  // Sin puntero fino: todo visible.
  if (!fine) return grid(true);

  return (
    <div
      ref={root}
      className="relative"
      data-cursor=""
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--sx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--sy', `${e.clientY - r.top}px`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty('--sx', '-999px');
        e.currentTarget.style.setProperty('--sy', '-999px');
      }}
    >
      {/* Capa oscura: siluetas */}
      {grid(false)}
      {/* Capa revelada por la linterna */}
      <div
        className="absolute inset-0"
        style={{
          maskImage:
            'radial-gradient(230px circle at var(--sx, -999px) var(--sy, -999px), #000 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(230px circle at var(--sx, -999px) var(--sy, -999px), #000 30%, transparent 75%)',
        }}
      >
        {grid(true)}
      </div>
      {/* Accesible: la lista completa también existe para lectores de pantalla */}
      <ul className="sr-only">
        {reps.map((r) => (
          <li key={r.documentId}>
            {r.fullName}
            {r.position ? `, ${r.position}` : ''} — {acronymOf(r.university)}
          </li>
        ))}
      </ul>
    </div>
  );
}

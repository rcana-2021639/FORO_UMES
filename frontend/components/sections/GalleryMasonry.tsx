'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { PixelTrail } from './PixelTrail';
import { mediaUrl } from '@/lib/api';
import { formatDateShort } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import type { GalleryItem } from '@/lib/types';

/** Capítulo 09 · Galería. Masonry por columnas CSS con reveal y estela de píxeles del cursor. */
export function GalleryMasonry({ items }: { items: GalleryItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();

  if (!items.length)
    return (
      <p className="text-fg-muted">
        La galería se llenará con las fotos y videos de las actividades.
      </p>
    );

  return (
    <div ref={ref} className="relative">
      <PixelTrail />
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {items.map((g, i) => {
          const src = mediaUrl(g.file?.formats?.medium?.url ?? g.file?.url);
          const w = g.file?.width ?? 4;
          const h = g.file?.height ?? 3;
          return (
            <motion.figure
              key={g.documentId}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (i % 8) * 0.05 }}
              className="group relative overflow-hidden rounded-[3px] border border-line bg-paper-2"
            >
              {g.type === 'Video' && g.videoUrl ? (
                <a
                  href={g.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="Ver video"
                  className="relative block aspect-video"
                >
                  {src ? (
                    <Image
                      src={src}
                      alt={g.title ?? ''}
                      fill
                      sizes="(min-width:1024px) 25vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center">
                      <PlayGlyph />
                    </span>
                  )}
                  <span className="absolute right-3 bottom-3 mono-label rounded-full bg-ink/80 px-2 py-0.5 text-paper">
                    video
                  </span>
                </a>
              ) : src ? (
                <div className="relative" style={{ aspectRatio: `${w} / ${h}` }} data-cursor="">
                  <Image
                    src={src}
                    alt={g.file?.alternativeText ?? g.title ?? ''}
                    fill
                    sizes="(min-width:1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}
              {(g.title || g.date) && (
                <figcaption
                  className={cn(
                    'flex items-baseline justify-between gap-3 px-3 py-2',
                    'mono-label text-fg-muted'
                  )}
                >
                  <span className="truncate text-fg">{g.title}</span>
                  <span>{formatDateShort(g.date)}</span>
                </figcaption>
              )}
            </motion.figure>
          );
        })}
      </div>
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="19" fill="none" stroke="var(--color-ink)" strokeWidth="1" />
      <path d="M16 13 L28 20 L16 27 Z" fill="var(--color-ink)" />
    </svg>
  );
}

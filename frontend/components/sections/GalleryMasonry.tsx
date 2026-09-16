'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { PixelTrail } from './PixelTrail';
import { mediaUrl } from '@/lib/api';
import { formatDateShort } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, stagger } from '@/lib/motion';
import type { GalleryItem } from '@/lib/types';

/**
 * Lo que quedó en fotos. Masonry por columnas CSS; cada foto se revela con una máscara que
 * sube (clip-path desde abajo), como si alguien la deslizara sobre la mesa, con stagger
 * irregular. Estela de píxeles jade tras el cursor solo aquí.
 */
export function GalleryMasonry({ items }: { items: GalleryItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const reduced = useReducedMotion();

  if (!items.length)
    return (
      <p className="max-w-[44ch] text-fg-muted">
        La galería está vacía por ahora. Las fotos y videos de la próxima actividad aparecerán aquí.
      </p>
    );

  return (
    <div ref={ref} className="relative">
      <PixelTrail color="#0b6b5a" />
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {items.map((g, i) => {
          const src = mediaUrl(g.file?.formats?.medium?.url ?? g.file?.url);
          const w = g.file?.width ?? 4;
          const h = g.file?.height ?? 3;
          return (
            <motion.figure
              key={g.documentId}
              initial={reduced ? false : { clipPath: 'inset(100% 0 0 0)', y: 24 }}
              animate={inView ? { clipPath: 'inset(0% 0 0 0)', y: 0 } : undefined}
              transition={{ duration: 1.2, ease: EASE.premium, delay: stagger(i % 10, 0.05) }}
              className="group relative overflow-hidden rounded-[4px] bg-[color-mix(in_oklab,var(--fg)_5%,var(--bg))]"
            >
              {g.type === 'Video' && g.videoUrl ? (
                <a
                  href={g.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="Ver el video"
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
                  <span className="ui-label absolute right-3 bottom-3 rounded-full bg-ink/85 px-2.5 py-1 text-paper">
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
                    className="object-cover transition-transform duration-[1.4s] ease-(--ease-out-premium) group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}
              {(g.title || g.date) && (
                <figcaption className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                  <span className="ui-label truncate text-fg">{g.title}</span>
                  <span className="mono-label text-fg-muted">{formatDateShort(g.date)}</span>
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
      <circle cx="20" cy="20" r="19" fill="none" stroke="var(--fg)" strokeWidth="1" />
      <path d="M16 13 L28 20 L16 27 Z" fill="var(--fg)" />
    </svg>
  );
}

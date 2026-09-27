'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { PixelTrail } from './PixelTrail';
import { ScrollExpand } from '@/components/ui/ScrollExpand';
import { mediaUrl } from '@/lib/api';
import { formatDate, formatDateShort, videoThumbnail } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, stagger } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { GalleryItem } from '@/lib/types';

/** Imagen de un ítem: la foto subida o, si es video, la miniatura del proveedor. */
function imageOf(g: GalleryItem) {
  const own = mediaUrl(g.file?.formats?.medium?.url ?? g.file?.url);
  if (own) return { src: own, w: g.file?.width ?? 4, h: g.file?.height ?? 3, remote: false };
  const thumb = g.type === 'Video' ? videoThumbnail(g.videoUrl) : null;
  return thumb ? { src: thumb, w: 16, h: 9, remote: true } : null;
}

interface Props {
  items: GalleryItem[];
  /** Portada: abre el capítulo con el primer ítem a pantalla completa (ScrollExpand). */
  opener?: boolean;
}

/**
 * Lo que quedó en fotos. En la portada, el primer ítem entra en un marco que se abre con el
 * scroll hasta ocupar toda la pantalla (React Bits `ScrollExpand`); debajo, masonry por columnas
 * con reveal de máscara ascendente y stagger irregular. Los videos muestran su miniatura.
 * Estela de píxeles violeta (con filtro gooey) tras el cursor, solo aquí.
 */
export function GalleryMasonry({ items, opener }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const reduced = useReducedMotion();

  if (!items.length)
    return (
      <p className="container-x max-w-[44ch] text-fg-muted">
        La galería está vacía por ahora. Las fotos y videos de la próxima actividad aparecerán aquí.
      </p>
    );

  const featuredIndex = opener ? items.findIndex((g) => imageOf(g)) : -1;
  const featured = featuredIndex >= 0 ? items[featuredIndex] : null;
  const rest = featured ? items.filter((_, i) => i !== featuredIndex) : items;

  return (
    <div>
      {featured && <Opener item={featured} />}

      {rest.length > 0 && (
        <div ref={ref} className={cn('relative', opener && 'container-x mt-10 md:mt-14')}>
          <PixelTrail color="#7c5ae0" gooey />
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
            {rest.map((g, i) => {
              const img = imageOf(g);
              const isVideo = g.type === 'Video' && g.videoUrl;
              return (
                <motion.figure
                  key={g.documentId}
                  initial={reduced ? false : { clipPath: 'inset(100% 0 0 0)', y: 24 }}
                  animate={inView ? { clipPath: 'inset(0% 0 0 0)', y: 0 } : undefined}
                  transition={{ duration: 1.2, ease: EASE.premium, delay: stagger(i % 10, 0.05) }}
                  className="group relative overflow-hidden rounded-[4px] bg-[color-mix(in_oklab,var(--fg)_5%,var(--bg))]"
                >
                  {isVideo ? (
                    <a
                      href={g.videoUrl!}
                      target="_blank"
                      rel="noopener noreferrer"

                      className="relative block aspect-video"
                    >
                      {img ? (
                        <Image
                          src={img.src}
                          alt={g.title ?? ''}
                          fill
                          sizes="(min-width:1024px) 25vw, 50vw"
                          className="object-cover transition-transform duration-[1.4s] ease-(--ease-out-premium) group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center">
                          <PlayGlyph />
                        </span>
                      )}
                      <span className="absolute inset-0 bg-gradient-to-t from-dusk/70 to-transparent opacity-80" />
                      <span className="absolute bottom-3 left-3 flex items-center gap-2 text-paper">
                        <PlayGlyph small />
                        <span className="ui-label">video</span>
                      </span>
                    </a>
                  ) : img ? (
                    <div className="relative" style={{ aspectRatio: `${img.w} / ${img.h}` }}>
                      <Image
                        src={img.src}
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
      )}
    </div>
  );
}

/** Marco que se abre: foto o miniatura del video, con el título del ítem en Fraunces. */
function Opener({ item }: { item: GalleryItem }) {
  const img = imageOf(item)!;
  const isVideo = item.type === 'Video' && item.videoUrl;
  return (
    <ScrollExpand
      title={item.title ?? 'Galería'}
      scrollHint="Sigue bajando para abrir el marco"
      media={
        <Image
          src={img.src}
          alt={item.file?.alternativeText ?? item.title ?? ''}
          fill
          priority={false}
          sizes="100vw"
          className="object-cover"
        />
      }
    >
      <div className="container-x w-full text-paper">
        <p className="mono-label text-paper/70">
          {formatDate(item.date)}
          {item.relatedActivity?.title ? ` · ${item.relatedActivity.title}` : ''}
        </p>
        <p
          className="mt-2 max-w-[22ch] font-display text-[clamp(1.6rem,3.6vw,3rem)] leading-[1.02]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50, 'WONK' 1" }}
        >
          {item.title}
        </p>
        {isVideo && (
          <a
            href={item.videoUrl!}
            target="_blank"
            rel="noopener noreferrer"

            className="ui-label mt-5 inline-flex items-center gap-2 rounded-full border border-paper/40 px-4 py-2 text-paper transition-[background-color,border-color,color] duration-300 hover:border-lilac-2 hover:bg-lilac-2 hover:text-lilac-3"
          >
            <PlayGlyph small /> Ver el video completo
          </a>
        )}
      </div>
    </ScrollExpand>
  );
}

function PlayGlyph({ small }: { small?: boolean }) {
  const s = small ? 18 : 40;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden>
      <circle
        cx="20"
        cy="20"
        r="19"
        fill="none"
        stroke="currentColor"
        strokeWidth={small ? 2 : 1}
      />
      <path d="M16 13 L28 20 L16 27 Z" fill="currentColor" />
    </svg>
  );
}

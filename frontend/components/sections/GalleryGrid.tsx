'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'motion/react';
import { PlayIcon } from '@phosphor-icons/react/dist/ssr';
import { Lightbox, type LightboxItem } from '@/components/ui/Lightbox';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

export interface GridItem extends LightboxItem {
  /** Fecha corta para el pie de la miniatura ("14 oct 2022"). */
  shortDate?: string | null;
  isVideo: boolean;
}

/**
 * Mosaico de la galería (DESIGN_NOTES §28.4, fase 5): cada pieza entra con la cortina de siempre
 * (`data-reveal-stagger="clip"`) y ahora se abre en el visor: la foto crece desde su lugar hasta
 * llenar la pantalla; los videos se reproducen ahí mismo en vez de abrir otra pestaña.
 */
export function GalleryGrid({ items, className }: { items: GridItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();

  return (
    <>
      <div
        data-reveal-stagger="clip"
        className={cn(
          'columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid',
          className
        )}
      >
        {items.map((g, i) => (
          <figure
            key={g.id}
            className="group relative overflow-hidden rounded-[8px] bg-white shadow-[0_0_0_1px_var(--rule)]"
          >
            <button
              type="button"
              className="gallery-thumb"
              onClick={() => setOpen(i)}
              aria-label={`${g.isVideo ? 'Reproducir el video' : 'Ampliar la foto'}${g.title ? ` «${g.title}»` : ''}`}
            >
              <motion.div
                layoutId={reduced ? undefined : `gal-${g.id}`}
                className="relative overflow-hidden"
                style={{ aspectRatio: g.isVideo ? '16 / 9' : `${g.w} / ${g.h}` }}
                transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
              >
                {g.thumb ? (
                  <Image
                    src={g.thumb}
                    alt={g.alt}
                    fill
                    sizes="(min-width:1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[1.4s] ease-(--ease-out-premium) group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="absolute inset-0 bg-paper-2" />
                )}
                {g.isVideo && (
                  <span aria-hidden className="gallery-thumb__play">
                    <PlayIcon weight="fill" />
                  </span>
                )}
                <span aria-hidden className="gallery-thumb__zoom" />
              </motion.div>
            </button>
            {(g.title || g.shortDate) && (
              <figcaption className="gallery-cap">
                {g.shortDate && <span className="gallery-cap__date">{g.shortDate}</span>}
                {g.title && <span className="gallery-cap__title">{g.title}</span>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      <Lightbox items={items} index={open} onIndex={setOpen} prefix="gal" />
    </>
  );
}

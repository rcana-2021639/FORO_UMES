'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Lightbox, type LightboxItem } from '@/components/ui/Lightbox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Fotos de una actividad, en el costado de su página: cada miniatura se abre en el visor (la foto
 * crece desde su lugar), con flechas para recorrerlas.
 */
export function ActivityGallery({ items }: { items: LightboxItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();
  return (
    <>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {items.map((g, i) => (
          <li key={g.id}>
            <button
              type="button"
              className="gallery-thumb rounded-[6px] overflow-hidden"
              onClick={() => setOpen(i)}
              aria-label={`Ampliar la foto${g.title ? ` «${g.title}»` : ''}`}
            >
              <motion.div
                layoutId={reduced ? undefined : `act-gal-${g.id}`}
                className="relative aspect-square overflow-hidden bg-paper-2"
                transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
              >
                {g.thumb && (
                  <Image src={g.thumb} alt={g.alt} fill sizes="120px" className="object-cover" />
                )}
                <span aria-hidden className="gallery-thumb__zoom" />
              </motion.div>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox items={items} index={open} onIndex={setOpen} prefix="act-gal" />
    </>
  );
}

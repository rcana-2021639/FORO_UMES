import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ImageSquareIcon, PlayCircleIcon } from '@phosphor-icons/react/dist/ssr';

export interface FanPhoto {
  id: string;
  src: string;
  alt: string;
}

/**
 * Cabecera de /galeria (DESIGN_NOTES §28.4, fase 5): cuatro fotos apiladas que se abren en abanico
 * al llegar y se separan un poco más al pasar el cursor, con cuántas fotos y videos guarda el
 * archivo. Solo transformaciones en CSS (`.photo-fan`).
 */
export function PhotoFan({
  photos,
  counts,
}: {
  photos: FanPhoto[];
  counts: { photos: number; videos: number };
}) {
  return (
    <figure className="photo-fan" aria-label="Algunas fotos del archivo">
      <div className="photo-fan__stack">
        {photos.slice(0, 4).map((p, i) => (
          <span key={p.id} className="photo-fan__card" style={{ '--i': i } as CSSProperties}>
            <Image src={p.src} alt={p.alt} fill sizes="240px" className="object-cover" />
          </span>
        ))}
      </div>
      <figcaption className="photo-fan__cap">
        <span>
          <ImageSquareIcon aria-hidden weight="duotone" /> <b>{counts.photos}</b> fotos
        </span>
        <span>
          <PlayCircleIcon aria-hidden weight="duotone" /> <b>{counts.videos}</b> videos
        </span>
      </figcaption>
    </figure>
  );
}

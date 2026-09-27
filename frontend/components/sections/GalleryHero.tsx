'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuality } from '@/lib/quality';
import { cn } from '@/lib/cn';
import type { MorphItem } from './MorphSlider';

const MorphSlider = dynamic(() => import('./MorphSlider').then((m) => m.MorphSlider), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-[6px] bg-dusk" aria-hidden />,
});

/**
 * Cabecera de /galeria. En modo completo, el deslizador WebGL ("melt"); en modo liviano, las
 * mismas imágenes con un fundido encadenado (solo opacidad), sin contexto WebGL.
 */
export function GalleryHero({ items }: { items: MorphItem[] }) {
  const lite = useQuality() !== 'full';
  return (
    <div className="aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
      {lite ? <FadeSlider items={items} /> : <MorphSlider items={items} className="h-full" />}
    </div>
  );
}

function FadeSlider({ items }: { items: MorphItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % items.length), 5500);
    return () => window.clearInterval(id);
  }, [paused, items.length]);

  const current = items[i];
  return (
    <div
      className="relative h-full overflow-hidden rounded-[6px] bg-dusk"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {items.map((it, n) => (
        <Image
          key={it.image}
          src={it.image}
          alt=""
          fill
          sizes="100vw"
          priority={n === 0}
          className={cn(
            'object-cover transition-opacity duration-[1200ms] ease-(--ease-snap)',
            n === i ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dusk/80 via-transparent to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-paper md:p-8">
        {current?.caption &&
          (current.href ? (
            <Link
              href={current.href}
              className="font-display text-[1.4rem] underline-offset-4 hover:underline"
            >
              {current.caption}
            </Link>
          ) : (
            <p className="font-display text-[1.4rem]">{current.caption}</p>
          ))}
        <div className="flex gap-2" role="tablist" aria-label="Imágenes">
          {items.map((it, n) => (
            <button
              key={it.image}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={`Imagen ${n + 1}`}
              onClick={() => setI(n)}
              className={cn(
                'h-2 rounded-full transition-[width,background-color] duration-500',
                n === i ? 'w-8 bg-paper' : 'w-2 bg-paper/40 hover:bg-paper/70'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

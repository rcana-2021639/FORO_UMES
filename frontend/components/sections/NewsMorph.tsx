'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { mediaUrl } from '@/lib/api';
import { excerpt, formatDate } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import type { NewsItem } from '@/lib/types';

/**
 * Capítulo 07 · Noticias. Scale/morph ligado al scroll (scroll anim #6, Motion useScroll +
 * useTransform): la tarjeta central crece hasta 1 y las laterales rotan y se separan según
 * el progreso del scroll de la sección.
 */
export function NewsMorph({ news }: { news: NewsItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'end 40%'] });

  const [a, b, c] = news;
  return (
    <div ref={ref} className="grid gap-5 md:grid-cols-12 md:items-stretch">
      {!a && <p className="text-fg-muted md:col-span-12">Aún no hay noticias publicadas.</p>}
      {b && (
        <Card
          item={b}
          progress={scrollYProgress}
          side="left"
          reduced={reduced}
          className="md:col-span-3"
        />
      )}
      {a && (
        <Card
          item={a}
          progress={scrollYProgress}
          side="center"
          reduced={reduced}
          className="md:col-span-6"
          featured
        />
      )}
      {c && (
        <Card
          item={c}
          progress={scrollYProgress}
          side="right"
          reduced={reduced}
          className="md:col-span-3"
        />
      )}
    </div>
  );
}

function Card({
  item,
  progress,
  side,
  reduced,
  className,
  featured,
}: {
  item: NewsItem;
  progress: MotionValue<number>;
  side: 'left' | 'center' | 'right';
  reduced: boolean;
  className?: string;
  featured?: boolean;
}) {
  const dir = side === 'left' ? -1 : side === 'right' ? 1 : 0;
  const scale = useTransform(progress, [0, 1], side === 'center' ? [0.88, 1] : [1, 0.94]);
  const rotate = useTransform(progress, [0, 1], [0, dir * 3]);
  const y = useTransform(progress, [0, 1], side === 'center' ? [60, 0] : [0, 40]);
  const x = useTransform(progress, [0, 1], [0, dir * 14]);
  const cover = mediaUrl(item.coverImage?.formats?.medium?.url ?? item.coverImage?.url);

  return (
    <motion.article
      style={reduced ? undefined : { scale, rotate, y, x }}
      className={cn('will-change-transform', className)}
    >
      <Link
        href={`/noticias/${item.documentId}`}
        data-cursor="Leer"
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-[3px] border border-line bg-bg transition-[border-color] duration-500 hover:border-fg/40'
        )}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden bg-paper-2',
            featured ? 'aspect-[16/9]' : 'aspect-[4/3]'
          )}
        >
          {cover ? (
            <Image
              src={cover}
              alt={item.coverImage?.alternativeText ?? ''}
              fill
              sizes={featured ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 100vw'}
              className="object-cover transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-[1.04]"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-0 grid place-items-center font-display text-[4rem] text-fg-muted/30"
              style={{ fontVariationSettings: "'opsz' 144, 'WONK' 1" }}
            >
              F
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5 md:p-6">
          <span className="mono-label text-fg-muted">{formatDate(item.publishedAt)}</span>
          <h3
            className={cn(
              'mt-3 text-fg',
              featured ? 'text-[clamp(1.5rem,2.6vw,2.2rem)]' : 'text-[1.2rem]'
            )}
          >
            {item.title}
          </h3>
          {featured && item.summary && (
            <p className="mt-4 max-w-[58ch] leading-relaxed text-fg-muted">
              {excerpt(item.summary, 200)}
            </p>
          )}
          <span className="mono-label mt-auto pt-6 text-jade">Leer noticia →</span>
        </div>
      </Link>
    </motion.article>
  );
}

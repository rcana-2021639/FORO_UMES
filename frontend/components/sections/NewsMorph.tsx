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
 * Noticias del Foro. Sin marcos: la imagen manda y el texto cuelga debajo como pie de foto
 * editorial. Scale/morph ligado al scroll (scroll anim #6): la nota principal enfoca (escala
 * y blur → nítida) y las laterales rotan y se separan según el progreso de la sección.
 */
export function NewsMorph({ news }: { news: NewsItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 92%', 'end 45%'] });

  const [a, b, c] = news;
  return (
    <div ref={ref} className="grid gap-x-6 gap-y-10 md:grid-cols-12 md:items-end">
      {!a && (
        <p className="max-w-[44ch] text-fg-muted md:col-span-12">
          Todavía no hay noticias publicadas. La primera que salga del panel aparecerá aquí.
        </p>
      )}
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
  const scale = useTransform(progress, [0, 1], side === 'center' ? [0.9, 1] : [1, 0.95]);
  const rotate = useTransform(progress, [0, 1], [0, dir * 2.5]);
  const y = useTransform(progress, [0, 1], side === 'center' ? [70, 0] : [0, 36]);
  const x = useTransform(progress, [0, 1], [0, dir * 18]);
  const blur = useTransform(progress, [0, 0.6, 1], side === 'center' ? [6, 0, 0] : [0, 0, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const cover = mediaUrl(item.coverImage?.formats?.medium?.url ?? item.coverImage?.url);

  return (
    <motion.article
      style={reduced ? undefined : { scale, rotate, y, x, filter }}
      className={cn('will-change-transform', className)}
    >
      <Link
        href={`/noticias/${item.documentId}`}
        data-cursor="Leer la nota"
        className="group block"
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-[4px] bg-[color-mix(in_oklab,var(--fg)_6%,var(--bg))]',
            featured ? 'aspect-[16/9]' : 'aspect-[4/3]'
          )}
        >
          {cover ? (
            <Image
              src={cover}
              alt={item.coverImage?.alternativeText ?? ''}
              fill
              sizes={featured ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 100vw'}
              className="object-cover transition-transform duration-[1.4s] ease-(--ease-out-premium) group-hover:scale-[1.04]"
            />
          ) : (
            <Seal />
          )}
          {/* Velo jade que se retira al hover, como levantar una hoja */}
          <span
            aria-hidden
            className="absolute inset-0 origin-bottom bg-[color-mix(in_oklab,var(--color-jade)_18%,transparent)] transition-transform duration-700 ease-(--ease-cinematic) group-hover:scale-y-0"
          />
        </div>
        <div className={cn('pt-4', featured && 'md:grid md:grid-cols-6 md:gap-6')}>
          <p className={cn('mono-label text-fg-muted', featured && 'md:col-span-2')}>
            {formatDate(item.publishedAt)}
          </p>
          <div className={cn(featured && 'md:col-span-4')}>
            <h3
              className={cn(
                'text-fg underline decoration-transparent decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-500 group-hover:decoration-[color:var(--accent-jade)]',
                featured ? 'text-[clamp(1.6rem,2.8vw,2.4rem)]' : 'mt-2 text-[1.2rem] md:mt-0'
              )}
            >
              {item.title}
            </h3>
            {featured && item.summary && (
              <p className="mt-4 max-w-[58ch] leading-relaxed text-fg-muted">
                {excerpt(item.summary, 200)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/** Placeholder sin foto: el anillo de la mesa, no una letra suelta. */
function Seal() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r="22"
        fill="none"
        stroke="var(--fg)"
        strokeWidth="0.4"
        opacity="0.35"
      />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={50 + 22 * Math.cos(a)}
            cy={50 + 22 * Math.sin(a)}
            r="1.4"
            fill="var(--fg)"
            opacity="0.5"
          />
        );
      })}
    </svg>
  );
}

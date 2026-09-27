'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { FoldText } from '@/components/fx/FoldText';
import { Tilt } from '@/components/fx/Tilt';
import { mediaUrl } from '@/lib/api';
import { excerpt, formatDate, folio } from '@/lib/format';
import { useReducedMotion, useFinePointer } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { useQuality } from '@/lib/quality';
import type { NewsItem } from '@/lib/types';

const ElasticMesh = dynamic(
  () => import('@/components/fx/ElasticMesh').then((m) => m.ElasticMesh),
  {
    ssr: false,
  }
);

/**
 * Noticias del Foro. La última nota manda: su portada es una malla elástica (React Bits
 * `ElasticMesh`) que se hunde y rebota bajo el puntero, con el título desplegándose (FoldText).
 * Las dos anteriores son losas que se inclinan (Tilt) y entran con el scroll. Cada nota lleva
 * su folio (01, 02, 03) y su fecha para que se entienda que es una lista de lo más reciente.
 */
export function NewsMorph({ news }: { news: NewsItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const quality = useQuality();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 92%', 'end 45%'] });

  const [a, b, c] = news;
  if (!a)
    return (
      <p className="max-w-[44ch] text-fg-muted">
        Todavía no hay noticias publicadas. La primera que salga del panel aparecerá aquí.
      </p>
    );

  return (
    <div ref={ref} className="grid gap-x-6 gap-y-10 lg:grid-cols-12 [perspective:1600px]">
      <Featured
        item={a}
        progress={scrollYProgress}
        reduced={reduced}
        elastic={fine && !reduced && quality === 'full' && !!a.coverImage}
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
        {b && <Side item={b} index={2} progress={scrollYProgress} reduced={reduced} />}
        {c && <Side item={c} index={3} progress={scrollYProgress} reduced={reduced} />}
      </div>
    </div>
  );
}

function Featured({
  item,
  progress,
  reduced,
  elastic,
}: {
  item: NewsItem;
  progress: MotionValue<number>;
  reduced: boolean;
  elastic: boolean;
}) {
  const y = useTransform(progress, [0, 1], [80, 0]);
  const rotateX = useTransform(progress, [0, 1], [14, 0]);
  const scale = useTransform(progress, [0, 1], [0.94, 1]);
  const cover = mediaUrl(item.coverImage?.formats?.large?.url ?? item.coverImage?.url);
  const thumb = mediaUrl(item.coverImage?.formats?.medium?.url ?? item.coverImage?.url);

  return (
    <motion.article
      style={reduced ? undefined : { y, rotateX, scale, transformOrigin: '50% 100%' }}
      className="group relative lg:col-span-8 [transform-style:preserve-3d]"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="ui-label inline-flex items-center gap-2 rounded-full bg-fg px-3 py-1 text-bg">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
          Última publicación
        </span>
        <span className="mono-label text-fg-muted">
          {folio(1)} · {formatDate(item.publishedAt)}
        </span>
      </div>

      <Tilt max={5} scale={1.01} className="rounded-[16px]" glare={false}>
        <Link
          href={`/noticias/${item.documentId}`}
          className="relative block aspect-[16/9] overflow-hidden rounded-[16px] border border-line bg-surface-2 shadow-[0_40px_80px_-40px_rgb(var(--shadow-ink)/0.5)]"
        >
          {elastic ? (
            <div className="absolute inset-0">
              <ElasticMesh
                image={cover ?? ''}
                color1="#6443c4"
                color2="#7c5ae0"
                highlight="#fdfcff"
                showGrid={!cover}
                gridDensity={18}
                gridOpacity={0.18}
                gridColor="#fdfcff"
                borderRadius={0}
                tilt={0}
                shading={0.45}
                resolution={22}
                interaction="hover"
                stiffness={0.06}
                damping={0.18}
                grabRadius={0.5}
                pull={0.35}
                wobble={4}
              />
            </div>
          ) : thumb ? (
            <Image
              src={thumb}
              alt={item.coverImage?.alternativeText ?? ''}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span aria-hidden className="news-cover absolute inset-0" />
          )}
          {/* Scrim y texto: sin eventos, para que el puntero llegue a la malla */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dusk/85 via-dusk/20 to-transparent"
          />
          <span className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6 text-paper md:p-9">
            <h3
              className="max-w-[20ch] text-[clamp(1.7rem,3.4vw,3rem)] leading-[1.02] text-paper"
              style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 40, 'WONK' 1" }}
            >
              <FoldText text={item.title} splitBy="word" hinge="bottom" stagger={0.06} />
            </h3>
            {item.summary && (
              <span className="mt-3 block max-w-[58ch] text-[0.98rem] leading-relaxed text-paper/80">
                {excerpt(item.summary, 180)}
              </span>
            )}
            <span className="ui-label mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-paper/40 px-4 py-2 text-paper transition-[background-color,color,border-color] duration-300 group-hover:border-clay group-hover:bg-clay group-hover:text-ink">
              Leer la nota <span aria-hidden>→</span>
            </span>
          </span>
        </Link>
      </Tilt>
      <p className="ui-label mt-3 text-fg-muted">
        {elastic ? 'Mueve el cursor sobre la portada: es una superficie elástica.' : ''}
      </p>
    </motion.article>
  );
}

function Side({
  item,
  index,
  progress,
  reduced,
}: {
  item: NewsItem;
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const y = useTransform(progress, [0, 1], [50 + index * 20, 0]);
  const rotateY = useTransform(progress, [0, 1], [-18, 0]);
  const opacity = useTransform(progress, [0, 0.5, 1], [0, 0.8, 1]);
  const cover = mediaUrl(item.coverImage?.formats?.medium?.url ?? item.coverImage?.url);
  return (
    <motion.article
      style={reduced ? undefined : { y, rotateY, opacity, transformOrigin: '0% 50%' }}
      className="[transform-style:preserve-3d]"
    >
      <Tilt max={9} scale={1.03} className="rounded-[12px]">
        <Link
          href={`/noticias/${item.documentId}`}
          className="group relative block overflow-hidden rounded-[12px] border border-line bg-surface-1 [transform-style:preserve-3d]"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
            {cover ? (
              <Image
                src={cover}
                alt={item.coverImage?.alternativeText ?? ''}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover transition-transform duration-[1.4s] ease-(--ease-out-premium) group-hover:scale-[1.06]"
              />
            ) : (
              <Seal />
            )}
            <span
              aria-hidden
              className="absolute inset-0 origin-bottom bg-[color-mix(in_oklab,var(--color-sage)_22%,transparent)] transition-transform duration-700 ease-(--ease-cinematic) group-hover:scale-y-0"
            />
            <span className="mono-label absolute top-3 left-3 rounded-full bg-bg/85 px-2 py-0.5 text-fg backdrop-blur-sm">
              {folio(index)}
            </span>
          </div>
          <div className="p-4 md:p-5" data-depth style={{ '--z': 20 } as React.CSSProperties}>
            <p className="mono-label text-fg-muted">{formatDate(item.publishedAt)}</p>
            <h3
              className={cn(
                'mt-2 text-[1.2rem] leading-[1.15] text-fg underline decoration-transparent decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-500 group-hover:decoration-[color:var(--accent-sage)]'
              )}
              style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 30" }}
            >
              {item.title}
            </h3>
            <span className="ui-label mt-3 inline-flex items-center gap-2 text-fg-muted transition-colors duration-300 group-hover:text-fg">
              Leer{' '}
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </div>
        </Link>
      </Tilt>
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

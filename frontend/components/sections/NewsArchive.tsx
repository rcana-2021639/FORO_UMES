'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useRef, ViewTransition, type RefObject } from 'react';
import { FoldText } from '@/components/fx/FoldText';
import { Tilt } from '@/components/fx/Tilt';
import { DepthText } from '@/components/fx/DepthText';
import { mediaUrl, sameOriginImage } from '@/lib/api';
import { excerpt, formatDate, folio } from '@/lib/format';
import { useFinePointer, useReducedMotion } from '@/hooks/useReducedMotion';
import { useQuality } from '@/lib/quality';
import type { NewsItem } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';

const ElasticMesh = dynamic(
  () => import('@/components/fx/ElasticMesh').then((m) => m.ElasticMesh),
  {
    ssr: false,
  }
);

interface Props {
  news: NewsItem[];
  page: number;
  pageCount: number;
}

/**
 * Archivo de noticias. En la primera página, la nota más reciente abre a lo grande con su portada
 * como malla elástica (ElasticMesh) y el título desplegándose; el resto son losas que entran
 * girando (rotateX) con stagger y se inclinan con el puntero (Tilt). Cada nota lleva folio y
 * fecha; la paginación va al pie con los mismos boletos.
 */
export function NewsArchive({ news, page, pageCount }: Props) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const quality = useQuality();
  const [first, ...rest] = news;
  const featured = page === 1 ? first : null;
  const grid = page === 1 ? rest : news;
  const offset = (page - 1) * 12;
  const gridRef = useRef<HTMLUListElement>(null);
  usePhotoPan(gridRef, fine && !reduced && quality !== 'still');

  if (!news.length)
    return (
      <p className="max-w-[44ch] text-fg-muted">
        Todavía no hay noticias publicadas. La primera que salga del panel aparecerá aquí.
      </p>
    );

  return (
    <div className="space-y-14">
      {featured && (
        <Featured
          item={featured}
          elastic={fine && !reduced && quality === 'full' && !!featured.coverImage}
        />
      )}

      <ul
        ref={gridRef}
        data-reveal-stagger="tilt"
        className="clips grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
      >
        {grid.map((n, i) => (
          <Card key={n.documentId} item={n} n={offset + i + (featured ? 2 : 1)} />
        ))}
      </ul>

      {pageCount > 1 && (
        <nav
          aria-label="Paginación"
          className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8"
        >
          {page > 1 ? (
            <Link
              href={`/noticias?pagina=${page - 1}`}
              className="ui-label inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-fg transition-[background-color,color,border-color] duration-300 hover:border-fg hover:bg-fg hover:text-bg"
            >
              ‹ Más recientes
            </Link>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-3">
            <span className="ui-label text-fg-muted">Página</span>
            <DepthText
              text={String(page)}
              layers={10}
              depth={1}
              fontSize="1.8rem"
              tilt={7}
              depthColor="var(--accent-sage)"
              fontVariationSettings="'opsz' 32, 'WONK' 1"
            />
            <span className="ui-label text-fg-muted">de {pageCount}</span>
          </span>
          {page < pageCount ? (
            <Link
              href={`/noticias?pagina=${page + 1}`}
              className="ui-label inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-fg transition-[background-color,color,border-color] duration-300 hover:border-fg hover:bg-fg hover:text-bg"
            >
              Anteriores ›
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

function Featured({ item, elastic }: { item: NewsItem; elastic: boolean }) {
  const cover = mediaUrl(item.coverImage?.formats?.large?.url ?? item.coverImage?.url);
  const thumb = mediaUrl(item.coverImage?.formats?.medium?.url ?? item.coverImage?.url);
  return (
    <article data-reveal="tilt" className="group [perspective:1600px]">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-[4px] bg-fg px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.08em] text-bg uppercase">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
          La más reciente
        </span>
        <span className="mono-label text-fg-muted">
          {folio(1)} · {formatDate(item.publishedAt)}
        </span>
      </div>
      <Tilt max={4} scale={1.005} glare={false} className="rounded-[12px]">
        {/* Al abrir la nota, esta portada viaja hasta la cabecera del artículo */}
        <ViewTransition
          name={`news-${item.documentId}`}
          share={{ 'news-card': 'news-morph', default: 'none' }}
          default="none"
        >
          <Link
            href={`/noticias/${item.documentId}`}
            transitionTypes={['news-card']}
            className="relative block aspect-[4/5] overflow-hidden rounded-[12px] border border-line bg-surface-2 shadow-[0_50px_90px_-45px_rgb(var(--shadow-ink)/0.55)] sm:aspect-[16/9] md:aspect-[21/9]"
          >
            {elastic ? (
              <div className="absolute inset-0">
                <ElasticMesh
                  image={sameOriginImage(cover)}
                  color1="#6443c4"
                  color2="#7c5ae0"
                  highlight="#fdfcff"
                  showGrid={!cover}
                  gridDensity={20}
                  gridOpacity={0.16}
                  gridColor="#fdfcff"
                  borderRadius={0}
                  tilt={0}
                  shading={0.45}
                  resolution={24}
                  interaction="hover"
                  stiffness={0.06}
                  damping={0.18}
                  grabRadius={0.45}
                  pull={0.32}
                  wobble={4}
                  fit={1.06}
                />
              </div>
            ) : thumb ? (
              <Image
                src={thumb}
                alt={item.coverImage?.alternativeText || item.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            ) : (
              <span aria-hidden className="news-cover absolute inset-0" />
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dusk/85 via-dusk/25 to-transparent"
            />
            <span className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6 text-paper md:p-10">
              <h2
                className="max-w-[22ch] text-[clamp(1.8rem,3.8vw,3.4rem)] leading-[1.02] text-paper"
                style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 40, 'WONK' 1" }}
              >
                <FoldText
                  text={item.title}
                  splitBy="word"
                  hinge="bottom"
                  trigger="mount"
                  stagger={0.06}
                  delay={0.4}
                />
              </h2>
              {item.summary && (
                <span className="mt-3 block max-w-[60ch] text-[0.98rem] leading-relaxed text-paper/80">
                  {excerpt(item.summary, 200)}
                </span>
              )}
              <span className="ui-label mt-5 inline-flex w-fit items-center gap-2 rounded-[6px] border border-paper/40 px-4 py-2 font-semibold text-paper transition-[background-color,color,border-color] duration-300 group-hover:border-clay group-hover:bg-clay group-hover:text-ink">
                Leer la nota <Arrow />
              </span>
            </span>
          </Link>
        </ViewTransition>
      </Tilt>
    </article>
  );
}

function Card({ item, n }: { item: NewsItem; n: number }) {
  const cover = mediaUrl(item.coverImage?.formats?.medium?.url ?? item.coverImage?.url);
  return (
    <li className="clip-li" style={{ '--tilt': `${n % 2 ? -0.7 : 0.6}deg` } as React.CSSProperties}>
      <Link href={`/noticias/${item.documentId}`} transitionTypes={['news-card']} className="clip">
        <span aria-hidden className="clip__tape" />
        <p className="clip__dateline">
          <span>N.º {folio(n)}</span>
          <span>{formatDate(item.publishedAt)}</span>
        </p>
        <ViewTransition
          name={`news-${item.documentId}`}
          share={{ 'news-card': 'news-morph', default: 'none' }}
          default="none"
        >
          <div className="clip__photo">
            {cover ? (
              <span className="clip__pan">
                <Image
                  src={cover}
                  alt={item.coverImage?.alternativeText || item.title}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="clip__img"
                />
              </span>
            ) : (
              <span aria-hidden className="clip__blank">
                F
              </span>
            )}
            {/* La foto "impresa" en trama de puntos; al tomar el recorte, se revela a color */}
            <span aria-hidden className="clip__screen" />
          </div>
        </ViewTransition>
        <div className="clip__body">
          <h2 className="clip__title">
            <span>{item.title}</span>
            <svg aria-hidden className="clip__under" viewBox="0 0 200 8" preserveAspectRatio="none">
              <path pathLength={1} d="M2 5.2C40 2.6 88 6.4 132 3.8 158 2.4 180 4.6 198 3.4" />
            </svg>
          </h2>
          {item.summary && <p className="clip__summary">{excerpt(item.summary, 120)}</p>}
          <span className="clip__read">
            Leer la nota <Arrow />
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * Con el cursor sobre un recorte, su foto se desplaza un poco hacia el lado contrario (paralaje en
 * 2D: el texto nunca se inclina, así que se ve nítido). Un solo listener para toda la rejilla y
 * como mucho una escritura de `translate` por fotograma, solo en la foto bajo el cursor.
 */
function usePhotoPan(ref: RefObject<HTMLElement | null>, on: boolean) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !on) return;
    let frame = 0;
    let target: HTMLElement | null = null;
    let pan: HTMLElement | null = null;
    let point = { x: 0, y: 0 };
    const reset = () => {
      pan?.style.removeProperty('translate');
      target = null;
      pan = null;
    };
    const apply = () => {
      frame = 0;
      if (!target || !pan) return;
      const r = target.getBoundingClientRect();
      const px = (point.x - r.left) / r.width - 0.5;
      const py = (point.y - r.top) / r.height - 0.5;
      pan.style.translate = `${(px * -14).toFixed(1)}px ${(py * -10).toFixed(1)}px`;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const card = (e.target as HTMLElement).closest<HTMLElement>('.clip');
      if (card !== target) {
        reset();
        target = card;
        pan = card?.querySelector<HTMLElement>('.clip__pan') ?? null;
      }
      point = { x: e.clientX, y: e.clientY };
      if (target && !frame) frame = requestAnimationFrame(apply);
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', reset);
    return () => {
      cancelAnimationFrame(frame);
      reset();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', reset);
    };
  }, [ref, on]);
}

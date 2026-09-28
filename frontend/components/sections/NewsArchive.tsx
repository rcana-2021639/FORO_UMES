'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { FoldText } from '@/components/fx/FoldText';
import { Tilt } from '@/components/fx/Tilt';
import { DepthText } from '@/components/fx/DepthText';
import { mediaUrl, sameOriginImage } from '@/lib/api';
import { excerpt, formatDate, folio } from '@/lib/format';
import { useFinePointer, useReducedMotion } from '@/hooks/useReducedMotion';
import { useQuality } from '@/lib/quality';
import type { NewsItem } from '@/lib/types';

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
        data-reveal-stagger="tilt"
        className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 [perspective:1600px]"
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
        <span className="ui-label inline-flex items-center gap-2 rounded-full bg-fg px-3 py-1 text-bg">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
          La más reciente
        </span>
        <span className="mono-label text-fg-muted">
          {folio(1)} · {formatDate(item.publishedAt)}
        </span>
      </div>
      <Tilt max={4} scale={1.005} glare={false} className="rounded-[18px]">
        <Link
          href={`/noticias/${item.documentId}`}
          className="relative block aspect-[16/8] overflow-hidden rounded-[18px] border border-line bg-surface-2 shadow-[0_50px_90px_-45px_rgb(var(--shadow-ink)/0.55)] md:aspect-[21/9]"
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
              />
            </div>
          ) : thumb ? (
            <Image
              src={thumb}
              alt={item.coverImage?.alternativeText ?? ''}
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
            <span className="ui-label mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-paper/40 px-4 py-2 text-paper transition-[background-color,color,border-color] duration-300 group-hover:border-clay group-hover:bg-clay group-hover:text-ink">
              Leer la nota <span aria-hidden>→</span>
            </span>
          </span>
        </Link>
      </Tilt>
    </article>
  );
}

function Card({ item, n }: { item: NewsItem; n: number }) {
  const cover = mediaUrl(item.coverImage?.formats?.medium?.url ?? item.coverImage?.url);
  return (
    <li className="[transform-style:preserve-3d]">
      <Tilt max={9} scale={1.03} className="h-full rounded-[14px]">
        <Link
          href={`/noticias/${item.documentId}`}
          className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface-1 [transform-style:preserve-3d]"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
            {cover ? (
              <Image
                src={cover}
                alt={item.coverImage?.alternativeText ?? ''}
                fill
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1.4s] ease-(--ease-out-premium) group-hover:scale-[1.07]"
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
            <span
              aria-hidden
              className="absolute inset-0 origin-bottom bg-[color-mix(in_oklab,var(--color-lilac)_22%,transparent)] transition-transform duration-700 ease-(--ease-cinematic) group-hover:scale-y-0"
            />
            <span className="mono-label absolute top-3 left-3 rounded-full bg-bg/85 px-2 py-0.5 text-fg">
              {folio(n)}
            </span>
          </div>
          <div
            className="flex flex-1 flex-col p-5"
            data-depth
            style={{ '--z': 22 } as React.CSSProperties}
          >
            <p className="mono-label text-fg-muted">{formatDate(item.publishedAt)}</p>
            <h2
              className="mt-2 text-[1.3rem] leading-[1.15] text-fg underline decoration-transparent underline-offset-[5px] transition-[text-decoration-color] duration-500 group-hover:decoration-[color:var(--accent-sage)]"
              style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 30" }}
            >
              {item.title}
            </h2>
            {item.summary && (
              <p className="mt-2 text-[0.95rem] leading-relaxed text-fg-muted">
                {excerpt(item.summary, 120)}
              </p>
            )}
            <span className="ui-label mt-auto inline-flex items-center gap-2 pt-4 text-fg-muted transition-colors duration-300 group-hover:text-fg">
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
    </li>
  );
}

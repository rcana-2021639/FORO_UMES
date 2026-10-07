'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { mediaUrl, sameOriginImage } from '@/lib/api';
import { excerpt, formatDate, folio } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useQuality } from '@/lib/quality';
import { useNear } from '@/hooks/useNear';
import { webglAvailable } from '@/lib/webgl';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { NewsItem } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';

const ElasticMesh = dynamic(
  () => import('@/components/fx/ElasticMesh').then((m) => m.ElasticMesh),
  { ssr: false }
);

/** Degradados violeta para las notas sin portada: cada una se distingue de la anterior. */
const TONES: [string, string][] = [
  ['#4f339e', '#b8a2fa'],
  ['#3a2677', '#8e4fb8'],
  ['#4b4aa8', '#d7daff'],
  ['#7a3d8f', '#ebcff2'],
  ['#261a4f', '#7c5ae0'],
];

const CYCLE_MS = 7000;

/**
 * Noticias del Foro. A la izquierda, la portada de la nota activa es una tela elástica (React
 * Bits `ElasticMesh`): se hunde bajo el cursor, respira sola y, al cambiar de nota, la nueva
 * imagen se revela en círculo mientras la tela da un latido. A la derecha, el índice de notas:
 * pasar el cursor o el foco por una la muestra en la tela; sin tocar nada, avanzan solas.
 */
export function NewsMorph({ news }: { news: NewsItem[] }) {
  const items = news.slice(0, 4);
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const quality = useQuality();
  // La tela (WebGL) se monta al acercarse: al cargar, su malla, su textura y la prueba de WebGL
  // ocupaban el hilo principal aunque la sección estuviera muy abajo. Hasta entonces, la portada fija.
  const near = useNear(root);
  const elastic = near && quality === 'full' && !reduced && webglAvailable();

  // Solo avanza sola si se ve y nadie la está usando
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const cycling = inView && !hold && !reduced && items.length > 1;
  useEffect(() => {
    if (!cycling) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % items.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [cycling, active, items.length]);

  if (!items.length)
    return (
      <p className="max-w-[44ch] text-fg-muted">
        Todavía no hay noticias publicadas. La primera que salga del panel aparecerá aquí.
      </p>
    );

  const item = items[active];
  const tone = TONES[active % TONES.length];
  const cover = mediaUrl(item.coverImage?.formats?.large?.url ?? item.coverImage?.url);

  return (
    <div
      ref={root}
      className="news-stage grid gap-x-10 gap-y-12 lg:grid-cols-12"
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      <article data-reveal="tilt" className="lg:col-span-7">
        <Link
          href={`/noticias/${item.documentId}`}
          className="news-mesh group"
          aria-label={`Leer: ${item.title}`}
          tabIndex={-1}
        >
          <span aria-hidden className="news-mesh__shadow" />
          {elastic ? (
            <span className="absolute inset-0">
              <ElasticMesh
                image={sameOriginImage(cover)}
                color1={tone[0]}
                color2={tone[1]}
                highlight="#fdfcff"
                showGrid
                gridDensity={20}
                gridOpacity={cover ? 0.12 : 0.26}
                gridColor="#ffffff"
                borderRadius={26}
                tilt={12}
                shading={0.5}
                resolution={24}
                interaction="hover"
                stiffness={0.05}
                damping={0.2}
                grabRadius={0.6}
                pull={0.4}
                wobble={5}
                idle={1}
              />
            </span>
          ) : (
            <StaticCover items={items} active={active} />
          )}
          <span className="news-mesh__chip">
            <span aria-hidden className="news-mesh__live" />
            {active === 0 ? 'Última publicación' : `Nota ${folio(active + 1)}`}
          </span>
          {elastic && (
            <span aria-hidden className="news-mesh__hint">
              Mueve el cursor sobre la portada
            </span>
          )}
        </Link>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.documentId}
            initial={reduced ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduced ? undefined : { opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.55, ease: EASE.premium }}
            className="news-copy"
          >
            <p className="mono-label text-fg-muted">
              {folio(active + 1)} · {formatDate(item.publishedAt)}
            </p>
            <h3 className="news-copy__title">
              <Link href={`/noticias/${item.documentId}`}>{item.title}</Link>
            </h3>
            {item.summary && <p className="news-copy__summary">{excerpt(item.summary, 200)}</p>}
            <Link href={`/noticias/${item.documentId}`} className="news-copy__cta">
              Leer la nota
              <span aria-hidden className="news-copy__arrow">
                <Arrow />
              </span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </article>

      <div className="lg:col-span-5">
        <p data-reveal="fade" className="news-index__head">
          <span>Últimas notas</span>
          <span className="mono-label">{folio(items.length)} en portada</span>
        </p>
        <ol data-reveal-stagger="right" className="news-index">
          {items.map((n, i) => {
            const thumb = mediaUrl(n.coverImage?.formats?.thumbnail?.url ?? n.coverImage?.url);
            const on = i === active;
            return (
              <li key={n.documentId}>
                <Link
                  href={`/noticias/${n.documentId}`}
                  className={cn('news-row', on && 'is-active')}
                  aria-current={on ? 'true' : undefined}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  {on && (
                    <motion.span
                      layoutId="news-row-bg"
                      aria-hidden
                      className="news-row__bg"
                      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                    />
                  )}
                  <span className="news-row__n" aria-hidden>
                    {folio(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="news-row__title">{n.title}</span>
                    <span className="news-row__date mono-label">{formatDate(n.publishedAt)}</span>
                  </span>
                  <span
                    aria-hidden
                    className="news-row__thumb"
                    style={
                      {
                        '--t1': TONES[i % TONES.length][0],
                        '--t2': TONES[i % TONES.length][1],
                      } as React.CSSProperties
                    }
                  >
                    {thumb && (
                      <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />
                    )}
                  </span>
                  {/* Cuánto falta para pasar a la siguiente (solo en la activa) */}
                  {on && cycling && (
                    <span
                      aria-hidden
                      key={`p-${active}`}
                      className="news-row__progress"
                      style={{ animationDuration: `${CYCLE_MS}ms` }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
        <Link href="/noticias" data-reveal="up" className="news-index__all">
          Ver todas las noticias <Arrow />
        </Link>
      </div>
    </div>
  );
}

/** Sin WebGL o en modo liviano: las portadas apiladas, la activa aparece con un fundido. */
function StaticCover({ items, active }: { items: NewsItem[]; active: number }) {
  return (
    <span className="news-static">
      {items.map((n, i) => {
        const src = mediaUrl(n.coverImage?.formats?.large?.url ?? n.coverImage?.url);
        const tone = TONES[i % TONES.length];
        return (
          <span
            key={n.documentId}
            className={cn('news-static__layer', i === active && 'is-on')}
            style={{ background: `linear-gradient(160deg, ${tone[0]}, ${tone[1]})` }}
          >
            {src && (
              <Image
                src={src}
                alt={n.coverImage?.alternativeText ?? ''}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

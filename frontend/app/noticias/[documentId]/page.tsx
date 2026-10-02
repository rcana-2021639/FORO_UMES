import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Prose } from '@/components/ui/Prose';
import { Button } from '@/components/ui/Button';
import { api, findOne, mediaUrl, safe, staticIds } from '@/lib/api';
import { excerpt, formatDate, readingMinutes } from '@/lib/format';
import { breadcrumbJsonLd, newsArticleJsonLd } from '@/lib/json-ld';
import { pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import type { NewsItem } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';
import { ShareLink } from '@/components/ui/ShareLink';
import Link from 'next/link';
import { ViewTransition } from 'react';
import { ClockIcon } from '@phosphor-icons/react/dist/ssr';

type Params = { params: Promise<{ documentId: string }> };

const load = (id: string) => findOne<NewsItem>(id, api.newsItem);

/** Generadas por adelantado y renovadas solas: abren al instante (ver staticIds en lib/api.ts). */
export function generateStaticParams() {
  return staticIds(api.news({ 'pagination[pageSize]': 50 }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { documentId } = await params;
  const n = await load(documentId).catch(() => null);
  if (!n) return { title: 'Página no encontrada', robots: { index: false } };
  return pageMetadata({
    title: n.title,
    description: n.summary ?? excerpt(n.content),
    path: `/noticias/${n.documentId}`,
    image: mediaUrl(n.coverImage?.formats?.large?.url ?? n.coverImage?.url),
    imageAlt: n.coverImage?.alternativeText,
    type: 'article',
    publishedTime: n.publishedAt,
    modifiedTime: n.updatedAt,
  });
}

export default async function NoticiaPage({ params }: Params) {
  const { documentId } = await params;
  const [n, list] = await Promise.all([
    load(documentId),
    // Para "nota anterior / siguiente": la misma lista que generó estas páginas (ya en caché)
    safe(api.news({ 'pagination[pageSize]': 50 }), null),
  ]);
  if (!n) notFound();
  const cover = mediaUrl(n.coverImage?.formats?.large?.url ?? n.coverImage?.url);
  const all = list?.data ?? [];
  const at = all.findIndex((x) => x.documentId === n.documentId);
  const newer = at > 0 ? all[at - 1] : null;
  const older = at >= 0 && at < all.length - 1 ? all[at + 1] : null;
  const minutes = readingMinutes(n.content);

  return (
    <article>
      <JsonLd
        data={[
          newsArticleJsonLd(n),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Noticias', path: '/noticias' },
            { name: n.title, path: `/noticias/${n.documentId}` },
          ]),
        ]}
      />
      <PageHeader
        crumbs={[{ label: 'Noticias', href: '/noticias' }]}
        size="article"
        kicker={`Publicada el ${formatDate(n.publishedAt)}`}
        title={n.title}
        intro={n.summary ?? undefined}
        aside={
          <div className="article-meta">
            <span className="article-meta__item">
              <ClockIcon aria-hidden weight="bold" />
              Lectura de {minutes} {minutes === 1 ? 'minuto' : 'minutos'}
            </span>
            <ShareLink title={n.title} className="article-meta__share" />
          </div>
        }
        visual={
          cover ? (
            // Viniendo de una ficha del archivo (o de la nota vecina), su foto viaja hasta aquí
            <ViewTransition
              name={`news-${n.documentId}`}
              share={{ 'news-card': 'news-morph', default: 'none' }}
              default="none"
            >
              <figure className="article-cover">
                <Image
                  src={cover}
                  alt={n.coverImage?.alternativeText ?? ''}
                  fill
                  sizes="(min-width:900px) 40vw, 100vw"
                  className="object-cover"
                  priority
                />
              </figure>
            </ViewTransition>
          ) : undefined
        }
      />
      <div className="container-x grid gap-12 pb-[var(--section-y)] md:grid-cols-12">
        <div className="md:col-span-8 md:col-start-3">
          <Prose markdown={n.content} />

          {(newer || older) && (
            <nav aria-label="Otras notas" className="article-next">
              {[
                { item: older, label: 'Nota anterior', dir: 'left' as const },
                { item: newer, label: 'Nota siguiente', dir: 'right' as const },
              ].map(({ item, label, dir }) =>
                item ? (
                  <NeighborCard key={label} item={item} label={label} dir={dir} />
                ) : (
                  <span key={label} />
                )
              )}
            </nav>
          )}

          <div data-reveal="up" className="mt-12 border-t border-line pt-8">
            <Button variant="ghost" href="/noticias">
              <Arrow dir="left" /> Archivo de noticias
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** La nota vecina, con su foto: al abrirla, la foto viaja a la cabecera de esa nota. */
function NeighborCard({
  item,
  label,
  dir,
}: {
  item: NewsItem;
  label: string;
  dir: 'left' | 'right';
}) {
  const thumb = mediaUrl(item.coverImage?.formats?.small?.url ?? item.coverImage?.url);
  return (
    <Link
      href={`/noticias/${item.documentId}`}
      transitionTypes={['news-card']}
      className="article-next__card group"
      data-dir={dir}
      data-reveal="up"
    >
      {thumb && (
        <ViewTransition
          name={`news-${item.documentId}`}
          share={{ 'news-card': 'news-morph', default: 'none' }}
          default="none"
        >
          <span className="article-next__thumb">
            <Image src={thumb} alt="" fill sizes="160px" className="object-cover" />
          </span>
        </ViewTransition>
      )}
      <span className="min-w-0">
        <span className="article-next__label">
          {dir === 'left' ? (
            <>
              <Arrow dir="left" /> {label}
            </>
          ) : (
            <>
              {label} <Arrow />
            </>
          )}
        </span>
        <span className="article-next__title">{item.title}</span>
        <span className="article-next__date">{formatDate(item.publishedAt)}</span>
      </span>
    </Link>
  );
}

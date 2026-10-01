import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Prose } from '@/components/ui/Prose';
import { Button } from '@/components/ui/Button';
import { api, findOne, mediaUrl } from '@/lib/api';
import { excerpt, formatDate } from '@/lib/format';
import { breadcrumbJsonLd, newsArticleJsonLd } from '@/lib/json-ld';
import { pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import type { NewsItem } from '@/lib/types';

type Params = { params: Promise<{ documentId: string }> };

const load = (id: string) => findOne<NewsItem>(id, api.newsItem);

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
  const n = await load(documentId);
  if (!n) notFound();
  const cover = mediaUrl(n.coverImage?.formats?.large?.url ?? n.coverImage?.url);

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
      />
      <div className="container-x grid gap-12 pb-[var(--section-y)] md:grid-cols-12">
        <div className="md:col-span-8 md:col-start-3">
          {cover && (
            <figure
              data-reveal="clip"
              className="relative mb-12 aspect-[16/9] overflow-hidden rounded-[3px] border border-line"
            >
              <Image
                src={cover}
                alt={n.coverImage?.alternativeText ?? ''}
                fill
                sizes="(min-width:768px) 66vw, 100vw"
                className="object-cover"
                priority
              />
            </figure>
          )}
          <Prose markdown={n.content} />
          <div data-reveal="up" className="mt-16 border-t border-line pt-8">
            <Button variant="ghost" href="/noticias">
              ← Archivo de noticias
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

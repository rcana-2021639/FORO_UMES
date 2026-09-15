import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Prose } from '@/components/ui/Prose';
import { Button } from '@/components/ui/Button';
import { api, ApiError, mediaUrl } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { NewsItem } from '@/lib/types';

type Params = { params: Promise<{ documentId: string }> };

async function load(id: string): Promise<NewsItem | null> {
  try {
    return (await api.newsItem(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { documentId } = await params;
  const n = await load(documentId).catch(() => null);
  const image = mediaUrl(n?.coverImage?.formats?.large?.url ?? n?.coverImage?.url);
  return {
    title: n?.title ?? 'Noticia',
    description: n?.summary ?? undefined,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

export default async function NoticiaPage({ params }: Params) {
  const { documentId } = await params;
  const n = await load(documentId);
  if (!n) notFound();
  const cover = mediaUrl(n.coverImage?.formats?.large?.url ?? n.coverImage?.url);

  return (
    <article>
      <PageHeader
        kicker={`Noticia · ${formatDate(n.publishedAt)}`}
        title={n.title}
        intro={n.summary ?? undefined}
      />
      <div className="container-x grid gap-12 pb-[var(--section-y)] md:grid-cols-12">
        <div className="md:col-span-8 md:col-start-3">
          {cover && (
            <figure className="relative mb-12 aspect-[16/9] overflow-hidden rounded-[3px] border border-line">
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
          <div className="mt-16 border-t border-line pt-8">
            <Button variant="ghost" href="/noticias">
              ← Archivo de noticias
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Prose } from '@/components/ui/Prose';
import { Button } from '@/components/ui/Button';
import { api, findOne, mediaUrl, staticIds } from '@/lib/api';
import { ACTIVITY_LABEL, CONTRIBUTION_LABEL, acronymOf, excerpt, formatDate } from '@/lib/format';
import { breadcrumbJsonLd, eventJsonLd } from '@/lib/json-ld';
import { pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Activity } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';
import { ActivityStub } from '@/components/sections/ActivityStub';
import { ActivityGallery } from '@/components/sections/ActivityGallery';

type Params = { params: Promise<{ documentId: string }> };

const load = (id: string) => findOne<Activity>(id, api.activity);

/** Generadas por adelantado y renovadas solas: abren al instante (ver staticIds en lib/api.ts). */
export function generateStaticParams() {
  return staticIds(api.activities({ 'pagination[pageSize]': 50 }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { documentId } = await params;
  const a = await load(documentId).catch(() => null);
  if (!a) return { title: 'Página no encontrada', robots: { index: false } };
  return pageMetadata({
    title: a.title,
    description:
      excerpt(a.description) || `${ACTIVITY_LABEL[a.type]} del Foro, ${formatDate(a.date)}.`,
    path: `/actividades/${a.documentId}`,
    image: mediaUrl(a.coverImage?.formats?.large?.url ?? a.coverImage?.url),
    imageAlt: a.coverImage?.alternativeText,
  });
}

export default async function ActividadPage({ params }: Params) {
  const { documentId } = await params;
  const a = await load(documentId);
  if (!a) notFound();
  const cover = mediaUrl(a.coverImage?.formats?.large?.url ?? a.coverImage?.url);

  return (
    <>
      <JsonLd
        data={[
          eventJsonLd(a),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Actividades', path: '/actividades' },
            { name: a.title, path: `/actividades/${a.documentId}` },
          ]),
        ]}
      />
      <PageHeader
        crumbs={[{ label: 'Actividades', href: '/actividades' }]}
        size="article"
        kicker={`${ACTIVITY_LABEL[a.type]}, ${formatDate(a.date)}`}
        title={a.title}
        visual={
          <ActivityStub
            variant="detail"
            activity={{
              documentId: a.documentId,
              title: a.title,
              type: a.type,
              date: a.date,
              summary: excerpt(a.description, 220),
            }}
          />
        }
        aside={
          !!a.participatingUniversities?.length && (
            <div>
              <p className="eyebrow text-fg-muted">
                Participan {a.participatingUniversities.length} de las nueve
              </p>
              {/* Lista que salta de línea: en una sola fila las siglas se salían de la pantalla */}
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {a.participatingUniversities.map((u) => (
                  <li key={u.documentId}>
                    <Link href={`/universidades/${u.documentId}`} className="uni-chip">
                      {acronymOf(u)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
      />
      <div className="container-x grid gap-12 pb-[var(--section-y)] md:grid-cols-12">
        <div className="md:col-span-8">
          {cover && (
            <div
              data-reveal="clip"
              className="relative mb-10 aspect-[16/9] overflow-hidden rounded-[3px] border border-line"
            >
              <Image
                src={cover}
                alt={a.coverImage?.alternativeText || a.title}
                fill
                sizes="(min-width:768px) 66vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          {a.description ? (
            <Prose markdown={a.description} />
          ) : (
            <p className="text-fg-muted">Esta actividad todavía no tiene descripción.</p>
          )}
        </div>
        <aside data-reveal-stagger="up" className="md:col-span-4">
          {!!a.contributions?.length && (
            <section>
              <h2 className="eyebrow border-b border-line pb-3 text-fg-muted">Aportes derivados</h2>
              <ul className="divide-y divide-line">
                {a.contributions.map((c) => (
                  <li key={c.documentId} className="py-4">
                    <span className="ui-label text-accent">{CONTRIBUTION_LABEL[c.type]}</span>
                    <p className="mt-1 text-fg">{c.title}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!!a.galleryItems?.length && (
            <section className="mt-10">
              <h2 className="eyebrow border-b border-line pb-3 text-fg-muted">Galería</h2>
              <ActivityGallery
                items={a.galleryItems
                  .filter((g) => g.file)
                  .map((g) => ({
                    id: g.documentId,
                    thumb: mediaUrl(g.file?.formats?.small?.url ?? g.file?.url),
                    src: mediaUrl(g.file?.formats?.large?.url ?? g.file?.url),
                    w: g.file?.width ?? 4,
                    h: g.file?.height ?? 3,
                    alt: g.file?.alternativeText ?? g.title ?? '',
                    title: g.title,
                    date: g.date ? formatDate(g.date) : null,
                  }))}
              />
            </section>
          )}
          <div className="mt-12">
            <Button variant="ghost" href="/actividades">
              <Arrow dir="left" /> Todas las actividades
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}

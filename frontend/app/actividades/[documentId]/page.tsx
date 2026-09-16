import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Prose } from '@/components/ui/Prose';
import { Button } from '@/components/ui/Button';
import { api, ApiError, mediaUrl } from '@/lib/api';
import { ACTIVITY_LABEL, CONTRIBUTION_LABEL, acronymOf, formatDate } from '@/lib/format';
import type { Activity } from '@/lib/types';

type Params = { params: Promise<{ documentId: string }> };

async function load(id: string): Promise<Activity | null> {
  try {
    return (await api.activity(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { documentId } = await params;
  const a = await load(documentId).catch(() => null);
  return { title: a?.title ?? 'Actividad' };
}

export default async function ActividadPage({ params }: Params) {
  const { documentId } = await params;
  const a = await load(documentId);
  if (!a) notFound();
  const cover = mediaUrl(a.coverImage?.formats?.large?.url ?? a.coverImage?.url);

  return (
    <>
      <PageHeader
        kicker={`${ACTIVITY_LABEL[a.type]} · ${formatDate(a.date)}`}
        title={a.title}
        aside={
          <p className="mono-label text-fg-muted md:text-right">
            {(a.participatingUniversities ?? []).map((u) => (
              <Link
                key={u.documentId}
                href={`/universidades/${u.documentId}`}
                className="ml-3 text-jade hover:underline"
              >
                {acronymOf(u)}
              </Link>
            ))}
          </p>
        }
      />
      <div className="container-x grid gap-12 pb-[var(--section-y)] md:grid-cols-12">
        <div className="md:col-span-8">
          {cover && (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-[3px] border border-line">
              <Image
                src={cover}
                alt={a.coverImage?.alternativeText ?? ''}
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
            <p className="text-fg-muted">Sin descripción.</p>
          )}
        </div>
        <aside className="md:col-span-4">
          {!!a.contributions?.length && (
            <section>
              <h2 className="mono-label border-b border-line pb-3 text-fg-muted">
                Aportes derivados
              </h2>
              <ul className="divide-y divide-line">
                {a.contributions.map((c) => (
                  <li key={c.documentId} className="py-4">
                    <span className="mono-label text-accent">{CONTRIBUTION_LABEL[c.type]}</span>
                    <p className="mt-1 text-fg">{c.title}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!!a.galleryItems?.length && (
            <section className="mt-10">
              <h2 className="mono-label border-b border-line pb-3 text-fg-muted">Galería</h2>
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {a.galleryItems.map((g) => {
                  const src = mediaUrl(g.file?.formats?.thumbnail?.url ?? g.file?.url);
                  return (
                    <li
                      key={g.documentId}
                      className="relative aspect-square overflow-hidden rounded-[2px] border border-line bg-paper-2"
                    >
                      {src && (
                        <Image
                          src={src}
                          alt={g.title ?? ''}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <div className="mt-12">
            <Button variant="ghost" href="/actividades">
              ← Todas las actividades
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}

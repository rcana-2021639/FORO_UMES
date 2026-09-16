import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { api, ApiError, mediaUrl } from '@/lib/api';
import { LEVEL_LABEL, MODALITY_LABEL, formatDate } from '@/lib/format';
import type { University } from '@/lib/types';

type Params = { params: Promise<{ documentId: string }> };

async function load(documentId: string): Promise<University | null> {
  try {
    return (await api.university(documentId)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { documentId } = await params;
  const u = await load(documentId).catch(() => null);
  return { title: u?.name ?? 'Universidad', description: u?.shortDescription ?? undefined };
}

export default async function UniversidadPage({ params }: Params) {
  const { documentId } = await params;
  const u = await load(documentId);
  if (!u) notFound();

  const logo = mediaUrl(u.logo?.formats?.small?.url ?? u.logo?.url);
  const programs = u.academicPrograms ?? [];
  const reps = u.representatives ?? [];

  return (
    <>
      <PageHeader
        kicker={`Silla ${u.displayOrder} de nueve`}
        title={u.name}
        intro={u.shortDescription ?? undefined}
        aside={
          u.website ? (
            <Button variant="secondary" href={u.website}>
              Sitio oficial ↗
            </Button>
          ) : undefined
        }
      />

      <div className="container-x grid gap-12 pb-[var(--section-y)] md:grid-cols-12">
        <aside className="md:col-span-4">
          <div className="rounded-[4px] bg-[color-mix(in_oklab,var(--fg)_5%,var(--bg))] p-6">
            {logo ? (
              <Image
                src={logo}
                alt={`Logotipo de ${u.name}`}
                width={200}
                height={200}
                className="h-20 w-auto object-contain mix-blend-multiply"
              />
            ) : (
              <span
                className="font-display text-[3.5rem] leading-none"
                style={{ fontVariationSettings: "'opsz' 96, 'WONK' 1" }}
              >
                {u.acronym}
              </span>
            )}
            <dl className="ui-label mt-8 space-y-3 text-fg-muted">
              {u.acronym && (
                <div className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt>Siglas</dt>
                  <dd className="text-fg">{u.acronym}</dd>
                </div>
              )}
              {u.joinedForumAt && (
                <div className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt>En el Foro desde</dt>
                  <dd className="text-fg">{formatDate(u.joinedForumAt)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-b border-line pb-3">
                <dt>Programas</dt>
                <dd className="text-fg">{programs.length}</dd>
              </div>
              <div className="flex justify-between gap-4 pb-1">
                <dt>Representantes</dt>
                <dd className="text-fg">{reps.length}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="md:col-span-8">
          <section aria-labelledby="reps">
            <h2 id="reps" className="text-[clamp(1.6rem,3vw,2.4rem)]">
              Representantes
            </h2>
            {reps.length ? (
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {reps.map((r) => (
                  <li key={r.documentId} className="grid gap-2 py-5 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <p className="text-[1.1rem] text-fg">{r.fullName}</p>
                      {r.position && <p className="ui-label mt-1 text-fg-muted">{r.position}</p>}
                    </div>
                    <div className="md:col-span-7">
                      {r.shortBio && (
                        <p className="text-[0.95rem] leading-relaxed text-fg-muted">{r.shortBio}</p>
                      )}
                      <a
                        href={`mailto:${r.institutionalEmail}`}
                        className="mono-label mt-2 inline-block text-accent-jade underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-current"
                      >
                        {r.institutionalEmail}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-fg-muted">
                La universidad aún no publica a su representante.
              </p>
            )}
          </section>

          <section aria-labelledby="progs" className="mt-16">
            <h2 id="progs" className="text-[clamp(1.6rem,3vw,2.4rem)]">
              Programas de posgrado
            </h2>
            {programs.length ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {programs.map((p) => (
                  <li
                    key={p.documentId}
                    className="lift hover:lift-on rounded-[4px] bg-[color-mix(in_oklab,var(--fg)_4%,var(--bg))] p-5"
                  >
                    <span className="ui-label text-accent">{LEVEL_LABEL[p.level]}</span>
                    <h3 className="mt-3 text-[1.2rem]">{p.name}</h3>
                    <p className="ui-label mt-4 text-fg-muted">
                      {MODALITY_LABEL[p.modality]}
                      {p.duration ? ` · ${p.duration}` : ''}
                    </p>
                    {p.infoUrl && (
                      <Link
                        href={p.infoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-label mt-4 inline-block text-accent-jade underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-current"
                      >
                        Ficha oficial del programa ↗
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-fg-muted">La universidad aún no publica sus programas.</p>
            )}
          </section>

          <div className="mt-16">
            <Button variant="ghost" href="/universidades">
              ← Todas las universidades
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

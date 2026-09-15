import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/ui/PageHeader';
import { api, mediaUrl, safe } from '@/lib/api';
import { excerpt, formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Noticias y comunicados del Foro Interuniversitario de Estudios de Posgrado.',
};

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const news = await safe(
    api.news({ 'pagination[page]': page, 'pagination[pageSize]': 12 }),
    EMPTY
  );
  const { pageCount } = news.meta.pagination;

  return (
    <>
      <PageHeader
        number={7}
        kicker="Actualidad"
        title="Archivo de noticias"
        intro="Comunicados, convocatorias y crónicas de las actividades del Foro, de la más reciente a la más antigua."
      />
      <div className="container-x pb-[var(--section-y)]">
        {news.data.length ? (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {news.data.map((n, i) => {
              const cover = mediaUrl(n.coverImage?.formats?.medium?.url ?? n.coverImage?.url);
              return (
                <li key={n.documentId} className="group">
                  <Link href={`/noticias/${n.documentId}`} data-cursor="Leer" className="block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] border border-line bg-paper-2">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={n.coverImage?.alternativeText ?? ''}
                          fill
                          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-[1.04]"
                          priority={i < 3}
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
                    </div>
                    <p className="mono-label mt-4 text-fg-muted">{formatDate(n.publishedAt)}</p>
                    <h2 className="mt-2 text-[1.35rem] leading-tight text-fg transition-colors group-hover:text-jade">
                      {n.title}
                    </h2>
                    {n.summary && (
                      <p className="mt-2 text-[0.95rem] leading-relaxed text-fg-muted">
                        {excerpt(n.summary, 140)}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-fg-muted">Aún no hay noticias publicadas.</p>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Paginación"
            className="mono-label mt-16 flex items-center justify-between border-t border-line pt-6 text-fg-muted"
          >
            {page > 1 ? (
              <Link href={`/noticias?pagina=${page - 1}`} className="text-fg hover:text-jade">
                ← Más recientes
              </Link>
            ) : (
              <span />
            )}
            <span>
              Página {page} de {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={`/noticias?pagina=${page + 1}`} className="text-fg hover:text-jade">
                Anteriores →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </>
  );
}

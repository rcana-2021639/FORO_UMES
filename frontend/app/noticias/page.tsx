import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { NewsArchive } from '@/components/sections/NewsArchive';
import { NewsCalendar } from '@/components/sections/NewsCalendar';
import { api, critical, parsePage, safe } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

type Props = { searchParams: Promise<{ pagina?: string }> };

/** Cada página del archivo es canónica de sí misma (lo que Google recomienda para listados). */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePage((await searchParams).pagina);
  return pageMetadata({
    title: page > 1 ? `Noticias, página ${page}` : 'Noticias',
    description: 'Noticias y comunicados del Foro Interuniversitario de Estudios de Posgrado.',
    path: page > 1 ? `/noticias?pagina=${page}` : '/noticias',
  });
}

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function NoticiasPage({ searchParams }: Props) {
  const { pagina } = await searchParams;
  const page = parsePage(pagina);
  const [news, all] = await Promise.all([
    critical(api.news({ 'pagination[page]': page, 'pagination[pageSize]': 12 }), EMPTY),
    // Para el calendario de la cabecera: el año de publicaciones (la misma consulta que usan las
    // páginas de detalle generadas por adelantado, ya en caché)
    safe(api.news({ 'pagination[pageSize]': 50 }), EMPTY),
  ]);
  const { pageCount } = news.meta.pagination;
  // Un enlace viejo a una página que ya no existe lleva a la última, no a un archivo vacío
  if (pageCount > 0 && page > pageCount) redirect(`/noticias?pagina=${pageCount}`);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Noticias' }]}
        kicker="Lo último que se dijo"
        title="Archivo de noticias"
        mark={{ word: 'noticias', kind: 'highlight' }}
        intro="Comunicados, convocatorias y crónicas de las actividades del Foro, de la más reciente a la más antigua. La primera abre a lo grande; el resto, en fichas numeradas."
        visual={
          all.data.length ? (
            <NewsCalendar
              now={new Date()}
              notes={all.data.map((n) => ({
                documentId: n.documentId,
                title: n.title,
                publishedAt: n.publishedAt ?? n.createdAt,
              }))}
            />
          ) : undefined
        }
      />
      <div className="container-x pb-[var(--section-y)]">
        <NewsArchive news={news.data} page={page} pageCount={pageCount} />
      </div>
    </>
  );
}

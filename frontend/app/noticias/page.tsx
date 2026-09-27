import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { NewsArchive } from '@/components/sections/NewsArchive';
import { api, safe } from '@/lib/api';

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
        kicker="Lo último que se dijo"
        title="Archivo de noticias"
        intro="Comunicados, convocatorias y crónicas de las actividades del Foro, de la más reciente a la más antigua. La primera abre a lo grande; el resto, en fichas numeradas."
      />
      <div className="container-x pb-[var(--section-y)]">
        <NewsArchive news={news.data} page={page} pageCount={pageCount} />
      </div>
    </>
  );
}

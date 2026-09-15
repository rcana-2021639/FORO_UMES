import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgramsCatalog } from '@/components/sections/ProgramsCatalog';
import { api, safe } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Programas de posgrado',
  description:
    'Catálogo de maestrías, doctorados, especializaciones y diplomados de las universidades del Foro.',
};

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function ProgramasPage() {
  // El backend limita a 50 por página: traemos hasta 4 páginas (200 programas)
  const first = await safe(api.programs({ 'pagination[page]': 1 }), EMPTY);
  const pages = Math.min(first.meta.pagination.pageCount, 4);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
      safe(api.programs({ 'pagination[page]': i + 2 }), EMPTY)
    )
  );
  const programs = [...first.data, ...rest.flatMap((r) => r.data)];

  return (
    <>
      <PageHeader
        number={3}
        kicker="Oferta de posgrado"
        title="Catálogo de programas"
        intro="Toda la oferta de las nueve universidades en una sola lista. Filtra por nivel, modalidad o universidad."
      />
      <div className="container-x pb-[var(--section-y)]">
        <ProgramsCatalog programs={programs} />
      </div>
    </>
  );
}

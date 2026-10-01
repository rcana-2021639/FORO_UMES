import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgramsCatalog } from '@/components/sections/ProgramsCatalog';
import { api, critical } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Programas de posgrado',
  description:
    'Catálogo de maestrías, doctorados, especializaciones y diplomados de las universidades del Foro.',
  path: '/programas',
});

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function ProgramasPage() {
  const programs = (await critical(api.allPrograms(), EMPTY)).data;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Programas' }]}
        kicker="Lo que se puede estudiar"
        title="Catálogo de programas"
        intro="Toda la oferta de posgrado de las nueve universidades en una sola lista. Filtra por nivel, modalidad o universidad, o busca por nombre."
      />
      <div className="container-x pb-[var(--section-y)]">
        <ProgramsCatalog programs={programs} />
      </div>
    </>
  );
}

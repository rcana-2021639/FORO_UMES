import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgramsCatalog } from '@/components/sections/ProgramsCatalog';
import { OfferDots } from '@/components/sections/OfferDots';
import { api, critical, safe } from '@/lib/api';
import { LEVELS } from '@/lib/levels';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Programas de posgrado',
  description:
    'Catálogo de maestrías, doctorados, especializaciones y diplomados de las universidades del Foro.',
  path: '/programas',
});

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function ProgramasPage() {
  const [all, universities] = await Promise.all([
    critical(api.allPrograms(), EMPTY),
    safe(api.universities(), EMPTY),
  ]);
  const programs = all.data;

  // Una fila por universidad (en el orden oficial) con sus programas ordenados por nivel
  const rows = universities.data
    .map((u) => ({
      documentId: u.documentId,
      acronym: u.acronym ?? u.name.slice(0, 4),
      programs: programs
        .filter((p) => p.university?.documentId === u.documentId)
        .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level))
        .map((p) => ({ name: p.name, level: p.level })),
    }))
    .filter((r) => r.programs.length);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Programas' }]}
        kicker="Lo que se puede estudiar"
        title="Catálogo de programas"
        intro="Toda la oferta de posgrado de las nueve universidades en una sola lista. Filtra por nivel, modalidad o universidad, busca por nombre y guarda con la estrella los que quieras comparar."
        visual={rows.length ? <OfferDots rows={rows} total={programs.length} /> : undefined}
      />
      <div className="container-x pb-[var(--section-y)]">
        <ProgramsCatalog programs={programs} />
      </div>
    </>
  );
}

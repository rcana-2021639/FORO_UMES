import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversitiesBento } from '@/components/sections/UniversitiesBento';
import { api, safe } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Universidades',
  description:
    'Las nueve universidades integrantes del Foro Interuniversitario de Estudios de Posgrado.',
};

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function UniversidadesPage() {
  const universities = await safe(api.universities(), EMPTY);
  return (
    <>
      <PageHeader
        number={2}
        kicker="Integrantes"
        title="Las universidades del Foro"
        intro="En el orden oficial de la mesa. Entra al perfil de cada una para ver representantes y programas."
      />
      <div className="container-x pb-[var(--section-y)]">
        <UniversitiesBento universities={universities.data} />
      </div>
    </>
  );
}

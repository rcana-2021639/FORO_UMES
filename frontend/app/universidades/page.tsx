import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversitiesBento } from '@/components/sections/UniversitiesBento';
import { api, critical } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Universidades',
  description:
    'Las nueve universidades integrantes del Foro Interuniversitario de Estudios de Posgrado.',
  path: '/universidades',
});

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function UniversidadesPage() {
  const universities = await critical(api.universities(), EMPTY);
  return (
    <>
      <PageHeader
        kicker="Quiénes forman el Foro"
        title="Las nueve universidades"
        intro="Las nueve universidades que forman el Foro. Abre el perfil de cada una para ver quién la representa y qué programas ofrece."
      />
      <div className="container-x pb-[var(--section-y)]">
        <UniversitiesBento universities={universities.data} />
      </div>
    </>
  );
}

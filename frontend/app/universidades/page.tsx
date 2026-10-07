import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversityShelf } from '@/components/sections/UniversityShelf';
import { UniversitiesExplorer } from '@/components/sections/UniversitiesExplorer';
import { api, critical, mediaUrl, safe } from '@/lib/api';
import {
  countByUniversity,
  levelsByUniversity,
  modalitiesByUniversity,
  yearOf,
} from '@/lib/format';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Universidades',
  description:
    'Las nueve universidades integrantes del Foro Interuniversitario de Estudios de Posgrado.',
  path: '/universidades',
});

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function UniversidadesPage() {
  const [universities, programs] = await Promise.all([
    critical(api.universities(), EMPTY),
    safe(api.allPrograms(), EMPTY),
  ]);
  const counts = countByUniversity(programs.data);
  const levels = levelsByUniversity(programs.data);
  const books = universities.data.map((u) => ({
    documentId: u.documentId,
    acronym: u.acronym ?? u.name.slice(0, 4),
    name: u.name,
    logo: mediaUrl(u.logo?.formats?.small?.url ?? u.logo?.url),
    programs: counts[u.documentId],
    joined: yearOf(u.joinedForumAt),
    levels: levels[u.documentId],
  }));

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Universidades' }]}
        kicker="Quiénes forman el Foro"
        title="Las nueve universidades"
        mark={{ word: 'nueve', kind: 'circle' }}
        intro="Todas participan en igualdad de condiciones. Señala un libro del estante para saber quién es, ábrelo para ver su perfil (quién la representa y qué ofrece) o compáralas más abajo."
        visual={books.length ? <UniversityShelf books={books} /> : undefined}
      />
      <div className="container-x pb-[var(--section-y)]">
        <UniversitiesExplorer
          universities={universities.data}
          programCounts={counts}
          levels={levels}
          modalities={modalitiesByUniversity(programs.data)}
        />
      </div>
    </>
  );
}

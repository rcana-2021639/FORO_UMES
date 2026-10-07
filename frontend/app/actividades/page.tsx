import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Words } from '@/components/ui/Words';
import { ActivitiesBoard } from '@/components/sections/ActivitiesBoard';
import { MilestonesTrack } from '@/components/sections/MilestonesTrack';
import { buildMilestones } from '@/lib/milestones';
import { ActivityStub } from '@/components/sections/ActivityStub';
import { excerpt } from '@/lib/format';
import { api, critical } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Actividades',
  description: 'Encuentros, conferencias, seminarios, reuniones y proyectos del Foro.',
  path: '/actividades',
});

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function ActividadesPage() {
  const [activities, universities] = await Promise.all([
    critical(api.activities({ 'pagination[pageSize]': 50 }), EMPTY),
    critical(api.universities(), EMPTY),
  ]);
  // Aquí la historia completa, desde el primer ingreso (en la portada solo los últimos 14)
  const milestones = buildMilestones(universities.data, activities.data, 100);
  // La próxima actividad (la más cercana que no ha pasado); si no hay, la más reciente
  const today = new Date().toISOString().slice(0, 10);
  const next =
    [...activities.data]
      .filter((a) => a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? activities.data[0];

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Actividades' }]}
        kicker="Lo que ya pasó y lo que viene"
        title="Actividades del Foro"
        mark={{ word: 'Actividades', kind: 'swash' }}
        intro="Encuentros, seminarios y proyectos de las nueve universidades. Filtra por tipo y pulsa un boleto para ver de qué se trata y quién participa."
        visual={
          next ? (
            <ActivityStub
              variant="upcoming"
              activity={{
                documentId: next.documentId,
                title: next.title,
                type: next.type,
                date: next.date,
                summary: excerpt(next.description, 220),
              }}
            />
          ) : undefined
        }
      />
      <div className="container-x">
        <ActivitiesBoard activities={activities.data} />
      </div>

      {milestones.length > 0 && (
        <section aria-labelledby="hitos" className="mt-24 pb-[var(--section-y)] md:mt-32">
          <div className="container-x">
            <div className="border-t border-line pt-16">
              <p data-reveal="left" className="eyebrow text-fg-muted">
                Todo en orden, desde el principio
              </p>
              <h2 id="hitos" data-reveal-group className="mt-2 text-[clamp(2rem,4vw,3.4rem)]">
                <Words text="Hitos del Foro" />
              </h2>
            </div>
          </div>
          <MilestonesTrack milestones={milestones} />
        </section>
      )}
    </>
  );
}

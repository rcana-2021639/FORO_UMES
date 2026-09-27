import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActivitiesBoard } from '@/components/sections/ActivitiesBoard';
import { TimelinePath } from '@/components/sections/TimelinePath';
import { buildMilestones } from '@/lib/milestones';
import { api, safe } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Actividades',
  description: 'Encuentros, conferencias, seminarios, reuniones y proyectos del Foro.',
};

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function ActividadesPage() {
  const [activities, universities] = await Promise.all([
    safe(api.activities({ 'pagination[pageSize]': 50 }), EMPTY),
    safe(api.universities(), EMPTY),
  ]);
  const milestones = buildMilestones(universities.data, activities.data);

  return (
    <>
      <PageHeader
        kicker="Lo que ya pasó y lo que viene"
        title="Actividades del Foro"
        intro="Encuentros, seminarios y proyectos de las nueve universidades. Filtra por tipo y pulsa un boleto para ver de qué se trata y quién participa."
      />
      <div className="container-x pb-[var(--section-y)]">
        <ActivitiesBoard activities={activities.data} />

        {milestones.length > 0 && (
          <section aria-labelledby="hitos" className="mt-24 border-t border-line pt-16 md:mt-32">
            <p className="eyebrow text-fg-muted">Todo en orden, desde el principio</p>
            <h2 id="hitos" className="mt-2 mb-12 text-[clamp(2rem,4vw,3.4rem)]">
              Hitos del Foro
            </h2>
            <TimelinePath milestones={milestones} />
          </section>
        )}
      </div>
    </>
  );
}

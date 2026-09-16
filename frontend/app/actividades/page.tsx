import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/ui/PageHeader';
import { api, mediaUrl, safe } from '@/lib/api';
import { ACTIVITY_LABEL, acronymOf, formatDate } from '@/lib/format';
import type { Activity } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Actividades',
  description: 'Encuentros, conferencias, seminarios, reuniones y proyectos del Foro.',
};

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

function ActivityList({ items, heading, id }: { items: Activity[]; heading: string; id: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="eyebrow border-b border-line pb-3 text-fg-muted">
        {heading} ({items.length})
      </h2>
      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map((a) => {
            const cover = mediaUrl(a.coverImage?.formats?.thumbnail?.url ?? a.coverImage?.url);
            return (
              <li key={a.documentId}>
                <Link
                  href={`/actividades/${a.documentId}`}
                  data-cursor="Ver"
                  className="group grid gap-3 py-6 md:grid-cols-12 md:items-center md:gap-6"
                >
                  <span className="mono-label text-fg-muted md:col-span-2">
                    {formatDate(a.date)}
                  </span>
                  <span className="ui-label text-accent md:col-span-2">
                    {ACTIVITY_LABEL[a.type]}
                  </span>
                  <span className="flex items-center gap-4 md:col-span-6">
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        width={64}
                        height={64}
                        className="h-14 w-14 rounded-[2px] object-cover"
                      />
                    )}
                    <span className="text-[1.25rem] leading-tight text-fg transition-colors duration-300 group-hover:text-accent-jade">
                      {a.title}
                    </span>
                  </span>
                  <span className="mono-label text-fg-muted md:col-span-2 md:text-right">
                    {(a.participatingUniversities ?? []).map(acronymOf).join(', ')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-8 text-fg-muted">Nada por aquí todavía.</p>
      )}
    </section>
  );
}

export default async function ActividadesPage() {
  const activities = await safe(api.activities({ 'pagination[pageSize]': 50 }), EMPTY);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = activities.data.filter((a) => a.date >= today).reverse();
  const past = activities.data.filter((a) => a.date < today);

  return (
    <>
      <PageHeader
        kicker="Lo que ya pasó y lo que viene"
        title="Actividades del Foro"
        intro="Encuentros, conferencias, seminarios, reuniones y proyectos, con las universidades que participan en cada uno."
      />
      <div className="container-x space-y-16 pb-[var(--section-y)]">
        <ActivityList items={upcoming} heading="Próximas" id="proximas" />
        <ActivityList items={past} heading="Anteriores" id="anteriores" />
      </div>
    </>
  );
}

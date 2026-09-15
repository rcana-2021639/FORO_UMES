import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { GalleryMasonry } from '@/components/sections/GalleryMasonry';
import { api, safe } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Galería',
  description: 'Fotografías y videos de las actividades del Foro.',
};

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function GaleriaPage() {
  const gallery = await safe(api.gallery({ 'pagination[pageSize]': 50 }), EMPTY);
  return (
    <>
      <PageHeader
        number={9}
        kicker="Memoria visual"
        title="Galería"
        intro="Fotografías y videos de encuentros, seminarios y proyectos de las nueve universidades."
      />
      <div className="container-x pb-[var(--section-y)]">
        <GalleryMasonry items={gallery.data} />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { GalleryMasonry } from '@/components/sections/GalleryMasonry';
import { GalleryShowcase } from '@/components/sections/GalleryShowcase';
import { api, critical } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Galería',
  description: 'Fotografías y videos de las actividades del Foro.',
  path: '/galeria',
});

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function GaleriaPage() {
  const gallery = await critical(api.gallery({ 'pagination[pageSize]': 50 }), EMPTY);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Galería' }]}
        kicker="Lo que quedó en fotos"
        title="Galería"
        intro="Fotografías y videos de encuentros, seminarios y proyectos de las nueve universidades. Arrastra el carrusel o haz click en la del centro para abrirla."
      />
      {/* Carrusel interactivo con fotos y videos; debajo, todo el archivo en mosaico */}
      <div className="mb-14 md:mb-20">
        <GalleryShowcase items={gallery.data} height={620} />
      </div>
      <div className="container-x pb-[var(--section-y)]">
        <GalleryMasonry items={gallery.data} />
      </div>
    </>
  );
}

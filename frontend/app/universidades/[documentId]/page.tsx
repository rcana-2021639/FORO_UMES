import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UniversityProfile } from '@/components/sections/UniversityProfile';
import { JsonLd } from '@/components/seo/JsonLd';
import { api, findOne, safe, staticIds } from '@/lib/api';
import { excerpt } from '@/lib/format';
import { breadcrumbJsonLd, universityJsonLd } from '@/lib/json-ld';
import { pageMetadata } from '@/lib/seo';
import type { University } from '@/lib/types';

type Params = { params: Promise<{ documentId: string }> };

const load = (id: string) => findOne<University>(id, api.university);

/** Generadas por adelantado y renovadas solas: abren al instante (ver staticIds en lib/api.ts). */
export function generateStaticParams() {
  return staticIds(api.universities());
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { documentId } = await params;
  const u = await load(documentId).catch(() => null);
  if (!u) return { title: 'Página no encontrada', robots: { index: false } };
  return pageMetadata({
    title: u.name,
    description:
      excerpt(u.shortDescription) ||
      `${u.name}: oferta de posgrado, representantes y contacto en el Foro.`,
    path: `/universidades/${u.documentId}`,
  });
}

export default async function UniversidadPage({ params }: Params) {
  const { documentId } = await params;
  const [u, all] = await Promise.all([load(documentId), safe(api.universities(), null)]);
  if (!u) notFound();
  // Silla anterior y siguiente, en círculo: después de la novena vuelve la primera
  const seats = (all?.data ?? []).map((x) => ({
    href: `/universidades/${x.documentId}`,
    acronym: x.acronym ?? x.name,
    order: x.displayOrder,
  }));
  const i = seats.findIndex((x) => x.href.endsWith(u.documentId));
  const around = (d: number) =>
    i < 0 || seats.length < 2 ? null : seats[(i + d + seats.length) % seats.length];
  return (
    <>
      <JsonLd
        data={[
          universityJsonLd(u),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Universidades', path: '/universidades' },
            { name: u.name, path: `/universidades/${u.documentId}` },
          ]),
        ]}
      />
      <UniversityProfile u={u} prev={around(-1)} next={around(1)} />
    </>
  );
}

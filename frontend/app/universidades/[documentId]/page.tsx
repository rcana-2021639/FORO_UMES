import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UniversityProfile } from '@/components/sections/UniversityProfile';
import { api, findOne, safe } from '@/lib/api';
import type { University } from '@/lib/types';

type Params = { params: Promise<{ documentId: string }> };

const load = (id: string) => findOne<University>(id, api.university);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { documentId } = await params;
  const u = await load(documentId).catch(() => null);
  return { title: u?.name ?? 'Universidad', description: u?.shortDescription ?? undefined };
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
  return <UniversityProfile u={u} prev={around(-1)} next={around(1)} />;
}

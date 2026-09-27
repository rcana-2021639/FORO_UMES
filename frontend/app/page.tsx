import { Hero } from '@/components/hero/Hero';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { UniversitiesBento } from '@/components/sections/UniversitiesBento';
import { ProgramsRail } from '@/components/sections/ProgramsRail';
import { TimelinePath } from '@/components/sections/TimelinePath';
import { NewsMorph } from '@/components/sections/NewsMorph';
import { GalleryShowcase } from '@/components/sections/GalleryShowcase';
import { buildMilestones } from '@/lib/milestones';
import { ProcessSteps } from '@/components/sections/ProcessSteps';
import { ContributionsStrip } from '@/components/sections/ContributionsStrip';
import { ContactForm } from '@/components/sections/ContactForm';
import { SectionRail } from '@/components/nav/SectionRail';
import { api, safe } from '@/lib/api';

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

/** Capítulos de la portada, en el orden en que alguien los necesita. */
const RAIL = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'universidades', label: 'Universidades' },
  { id: 'programas', label: 'Programas' },
  { id: 'hitos', label: 'Hitos' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'galeria', label: 'Galería' },
  { id: 'como-trabaja', label: 'Cómo trabaja' },
  { id: 'contacto', label: 'Escríbele al Foro' },
];

export default async function Home() {
  const year = new Date().getFullYear();
  const [summary, universities, programs, activities, contributions, news, gallery] =
    await Promise.all([
      safe(api.summary(), null),
      safe(api.universities(), EMPTY),
      safe(api.programs(), EMPTY),
      safe(api.activities({ 'pagination[pageSize]': 12 }), EMPTY),
      safe(api.contributions(), EMPTY),
      safe(api.news({ 'pagination[pageSize]': 3 }), EMPTY),
      safe(api.gallery({ 'pagination[pageSize]': 13 }), EMPTY),
    ]);

  const counts = summary?.data.counts ?? {
    universities: universities.data.length,
    academicPrograms: programs.data.length,
    activitiesThisYear: activities.data.filter((a) => a.date.startsWith(String(year))).length,
    contributions: contributions.data.length,
  };
  const heroUniversities = universities.data.map((u) => ({
    acronym: u.acronym ?? u.name.slice(0, 4),
    name: u.name,
    href: `/universidades/${u.documentId}`,
  }));
  // Vitrina: niveles alternados y universidades distintas, para que el mazo muestre variedad
  const byLevel = new Map<string, typeof programs.data>();
  programs.data
    .filter((p) => p.university)
    .forEach((p) => byLevel.set(p.level, [...(byLevel.get(p.level) ?? []), p]));
  const queues = [...byLevel.values()];
  const picked: typeof programs.data = [];
  const seenUni = new Set<string>();
  for (let round = 0; picked.length < 6 && round < 20; round++) {
    for (const q of queues) {
      const p = q.find((x) => !seenUni.has(x.university!.documentId)) ?? q[0];
      if (!p || picked.includes(p)) continue;
      picked.push(p);
      seenUni.add(p.university!.documentId);
      q.splice(q.indexOf(p), 1);
      if (picked.length >= 6) break;
    }
  }
  const deck = picked.map((p) => ({
    id: p.documentId,
    name: p.name,
    level: p.level,
    modality: p.modality,
    university: p.university?.acronym ?? p.university?.name ?? '',
    href: `/universidades/${p.university?.documentId}`,
  }));

  return (
    <>
      <SectionRail items={RAIL} />

      <Hero year={year} counts={counts} universities={heroUniversities} programs={deck} />

      <Section
        id="universidades"
        kicker="Quiénes forman el Foro"
        title="Las nueve universidades"
        intro="Todas participan en igualdad de condiciones. Pasa el cursor por una para verla con sus colores y entra a su perfil: oferta, representantes y contacto."
        theme="paper-2"
        aside={
          <Button variant="secondary" href="/universidades">
            Ver los nueve perfiles
          </Button>
        }
      >
        <UniversitiesBento universities={universities.data} />
      </Section>

      <Section
        id="programas"
        kicker="Qué se puede estudiar"
        title="Programas de posgrado"
        intro="Elige un nivel, recorre las tarjetas y guarda con la estrella los que quieras comparar."
        bleed
        aside={
          <Button variant="secondary" href="/programas">
            Ver el catálogo completo
          </Button>
        }
      >
        <ProgramsRail programs={programs.data} />
      </Section>

      <Section
        id="hitos"
        kicker="Lo que ya pasó y lo que viene"
        title="Hitos del Foro"
        intro="Ingresos de universidades, encuentros, seminarios y proyectos, en el orden en que ocurrieron."
        theme="paper-2"
        aside={
          <Button variant="secondary" href="/actividades">
            Ver todas las actividades
          </Button>
        }
      >
        <TimelinePath milestones={buildMilestones(universities.data, activities.data)} />
      </Section>

      <Section
        id="noticias"
        kicker="Lo último que se dijo"
        title="Noticias del Foro"
        aside={
          <Button variant="secondary" href="/noticias">
            Leer el archivo completo
          </Button>
        }
      >
        <NewsMorph news={news.data} />
      </Section>

      <Section
        id="galeria"
        kicker="Lo que quedó en fotos y videos"
        title="Galería"
        intro="Arrastra el carrusel, usa las flechas del teclado o haz click en la foto del centro para ampliarla; los videos se abren en un reproductor."
        theme="paper-2"
        bleed
        aside={
          <Button variant="secondary" href="/galeria">
            Ver toda la galería
          </Button>
        }
      >
        <GalleryShowcase items={gallery.data} />
      </Section>

      <Section
        id="como-trabaja"
        kicker="Cómo se decide"
        title="Así trabaja el Foro"
        intro="Tres pasos, siempre los mismos. Pulsa cualquiera o deja que avance solo; debajo está lo que ya salió de ellos."
        bleed
      >
        <ProcessSteps />
        <div className="container-x mt-16 md:mt-20">
          <h3 className="mb-6 font-display text-[1.6rem] [font-variation-settings:'opsz'_36]">
            Lo que ya dio resultados
          </h3>
          <ContributionsStrip contributions={contributions.data} />
        </div>
      </Section>

      <Section
        id="contacto"
        kicker="Para universidades, prensa y quien busca un posgrado"
        title="Escríbele al Foro"
        theme="dusk"
        backdrop={
          <>
            <div className="dusk-glow" />
            <span className="contact-bigword">Hola</span>
          </>
        }
      >
        <ContactForm />
      </Section>
    </>
  );
}

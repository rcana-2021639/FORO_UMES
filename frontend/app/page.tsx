import { Hero } from '@/components/hero/Hero';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { UniversitiesBento } from '@/components/sections/UniversitiesBento';
import { ProgramsRail } from '@/components/sections/ProgramsRail';
import { MilestonesTrack } from '@/components/sections/MilestonesTrack';
import { NewsMorph } from '@/components/sections/NewsMorph';
import { GalleryShowcase } from '@/components/sections/GalleryShowcase';
import { buildMilestones } from '@/lib/milestones';
import { ProcessSteps } from '@/components/sections/ProcessSteps';
import { ContributionsStrip } from '@/components/sections/ContributionsStrip';
import { ContactForm } from '@/components/sections/ContactForm';
import { SectionRail } from '@/components/nav/SectionRail';
import { JsonLd } from '@/components/seo/JsonLd';
import { api, critical } from '@/lib/api';
import { organizationJsonLd, websiteJsonLd } from '@/lib/json-ld';
import { pageMetadata } from '@/lib/seo';
import { countByUniversity } from '@/lib/format';
import { SITE_DESCRIPTION } from '@/lib/site';

export const metadata = pageMetadata({ path: '/', description: SITE_DESCRIPTION });

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
      critical(api.summary(), null),
      critical(api.universities(), EMPTY),
      critical(api.allPrograms(), EMPTY),
      critical(api.activities({ 'pagination[pageSize]': 12 }), EMPTY),
      critical(api.contributions(), EMPTY),
      critical(api.news({ 'pagination[pageSize]': 4 }), EMPTY),
      critical(api.gallery({ 'pagination[pageSize]': 13 }), EMPTY),
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

  return (
    <>
      <JsonLd data={[organizationJsonLd(universities.data), websiteJsonLd()]} />
      <SectionRail items={RAIL} />

      <Hero year={year} counts={counts} universities={heroUniversities} />

      <Section
        id="universidades"
        index={1}
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
        <UniversitiesBento
          universities={universities.data}
          programCounts={countByUniversity(programs.data)}
        />
      </Section>

      <Section
        id="programas"
        index={2}
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
        index={3}
        kicker="Lo que ya pasó y lo que viene"
        title="Hitos del Foro"
        intro="Ingresos de universidades, encuentros, seminarios y proyectos, en el orden en que ocurrieron. Sigue bajando y la línea avanza sola."
        theme="paper-2"
        bleed
        aside={
          <Button variant="secondary" href="/actividades">
            Ver todas las actividades
          </Button>
        }
      >
        <MilestonesTrack milestones={buildMilestones(universities.data, activities.data, 14)} />
      </Section>

      <Section
        id="noticias"
        index={4}
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
        index={5}
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
        index={6}
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
        index={7}
        kicker="Universidades, prensa y estudiantes"
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

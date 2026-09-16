import { Hero } from '@/components/hero/Hero';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Marquee } from '@/components/sections/Marquee';
import { Stats } from '@/components/sections/Stats';
import { UniversitiesBento } from '@/components/sections/UniversitiesBento';
import { ProgramsRail } from '@/components/sections/ProgramsRail';
import { ProcessPinned } from '@/components/sections/ProcessPinned';
import { TimelinePath } from '@/components/sections/TimelinePath';
import { buildMilestones } from '@/lib/milestones';
import { ContributionsSticky } from '@/components/sections/ContributionsSticky';
import { NewsMorph } from '@/components/sections/NewsMorph';
import { RepresentativesSpotlight } from '@/components/sections/RepresentativesSpotlight';
import { GalleryMasonry } from '@/components/sections/GalleryMasonry';
import { ContactForm } from '@/components/sections/ContactForm';
import { api, safe } from '@/lib/api';

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

export default async function Home() {
  const year = new Date().getFullYear();
  const [summary, universities, programs, activities, contributions, news, reps, gallery] =
    await Promise.all([
      safe(api.summary(), null),
      safe(api.universities(), EMPTY),
      safe(api.programs(), EMPTY),
      safe(api.activities({ 'pagination[pageSize]': 12 }), EMPTY),
      safe(api.contributions(), EMPTY),
      safe(api.news({ 'pagination[pageSize]': 3 }), EMPTY),
      safe(api.representatives(), EMPTY),
      safe(api.gallery({ 'pagination[pageSize]': 12 }), EMPTY),
    ]);

  const counts = summary?.data.counts ?? {
    universities: universities.data.length,
    academicPrograms: programs.data.length,
    activitiesThisYear: activities.data.filter((a) => a.date.startsWith(String(year))).length,
    contributions: contributions.data.length,
  };
  const acronyms = universities.data.map((u) => u.acronym ?? u.name);
  const milestones = buildMilestones(universities.data, activities.data);

  return (
    <>
      <Hero year={year} universities={counts.universities} programs={counts.academicPrograms} />

      <Marquee
        items={acronyms.length ? acronyms : ['Foro Interuniversitario de Estudios de Posgrado']}
      />

      <Section
        id="cifras"
        number={1}
        kicker="El Foro en cifras"
        title={
          <>
            Una mesa, <em className="italic text-jade">nueve</em> universidades
          </>
        }
        intro="Lo que el Foro coordina hoy, en números que se actualizan desde el panel de cada universidad."
      >
        <Stats counts={counts} year={year} />
      </Section>

      <Section
        id="universidades"
        number={2}
        kicker="Integrantes"
        title="Las universidades del Foro"
        intro="En el orden oficial de la mesa. Cada una conserva su identidad y sus programas; el Foro es el espacio común."
        theme="paper-2"
        aside={
          <Button variant="secondary" href="/universidades">
            Ver todas
          </Button>
        }
      >
        <UniversitiesBento universities={universities.data} />
      </Section>

      <Section
        id="programas"
        number={3}
        kicker="Oferta de posgrado"
        title="Programas de las nueve"
        intro="Maestrías, doctorados, especializaciones y diplomados. Filtra por nivel y desliza para recorrerlos."
        bleed
        aside={
          <Button variant="secondary" href="/programas">
            Catálogo completo
          </Button>
        }
      >
        <ProgramsRail programs={programs.data} />
      </Section>

      <Section
        id="como-trabaja"
        number={4}
        kicker="Método"
        title="Cómo trabaja el Foro"
        theme="paper-2"
        bleed
      >
        <ProcessPinned />
      </Section>

      <Section
        id="linea-de-tiempo"
        number={5}
        kicker="Trayectoria"
        title="Hitos y actividades"
        intro="Ingresos de universidades y actividades del Foro, en orden cronológico."
        aside={
          <Button variant="secondary" href="/actividades">
            Todas las actividades
          </Button>
        }
      >
        <TimelinePath milestones={milestones} />
      </Section>

      <Section
        id="aportes"
        number={6}
        kicker="Aportes"
        title={
          <>
            Lo que el Foro <em className="italic text-accent-jade">produce</em>
          </>
        }
        intro="Resultados, iniciativas y beneficios documentados por las universidades."
        theme="night"
      >
        <ContributionsSticky contributions={contributions.data} />
      </Section>

      <Section
        id="noticias"
        number={7}
        kicker="Actualidad"
        title="Últimas noticias"
        aside={
          <Button variant="secondary" href="/noticias">
            Archivo
          </Button>
        }
      >
        <NewsMorph news={news.data} />
      </Section>

      <Section
        id="representantes"
        number={8}
        kicker="Quiénes se sientan a la mesa"
        title="Representantes"
        intro="Direcciones de posgrado de cada universidad. Recorre la retícula con el cursor."
        theme="paper-2"
      >
        <RepresentativesSpotlight reps={reps.data} />
      </Section>

      <Section
        id="galeria"
        number={9}
        kicker="Memoria visual"
        title="Galería"
        aside={
          <Button variant="secondary" href="/galeria">
            Ver galería
          </Button>
        }
      >
        <GalleryMasonry items={gallery.data} />
      </Section>

      <Section
        id="contacto"
        number={10}
        kicker="Contacto"
        title={
          <>
            Escríbele <em className="italic text-accent-jade">al Foro</em>
          </>
        }
        theme="night"
      >
        <ContactForm />
      </Section>
    </>
  );
}

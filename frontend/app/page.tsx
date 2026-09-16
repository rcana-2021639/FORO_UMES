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
        kicker="Lo que hay sobre la mesa hoy"
        title="Nueve sillas, una mesa"
        intro="Cuatro cifras que cada universidad actualiza desde su propio panel. No hay estimaciones: es lo publicado."
        rhythm="tight"
      >
        <Stats counts={counts} year={year} />
      </Section>

      <Section
        id="universidades"
        kicker="Quiénes se sientan"
        title="Las nueve universidades"
        intro="En el orden en que se sientan a la mesa. Cada una conserva su identidad y su oferta; el Foro es el espacio que comparten."
        theme="paper-2"
        rhythm="wide"
        aside={
          <Button variant="secondary" href="/universidades">
            Abrir los nueve perfiles
          </Button>
        }
      >
        <UniversitiesBento universities={universities.data} />
      </Section>

      <Section
        id="programas"
        kicker="Lo que se puede estudiar"
        title="Programas de posgrado"
        intro="Maestrías, doctorados, especializaciones y diplomados de las nueve. Filtra por nivel y sigue bajando para recorrerlos."
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
        id="como-trabaja"
        kicker="Cómo se toma una decisión"
        title="Así trabaja la mesa"
        theme="paper-2"
        bleed
      >
        <ProcessPinned />
      </Section>

      <Section
        id="linea-de-tiempo"
        kicker="Lo que ya pasó y lo que viene"
        title="Hitos del Foro"
        intro="Ingresos de universidades, encuentros, seminarios y proyectos, en el orden en que ocurrieron."
        aside={
          <Button variant="secondary" href="/actividades">
            Ver todas las actividades
          </Button>
        }
      >
        <TimelinePath milestones={milestones} />
      </Section>

      <Section
        id="aportes"
        kicker="Lo que sale de la mesa"
        title="Aportes del Foro"
        intro="Resultados que ya se pueden medir, iniciativas en marcha y beneficios concretos para estudiantes y programas."
        theme="night"
        rhythm="wide"
      >
        <ContributionsSticky contributions={contributions.data} />
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
        id="representantes"
        kicker="Las personas detrás de cada silla"
        title="Representantes"
        intro="Quien dirige el posgrado en cada universidad. Con el cursor, la linterna revela nombre y cargo."
        theme="paper-2"
      >
        <RepresentativesSpotlight reps={reps.data} />
      </Section>

      <Section
        id="galeria"
        kicker="Lo que quedó en fotos"
        title="Galería"
        rhythm="tight"
        aside={
          <Button variant="secondary" href="/galeria">
            Ver toda la galería
          </Button>
        }
      >
        <GalleryMasonry items={gallery.data} />
      </Section>

      <Section
        id="contacto"
        kicker="Para universidades, prensa y quien busca un posgrado"
        title="Escríbele a la mesa"
        theme="night"
      >
        <ContactForm />
      </Section>
    </>
  );
}

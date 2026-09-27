'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ProgramDeck, type DeckProgram } from './ProgramDeck';
import { RollingNumber } from '@/components/ui/RollingNumber';
import { useSplitReveal } from '@/hooks/useSplitReveal';
import { gsap } from '@/lib/gsap';
import { getQuality } from '@/lib/quality';

export interface HeroUniversity {
  acronym: string;
  name: string;
  href: string;
}

interface Props {
  year: number;
  counts: {
    universities: number;
    academicPrograms: number;
    activitiesThisYear: number;
    contributions: number;
  };
  universities: HeroUniversity[];
  programs: DeckProgram[];
}

/** Los tres motivos por los que alguien llega al sitio. Es lo primero que hay que poder elegir. */
const PATHS = [
  {
    n: '01',
    title: 'Busco un posgrado',
    text: 'Maestrías, doctorados, especializaciones y diplomados de las nueve.',
    href: '/programas',
  },
  {
    n: '02',
    title: 'Quiero conocer una universidad',
    text: 'Su perfil, quién la representa y qué ofrece.',
    href: '#universidades',
  },
  {
    n: '03',
    title: 'Quiero escribirle al Foro',
    text: 'Universidades, prensa o estudiantes: la secretaría responde.',
    href: '#contacto',
  },
] as const;

/**
 * Portada. Campo de luz violeta propio (orbes que derivan, retícula de puntos), el nombre del
 * Foro con "Posgrado" en degradado, y a la derecha una vitrina de programas reales que se baraja
 * sola. Debajo: tres caminos, cuatro cifras y una cinta con las nueve universidades.
 */
export function Hero({ year, counts, universities, programs }: Props) {
  const root = useRef<HTMLElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const title = useSplitReveal<HTMLHeadingElement>({ type: 'words', immediate: true, delay: 0.1 });

  useEffect(() => {
    const q = getQuality();
    if (q === 'still' || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-in]', {
        y: 26,
        autoAlpha: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.07,
        delay: 0.45,
      });
      gsap.from(deck.current, {
        y: 60,
        rotate: 6,
        autoAlpha: 0,
        duration: 1.4,
        ease: 'expo.out',
        delay: 0.35,
      });
      if (q === 'full') {
        gsap.to('[data-hero-orb]', {
          yPercent: (i) => [-18, 12, -8][i] ?? 0,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  const stats = [
    { value: counts.universities, label: 'universidades' },
    { value: counts.academicPrograms, label: 'programas de posgrado' },
    { value: counts.activitiesThisYear, label: `actividades en ${year}` },
    { value: counts.contributions, label: 'aportes publicados' },
  ];
  const ribbon = universities.length
    ? universities
    : [{ acronym: 'Foro', name: 'Foro Interuniversitario', href: '/' }];

  return (
    <section
      ref={root}
      id="inicio"
      data-section-theme="paper"
      className="hero-field relative isolate overflow-clip pt-28 md:pt-32"
      aria-labelledby="hero-title"
    >
      {/* Campo de luz: tres orbes que derivan despacio (transform, sin filtros) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span data-hero-orb className="hero-orb hero-orb--a" />
        <span data-hero-orb className="hero-orb hero-orb--b" />
        <span data-hero-orb className="hero-orb hero-orb--c" />
        <span className="hero-dots" />
      </div>

      <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-10">
        <div className="lg:col-span-7">
          <p data-hero-in className="hero-pill">
            <span className="hero-pill__live" aria-hidden />
            Guatemala, {year} · {counts.universities} universidades, una sola oferta de posgrado
          </p>
          <h1
            id="hero-title"
            ref={title}
            className="mt-6 max-w-[13ch] text-[clamp(2.7rem,6.6vw,6.4rem)] leading-[0.96] text-fg"
          >
            Foro Interuniversitario de Estudios de{' '}
            <span className="text-violet-grad">Posgrado</span>
          </h1>
          <p
            data-hero-in
            className="mt-6 max-w-[46ch] text-[1.14rem] leading-relaxed text-fg-muted"
          >
            Las direcciones de posgrado de nueve universidades de Guatemala coordinan aquí su
            oferta, sus actividades y sus proyectos.
          </p>
          <div data-hero-in className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/programas" className="cta-violet">
              Explorar programas <span aria-hidden>→</span>
            </Link>
            <Link href="#universidades" className="cta-ghost">
              Conocer las universidades
            </Link>
          </div>
        </div>

        <div ref={deck} className="lg:col-span-5">
          <ProgramDeck programs={programs} total={counts.academicPrograms} />
        </div>

        {/* Tres caminos: la decisión principal de la portada */}
        <ol className="grid gap-3 md:grid-cols-3 lg:col-span-12" aria-label="Por dónde empezar">
          {PATHS.map((p) => (
            <li key={p.n} data-hero-in>
              <Link href={p.href} className="path-card group">
                <span className="path-card__n" aria-hidden>
                  {p.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.3rem] leading-tight text-fg [font-variation-settings:'opsz'_36,'SOFT'_40]">
                    {p.title}
                  </span>
                  <span className="ui-label mt-1.5 block text-fg-muted">{p.text}</span>
                </span>
                <span className="path-card__arrow" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {/* Cifras: odómetro, regla que se dibuja y destello al llegar */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 lg:col-span-12">
          {stats.map((s, i) => (
            <HeroStat key={s.label} value={s.value} label={s.label} index={i} />
          ))}
        </dl>
      </div>

      {/* Cinta con las nueve universidades: movimiento continuo, pausa al pasar el cursor */}
      <nav aria-label="Universidades del Foro" className="uni-ribbon mt-16 md:mt-20">
        <div className="uni-ribbon__track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="uni-ribbon__list" aria-hidden={copy === 1}>
              {ribbon.map((u) => (
                <li key={`${copy}-${u.href}`}>
                  <Link href={u.href} tabIndex={copy === 1 ? -1 : 0} className="uni-ribbon__item">
                    <span className="font-display text-[1.35rem] [font-variation-settings:'opsz'_36]">
                      {u.acronym}
                    </span>
                    <span className="ui-label opacity-75">{u.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </nav>
    </section>
  );
}

function HeroStat({ value, label, index }: { value: number; label: string; index: number }) {
  const [landed, setLanded] = useState(false);
  // Cada cifra arranca un poco después de la anterior; la primera espera a que entre el título
  const delay = 0.9 + index * 0.22;
  return (
    <div className="hero-stat" data-landed={landed} style={{ '--i': index } as React.CSSProperties}>
      <span aria-hidden className="hero-stat__rule" />
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="hero-stat__num text-violet-grad block font-display text-[clamp(2.4rem,4vw,3.6rem)] leading-none [font-variation-settings:'opsz'_96,'SOFT'_50]">
          <span aria-hidden className="hero-stat__flash" />
          <RollingNumber value={value} delay={delay} onLand={() => setLanded(true)} />
        </span>
        <span aria-hidden className="hero-stat__label ui-label mt-2 block text-fg-muted">
          <span>{label}</span>
        </span>
      </dd>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { GuideDeck } from './GuideDeck';
import { RollingNumber } from '@/components/ui/RollingNumber';
import { Word, Words } from '@/components/ui/Words';
import { gsap } from '@/lib/gsap';
import { getQuality } from '@/lib/quality';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { Arrow } from '@/components/ui/Arrow';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';

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
}

/** Los tres motivos por los que alguien llega al sitio. Es lo primero que hay que poder elegir. */
const PATHS = [
  {
    label: 'Si buscas un posgrado',
    title: 'Busca y compara programas',
    text: 'Maestrías, doctorados, especializaciones y diplomados de las nueve, en una sola lista.',
    href: '/programas',
  },
  {
    label: 'Si quieres conocer una universidad',
    title: 'Abre su perfil',
    text: 'Qué ofrece, quién la representa y cómo escribirle.',
    href: '#universidades',
  },
  {
    label: 'Si quieres escribirle al Foro',
    title: 'Envía un mensaje',
    text: 'Universidades, prensa o estudiantes: responde la secretaría técnica.',
    href: '#contacto',
  },
] as const;

/**
 * Portada (v5, DESIGN_NOTES §27). El nombre del Foro, una frase que dice qué es con enlaces a lo
 * que nombra, y el buscador de programas como acción principal (con atajos por nivel); a la
 * derecha, la guía del posgrado en cartas que se barajan solas. Debajo: tres caminos como índice,
 * cuatro cifras y la cinta con las nueve universidades. Al fondo, círculos planos que derivan
 * despacio (los "puntos" del emblema), sin manchas de luz.
 *
 * La entrada la hace el script de arranque (data-reveal): empieza en el primer pintado, antes de
 * que React hidrate, así que nada aparece, desaparece y vuelve a entrar.
 */
export function Hero({ year, counts, universities }: Props) {
  const root = useRef<HTMLElement>(null);

  // Parallax de los orbes con el scroll (solo modo completo)
  useEffect(() => {
    if (getQuality() !== 'full' || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.to('[data-hero-orb]', {
        yPercent: (i) => [-18, 12, -8][i] ?? 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
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
          <p data-reveal="down" className="hero-pill">
            <span className="hero-pill__live" aria-hidden />
            Guatemala, {year} · {counts.universities} universidades, una sola oferta de posgrado
          </p>
          <h1
            id="hero-title"
            data-reveal-group
            className="mt-6 max-w-[13ch] text-[clamp(2.25rem,11.2vw,2.75rem)] leading-[0.96] text-fg sm:text-[clamp(2.75rem,6.6vw,6.4rem)]"
          >
            <Words text="Foro Interuniversitario de Estudios de" />{' '}
            <Word className="text-violet-grad">Posgrado</Word>
          </h1>
          <p data-reveal="blur" className="hero-lead">
            Las direcciones de posgrado de{' '}
            <Link href="#universidades" className="hero-link">
              nueve universidades de Guatemala
            </Link>{' '}
            coordinan aquí su oferta{' '}
            {counts.academicPrograms > 0 ? (
              <>
                —
                <Link href="/programas" className="hero-link">
                  {counts.academicPrograms} programas
                </Link>{' '}
                de posgrado—
              </>
            ) : (
              'de posgrado'
            )}
            , sus actividades y sus proyectos.
          </p>

          <form
            action="/programas"
            method="get"
            role="search"
            data-reveal="up"
            className="hero-search"
          >
            <label htmlFor="hero-q" className="hero-search__label">
              ¿Qué quieres estudiar?
            </label>
            <div className="hero-search__field">
              <MagnifyingGlassIcon aria-hidden className="hero-search__icon" />
              <input
                id="hero-q"
                name="q"
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Ej.: administración, docencia, salud pública"
                className="hero-search__input"
              />
              <button type="submit" className="cta-violet hero-search__btn">
                Buscar <Arrow />
              </button>
            </div>
            <p className="hero-search__quick">
              <span>O por nivel:</span>
              {LEVELS.map((l) => (
                <Link key={l} href={`/programas?nivel=${l}`}>
                  {LEVEL_META[l].plural}
                </Link>
              ))}
            </p>
          </form>
        </div>

        <div data-reveal="deck" className="lg:col-span-5">
          <GuideDeck />
        </div>

        {/* Tres caminos: la decisión principal de la portada, como índice */}
        <ol
          data-reveal-stagger="tilt"
          className="hero-paths grid md:grid-cols-3 lg:col-span-12"
          aria-label="Por dónde empezar"
        >
          {PATHS.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="path-card group">
                <span className="path-card__label">{p.label}</span>
                <span className="path-card__title">
                  {p.title}
                  <span className="path-card__arrow" aria-hidden>
                    <Arrow />
                  </span>
                </span>
                <span className="path-card__text">{p.text}</span>
              </Link>
            </li>
          ))}
        </ol>

        {/* Cifras: odómetro, regla que se dibuja y destello al llegar */}
        <dl
          data-reveal-stagger="up"
          className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 lg:col-span-12"
        >
          {stats.map((s, i) => (
            <HeroStat key={s.label} value={s.value} label={s.label} index={i} />
          ))}
        </dl>
      </div>

      {/* Cinta con las nueve universidades: movimiento continuo, pausa al pasar el cursor */}
      <nav
        aria-label="Universidades del Foro"
        data-reveal="fade"
        className="uni-ribbon mt-16 md:mt-20"
      >
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

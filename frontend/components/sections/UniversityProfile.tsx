'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { PulseStar } from '@/components/ui/PulseStar';
import { DepthText } from '@/components/fx/DepthText';
import { FoldText } from '@/components/fx/FoldText';
import { Tilt } from '@/components/fx/Tilt';
import { useSavedPrograms } from '@/hooks/useSavedPrograms';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { mediaUrl } from '@/lib/api';
import { LEVEL_LABEL, MODALITY_LABEL, yearOf } from '@/lib/format';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { CopyEmail } from '@/components/ui/CopyEmail';
import { brandOf, brandRootCss, brandVars } from '@/lib/universities';
import type { ProgramLevel, University } from '@/lib/types';

export interface SeatLink {
  href: string;
  acronym: string;
  order: number;
}

/**
 * Perfil de universidad: la única vista que lleva los colores institucionales (lib/universities).
 * Todo el color sale de las variables --u-* que pone `brandVars` en la raíz, así que cada perfil
 * se tiñe con su identidad sin tocar el resto del sitio. Cabecera en su color con la luz de su
 * segundo color, logo en losa clara y cifras; debajo, representantes, programas por nivel (con los
 * colores de nivel del catálogo, por coherencia) y el paso a la silla anterior o siguiente.
 */
export function UniversityProfile({
  u,
  prev,
  next,
}: {
  u: University;
  prev?: SeatLink | null;
  next?: SeatLink | null;
}) {
  const brand = brandOf(u.acronym);
  const logo = mediaUrl(u.logo?.formats?.small?.url ?? u.logo?.url);
  const programs = useMemo(() => u.academicPrograms ?? [], [u.academicPrograms]);
  const reps = u.representatives ?? [];
  const joined = yearOf(u.joinedForumAt);
  const firstRep = u.representatives?.[0];

  const byLevel = useMemo(
    () =>
      LEVELS.map((l) => ({ level: l, items: programs.filter((p) => p.level === l) })).filter(
        (g) => g.items.length
      ),
    [programs]
  );

  const stats = [
    { n: String(programs.length), label: programs.length === 1 ? 'programa' : 'programas' },
    {
      n: String(byLevel.length),
      label: byLevel.length === 1 ? 'nivel de posgrado' : 'niveles de posgrado',
    },
    { n: joined ? String(joined) : '—', label: 'en el Foro desde' },
    { n: String(reps.length), label: reps.length === 1 ? 'representante' : 'representantes' },
  ];

  return (
    <div style={brandVars(u.acronym)} className="u-profile">
      {/* Los colores de la universidad también para lo que vive fuera del perfil (barra de
          navegación, progreso de lectura, selección de texto): se quitan al salir de la página */}
      <style>{brandRootCss(u.acronym)}</style>
      {/* Cabecera en el color de la universidad */}
      <section
        className="u-hero relative isolate overflow-hidden"
        style={{ color: brand.onSurface }}
        aria-labelledby="u-title"
      >
        <span aria-hidden className="u-hero__light" />
        <SeatsRing />
        <div className="container-x relative grid gap-10 pt-32 pb-16 md:grid-cols-12 md:items-end md:pt-40 md:pb-20">
          <div className="md:col-span-8">
            <nav
              aria-label="Ruta"
              data-reveal="down"
              className="ui-label flex items-center gap-2 opacity-80"
            >
              <Link
                href="/"
                className="underline decoration-current/30 underline-offset-4 hover:decoration-current"
              >
                Inicio
              </Link>
              <span aria-hidden>/</span>
              <Link
                href="/universidades"
                className="underline decoration-current/30 underline-offset-4 hover:decoration-current"
              >
                Universidades
              </Link>
              <span aria-hidden>/</span>
              <span aria-current="page">{u.acronym ?? u.name}</span>
            </nav>
            <div data-reveal="left" className="mt-6 flex items-center gap-4">
              <p className="eyebrow opacity-80">Universidad miembro del Foro</p>
              <span
                aria-hidden
                className="h-px w-16 bg-[var(--u-accent,currentColor)] opacity-70"
              />
            </div>
            <h1 id="u-title" className="mt-5 max-w-[16ch] text-[clamp(2.4rem,6vw,5.4rem)]">
              <FoldText
                text={u.name}
                splitBy="word"
                hinge="bottom"
                trigger="mount"
                stagger={0.08}
                delay={0.15}
              />
            </h1>
            {u.shortDescription && (
              <p
                data-reveal="blur"
                className="mt-6 max-w-[56ch] text-[1.05rem] leading-relaxed opacity-80"
              >
                {u.shortDescription}
              </p>
            )}
            <div data-reveal="up" className="mt-8 flex flex-wrap items-center gap-3">
              {programs.length > 0 && (
                <a href="#programas-u" className="u-cta u-cta--solid">
                  Ver sus {programs.length} programas <span aria-hidden>↓</span>
                </a>
              )}
              {firstRep && (
                <a href={`mailto:${firstRep.institutionalEmail}`} className="u-cta">
                  Escribir a su representante <span aria-hidden>✉</span>
                </a>
              )}
              {u.website && (
                <a href={u.website} target="_blank" rel="noopener noreferrer" className="u-cta">
                  Sitio oficial <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          </div>

          <div
            data-reveal="swing"
            className="relative md:col-span-4 md:justify-self-end [perspective:1200px]"
          >
            {/* Anillos que giran detrás de la losa del logo */}
            <span
              aria-hidden
              className="spin-slow pointer-events-none absolute -inset-6 rounded-full border border-dashed border-[var(--u-accent)] opacity-60"
              style={{ '--spin-dur': '50s' } as React.CSSProperties}
            />
            <span
              aria-hidden
              className="spin-slow pointer-events-none absolute -inset-12 rounded-full border border-current opacity-15"
              style={{ '--spin-dur': '80s', animationDirection: 'reverse' } as React.CSSProperties}
            />
            <div
              className="float-y"
              style={{ '--float-amp': '9px', '--float-dur': '7s' } as React.CSSProperties}
            >
              <Tilt max={12} scale={1.04} className="rounded-[18px]">
                <div className="relative grid aspect-square w-full max-w-[18rem] place-items-center rounded-[18px] bg-paper p-8 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)] [transform-style:preserve-3d]">
                  <span
                    data-depth
                    style={{ '--z': 40 } as React.CSSProperties}
                    className="grid place-items-center"
                  >
                    {logo ? (
                      <Image
                        src={logo}
                        alt={`Logotipo de ${u.name}`}
                        width={260}
                        height={260}
                        className="h-auto max-h-[12rem] w-full object-contain"
                        priority
                      />
                    ) : (
                      <span
                        className="font-display text-[clamp(3rem,8vw,5rem)] leading-none text-[var(--u-text)]"
                        style={{ fontVariationSettings: "'opsz' 96, 'WONK' 1" }}
                      >
                        {u.acronym ?? u.name.slice(0, 3)}
                      </span>
                    )}
                  </span>
                  {u.acronym && (
                    <span
                      className="mono-label absolute right-4 bottom-3 text-[var(--u-text)]"
                      data-depth
                      style={{ '--z': 20 } as React.CSSProperties}
                    >
                      {u.acronym}
                    </span>
                  )}
                </div>
              </Tilt>
            </div>
          </div>
        </div>

        {/* Franja de cifras */}
        <div className="container-x relative border-t border-current/15">
          <dl
            data-reveal-stagger="up"
            className="grid grid-cols-2 divide-current/15 md:grid-cols-4 md:divide-x"
          >
            {stats.map((s, i) => (
              <div key={s.label} className="py-6 md:px-6 md:first:pl-0">
                <dd className="m-0">
                  <DepthText
                    text={s.n}
                    layers={14}
                    depth={1.2}
                    faceColor={brand.onSurface}
                    depthColor={i % 2 ? brand.primary : brand.accent}
                    fontSize="2.6rem"
                    tilt={8}
                    orbitSpeed={0.2}
                    fontVariationSettings="'opsz' 96, 'SOFT' 40"
                  />
                </dd>
                <dt className="ui-label mt-1 opacity-70">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="u-body container-x pb-[var(--section-y)]">
        {/* Representantes */}
        <section aria-labelledby="reps" className="pt-16 md:pt-20">
          <div data-reveal="up" className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--u-text)]">Quién la representa en el Foro</p>
              <h2 id="reps" className="mt-2 text-[clamp(1.8rem,3.4vw,2.8rem)]">
                Representantes
              </h2>
            </div>
            <p className="ui-label max-w-[36ch] text-fg-muted">
              Quien dirige el posgrado en {u.acronym ?? u.name}. Escríbele directamente a su correo.
            </p>
          </div>
          {reps.length ? (
            <ul
              data-reveal-stagger="tilt"
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {reps.map((r) => (
                <li key={r.documentId} className="h-full">
                  <Tilt max={8} scale={1.02} className="h-full rounded-[12px]">
                    <article className="group flex h-full gap-4 rounded-[12px] border border-line bg-surface-1 p-5 [transform-style:preserve-3d]">
                      <Avatar
                        name={r.fullName}
                        photo={mediaUrl(r.photo?.formats?.thumbnail?.url ?? r.photo?.url)}
                      />
                      <div className="min-w-0">
                        <h3
                          className="text-[1.2rem] leading-tight"
                          style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 30" }}
                        >
                          {r.fullName}
                        </h3>
                        {r.position && (
                          <p className="ui-label mt-1 text-[var(--u-text)]">{r.position}</p>
                        )}
                        {r.shortBio && (
                          <p className="mt-3 text-[0.92rem] leading-relaxed text-fg-muted">
                            {r.shortBio}
                          </p>
                        )}
                        <CopyEmail
                          email={r.institutionalEmail}
                          className="mono-label mt-3 max-w-full text-[var(--u-text)]"
                          linkClassName="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-current"
                        />
                      </div>
                    </article>
                  </Tilt>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-fg-muted">La universidad aún no publica a su representante.</p>
          )}
        </section>

        {/* Programas */}
        <section aria-labelledby="progs" id="programas-u" className="mt-20 scroll-mt-28 md:mt-24">
          <div data-reveal="up" className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--u-text)]">Oferta de posgrado</p>
              <h2 id="progs" className="mt-2 text-[clamp(1.8rem,3.4vw,2.8rem)]">
                Programas de posgrado
              </h2>
            </div>
            <Button variant="secondary" href="/programas">
              Comparar con las otras ocho
            </Button>
          </div>
          {programs.length ? (
            <Programs groups={byLevel} name={u.acronym ?? u.name} />
          ) : (
            <p className="mt-6 text-fg-muted">La universidad aún no publica sus programas.</p>
          )}
        </section>

        {/* Recorrer las nueve sin volver al índice */}
        <nav
          aria-label="Otras universidades"
          data-reveal-stagger="up"
          className="mt-20 grid gap-3 border-t border-line pt-8 sm:grid-cols-3"
        >
          {prev ? <SeatNav link={prev} dir="prev" /> : <span />}
          <Link
            href="/universidades"
            className="ui-label self-center justify-self-center text-fg-muted underline decoration-line underline-offset-4 hover:text-fg"
          >
            Las nueve universidades
          </Link>
          {next ? <SeatNav link={next} dir="next" /> : <span />}
        </nav>
      </div>
    </div>
  );
}

function SeatNav({ link, dir }: { link: SeatLink; dir: 'prev' | 'next' }) {
  const b = brandOf(link.acronym);
  return (
    <Link
      href={link.href}
      className={cn('seat-nav group', dir === 'next' && 'sm:text-right')}
      style={{ '--c': b.primary } as React.CSSProperties}
    >
      <span className="ui-label block text-fg-muted">
        {dir === 'prev' ? '← Universidad anterior' : 'Siguiente universidad →'}
      </span>
      <span
        className={cn(
          'mt-1 flex items-center gap-2 font-display text-[1.6rem] leading-none',
          dir === 'next' && 'sm:justify-end'
        )}
      >
        <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: b.primary }} />
        {link.acronym}
      </span>
    </Link>
  );
}

/** Nueve asientos en un anillo del color de acento, girando despacio detrás de la cabecera. */
function SeatsRing() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className="spin-slow pointer-events-none absolute -right-[12%] -bottom-[40%] h-[46rem] w-[46rem] opacity-30"
      style={{ '--spin-dur': '120s' } as React.CSSProperties}
    >
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="var(--u-accent)"
        strokeWidth="0.25"
        strokeDasharray="0.6 1.6"
      />
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.15" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={50 + 44 * Math.cos(a)}
            cy={50 + 44 * Math.sin(a)}
            r="1.3"
            fill="var(--u-accent)"
          />
        );
      })}
    </svg>
  );
}

const MODALITY_ICON: Record<string, string> = { Presencial: '◉', Virtual: '◎', Hibrida: '◐' };

/**
 * Oferta de la universidad, en su color. Los niveles se distinguen por nombre y explicación, no
 * por colores ajenos a la universidad: arriba, un resumen que filtra ("Todos · 2", "Maestrías · 1");
 * cada grupo dice qué es ese nivel y cuánto dura; cada tarjeta, modalidad, duración y ficha oficial.
 */
function Programs({
  groups,
  name,
}: {
  groups: { level: ProgramLevel; items: NonNullable<University['academicPrograms']> }[];
  name: string;
}) {
  const [active, setActive] = useState<ProgramLevel | 'all'>('all');
  const { has, toggle } = useSavedPrograms();
  const reduced = useReducedMotion();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const shown = active === 'all' ? groups : groups.filter((g) => g.level === active);
  // Con pocos programas por nivel, los grupos van lado a lado en vez de dejar columnas vacías
  const compact = shown.length > 1 && shown.every((g) => g.items.length <= 2);

  return (
    <>
      {groups.length > 1 && (
        <div
          data-reveal="up"
          className="mt-8 flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Filtrar por nivel"
        >
          <Tab active={active === 'all'} onClick={() => setActive('all')} count={total}>
            Todos
          </Tab>
          {groups.map((g) => (
            <Tab
              key={g.level}
              active={active === g.level}
              onClick={() => setActive(g.level)}
              count={g.items.length}
            >
              {LEVEL_META[g.level].plural}
            </Tab>
          ))}
        </div>
      )}
      <div className={cn('mt-10', compact ? 'grid gap-x-8 gap-y-14 lg:grid-cols-2' : 'space-y-14')}>
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((g) => {
            const meta = LEVEL_META[g.level];
            return (
              <motion.section
                key={g.level}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE.premium }}
                aria-label={meta.plural}
              >
                <header className="u-level">
                  <h3 className="font-display text-[1.6rem] leading-none [font-variation-settings:'opsz'_36]">
                    {meta.plural}
                    <span className="u-level__count">{g.items.length}</span>
                  </h3>
                  <p className="ui-label text-fg-muted">
                    {meta.hint}{' '}
                    <span className="whitespace-nowrap">Duración típica: {meta.span}.</span>
                  </p>
                </header>
                <ul
                  data-reveal-stagger="up"
                  className={cn('mt-5 grid gap-4 sm:grid-cols-2', !compact && 'xl:grid-cols-3')}
                >
                  {g.items.map((p) => (
                    <li key={p.documentId} className="h-full">
                      <article className="u-program group">
                        <div className="flex items-start justify-between gap-3">
                          <span className="u-program__level">{LEVEL_LABEL[p.level]}</span>
                          <PulseStar
                            active={has(p.documentId)}
                            onToggle={() => toggle(p.documentId)}
                            label={
                              has(p.documentId) ? 'Quitar de guardados' : 'Guardar para comparar'
                            }
                            size={30}
                          />
                        </div>
                        <h4 className="mt-4 font-display text-[1.3rem] leading-[1.15] text-fg [font-variation-settings:'opsz'_32,'SOFT'_30]">
                          {p.name}
                        </h4>
                        <dl className="u-program__facts">
                          <div>
                            <dt>Modalidad</dt>
                            <dd>
                              <span aria-hidden className="text-[var(--u-text)]">
                                {MODALITY_ICON[p.modality] ?? '◉'}
                              </span>{' '}
                              {MODALITY_LABEL[p.modality]}
                            </dd>
                          </div>
                          <div>
                            <dt>Duración</dt>
                            <dd>{p.duration ?? 'Por confirmar'}</dd>
                          </div>
                        </dl>
                        {p.infoUrl ? (
                          <Link
                            href={p.infoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="u-program__cta"
                          >
                            Ver ficha oficial en {name} <span aria-hidden>↗</span>
                          </Link>
                        ) : (
                          <span className="u-program__cta u-program__cta--muted">
                            Ficha oficial próximamente
                          </span>
                        )}
                      </article>
                    </li>
                  ))}
                </ul>
              </motion.section>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}

function Tab({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className="u-tab">
      {children}
      <span className="u-tab__count">{count}</span>
    </button>
  );
}

/** Foto del representante o, si no la hay, sus iniciales sobre una tinta. */
function Avatar({ name, photo }: { name: string; photo?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span
      data-depth
      style={{ '--z': 26 } as React.CSSProperties}
      className={cn(
        'relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--u-accent)] ring-offset-2 ring-offset-bg',
        // Con foto: un fondo claro del color de la universidad detrás de la ilustración
        photo
          ? 'bg-[radial-gradient(circle_at_30%_25%,#fff,color-mix(in_oklab,var(--u-primary)_20%,#fff))]'
          : 'bg-[linear-gradient(135deg,var(--u-primary),var(--u-surface))] text-[var(--u-on-surface)]'
      )}
    >
      {photo ? (
        <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
      ) : (
        <span
          className="grid h-full w-full place-items-center font-display text-[1.3rem]"
          style={{ fontVariationSettings: "'opsz' 32, 'WONK' 1" }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}

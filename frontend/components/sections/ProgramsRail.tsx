'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/lib/motion';
import { DepthCarousel, type DepthItem } from '@/components/ui/DepthCarousel';
import { PulseStar } from '@/components/ui/PulseStar';
import { LevelTabs, countByLevel, type LevelFilter } from '@/components/ui/LevelTabs';
import { useSavedPrograms } from '@/hooks/useSavedPrograms';
import { LEVEL_LABEL, MODALITY_LABEL, acronymOf } from '@/lib/format';
import { LEVEL_META } from '@/lib/levels';
import { cn } from '@/lib/cn';
import type { AcademicProgram } from '@/lib/types';

/**
 * Capítulo 03 · Programas. Arriba, el selector de nivel a lo grande (una losa por nivel con
 * cuántos programas hay y qué significa); abajo, el carrusel de profundidad (React Bits
 * `DepthCarousel`) con tarjetas coloreadas por nivel: la del frente se abre al hacer click,
 * las demás se traen al frente. Estrella de "guardar" en cada tarjeta.
 */
export function ProgramsRail({ programs }: { programs: AcademicProgram[] }) {
  const [level, setLevel] = useState<LevelFilter>('all');
  const router = useRouter();
  const { saved, has, toggle } = useSavedPrograms();
  const reduced = useReducedMotion();

  const counts = useMemo(() => countByLevel(programs, saved), [programs, saved]);
  const visible = useMemo(() => {
    if (level === 'all') return programs;
    if (level === 'saved') return programs.filter((p) => saved.includes(p.documentId));
    return programs.filter((p) => p.level === level);
  }, [programs, level, saved]);

  const open = (p: AcademicProgram) => {
    if (p.infoUrl) window.open(p.infoUrl, '_blank', 'noopener,noreferrer');
    else if (p.university) router.push(`/universidades/${p.university.documentId}`);
  };

  const items: DepthItem[] = visible.map((p) => ({
    key: p.documentId,
    label: p.name,
    onOpen: p.infoUrl || p.university ? () => open(p) : undefined,
    content: (
      <ProgramCard
        program={p}
        saved={has(p.documentId)}
        onToggleSave={() => toggle(p.documentId)}
      />
    ),
  }));

  const heading =
    level === 'all'
      ? 'Toda la oferta'
      : level === 'saved'
        ? 'Tus programas guardados'
        : LEVEL_META[level].plural;

  return (
    <div className="relative">
      <div className="container-x">
        <p className="ui-label mb-4 text-fg-muted">
          Elige un nivel para ver solo esos programas. Cada color se repite en las tarjetas de
          abajo.
        </p>
        <LevelTabs value={level} onChange={setLevel} counts={counts} />
      </div>

      <div className="container-x mt-10 flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className="text-[1.6rem] text-fg"
          style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 30" }}
        >
          {heading}
        </h3>
        <span className="ui-label text-fg-muted" aria-live="polite">
          {visible.length} programa{visible.length === 1 ? '' : 's'} · arrastra o usa las flechas
        </span>
      </div>

      {items.length ? (
        // El carrusel entra abriéndose en perspectiva, y vuelve a hacerlo al cambiar de nivel
        <motion.div
          key={level}
          className="[perspective:1600px]"
          initial={reduced ? false : { opacity: 0, x: 90, rotateY: -22, scale: 0.88 }}
          whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1.2, ease: EASE.premium }}
        >
          <DepthCarousel
            items={items}
            ariaLabel="Programas de posgrado"
            cardWidth={400}
            cardHeight={500}
            depth={240}
            spread={150}
            tilt={18}
            visibleCards={5}
            falloff={0.2}
            blur={3}
          />
        </motion.div>
      ) : (
        <p className="container-x mt-8 max-w-[44ch] text-fg-muted">
          {level === 'saved'
            ? 'No has guardado programas todavía. Marca la estrella en una tarjeta para tenerla aquí.'
            : 'Ningún programa de este nivel está publicado todavía. Prueba otro nivel o vuelve al catálogo completo.'}
        </p>
      )}
      <p className="ui-label container-x mt-2 text-center text-fg-muted">
        Click en la tarjeta del frente para abrir la ficha oficial o el perfil de la universidad
      </p>
    </div>
  );
}

function ProgramCard({
  program: p,
  saved,
  onToggleSave,
}: {
  program: AcademicProgram;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const meta = LEVEL_META[p.level];
  return (
    <article
      className="relative flex h-full flex-col justify-between overflow-hidden p-7 text-paper md:p-8"
      style={{
        background: `linear-gradient(160deg, ${meta.color}, color-mix(in oklab, ${meta.color} 55%, var(--color-ink)))`,
      }}
    >
      {/* Grano y luz para que la losa no sea un color plano */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.22),transparent_55%)]"
      />
      {/* Marca de agua: la inicial del nivel al fondo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -bottom-10 font-display text-[11rem] leading-none font-light tracking-[-0.06em] text-paper/10 select-none"
        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 80" }}
      >
        {meta.glyph}
      </span>

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="ui-label inline-block rounded-full bg-paper/20 px-2.5 py-0.5">
            {LEVEL_LABEL[p.level]}
          </span>
          <span className="mono-label mt-2 block text-paper/70">{acronymOf(p.university)}</span>
        </div>
        <PulseStar
          active={saved}
          onToggle={onToggleSave}
          label={saved ? 'Quitar de guardados' : 'Guardar programa'}
          size={34}
          className="border-paper/30 text-paper/85 hover:border-clay hover:text-clay"
        />
      </div>

      <h3
        className="relative mt-8 text-[1.85rem] leading-[1.06] text-paper"
        style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 30" }}
      >
        {p.name}
      </h3>

      <div className="relative mt-auto">
        <dl className="ui-label flex flex-wrap gap-x-4 gap-y-1 text-paper/80">
          <div>
            <dt className="sr-only">Modalidad</dt>
            <dd>{MODALITY_LABEL[p.modality]}</dd>
          </div>
          {p.duration && (
            <div>
              <dt className="sr-only">Duración</dt>
              <dd>{p.duration}</dd>
            </div>
          )}
        </dl>
        <span
          className={cn('mt-5 flex items-center justify-between border-t border-paper/25 pt-4')}
        >
          <span className="ui-label">{p.infoUrl ? 'Ficha oficial' : 'Ir a la universidad'}</span>
          <span className="font-display text-[1.3rem] leading-none" aria-hidden>
            {p.infoUrl ? '↗' : '→'}
          </span>
        </span>
      </div>
    </article>
  );
}

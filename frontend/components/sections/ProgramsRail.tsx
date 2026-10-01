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
    <article className="program-card" style={{ '--lv': meta.color } as React.CSSProperties}>
      <div className="relative flex items-start justify-between gap-3">
        <p className="program-card__kicker">
          <span>{LEVEL_LABEL[p.level]}</span>
          <span aria-hidden>·</span>
          <span>{acronymOf(p.university)}</span>
        </p>
        <PulseStar
          active={saved}
          onToggle={onToggleSave}
          label={saved ? 'Quitar de guardados' : 'Guardar programa'}
          size={34}
          className="border-paper/30 text-paper/85 hover:border-clay hover:text-clay"
        />
      </div>

      <h3 className="program-card__title">{p.name}</h3>

      <div className="relative mt-auto">
        <dl className="program-card__facts">
          <div>
            <dt>Modalidad</dt>
            <dd>{MODALITY_LABEL[p.modality]}</dd>
          </div>
          {p.duration && (
            <div>
              <dt>Duración</dt>
              <dd>{p.duration}</dd>
            </div>
          )}
        </dl>
        <span className="program-card__go">
          <span>{p.infoUrl ? 'Ver la ficha oficial' : 'Ir a la universidad'}</span>
          <span aria-hidden>{p.infoUrl ? '↗' : '→'}</span>
        </span>
      </div>
    </article>
  );
}

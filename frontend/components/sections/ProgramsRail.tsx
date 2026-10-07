'use client';

import { useRouter } from 'next/navigation';
import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/lib/motion';
import {
  DepthCarousel,
  type DepthCarouselApi,
  type DepthItem,
} from '@/components/ui/DepthCarousel';
import { PulseStar } from '@/components/ui/PulseStar';
import { LevelTabs, countByLevel, type LevelFilter } from '@/components/ui/LevelTabs';
import { ModalityIcon } from '@/components/ui/ModalityIcon';
import { Button } from '@/components/ui/Button';
import { Note } from '@/components/ui/Note';
import { useSavedPrograms } from '@/hooks/useSavedPrograms';
import { LEVEL_LABEL, MODALITY_LABEL, acronymOf, programBrief } from '@/lib/format';
import { LEVEL_META } from '@/lib/levels';
import type { AcademicProgram } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';

/**
 * Capítulo 03 · Programas, "el fichero" (DESIGN_NOTES §29.5). Arriba, el selector de nivel; abajo,
 * el fichero de una biblioteca: cada programa es una ficha de catálogo (papel rayado, signatura en
 * el margen, sello de su universidad, perforación) con la pestaña en el color de su nivel y en su
 * propia altura, como los separadores de un cajón. Las fichas van en el carrusel de profundidad
 * (React Bits `DepthCarousel`, con sus flechas y su animación intactas); a la izquierda, la ficha
 * del frente abierta (dónde se imparte, ejes, a quién va dirigida); debajo, el canto del cajón: una
 * raya por ficha, en el color de su nivel, para ver dónde estás y saltar a cualquiera.
 */
export function ProgramsRail({ programs }: { programs: AcademicProgram[] }) {
  const [level, setLevel] = useState<LevelFilter>('all');
  const [active, setActive] = useState(0);
  // La ficha abierta solo anima el cambio cuando el visitante mueve el fichero (no al cargar)
  const [moved, setMoved] = useState(false);
  const router = useRouter();
  const { saved, has, toggle } = useSavedPrograms();
  const reduced = useReducedMotion();
  const deck = useRef<DepthCarouselApi | null>(null);

  const counts = useMemo(() => countByLevel(programs, saved), [programs, saved]);
  const visible = useMemo(() => {
    if (level === 'all') return programs;
    if (level === 'saved') return programs.filter((p) => saved.includes(p.documentId));
    return programs.filter((p) => p.level === level);
  }, [programs, level, saved]);

  const pickLevel = useCallback((l: LevelFilter) => {
    setLevel(l);
    setActive(0);
  }, []);

  const open = (p: AcademicProgram) => {
    if (p.infoUrl) window.open(p.infoUrl, '_blank', 'noopener,noreferrer');
    else if (p.university) router.push(`/universidades/${p.university.documentId}`);
  };

  // Las partes de cada descripción, una sola vez (no en cada cambio de ficha)
  const briefs = useMemo(
    () => new Map(programs.map((p) => [p.documentId, programBrief(p.description, p)])),
    [programs]
  );

  // Las fichas no dependen de cuál está al frente: al mover el fichero no se vuelven a crear
  const items: DepthItem[] = useMemo(
    () =>
      visible.map((p, i) => ({
        key: p.documentId,
        label: p.name,
        className: `fslot fslot--${p.level}`,
        onOpen: p.infoUrl || p.university ? () => open(p) : undefined,
        content: (
          <FileCard
            program={p}
            topics={briefs.get(p.documentId)?.axes ?? []}
            number={i + 1}
            saved={has(p.documentId)}
            onToggleSave={() => toggle(p.documentId)}
          />
        ),
      })),
    // `open` solo usa el router, que no cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible, briefs, has, toggle]
  );

  const heading =
    level === 'all'
      ? 'Toda la oferta'
      : level === 'saved'
        ? 'Tus programas guardados'
        : LEVEL_META[level].plural;
  // Al recorrer el canto de un tirón, la ficha abierta se pone al día sin frenar al fichero
  const opened = useDeferredValue(active);
  const current = visible[Math.min(opened, visible.length - 1)];

  return (
    <div className="relative">
      <div className="container-x">
        <p className="ui-label mb-4 text-fg-muted" data-reveal="fade">
          Elige un nivel para ver solo esos programas. Cada color se repite en las pestañas de las
          fichas.
        </p>
        <StableLevelTabs value={level} onChange={pickLevel} counts={counts} />
      </div>

      <div
        className="container-x mt-12 flex flex-wrap items-baseline justify-between gap-2"
        data-reveal="up"
      >
        <h3 className="fichero__heading">{heading}</h3>
        <span className="ui-label text-fg-muted" aria-live="polite">
          {visible.length} ficha{visible.length === 1 ? '' : 's'} · arrastra o usa las flechas
        </span>
      </div>

      {items.length && current ? (
        <div className="container-x fichero" key={level}>
          <OpenFile
            program={current}
            brief={briefs.get(current.documentId)}
            number={Math.min(opened, visible.length - 1) + 1}
            total={visible.length}
            swap={moved}
          />

          {/* El fichero entra abriéndose en perspectiva, y vuelve a hacerlo al cambiar de nivel */}
          <motion.div
            className="fichero__deck [perspective:1600px]"
            initial={reduced ? false : { opacity: 0, x: 90, rotateY: -22, scale: 0.88 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 1.2, ease: EASE.premium }}
          >
            <DepthCarousel
              items={items}
              apiRef={deck}
              onChange={(i) => {
                setActive(i);
                setMoved(true);
              }}
              className="depth-carousel--fichero"
              ariaLabel="Fichero de programas de posgrado"
              cardWidth={380}
              cardHeight={480}
              radius={0}
              depth={240}
              spread={150}
              tilt={18}
              visibleCards={5}
              falloff={0.2}
              showIndicators={false}
            />
          </motion.div>

          <FileEdge programs={visible} active={active} onPick={(i) => deck.current?.goTo(i)} />
        </div>
      ) : (
        <p className="container-x mt-8 max-w-[44ch] text-fg-muted">
          {level === 'saved'
            ? 'No has guardado programas todavía. Marca la estrella en una ficha para tenerla aquí.'
            : 'Ningún programa de este nivel está publicado todavía. Prueba otro nivel o vuelve al catálogo completo.'}
        </p>
      )}
    </div>
  );
}

/**
 * El selector de nivel no cambia al mover el fichero: memorizado, no se vuelve a dibujar en cada
 * ficha (su fondo deslizante mide el diseño en cada render, y con el canto eso era cada fotograma).
 */
const StableLevelTabs = memo(LevelTabs);

/** Una ficha de catálogo. */
function FileCard({
  program: p,
  topics,
  number,
  saved,
  onToggleSave,
}: {
  program: AcademicProgram;
  topics: string[];
  number: number;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const meta = LEVEL_META[p.level];
  const acr = acronymOf(p.university);
  return (
    // La altura de la pestaña la pone el marco (`fslot--Nivel`), que también recorta el velo
    <article className="fcard" style={{ '--lv': meta.color } as CSSProperties}>
      <span className="fcard__tab" aria-hidden>
        <b>{meta.glyph}</b>
        {LEVEL_LABEL[p.level]}
      </span>
      <div className="fcard__sheet">
        {/* Signatura en el margen, como en las fichas de biblioteca */}
        <p className="fcard__call" aria-hidden>
          <b>{meta.glyph}</b>
          <span>{acr}</span>
          <span>{String(number).padStart(3, '0')}</span>
        </p>
        <div className="fcard__star">
          <PulseStar
            active={saved}
            onToggle={onToggleSave}
            label={saved ? 'Quitar de guardados' : 'Guardar programa'}
            size={34}
            className="border-ink/20 text-ink/55 hover:border-clay hover:text-clay"
          />
        </div>

        <h3 className="fcard__title">{p.name}</h3>

        <dl className="fcard__fields">
          <div>
            <dt>Universidad</dt>
            <dd>{acr}</dd>
          </div>
          <div>
            <dt>Modalidad</dt>
            <dd>
              <ModalityIcon modality={p.modality} className="fcard__icon" />
              {MODALITY_LABEL[p.modality]}
            </dd>
          </div>
          {p.duration && (
            <div>
              <dt>Duración</dt>
              <dd>{p.duration}</dd>
            </div>
          )}
          {topics.length > 0 && (
            <div className="fcard__topics">
              <dt>Temas</dt>
              <dd>{topics.join(' · ')}</dd>
            </div>
          )}
        </dl>

        <span className="fcard__stamp" aria-hidden>
          <b>{acr}</b>
          <small>Posgrado</small>
        </span>

        <span className="fcard__go">
          <span>{p.infoUrl ? 'Ver la ficha oficial' : 'Ir a la universidad'}</span>
          <Arrow dir={p.infoUrl ? 'up-right' : 'right'} />
        </span>
        <span className="fcard__hole" aria-hidden />
      </div>
    </article>
  );
}

/** La ficha del frente, abierta: lo que la ficha pequeña no alcanza a decir. */
function OpenFile({
  program: p,
  brief = programBrief(p.description, p),
  number,
  total,
  swap,
}: {
  program: AcademicProgram;
  brief?: ReturnType<typeof programBrief>;
  number: number;
  total: number;
  swap: boolean;
}) {
  const meta = LEVEL_META[p.level];
  const acr = acronymOf(p.university);
  return (
    <aside
      className="fichero__open"
      aria-label="Ficha del frente"
      aria-live="polite"
      data-reveal="left"
    >
      {/* La clave reinicia la entrada: cada ficha nueva "se saca" del cajón */}
      <div
        key={p.documentId}
        className={swap ? 'fopen fopen--swap' : 'fopen'}
        style={{ '--lv': meta.color } as CSSProperties}
      >
        <p className="fopen__count">
          <span>Ficha</span> <b>{String(number).padStart(3, '0')}</b> <span>de {total}</span>
        </p>
        <p className="fopen__level">
          <span className="fopen__glyph" aria-hidden>
            {meta.glyph}
          </span>
          {LEVEL_LABEL[p.level]} · {meta.span}
        </p>
        <h4 className="fopen__name">{p.name}</h4>
        {p.university && (
          <p className="fopen__where">
            {p.university.name}
            {brief.where && <span> · {brief.where}</span>}
          </p>
        )}
        {brief.lead && <p className="fopen__lead">{brief.lead}</p>}
        {brief.axes.length > 0 && (
          <div className="fopen__axes">
            <p>Lo que se estudia</p>
            <ul>
              {brief.axes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}
        {brief.audience && (
          <p className="fopen__for">
            <span className="fopen__hand">para</span> {brief.audience}
          </p>
        )}
        <div className="fopen__actions">
          {p.infoUrl && (
            <Button href={p.infoUrl} external arrow="up-right">
              Ficha oficial
            </Button>
          )}
          {p.university && (
            <Button href={`/universidades/${p.university.documentId}`} variant="ghost">
              Perfil de {acr}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

/**
 * El canto del cajón: una raya por ficha, en el color de su nivel. Muestra dónde está la ficha del
 * frente; al pasar el cursor dice cuál es cada una y con click (o arrastrando) el fichero salta a
 * ella. Para teclado y lectores de pantalla es un deslizador.
 */
function FileEdge({
  programs,
  active,
  onPick,
}: {
  programs: AcademicProgram[];
  active: number;
  onPick: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState<number | null>(null);
  // Al arrastrar, la marca y el título siguen al dedo; el fichero salta al soltar (antes recorría
  // de un tirón decenas de fichas con su animación y se trababa)
  const [scrub, setScrub] = useState<number | null>(null);
  const dragging = useRef(false);
  const n = programs.length;

  // Las rayas no cambian al moverse: lo que se mueve es una sola marca (antes cada raya animaba su
  // altura y, al recorrer el canto de un tirón, decenas de rayas animándose a la vez trababan)
  const bars = useMemo(
    () =>
      programs.map((q) => (
        <span
          key={q.documentId}
          className="fedge__bar"
          style={{ '--lv': LEVEL_META[q.level].color } as CSSProperties}
        />
      )),
    [programs]
  );

  const indexAt = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !n) return 0;
    return Math.min(n - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * n)));
  };
  const at = (i: number) => `${((i + 0.5) / n) * 100}%`;
  const end = () => {
    dragging.current = false;
    setScrub(null);
  };

  const cur = scrub ?? active;
  const shown = scrub ?? peek ?? active;
  const p = programs[shown];
  return (
    <div className="fichero__edge" style={{ '--n': n } as CSSProperties}>
      <div className="fedge__label" aria-hidden>
        <span
          className="fedge__peek"
          style={{ '--f': (shown + 0.5) / n } as CSSProperties}
          data-on={peek !== null || scrub !== null}
        >
          {p ? `${String(shown + 1).padStart(3, '0')} · ${p.name}` : ''}
        </span>
      </div>
      <div
        className="fedge"
        role="slider"
        tabIndex={0}
        aria-label="Canto del fichero: elige una ficha"
        aria-valuemin={1}
        aria-valuemax={n}
        aria-valuenow={active + 1}
        aria-valuetext={
          programs[active] ? `${programs[active].name}, ficha ${active + 1} de ${n}` : undefined
        }
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setScrub(indexAt(e.clientX));
        }}
        onPointerMove={(e) => {
          const i = indexAt(e.clientX);
          if (e.pointerType === 'mouse' && i !== peek) setPeek(i);
          if (dragging.current && i !== scrub) setScrub(i);
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return;
          const i = scrub ?? indexAt(e.clientX);
          end();
          if (i !== active) onPick(i);
        }}
        onPointerCancel={end}
        onPointerLeave={() => setPeek(null)}
        onKeyDown={(e) => {
          const to =
            e.key === 'ArrowRight' || e.key === 'ArrowUp'
              ? active + 1
              : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
                ? active - 1
                : e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? n - 1
                    : null;
          if (to === null) return;
          e.preventDefault();
          onPick(Math.min(n - 1, Math.max(0, to)));
        }}
      >
        <div ref={ref} className="fedge__bars">
          {bars}
          {peek !== null && peek !== cur && (
            <span
              aria-hidden
              className="fedge__ghost"
              style={
                {
                  left: at(peek),
                  '--lv': LEVEL_META[programs[peek].level].color,
                } as CSSProperties
              }
            />
          )}
          {programs[cur] && (
            <span
              aria-hidden
              className="fedge__mark"
              data-scrub={scrub !== null || undefined}
              style={
                {
                  left: at(cur),
                  '--lv': LEVEL_META[programs[cur].level].color,
                } as CSSProperties
              }
            />
          )}
        </div>
      </div>
      <p className="fedge__foot">
        <Note tilt={-2} at={300}>
          cada raya es una ficha: tócala y sale al frente
        </Note>
      </p>
    </div>
  );
}

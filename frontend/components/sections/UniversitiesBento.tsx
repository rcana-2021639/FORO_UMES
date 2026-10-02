'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, ViewTransition } from 'react';
import { PixelSwap } from '@/components/ui/PixelSwap';
import { mediaUrl } from '@/lib/api';
import { LEVEL_LABEL, excerpt, yearOf, type LevelCounts } from '@/lib/format';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useQuality } from '@/lib/quality';
import { brandOf } from '@/lib/universities';
import type { University } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';

/**
 * Las nueve universidades en una retícula de losas iguales: ninguna es más grande que otra (el
 * Foro es neutral). En reposo, cada losa es una ficha (v5): sello y sigla, nombre completo y una
 * línea con cuántos programas ofrece y desde cuándo está en el Foro. Al pasar el cursor o el foco
 * se da la vuelta por píxeles (React Bits `PixelSwap`) y muestra el reverso con el color
 * institucional de esa universidad: un adelanto de su perfil. En modo liviano el reverso entra
 * con un barrido de máscara en CSS en vez de los píxeles.
 */
export function UniversitiesBento({
  universities,
  programCounts = {},
  levels = {},
}: {
  universities: University[];
  /** Programas publicados por universidad (documentId → cantidad). */
  programCounts?: Record<string, number>;
  /** Programas por nivel de cada universidad: el filete de la ficha es ese espectro. */
  levels?: Record<string, LevelCounts>;
}) {
  const reduced = useReducedMotion();
  const lite = useQuality() !== 'full';

  return (
    <ul
      data-reveal-stagger="tilt"
      className="uni-grid grid auto-rows-[6.4rem] grid-cols-1 gap-2 [perspective:1600px] sm:auto-rows-[13rem] sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
    >
      {universities.length === 0 && (
        <li className="col-span-full max-w-[44ch] text-fg-muted">
          Todavía no hay universidades publicadas. Aparecerán aquí en cuanto el Foro las cargue.
        </li>
      )}
      {universities.map((u, i) => (
        <Cell
          key={u.documentId}
          u={u}
          i={i}
          reduced={reduced}
          lite={lite}
          programs={programCounts[u.documentId]}
          levels={levels[u.documentId]}
        />
      ))}
    </ul>
  );
}

function Cell({
  u,
  i,
  reduced,
  lite,
  programs,
  levels,
}: {
  u: University;
  i: number;
  reduced: boolean;
  lite: boolean;
  programs?: number;
  levels?: LevelCounts;
}) {
  const [on, setOn] = useState(false);
  // Si el archivo del logo no carga (seed incompleto, CDN caído), la sigla ocupa su lugar
  const [logoBroken, setLogoBroken] = useState(false);
  const joined = yearOf(u.joinedForumAt);
  const logo = logoBroken ? null : mediaUrl(u.logo?.formats?.small?.url ?? u.logo?.url);
  const b = brandOf(u.acronym);
  const domain = u.website?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '') ?? '';
  const hoverTimer = useRef(0);
  // Intención de hover: la losa solo se da la vuelta si el cursor se detiene sobre ella. Barrer
  // el cursor por encima de todas ya no dispara nueve transiciones a la vez.
  const enter = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOn(true), 120);
  };
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);
  const leave = () => {
    window.clearTimeout(hoverTimer.current);
    setOn(false);
  };

  const count = programs ? `${programs} ${programs === 1 ? 'programa' : 'programas'}` : null;

  const front = (
    <div className="uni-face">
      <div className="flex items-start justify-between gap-3">
        {logo ? (
          <Image
            src={logo}
            alt=""
            width={144}
            height={144}
            onError={() => setLogoBroken(true)}
            className="uni-face__seal"
          />
        ) : (
          <span aria-hidden className="uni-face__seal uni-face__seal--text">
            {(u.acronym ?? u.name).slice(0, 3)}
          </span>
        )}
        <span className="uni-face__acronym">{u.acronym ?? ''}</span>
      </div>
      <div>
        <p className="uni-face__name">{u.name}</p>
        {levels && <Spectrum levels={levels} />}
        <p className="uni-face__meta">
          <span>
            {count ?? (joined ? `En el Foro desde ${joined}` : domain || 'Guatemala')}
            {/* En el teléfono cabe una sola línea: el año queda para pantallas anchas */}
            {count && joined && <span className="hidden sm:inline"> · desde {joined}</span>}
          </span>
          <span aria-hidden className="uni-face__arrow">
            <Arrow />
          </span>
        </p>
      </div>
    </div>
  );

  const back = (
    <div
      className="flex h-full flex-col justify-between p-4 sm:p-6"
      style={{ background: b.surface, color: b.onSurface }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="mono-label opacity-80">{u.acronym ?? domain}</span>
        <span
          className="ui-label hidden rounded-full px-2.5 py-0.5 sm:inline"
          style={{ background: b.accent, color: b.onAccent }}
        >
          {joined ? `En el Foro desde ${joined}` : 'Perfil completo'}
        </span>
      </div>
      <div>
        <p
          className="line-clamp-3 font-display text-[0.9rem] leading-[1.3] sm:line-clamp-4 sm:text-[1.02rem]"
          style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 40" }}
        >
          {u.shortDescription ? excerpt(u.shortDescription, 150) : u.name}
        </p>
        <span
          className="ui-label mt-4 inline-flex items-center gap-2 border-b pb-0.5"
          style={{ borderColor: b.accent }}
        >
          Abrir perfil <Arrow />
        </span>
      </div>
    </div>
  );

  return (
    <li
      className="group relative"
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocusCapture={() => setOn(true)}
      onBlurCapture={() => setOn(false)}
    >
      {/* Al abrir el perfil, la losa (ya con su color) crece hasta ser la cabecera (§28.3) */}
      <ViewTransition
        name={`uni-${u.documentId}`}
        share={{ 'uni-tile': 'uni-morph', default: 'none' }}
        default="none"
      >
        <Link
          href={`/universidades/${u.documentId}`}
          transitionTypes={['uni-tile']}
          aria-label={`${u.name}: abrir perfil`}
          className="uni-tile relative block h-full overflow-hidden rounded-[10px]"
          style={{ '--u-ring': b.primary } as React.CSSProperties}
        >
          {lite || reduced ? (
            <div className="relative h-full">
              {front}
              <div className="uni-tile__back absolute inset-0" data-on={on}>
                {back}
              </div>
            </div>
          ) : (
            <PixelSwap
              active={on}
              pixelSize={42}
              pattern={i % 2 ? 'diagonal' : 'spiral'}
              duration={760}
              firstContent={front}
              secondContent={back}
            />
          )}
        </Link>
      </ViewTransition>
    </li>
  );
}

/**
 * El filete de la ficha es su oferta: un tramo por nivel, de largo proporcional a cuántos programas
 * tiene (maestrías, doctorados, especializaciones, diplomados, con los colores del catálogo). Se
 * llena con el scroll y engrosa al pasar el cursor.
 */
function Spectrum({ levels }: { levels: LevelCounts }) {
  const parts = LEVELS.filter((l) => levels[l] > 0);
  const title = parts
    .map(
      (l) =>
        `${levels[l]} ${levels[l] === 1 ? LEVEL_LABEL[l].toLowerCase() : LEVEL_META[l].plural.toLowerCase()}`
    )
    .join(' · ');
  return (
    <span className="uni-face__spectrum" title={title} aria-label={title} role="img">
      {parts.map((l, i) => (
        <span
          key={l}
          style={
            {
              flexGrow: levels[l],
              background: LEVEL_META[l].color,
              '--i': i,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

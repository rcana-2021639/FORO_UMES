'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { PixelSwap } from '@/components/ui/PixelSwap';
import { mediaUrl } from '@/lib/api';
import { excerpt, yearOf } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useQuality } from '@/lib/quality';
import { brandOf } from '@/lib/universities';
import type { University } from '@/lib/types';

/**
 * Las nueve universidades en una retícula de losas iguales: ninguna silla es más grande que
 * otra (el Foro es neutral). En reposo las losas son de piedra; al pasar el cursor o el foco se
 * dan la vuelta por píxeles (React Bits `PixelSwap`) y muestran el reverso con el color
 * institucional de esa universidad: un adelanto de su perfil. En modo liviano el reverso entra
 * con un barrido de máscara en CSS en vez de los píxeles.
 */
export function UniversitiesBento({ universities }: { universities: University[] }) {
  const reduced = useReducedMotion();
  const lite = useQuality() !== 'full';

  return (
    <ul
      data-reveal-stagger="tilt"
      className="grid auto-rows-[10.5rem] grid-cols-2 gap-2.5 [perspective:1600px] sm:auto-rows-[13.5rem] sm:gap-3 lg:grid-cols-3"
    >
      {universities.length === 0 && (
        <li className="col-span-full max-w-[44ch] text-fg-muted">
          Todavía no hay universidades publicadas. Aparecerán aquí en cuanto el Foro las cargue.
        </li>
      )}
      {universities.map((u, i) => (
        <Cell key={u.documentId} u={u} i={i} reduced={reduced} lite={lite} />
      ))}
    </ul>
  );
}

function Cell({
  u,
  i,
  reduced,
  lite,
}: {
  u: University;
  i: number;
  reduced: boolean;
  lite: boolean;
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

  const front = (
    <div className="flex h-full flex-col justify-between bg-[color-mix(in_oklab,var(--fg)_4%,var(--bg))] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="mono-label flex items-center gap-2 text-fg-muted">
          {/* Una sola marca de su color: identifica sin teñir la losa */}
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: b.primary }} />
          {domain || 'Guatemala'}
        </span>
        {joined && <span className="ui-label hidden text-fg-muted sm:inline">desde {joined}</span>}
      </div>
      <div>
        {logo ? (
          <Image
            src={logo}
            alt=""
            width={144}
            height={144}
            onError={() => setLogoBroken(true)}
            className="h-12 w-auto object-contain transition-transform duration-700 ease-(--ease-out-premium) group-hover:scale-105 sm:h-[4.5rem]"
          />
        ) : (
          <span
            className="block font-display text-[2rem] leading-none font-light tracking-[-0.03em] text-fg sm:text-[2.6rem]"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
          >
            {u.acronym ?? u.name.slice(0, 3)}
          </span>
        )}
        <p className="mt-2 line-clamp-2 max-w-[30ch] text-[0.82rem] leading-snug text-fg sm:text-[0.98rem]">
          {u.name}
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
          Abrir perfil <span aria-hidden>→</span>
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
      <Link
        href={`/universidades/${u.documentId}`}
        aria-label={`${u.name}: abrir perfil`}
        className="uni-tile relative block h-full overflow-hidden rounded-[14px] border border-line/70"
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
    </li>
  );
}

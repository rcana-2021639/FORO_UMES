'use client';

import Image from 'next/image';
import { useRef, useState, type CSSProperties } from 'react';
import { ImageSquareIcon, PlayCircleIcon } from '@phosphor-icons/react/dist/ssr';

export interface FanPhoto {
  id: string;
  src: string;
  alt: string;
}

interface Drag {
  i: number;
  el: HTMLElement;
  x: number;
  y: number;
  ox: number;
  oy: number;
  lastX: number;
  lastT: number;
  vx: number;
  moved: boolean;
}

/** Hasta dónde se puede llevar una foto (no se sale de la mesa). */
const LIMIT = { x: 220, y: 120 };
const clamp = (v: number, m: number) => Math.min(m, Math.max(-m, v));

/**
 * Cabecera de /galeria (DESIGN_NOTES §29.8): una mesa con cuatro polaroids. Entran abriéndose en
 * abanico (como antes) y cada una lleva su pie escrito a mano. Se pueden **tomar y arrastrar**: la
 * que se toma sube encima de las demás y, al soltarla, queda girada según cómo se lanzó; un toque
 * sin arrastre solo la sube. "Ordenar la mesa" las devuelve al abanico. Durante el arrastre solo se
 * escriben dos propiedades registradas (`--dx`, `--dy`, sin herencia) en la foto que se mueve.
 */
export function PhotoFan({
  photos,
  counts,
}: {
  photos: FanPhoto[];
  counts: { photos: number; videos: number };
}) {
  const prints = photos.slice(0, 4);
  // Orden de apilado: la última está encima
  const [order, setOrder] = useState(() => prints.map((_, i) => i));
  const [moved, setMoved] = useState<Record<number, { x: number; y: number; r: number }>>({});
  const drag = useRef<Drag | null>(null);

  const toTop = (i: number) => setOrder((o) => [...o.filter((x) => x !== i), i]);

  const down = (i: number, e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const m = moved[i] ?? { x: 0, y: 0, r: 0 };
    drag.current = {
      i,
      el,
      x: e.clientX,
      y: e.clientY,
      ox: m.x,
      oy: m.y,
      lastX: e.clientX,
      lastT: e.timeStamp,
      vx: 0,
      moved: false,
    };
    toTop(i);
  };
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 4) {
      d.moved = true;
      d.el.setAttribute('data-drag', '');
    }
    if (!d.moved) return;
    const now = e.timeStamp;
    d.vx = (e.clientX - d.lastX) / Math.max(now - d.lastT, 1);
    d.lastX = e.clientX;
    d.lastT = now;
    d.el.style.setProperty('--dx', `${clamp(d.ox + dx, LIMIT.x)}px`);
    d.el.style.setProperty('--dy', `${clamp(d.oy + dy, LIMIT.y)}px`);
  };
  const up = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    d.el.removeAttribute('data-drag');
    const x = clamp(d.ox + e.clientX - d.x, LIMIT.x);
    const y = clamp(d.oy + e.clientY - d.y, LIMIT.y);
    // Al soltarla queda girada hacia donde se lanzó
    const r = clamp(d.vx * 9, 14);
    d.el.style.removeProperty('--dx');
    d.el.style.removeProperty('--dy');
    setMoved((m) => ({ ...m, [d.i]: { x, y, r } }));
  };

  const touched = Object.keys(moved).length > 0;

  return (
    <figure className="photo-fan" aria-label="Algunas fotos del archivo, sobre una mesa">
      <div className="photo-fan__stack">
        {prints.map((p, i) => {
          const m = moved[i];
          return (
            <span
              key={p.id}
              className="photo-fan__card"
              style={
                {
                  '--i': i,
                  zIndex: order.indexOf(i) + 1,
                  ...(m ? { '--dx': `${m.x}px`, '--dy': `${m.y}px`, '--dr': `${m.r}deg` } : {}),
                } as CSSProperties
              }
              onPointerDown={(e) => down(i, e)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
            >
              <span className="photo-fan__photo">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="240px"
                  className="object-cover"
                  draggable={false}
                />
              </span>
              <span aria-hidden className="photo-fan__caption">
                {p.alt || 'Foro'}
              </span>
            </span>
          );
        })}
      </div>
      <figcaption className="photo-fan__cap">
        <span>
          <ImageSquareIcon aria-hidden weight="duotone" /> <b>{counts.photos}</b> fotos
        </span>
        <span>
          <PlayCircleIcon aria-hidden weight="duotone" /> <b>{counts.videos}</b> videos
        </span>
        {touched ? (
          <button type="button" className="photo-fan__tidy" onClick={() => setMoved({})}>
            ↺ ordenar la mesa
          </button>
        ) : (
          <span aria-hidden className="photo-fan__hint">
            toma una foto y muévela
          </span>
        )}
      </figcaption>
    </figure>
  );
}

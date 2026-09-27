'use client';

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

type SplitBy = 'char' | 'word' | 'line';
type Hinge = 'top' | 'bottom' | 'left' | 'right';
type Trigger = 'mount' | 'hover' | 'scroll' | 'loop';

export interface FoldTextProps {
  text: string;
  splitBy?: SplitBy;
  hinge?: Hinge;
  duration?: number;
  stagger?: number;
  ease?: string;
  perspective?: number;
  creaseShading?: number;
  trigger?: Trigger;
  /** Posición del ScrollTrigger cuando `trigger="scroll"`. */
  start?: string;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

const HINGE: Record<Hinge, { origin: string; rx: number; ry: number }> = {
  top: { origin: '50% 0%', rx: -92, ry: 0 },
  bottom: { origin: '50% 100%', rx: 92, ry: 0 },
  left: { origin: '0% 50%', rx: 0, ry: 92 },
  right: { origin: '100% 50%', rx: 0, ry: -92 },
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Texto que se despliega como una hoja doblada: cada carácter/palabra/línea gira sobre una
 * bisagra (arriba, abajo, izquierda o derecha) con un sombreado de pliegue. Adaptado de React
 * Bits `FoldText`: hereda tipografía del padre (Fraunces en títulos), estilos en globals.css,
 * y registra GSAP desde lib/gsap. Con reduced-motion el pliegue se reduce a un fade corto.
 */
export function FoldText({
  text,
  splitBy = 'word',
  hinge = 'bottom',
  duration = 0.7,
  stagger = 0.05,
  ease = 'power3.out',
  perspective = 700,
  creaseShading = 0.5,
  trigger = 'scroll',
  start = 'top 82%',
  delay = 0,
  className,
  style,
  as: Tag = 'span',
}: FoldTextProps) {
  const root = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const h = HINGE[hinge];
  const crease = clamp(creaseShading, 0, 1);
  const persp = Math.max(120, perspective);

  const segments = useMemo(() => {
    let n = 0;
    const seg = (content: string, key: string, split: SplitBy = splitBy): ReactNode => {
      n += 1;
      return (
        <span
          className="fold-text-segment"
          data-fold-split={split}
          key={key}
          style={{ '--fold-perspective': `${persp}px` } as CSSProperties}
        >
          <span
            className="fold-text-piece"
            data-fold-hinge={hinge}
            style={{ transformOrigin: h.origin, '--fold-crease': 0 } as CSSProperties}
          >
            {content || ' '}
          </span>
        </span>
      );
    };
    if (splitBy === 'line')
      return text.split('\n').map((line, i) => (
        <span className="fold-text-line" key={`l${i}`}>
          {seg(line || ' ', `sl${i}`, 'line')}
        </span>
      ));
    if (splitBy === 'word')
      return text.split(/(\s+)/).flatMap((part, i) => {
        if (!part) return [];
        if (/^\s+$/.test(part)) return <span key={`ws${i}`}> </span>;
        return seg(part, `sw${n}`);
      });
    return Array.from(text).map((ch, i) =>
      ch === '\n' ? <br key={`br${i}`} /> : seg(ch === ' ' ? ' ' : ch, `sc${i}`)
    );
  }, [text, splitBy, hinge, h.origin, persp]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const pieces = Array.from(el.querySelectorAll<HTMLElement>('.fold-text-piece'));
    if (!pieces.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = {
      opacity: 0,
      rotateX: reduced ? 0 : h.rx,
      rotateY: reduced ? 0 : h.ry,
      '--fold-crease': reduced ? 0 : crease,
      transformOrigin: h.origin,
      force3D: true,
    };
    const to = {
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      '--fold-crease': 0,
      duration: reduced ? Math.min(duration, 0.22) : duration,
      ease: reduced ? 'power1.out' : ease,
      stagger: reduced ? Math.min(stagger, 0.02) : stagger,
      clearProps: 'willChange',
    };
    const kill = () => {
      tl.current?.kill();
      tl.current = null;
      gsap.killTweensOf(pieces);
    };
    const play = (repeat: boolean) => {
      kill();
      tl.current = gsap.timeline({
        repeat: repeat ? -1 : 0,
        repeatDelay: repeat ? 0.75 : 0,
        delay,
      });
      tl.current.fromTo(pieces, from, to);
    };

    let st: ScrollTrigger | undefined;
    let hover: (() => void) | undefined;
    if (trigger === 'hover') {
      gsap.set(pieces, { opacity: 1, rotateX: 0, rotateY: 0, '--fold-crease': 0 });
      hover = () => play(false);
      el.addEventListener('mouseenter', hover);
    } else if (trigger === 'scroll') {
      gsap.set(pieces, from);
      st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => play(false) });
    } else if (trigger === 'loop') play(true);
    else play(false);

    return () => {
      if (hover) el.removeEventListener('mouseenter', hover);
      st?.kill();
      kill();
    };
  }, [
    text,
    splitBy,
    hinge,
    duration,
    stagger,
    ease,
    crease,
    trigger,
    start,
    delay,
    h.origin,
    h.rx,
    h.ry,
  ]);

  return (
    <Tag
      ref={root as React.RefObject<never>}
      className={['fold-text', splitBy === 'word' && 'fold-text--words', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden className="fold-text-visual">
        {segments}
      </span>
    </Tag>
  );
}

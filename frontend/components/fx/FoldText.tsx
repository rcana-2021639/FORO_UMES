'use client';

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { Scribble, type ScribbleKind } from '@/components/ui/Scribble';

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
  delay?: number;
  className?: string;
  style?: CSSProperties;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
  /**
   * Una palabra marcada a mano (v7): se subraya, se encierra o se resalta con un trazo que se
   * dibuja justo después de que esa palabra se despliega. Solo con `splitBy="word"`.
   */
  mark?: { word: string; kind: ScribbleKind };
}

/** Compara palabras sin tildes, mayúsculas ni signos de puntuación. */
const bare = (w: string) =>
  w
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();

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
 * Bits `FoldText`: hereda tipografía del padre (Fraunces en títulos), estilos en globals.css.
 *
 * Con `trigger` "scroll" o "mount" (lo normal) la entrada la hace el script de arranque
 * (data-reveal="fold", lib/quality-script.ts): empieza en el primer pintado y no toca el DOM, así
 * que no hay parpadeo al hidratar. "hover" y "loop" siguen con GSAP porque se repiten.
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
  delay = 0,
  className,
  style,
  as: Tag = 'span',
  mark,
}: FoldTextProps) {
  const root = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const h = HINGE[hinge];
  const crease = clamp(creaseShading, 0, 1);
  const persp = Math.max(120, perspective);

  // Entrada única (scroll/mount): la anima el script de arranque. Repetida (hover/loop): GSAP
  const scripted = trigger === 'scroll' || trigger === 'mount';

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
            data-reveal={scripted ? 'fold' : undefined}
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
    if (splitBy === 'word') {
      const target = mark ? bare(mark.word) : null;
      let marked = false;
      return text.split(/(\s+)/).flatMap((part, i) => {
        if (!part) return [];
        if (/^\s+$/.test(part)) return <span key={`ws${i}`}> </span>;
        const piece = seg(part, `sw${n}`);
        if (!mark || marked || bare(part) !== target) return piece;
        marked = true;
        // El trazo se dibuja cuando su palabra ya se desplegó
        const at = Math.round((n - 1) * stagger * 1000 + duration * 650);
        return (
          <span key={`m${i}`} className={`marked marked--${mark.kind}`}>
            {piece}
            <Scribble kind={mark.kind} at={scripted ? at : undefined} />
          </span>
        );
      });
    }
    return Array.from(text).map((ch, i) =>
      ch === '\n' ? <br key={`br${i}`} /> : seg(ch === ' ' ? ' ' : ch, `sc${i}`)
    );
  }, [text, splitBy, hinge, h.origin, persp, scripted, mark, stagger, duration]);

  useEffect(() => {
    const el = root.current;
    if (!el || scripted) return;
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

    let hover: (() => void) | undefined;
    if (trigger === 'hover') {
      gsap.set(pieces, { opacity: 1, rotateX: 0, rotateY: 0, '--fold-crease': 0 });
      hover = () => play(false);
      el.addEventListener('mouseenter', hover);
    } else play(true);

    return () => {
      if (hover) el.removeEventListener('mouseenter', hover);
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
    delay,
    h.origin,
    h.rx,
    h.ry,
    scripted,
  ]);

  return (
    <Tag
      ref={root as React.RefObject<never>}
      className={['fold-text', splitBy === 'word' && 'fold-text--words', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-reveal-group={scripted ? '' : undefined}
      data-reveal-step={scripted ? Math.round(stagger * 1000) : undefined}
      data-reveal-delay={scripted && delay ? Math.round(delay * 1000) : undefined}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden className="fold-text-visual">
        {segments}
      </span>
    </Tag>
  );
}

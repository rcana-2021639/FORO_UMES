'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

// Cada píxel es una ventana a su propia copia del contenido entrante; la retícula queda
// acotada aunque el tamaño de píxel pedido sea muy pequeño.
const MAX_PIXELS = 160;
const KEYFRAME_STEPS = 14;
// Tope global de transiciones por píxeles a la vez: cada una clona el contenido una vez por píxel.
// Si alguien barre el cursor por todas las losas, las que excedan el tope cambian al instante.
const MAX_RUNNING = 2;
let running = 0;

type Pattern = 'random' | 'center' | 'edges' | 'left-to-right' | 'diagonal' | 'spiral';

const PATTERNS: Record<Pattern, (x: number, y: number) => number | null> = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  'left-to-right': (x) => x,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  },
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const noise = (seed: number) => {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Curva premium del sistema (ease-out-premium) evaluada numéricamente. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (p: number) => {
    let t = p;
    for (let i = 0; i < 5; i++) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - p) / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
}
const EASE = bezier(0.16, 1, 0.3, 1);

interface Pixel {
  id: number;
  left: number;
  top: number;
  offset: number;
}
interface Grid {
  pixels: Pixel[];
  size: number;
  width: number;
  height: number;
}

function buildGrid(
  width: number,
  height: number,
  pixelSize: number,
  pattern: Pattern,
  randomness: number
): Grid {
  let size = pixelSize;
  let cols = Math.max(1, Math.ceil(width / size));
  let rows = Math.max(1, Math.ceil(height / size));
  if (cols * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((cols * rows) / MAX_PIXELS));
    cols = Math.max(1, Math.ceil(width / size));
    rows = Math.max(1, Math.ceil(height / size));
  }
  const originX = (width - cols * size) / 2;
  const originY = (height - rows * size) / 2;
  const order = PATTERNS[pattern];
  const pixels: Pixel[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const x = cols <= 1 ? 0.5 : c / (cols - 1);
      const y = rows <= 1 ? 0.5 : r / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);
      pixels.push({
        id: index,
        left: originX + c * size,
        top: originY + r * size,
        offset: base === null ? random : base * (1 - randomness) + random * randomness,
      });
    }
  }
  return { pixels, size, width, height };
}

interface Props {
  firstContent: ReactNode;
  secondContent: ReactNode;
  /** Controlado desde fuera (hover del padre, foco…). */
  active: boolean;
  pixelSize?: number;
  pixelScale?: number;
  duration?: number;
  pixelDuration?: number;
  pattern?: Pattern;
  randomness?: number;
  className?: string;
}

/**
 * Cambio de contenido por píxeles. Adaptado de React Bits `PixelSwap`: la capa entrante se
 * clona una vez por píxel (no se re-renderiza por React) y cada píxel crece hasta cubrir su
 * celda mientras su contenido aplica la transformación inversa, así lo revelado no se mueve.
 * Aquí el estado es controlado (`active`) y el patrón por defecto barre desde la esquina.
 */
export function PixelSwap({
  firstContent,
  secondContent,
  active,
  pixelSize = 36,
  pixelScale = 0.3,
  duration = 900,
  pixelDuration = 380,
  pattern = 'diagonal',
  randomness = 0.35,
  className,
}: Props) {
  const [shown, setShown] = useState(active);
  const [transition, setTransition] = useState<{ to: boolean; grid: Grid } | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pixelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animations = useRef<Animation[]>([]);
  const timer = useRef(0);

  const grid = useMemo(
    () =>
      buildGrid(
        box.width,
        box.height,
        Math.max(8, Math.round(pixelSize)),
        pattern,
        clamp(randomness, 0, 1)
      ),
    [box.width, box.height, pixelSize, pattern, randomness]
  );
  const gridRef = useRef(grid);
  const settingsRef = useRef({ duration, pixelDuration, pixelScale });
  useEffect(() => {
    gridRef.current = grid;
    settingsRef.current = { duration, pixelDuration, pixelScale };
  }, [grid, duration, pixelDuration, pixelScale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      setBox((c) => (c.width === w && c.height === h ? c : { width: w, height: h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stop = useCallback(() => {
    animations.current.forEach((a) => a.cancel());
    animations.current = [];
    pixelRefs.current.forEach((p) => p?.replaceChildren());
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = 0;
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (transition || active === shown) return;
    setTransition({ to: active, grid: gridRef.current });
  }, [active, shown, transition]);

  useEffect(() => {
    if (!transition) return;
    const { to, grid: frozen } = transition;
    const s = settingsRef.current;
    const finish = () => {
      stop();
      setShown(to);
      setTransition(null);
    };
    const source = layerRefs.current[to ? 1 : 0];
    if (!source || !frozen.pixels.length || prefersReducedMotion() || running >= MAX_RUNNING) {
      finish();
      return;
    }
    running++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      running--;
    };
    const total = Math.max(200, s.duration);
    const pixelMs = clamp(s.pixelDuration, 60, total);
    const spread = Math.max(0, total - pixelMs);
    // Los píxeles crecen un poco más que su celda para cerrar cualquier hueco de subpíxel
    const endScale = 1.04;
    const startScale = clamp(s.pixelScale, 0.05, 1) * endScale;
    const win: Keyframe[] = [];
    const inner: Keyframe[] = [];
    for (let step = 0; step <= KEYFRAME_STEPS; step++) {
      const p = step / KEYFRAME_STEPS;
      const e = EASE(p);
      const sc = startScale + (endScale - startScale) * e;
      win.push({ offset: p, opacity: Math.min(1, e * 1.6), transform: `scale(${sc})` });
      inner.push({ offset: p, transform: `scale(${1 / sc})` });
    }
    frozen.pixels.forEach((px, i) => {
      const el = pixelRefs.current[i];
      if (!el) return;
      const content = document.createElement('div');
      content.className = 'pixel-swap__pixel-content';
      content.style.left = `${-px.left}px`;
      content.style.top = `${-px.top}px`;
      content.style.width = `${frozen.width}px`;
      content.style.height = `${frozen.height}px`;
      content.style.transformOrigin = `${px.left + frozen.size / 2}px ${px.top + frozen.size / 2}px`;
      const clone = source.cloneNode(true) as HTMLElement;
      clone.dataset.visible = 'true';
      clone.removeAttribute('aria-hidden');
      content.appendChild(clone);
      el.replaceChildren(content);
      const timing: KeyframeAnimationOptions = {
        duration: pixelMs,
        delay: px.offset * spread,
        easing: 'linear',
        fill: 'both',
      };
      animations.current.push(el.animate(win, timing), content.animate(inner, timing));
    });
    timer.current = window.setTimeout(() => {
      release();
      finish();
    }, total);
    return () => {
      release();
      stop();
    };
  }, [transition, stop]);

  const incoming = transition?.to ? 1 : 0;
  const layer = (content: ReactNode, index: number) => {
    const isShown = index === (shown ? 1 : 0);
    return (
      <div
        key={index}
        ref={(el) => {
          layerRefs.current[index] = el;
        }}
        className="pixel-swap__layer"
        data-visible={isShown && !(transition && index === incoming)}
        style={{ zIndex: isShown ? 2 : 1 }}
        aria-hidden={!isShown}
      >
        {content}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn('pixel-swap', className)} data-active={shown}>
      {layer(firstContent, 0)}
      {layer(secondContent, 1)}
      {transition && (
        <div className="pixel-swap__grid" aria-hidden>
          {transition.grid.pixels.map((px, i) => (
            <div
              key={px.id}
              ref={(el) => {
                pixelRefs.current[i] = el;
              }}
              className="pixel-swap__pixel"
              style={{
                left: px.left,
                top: px.top,
                width: transition.grid.size,
                height: transition.grid.size,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

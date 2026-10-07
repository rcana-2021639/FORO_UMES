'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

// Retícula acotada aunque el tamaño de píxel pedido sea muy pequeño.
const MAX_PIXELS = 160;
// Tope global de transiciones a la vez: cada una redibuja un recorte por fotograma (barato), pero
// si alguien barre el cursor por todas las losas no tiene sentido animar las nueve.
const MAX_RUNNING = 3;
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
  /** Centro de la celda. */
  cx: number;
  cy: number;
  offset: number;
}
interface Grid {
  pixels: Pixel[];
  size: number;
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
        cx: originX + c * size + size / 2,
        cy: originY + r * size + size / 2,
        offset: base === null ? random : base * (1 - randomness) + random * randomness,
      });
    }
  }
  return { pixels, size };
}

const CLOSED = "path('M0 0z')";

/** Recorte con la forma de todas las celdas abiertas en el instante `t` (ms). */
function pixelPath(
  grid: Grid,
  t: number,
  pixelMs: number,
  spread: number,
  startScale: number,
  endScale: number
) {
  let d = '';
  for (const px of grid.pixels) {
    const local = (t - px.offset * spread) / pixelMs;
    if (local <= 0) continue;
    const e = EASE(Math.min(local, 1));
    const half = (grid.size * (startScale + (endScale - startScale) * e)) / 2;
    const w = (half * 2).toFixed(1);
    d += `M${(px.cx - half).toFixed(1)} ${(px.cy - half).toFixed(1)}h${w}v${w}h-${w}z`;
  }
  return d ? `path('${d}')` : CLOSED;
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
 * Cambio de contenido por píxeles (adaptado de React Bits `PixelSwap`): la cara entrante aparece
 * por celdas que crecen desde un 30 % hasta cubrir su sitio, en el orden del patrón.
 *
 * Antes cada píxel era una copia completa del contenido (hasta 160 clones con su imagen por
 * transición): pasar el cursor por las losas mientras se hacía scroll congelaba la página. Ahora la
 * cara entrante es una sola capa recortada por un `clip-path` que reúne todas las celdas abiertas:
 * por fotograma se escribe un solo trazado. Mismo aspecto, sin crear nodos.
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
  const raf = useRef(0);

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
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    layerRefs.current.forEach((l) => l?.style.removeProperty('clip-path'));
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (transition || active === shown) return;
    // Sin movimiento, sin medida aún o con el tope alcanzado: cambia al instante
    if (!gridRef.current.pixels.length || prefersReducedMotion() || running >= MAX_RUNNING) {
      setShown(active);
      return;
    }
    setTransition({ to: active, grid: gridRef.current });
  }, [active, shown, transition]);

  // Antes del primer pintado de la capa entrante: cerrada del todo, para que no destelle
  useLayoutEffect(() => {
    if (!transition) return;
    layerRefs.current[transition.to ? 1 : 0]?.style.setProperty('clip-path', CLOSED);
  }, [transition]);

  useEffect(() => {
    if (!transition) return;
    const { to, grid: frozen } = transition;
    const layer = layerRefs.current[to ? 1 : 0];
    const s = settingsRef.current;
    const total = Math.max(200, s.duration);
    const pixelMs = clamp(s.pixelDuration, 60, total);
    const spread = Math.max(0, total - pixelMs);
    // Las celdas crecen un poco más que su sitio para cerrar cualquier hueco de subpíxel
    const endScale = 1.04;
    const startScale = clamp(s.pixelScale, 0.05, 1) * endScale;
    running++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      running--;
    };
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      if (t >= total || !layer) {
        release();
        stop();
        setShown(to);
        setTransition(null);
        return;
      }
      layer.style.setProperty(
        'clip-path',
        pixelPath(frozen, t, pixelMs, spread, startScale, endScale)
      );
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      release();
      stop();
    };
  }, [transition, stop]);

  const incoming = transition ? (transition.to ? 1 : 0) : -1;
  const layer = (content: ReactNode, index: number) => {
    const isShown = index === (shown ? 1 : 0);
    const entering = index === incoming;
    return (
      <div
        key={index}
        ref={(el) => {
          layerRefs.current[index] = el;
        }}
        className="pixel-swap__layer"
        data-visible={isShown || entering}
        style={{ zIndex: entering ? 3 : isShown ? 2 : 1 }}
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
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useQuality } from '@/lib/quality';

export interface DepthTextProps {
  text: string;
  /** Capas apiladas detrás de la cara (cada una un poco más al fondo y más oscura). */
  layers?: number;
  /** Separación entre capas, en px. */
  depth?: number;
  faceColor?: string;
  depthColor?: string;
  /** Inclinación máxima (grados) al seguir el puntero. */
  tilt?: number;
  pointerTracking?: boolean;
  smoothing?: number;
  perspective?: number;
  autoOrbit?: boolean;
  orbitSpeed?: number;
  fontSize?: string;
  fontWeight?: number | string;
  fontFamily?: string;
  fontVariationSettings?: string;
  letterSpacing?: string;
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
}

const MAX_LAYERS = 64;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const layerColor = (face: string, depth: string, index: number, total: number) => {
  const progress = total <= 1 ? 1 : index / total;
  const eased = progress * progress;
  const faceMix = Math.round((1 - eased) * 72 + 4);
  return `color-mix(in srgb, ${face} ${faceMix}%, ${depth})`;
};

const rot = (x: number, y: number) => `rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg)`;

/**
 * Texto con profundidad: la misma palabra apilada en N capas hacia el fondo, de modo que las
 * letras se ven "sobrepuestas" y con volumen; el bloque se inclina siguiendo al puntero o en una
 * órbita lenta. Adaptado de React Bits `DepthText` (con reduced-motion queda quieto en su
 * inclinación base).
 *
 * Rendimiento: el original apilaba las capas en 3D real (`preserve-3d` + `translateZ`), y cada
 * capa era una capa de GPU: la portada llegó a tener más de 100 solo por esto, y el navegador
 * tardaba varios milisegundos por fotograma en ordenarlas y en averiguar qué había bajo el cursor.
 * Ahora cada capa se coloca en 2D donde la proyección la pondría con la inclinación base
 * (desplazamiento y escala de la perspectiva), y solo el bloque entero gira en 3D: una capa de GPU
 * por palabra. La órbita es de pocos grados, así que la diferencia no se percibe.
 */
export function DepthText({
  text,
  layers = 24,
  depth = 1.6,
  faceColor = 'var(--fg)',
  depthColor = 'var(--accent-lilac)',
  tilt = 7,
  pointerTracking = true,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = true,
  orbitSpeed = 0.3,
  fontSize = 'clamp(3rem, 10vw, 7rem)',
  fontWeight = 400,
  fontFamily = 'var(--font-display)',
  fontVariationSettings = "'opsz' 144, 'SOFT' 60, 'WONK' 1",
  letterSpacing = '-0.04em',
  shadow = true,
  className,
  style,
}: DepthTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);

  // Hasta 12 capas (más separadas si se pidieron más): el mismo volumen con menos nodos.
  // Modo liviano: 6 capas y quieto.
  const lite = useQuality() !== 'full';
  const full = clamp(Math.round(layers), 2, MAX_LAYERS);
  const n = Math.min(full, lite ? 6 : 12);
  const d = clamp((depth * full) / n, 0, 12);
  const t = clamp(tilt, 0, 14);
  const sm = clamp(smoothing, 0.02, 0.35);
  const persp = clamp(perspective, 300, 2000);
  const orbit = clamp(orbitSpeed, 0, 2);

  const base = useMemo(() => ({ x: -t * 0.32, y: t * 0.42 }), [t]);

  // Dónde caería cada capa (a z = -index·d) con la inclinación base y la perspectiva: un
  // desplazamiento y una escala en 2D, relativos a la cara
  const depthLayers = useMemo(() => {
    const rad = Math.PI / 180;
    const sx = Math.sin(base.x * rad);
    const sy = Math.sin(base.y * rad);
    return Array.from({ length: n }, (_, i) => {
      const index = n - i;
      const z = index * d;
      const k = persp / (persp + z);
      return {
        index,
        color: layerColor(faceColor, depthColor, index, n),
        transform: `translate(${(-z * sy * k).toFixed(2)}px, ${(z * sx * k).toFixed(2)}px) scale(${k.toFixed(4)})`,
      };
    });
  }, [n, d, faceColor, depthColor, base, persp]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const reduced = lite || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const track = pointerTracking && fine && !reduced;

    let raf = 0;
    let active = false;
    let visible = true;
    const start = performance.now();
    const cur = { ...base };
    const tgt = { ...base };

    const apply = () => {
      stage.style.transform = rot(cur.x, cur.y);
    };
    if (reduced) {
      apply();
      return;
    }

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // Solo reacciona cerca del bloque (no a todo el documento)
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height * 1.6);
      if (Math.abs(dx) > 1.6 || Math.abs(dy) > 2.2) {
        if (active) onLeave();
        return;
      }
      active = true;
      tgt.x = base.x - clamp(dy, -1, 1) * t;
      tgt.y = base.y + clamp(dx, -1, 1) * t;
    };
    const onLeave = () => {
      active = false;
      tgt.x = base.x;
      tgt.y = base.y;
    };
    if (track) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('blur', onLeave);
    }

    const tick = (now: number) => {
      // Fuera de pantalla el bucle se detiene del todo (no solo deja de pintar)
      if (!visible) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
      if ((!track || !active) && autoOrbit) {
        const el = (now - start) / 1000;
        const o = el * orbit * Math.PI * 2;
        const amt = track ? 0.18 : 0.55;
        tgt.x = base.x + Math.sin(o) * t * amt;
        tgt.y = base.y + Math.cos(o * 0.85) * t * amt;
      }
      cur.x += (tgt.x - cur.x) * sm;
      cur.y += (tgt.y - cur.y) * sm;
      apply();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(root);
    apply();
    raf = requestAnimationFrame(tick);

    return () => {
      if (track) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('blur', onLeave);
      }
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [autoOrbit, base, pointerTracking, orbit, sm, t, lite]);

  const textStyle: CSSProperties = {
    fontSize,
    fontWeight,
    fontFamily,
    fontVariationSettings,
    letterSpacing,
    lineHeight: 0.9,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    textRendering: 'geometricPrecision',
  };

  return (
    <span
      ref={rootRef}
      className={['inline-block', className].filter(Boolean).join(' ')}
      style={{
        ...style,
        perspective: `${persp}px`,
        perspectiveOrigin: '50% 48%',
        isolation: 'isolate',
      }}
    >
      <span
        ref={stageRef}
        className="relative inline-grid place-items-center"
        style={{
          transform: rot(base.x, base.y),
          transformOrigin: '50% 50%',
          willChange: lite ? undefined : 'transform',
        }}
      >
        {depthLayers.map((l) => (
          <span
            aria-hidden
            key={l.index}
            className="pointer-events-none absolute inset-0 z-0 inline-block"
            style={{
              ...textStyle,
              color: l.color,
              transform: l.transform,
              transformOrigin: '50% 48%',
            }}
          >
            {text}
          </span>
        ))}
        <span
          className="relative z-10 inline-block"
          style={{
            ...textStyle,
            color: faceColor,
            textShadow: shadow
              ? `0 22px 34px color-mix(in srgb, ${depthColor} 30%, transparent), 0 3px 6px rgb(var(--shadow-ink) / 0.2)`
              : 'none',
          }}
        >
          {text}
        </span>
      </span>
    </span>
  );
}

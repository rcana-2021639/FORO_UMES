'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { getQuality } from '@/lib/quality';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Inclinación máxima en grados. */
  max?: number;
  /** Escala al pasar el cursor. */
  scale?: number;
  perspective?: number;
  /** Brillo que sigue al puntero por encima del contenido. */
  glare?: boolean;
  /** Sombra que se separa al levantar. */
  shadow?: boolean;
  as?: 'div' | 'li' | 'article' | 'span';
}

/**
 * Losa que se inclina en 3D siguiendo al puntero (rotateX/rotateY con perspectiva), con un
 * brillo que se desplaza y una sombra que se separa al levantarla. Todo en transforms y
 * opacidad. Los hijos con `data-depth="N"` se elevan N px en Z (parallax dentro de la losa).
 * Con puntero grueso o reduced-motion no hace nada.
 */
export function Tilt({
  children,
  className,
  style,
  max = 9,
  scale = 1.02,
  perspective = 900,
  glare = true,
  shadow = true,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const raf = useRef(0);
  const target = useRef({ rx: 0, ry: 0, gx: 50, gy: 50, on: 0 });
  const cur = useRef({ rx: 0, ry: 0, gx: 50, gy: 50, on: 0 });

  // Declaración de función (hoisted) para que pueda reprogramarse a sí misma
  function loop() {
    const el = ref.current;
    if (!el) return;
    const t = target.current;
    const c = cur.current;
    c.rx += (t.rx - c.rx) * 0.14;
    c.ry += (t.ry - c.ry) * 0.14;
    c.gx += (t.gx - c.gx) * 0.14;
    c.gy += (t.gy - c.gy) * 0.14;
    c.on += (t.on - c.on) * 0.14;
    el.style.setProperty('--tilt-rx', `${c.rx.toFixed(2)}deg`);
    el.style.setProperty('--tilt-ry', `${c.ry.toFixed(2)}deg`);
    el.style.setProperty('--tilt-gx', `${c.gx.toFixed(1)}%`);
    el.style.setProperty('--tilt-gy', `${c.gy.toFixed(1)}%`);
    el.style.setProperty('--tilt-on', c.on.toFixed(3));
    const still =
      Math.abs(t.rx - c.rx) < 0.02 &&
      Math.abs(t.ry - c.ry) < 0.02 &&
      Math.abs(t.on - c.on) < 0.005 &&
      Math.abs(t.gx - c.gx) < 0.1;
    raf.current = still ? 0 : requestAnimationFrame(loop);
  }

  const kick = () => {
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  };

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    []
  );

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || getQuality() !== 'full') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    target.current = {
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      gx: px * 100,
      gy: py * 100,
      on: 1,
    };
    kick();
  };
  const onLeave = () => {
    target.current = { rx: 0, ry: 0, gx: 50, gy: 50, on: 0 };
    kick();
  };

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn('tilt', glare && 'tilt--glare', shadow && 'tilt--shadow', className)}
      style={
        {
          ...style,
          '--tilt-persp': `${perspective}px`,
          '--tilt-scale': scale,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}

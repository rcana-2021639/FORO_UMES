'use client';

import { useEffect, useRef } from 'react';
import { hasFinePointer, prefersReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  /** Tamaño de celda en px. */
  cell?: number;
  color?: string;
  /** Vida de cada celda en ms. */
  life?: number;
  className?: string;
}

/**
 * Estela de píxeles tras el cursor. Idea de React Bits `Animations/PixelTrail` (celdas de una
 * retícula que se encienden y se apagan), reimplementada en canvas 2D en vez de un segundo
 * contexto WebGL: el hero ya usa uno y no queremos dos en la misma página.
 * Solo con puntero fino; rAF activo únicamente mientras haya celdas vivas.
 */
export function PixelTrail({ cell = 22, color = '#0f6e5a', life = 700, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent || !hasFinePointer() || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cells = new Map<string, number>();
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const [key, born] of cells) {
        const t = (now - born) / life;
        if (t >= 1) {
          cells.delete(key);
          continue;
        }
        const [cx, cy] = key.split(',').map(Number);
        const a = (1 - t) * (1 - t);
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = color;
        const shrink = (cell * t) / 2;
        ctx.fillRect(cx * cell + shrink, cy * cell + shrink, cell - shrink * 2, cell - shrink * 2);
      }
      ctx.globalAlpha = 1;
      raf = cells.size ? requestAnimationFrame(draw) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / cell);
      const y = Math.floor((e.clientY - r.top) / cell);
      cells.set(`${x},${y}`, performance.now());
      if (!raf) raf = requestAnimationFrame(draw);
    };
    parent.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      parent.removeEventListener('pointermove', onMove);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [cell, color, life]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-10 mix-blend-multiply ${className ?? ''}`}
    />
  );
}

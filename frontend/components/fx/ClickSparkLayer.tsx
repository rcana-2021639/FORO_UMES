'use client';

import { useEffect, useRef } from 'react';
import { hasFinePointer, prefersReducedMotion } from '@/hooks/useReducedMotion';

interface Spark {
  x: number;
  y: number;
  angle: number;
  born: number;
  color: string;
}

/**
 * Chispas al click en toda la página (React Bits `ClickSpark`) sobre un canvas fijo. El color
 * lo dicta el capítulo visible vía `--spark` (violeta sobre piedra, oro sobre noche, violeta
 * claro sobre crepúsculo). El rAF solo corre mientras haya chispas vivas; nada con
 * reduced-motion ni en táctil.
 */
export function ClickSparkLayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion() || !hasFinePointer()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sparks: Spark[] = [];
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 10;
    const RADIUS = 26;
    const COUNT = 9;
    const DURATION = 460;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const elapsed = t - s.born;
        if (elapsed >= DURATION) {
          sparks.splice(i, 1);
          continue;
        }
        const p = elapsed / DURATION;
        const eased = 1 - Math.pow(1 - p, 3);
        const dist = eased * RADIUS;
        const len = SIZE * (1 - eased);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = 1 - p * 0.4;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
        ctx.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = sparks.length ? requestAnimationFrame(draw) : 0;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const color =
        getComputedStyle(document.documentElement).getPropertyValue('--spark').trim() || '#7c5ae0';
      const now = performance.now();
      for (let i = 0; i < COUNT; i++) {
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          angle: (2 * Math.PI * i) / COUNT + Math.PI / 9,
          born: now,
          color,
        });
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" />;
}

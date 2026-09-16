'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Chispas al click sobre un canvas propio. Adaptado de React Bits `Animations/ClickSpark`
 * (github.com/DavidHDev/react-bits): misma geometría de líneas radiales que se alejan y
 * acortan; aquí el rAF solo corre mientras haya chispas vivas.
 */
interface Options {
  color?: string;
  size?: number;
  radius?: number;
  count?: number;
  duration?: number;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export function useClickSpark({
  color = '#d9a93a',
  size = 9,
  radius = 22,
  count = 8,
  duration = 420,
}: Options = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparks = useRef<Spark[]>([]);
  const raf = useRef<number | null>(null);
  const drawRef = useRef<(t: number) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      // Margen para que las chispas salgan del borde del botón
      canvas.width = Math.ceil(width + radius * 2 + size * 2);
      canvas.height = Math.ceil(height + radius * 2 + size * 2);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    drawRef.current = (t: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks.current = sparks.current.filter((s) => {
        const elapsed = t - s.startTime;
        if (elapsed >= duration) return false;
        const p = elapsed / duration;
        const eased = p * (2 - p);
        const dist = eased * radius;
        const len = size * (1 - eased);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
        ctx.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
        ctx.stroke();
        return true;
      });
      raf.current = sparks.current.length ? requestAnimationFrame(drawRef.current) : null;
    };

    return () => {
      ro.disconnect();
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [color, duration, radius, size]);

  const spark = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      const now = performance.now();
      for (let i = 0; i < count; i++) {
        sparks.current.push({
          x,
          y,
          angle: (2 * Math.PI * i) / count + Math.PI / 8,
          startTime: now,
        });
      }
      if (raf.current === null) raf.current = requestAnimationFrame(drawRef.current);
    },
    [count]
  );

  const pad = radius + size;
  return { canvasRef, spark, pad };
}

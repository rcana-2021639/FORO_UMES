'use client';

import { useEffect, useRef, useState } from 'react';
import { getQuality } from '@/lib/quality';

/** Cifra que cuenta desde 0 al entrar en pantalla (una sola vez). Sin movimiento, aparece fija. */
export function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || getQuality() === 'still' || to === 0) return;
    let raf = 0;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      io.disconnect();
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(Math.max((t - start) / duration, 0), 1);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    // El 0 lo pone el primer fotograma: si el navegador nunca pinta, la cifra real se queda
    const io = new IntersectionObserver(([e]) => e.isIntersecting && run(), {
      rootMargin: '0px 0px -8% 0px',
    });
    io.observe(el);
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) run();
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}

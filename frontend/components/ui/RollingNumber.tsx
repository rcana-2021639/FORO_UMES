'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const DIGITS = '01234567890123456789'.split('');

/**
 * Cifra tipo odómetro: cada dígito es una columna 0–9 que da una vuelta completa antes de
 * detenerse en su valor, con retardo creciente de izquierda a derecha. Arranca al entrar en
 * pantalla (una vez) y avisa con `onLand` cuando la última columna se asienta.
 * Sin movimiento, el número aparece fijo.
 */
export function RollingNumber({
  value,
  delay = 0,
  onLand,
}: {
  value: number;
  delay?: number;
  onLand?: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setGo] = useState(false);
  const reduced = useReducedMotion();
  const go = started || reduced;
  const digits = String(Math.max(0, Math.round(value))).split('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      const id = window.setTimeout(() => onLand?.(), 0);
      return () => window.clearTimeout(id);
    }
    let t = 0;
    let landT = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        t = window.setTimeout(() => setGo(true), delay * 1000);
        landT = window.setTimeout(() => onLand?.(), delay * 1000 + 1500 + digits.length * 180);
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
      window.clearTimeout(landT);
    };
    // onLand y la longitud se leen solo al disparar; basta con volver a observar si cambia el valor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, reduced]);

  return (
    <span ref={ref} className="rolling" aria-label={String(value)} role="img">
      {digits.map((d, i) => (
        <span key={i} className="rolling__col" aria-hidden>
          <span
            className="rolling__strip"
            style={{
              // Da una vuelta (10 posiciones) y se detiene en el dígito
              transform: `translateY(${go ? -(10 + Number(d)) * 5 : 0}%)`,
              transitionDelay: `${i * 0.18}s`,
              transitionDuration: reduced ? '0s' : undefined,
            }}
          >
            {DIGITS.map((n, k) => (
              <span key={k} className="rolling__digit">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

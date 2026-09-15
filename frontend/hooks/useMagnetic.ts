'use client';

import { useEffect, useRef } from 'react';
import { animate, type AnimationPlaybackControls } from 'motion';
import { hasFinePointer, prefersReducedMotion } from './useReducedMotion';

interface Options {
  /** Radio (px) alrededor del elemento en el que empieza a atraer. */
  radius?: number;
  /** Cuánto se desplaza el elemento respecto a la distancia del cursor (0–1). */
  strength?: number;
  /** Desplazamiento del texto/hijo interno para dar sensación de profundidad. */
  innerStrength?: number;
}

/**
 * Efecto magnético: el elemento se desplaza hacia el cursor dentro de un radio y vuelve con
 * spring al salir. Solo con puntero fino y sin prefers-reduced-motion.
 * Devuelve un ref para el contenedor y otro opcional para el hijo interno.
 */
export function useMagnetic<
  T extends HTMLElement = HTMLElement,
  I extends HTMLElement = HTMLElement,
>({ radius = 60, strength = 0.35, innerStrength = 0.15 }: Options = {}) {
  const ref = useRef<T | null>(null);
  const innerRef = useRef<I | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;

    let active = false;
    let controls: AnimationPlaybackControls[] = [];

    const stop = () => {
      controls.forEach((c) => c.stop());
      controls = [];
    };

    const release = () => {
      active = false;
      stop();
      const spring = { type: 'spring' as const, stiffness: 220, damping: 16, mass: 0.6 };
      controls.push(animate(el, { x: 0, y: 0 }, spring));
      if (innerRef.current) controls.push(animate(innerRef.current, { x: 0, y: 0 }, spring));
      el.style.willChange = '';
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + radius;

      if (dist < reach) {
        if (!active) {
          active = true;
          el.style.willChange = 'transform';
        }
        stop();
        const ease = { type: 'spring' as const, stiffness: 300, damping: 24, mass: 0.4 };
        controls.push(animate(el, { x: dx * strength, y: dy * strength }, ease));
        if (innerRef.current) {
          controls.push(
            animate(innerRef.current, { x: dx * innerStrength, y: dy * innerStrength }, ease)
          );
        }
      } else if (active) {
        release();
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      stop();
    };
  }, [radius, strength, innerStrength]);

  return { ref, innerRef };
}

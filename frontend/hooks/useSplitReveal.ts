'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap';
import { prefersReducedMotion } from './useReducedMotion';

interface Options {
  /** Unidad que se anima. `chars` para H1 cortos, `words` para párrafos, `lines` para bloques. */
  type?: 'chars' | 'words' | 'lines';
  /** Retardo entre unidades (s). */
  stagger?: number;
  /** Duración por unidad (s). */
  duration?: number;
  /** Sin ScrollTrigger: anima al montar (hero). */
  immediate?: boolean;
  delay?: number;
  /** Posición del trigger, p. ej. 'top 80%'. */
  start?: string;
}

/**
 * Reveal de texto por caracteres/palabras/líneas con GSAP SplitText (scroll anim #3).
 * Cada unidad sube desde abajo con máscara de línea (no un fade del párrafo completo).
 * Con prefers-reduced-motion hace un fade simple del elemento entero.
 */
export function useSplitReveal<T extends HTMLElement = HTMLElement>({
  type = 'words',
  stagger,
  duration,
  immediate = false,
  delay = 0,
  start = 'top 85%',
}: Options = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      const tween = gsap.fromTo(
        el,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.6,
          delay,
          scrollTrigger: immediate ? undefined : { trigger: el, start },
        }
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }

    const perUnit = duration ?? (type === 'chars' ? 1.1 : type === 'words' ? 0.9 : 1.2);
    const gap = stagger ?? (type === 'chars' ? 0.018 : type === 'words' ? 0.04 : 0.12);

    let tween: gsap.core.Tween | undefined;
    const split = SplitText.create(el, {
      type: type === 'chars' ? 'lines,words,chars' : type === 'words' ? 'lines,words' : 'lines',
      mask: 'lines',
      autoSplit: true,
      aria: 'auto',
      onSplit: (self) => {
        const targets = type === 'chars' ? self.chars : type === 'words' ? self.words : self.lines;
        tween?.kill();
        tween = gsap.from(targets, {
          yPercent: 110,
          rotate: type === 'lines' ? 0 : 2,
          opacity: type === 'chars' ? 1 : 0.001,
          duration: perUnit,
          ease: 'expo.out',
          stagger: gap,
          delay,
          scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
        });
        return tween;
      },
    });

    return () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split.revert();
      ScrollTrigger.refresh();
    };
  }, [type, stagger, duration, immediate, delay, start]);

  return ref;
}

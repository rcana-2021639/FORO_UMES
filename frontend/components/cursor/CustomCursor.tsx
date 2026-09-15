'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useFinePointer, useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Cursor custom: punto de 12 px (color del tema vivo) que crece hasta 84 px con una etiqueta mono
 * cuando el elemento bajo el puntero declara `data-cursor="VER PERFIL"` (o `data-cursor=""`
 * para solo crecer). Sobre `data-cursor-hide` se oculta (p. ej. iframes, canvas 3D).
 * Solo se monta con puntero fino; con teclado el cursor nativo vuelve vía :focus-visible.
 */
export function CustomCursor() {
  const reduced = useReducedMotion();
  const enabled = useFinePointer() && !reduced;
  const [label, setLabel] = useState<string | null>(null);
  const [big, setBig] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.3 });

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.dataset.cursor = 'custom';

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const target = t?.closest?.('[data-cursor],[data-cursor-hide]') as HTMLElement | null;
      if (!target) {
        setLabel(null);
        setBig(false);
        setHidden(false);
        return;
      }
      if (target.hasAttribute('data-cursor-hide')) {
        setHidden(true);
        return;
      }
      const text = target.getAttribute('data-cursor') ?? '';
      setLabel(text || null);
      setBig(true);
      setHidden(false);
    };
    const onLeave = () => setHidden(true);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      delete document.documentElement.dataset.cursor;
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = big ? 84 : pressed ? 9 : 12;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full bg-fg text-bg"
        initial={false}
        animate={{
          width: size,
          height: size,
          opacity: hidden ? 0 : 1,
          scale: hidden ? 0.4 : 1,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.5 }}
      >
        {label && (
          <motion.span
            className="mono-label whitespace-nowrap text-[0.6rem]"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            {label}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}

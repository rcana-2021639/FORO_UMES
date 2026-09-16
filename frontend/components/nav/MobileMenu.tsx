'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  activeIndex: number;
}

/**
 * Menú móvil de página completa: se revela con `clip-path: circle()` que crece desde la
 * esquina del botón hamburguesa (no un drawer). Links en Fraunces grandes con stagger.
 */
export function MobileMenu({ open, onClose, activeIndex }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="menu-movil"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="fixed inset-0 z-[999] flex flex-col bg-ink text-paper md:hidden"
          initial={{ clipPath: 'circle(0% at 91% 5%)' }}
          animate={{ clipPath: 'circle(150% at 91% 5%)' }}
          exit={{ clipPath: 'circle(0% at 91% 5%)' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="container-x flex flex-1 flex-col justify-center gap-1 pt-24 pb-16">
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ delay: 0.18 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-baseline gap-4 border-b border-paper/15 py-3"
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={i === activeIndex ? 'page' : undefined}
                  className={cn(
                    'font-display text-[2.6rem] leading-none tracking-tight',
                    i === activeIndex ? 'italic text-jade-2' : 'text-paper'
                  )}
                  style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 30" }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <motion.p
              className="eyebrow mt-10 text-paper/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Nueve universidades de Guatemala, una mesa.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

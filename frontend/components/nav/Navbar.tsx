'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { GooeyIndicator } from './GooeyIndicator';
import { MobileMenu } from './MobileMenu';
import { Magnetic } from '@/components/ui/Magnetic';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from '@/lib/nav';

const SPRING = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 } as const;

/**
 * Navbar (DESIGN_NOTES §8): pill flotante de cristal arriba → barra completa al hacer scroll
 * (Motion `layout`), indicador gooey con spring, links magnéticos, menú móvil de página completa
 * y línea de progreso de lectura.
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 80));

  const activeIndex = NAV_ITEMS.findIndex((i) =>
    i.href === '/' ? pathname === '/' : pathname.startsWith(i.href)
  );
  const target = hover ?? activeIndex;

  return (
    <>
      <a
        href="#contenido"
        className="mono-label fixed top-2 left-2 z-[10001] -translate-y-20 bg-ink px-3 py-2 text-paper transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <motion.header
        layout
        transition={SPRING}
        className={cn(
          'fixed z-[1000] flex items-center justify-between border backdrop-blur-xl',
          'bg-[color-mix(in_oklab,var(--bg)_72%,transparent)] supports-[not(backdrop-filter:blur(1px))]:bg-bg',
          scrolled
            ? 'inset-x-0 top-0 rounded-none border-x-0 border-t-0 border-b-line px-[var(--gutter)] py-3'
            : 'inset-x-3 top-3 rounded-full border-transparent px-4 py-2 md:inset-x-auto md:left-1/2 md:w-[min(64rem,calc(100%-2rem))] md:-translate-x-1/2'
        )}
        style={
          scrolled
            ? undefined
            : {
                // Borde de 1 px con gradiente jade→ámbar (glass), sin caja de sombra genérica
                backgroundImage:
                  'linear-gradient(color-mix(in oklab,var(--bg) 72%,transparent),color-mix(in oklab,var(--bg) 72%,transparent)),linear-gradient(100deg,color-mix(in oklab,var(--color-jade) 35%,transparent),color-mix(in oklab,var(--color-amber) 35%,transparent))',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }
        }
      >
        <motion.div layout="position" className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Monogram />
            <span className="sr-only">Foro de Posgrado, inicio</span>
            <span
              aria-hidden
              className="hidden font-display text-[1.05rem] leading-none tracking-tight lg:block"
            >
              Foro de Posgrado
            </span>
          </Link>
        </motion.div>

        <motion.nav layout="position" aria-label="Principal" className="hidden md:block">
          <div className="relative">
            <GooeyIndicator container={listRef} activeIndex={activeIndex} hoverIndex={hover} />
            <ul
              ref={listRef}
              className="relative z-10 flex items-center gap-1"
              onPointerLeave={() => setHover(null)}
            >
              {NAV_ITEMS.map((item, i) => (
                <Magnetic as="li" key={item.href} radius={28} strength={0.22}>
                  <Link
                    href={item.href}
                    aria-current={i === activeIndex ? 'page' : undefined}
                    onPointerEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className={cn(
                      'mono-label block rounded-full px-3 py-2 transition-colors duration-300',
                      i === target ? 'text-paper delay-75' : 'text-fg hover:text-jade'
                    )}
                  >
                    {item.label}
                  </Link>
                </Magnetic>
              ))}
            </ul>
          </div>
        </motion.nav>

        <motion.div layout="position" className="flex items-center gap-2">
          <span className="mono-label hidden text-fg-muted xl:block">
            Guatemala · 9 universidades
          </span>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line md:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((o) => !o)}
            data-menu-button
          >
            <Burger open={open} />
          </button>
        </motion.div>

        {/* Progreso de lectura (Rare UI "Scroll Progress Indicator", reimplementado con Motion) */}
        <motion.span
          aria-hidden
          className={cn(
            'absolute bottom-0 left-0 h-[2px] w-full origin-left bg-amber transition-opacity duration-500',
            scrolled ? 'opacity-100' : 'opacity-0'
          )}
          style={{ scaleX: progress }}
        />
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} activeIndex={activeIndex} />
    </>
  );
}

function Monogram() {
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 place-items-center rounded-full border border-fg font-display text-[1.1rem] leading-none"
      style={{ fontVariationSettings: "'opsz' 20, 'WONK' 1" }}
    >
      F
    </span>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3 w-4" aria-hidden>
      <motion.span
        className="absolute left-0 h-px w-full bg-fg"
        animate={{ top: open ? 6 : 0, rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <motion.span
        className="absolute left-0 h-px w-full bg-fg"
        animate={{ top: open ? 6 : 12, rotate: open ? -45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    </span>
  );
}

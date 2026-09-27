'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { getLenis } from '@/components/providers/SmoothScroll';
import { MobileMenu } from './MobileMenu';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from '@/lib/nav';

/** Muelle firme y sin rebote: el indicador llega rápido y se asienta sin temblar. */
const SLIDE = { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 } as const;

/**
 * Navbar: barra de cristal flotante que no cambia de forma al hacer scroll (solo gana cuerpo y
 * sombra). Al pasar el cursor, una píldora lavanda se desliza de enlace en enlace; la página
 * actual se marca con texto violeta y una barrita en degradado que también se desliza al
 * cambiar de ruta. Sin filtros gooey, partículas ni efecto magnético.
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));

  // Ya en la portada, "Inicio" y el monograma suben al principio en vez de no hacer nada
  const goTop = (e: React.MouseEvent, href: string) => {
    if (href !== '/' || pathname !== '/') return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeIndex = NAV_ITEMS.findIndex((i) =>
    i.href === '/' ? pathname === '/' : pathname.startsWith(i.href)
  );

  return (
    <>
      <a
        href="#contenido"
        className="ui-label fixed top-2 left-2 z-[10001] -translate-y-20 rounded-full bg-violet-800 px-4 py-2 text-paper transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <header className="nav-shell" data-scrolled={scrolled}>
        <div className="nav-bar">
          <Link
            href="/"
            onClick={(e) => goTop(e, '/')}
            className="nav-brand"
            aria-label="Foro de Posgrado, inicio"
          >
            <span className="nav-brand__mark" aria-hidden>
              F
            </span>
            <span aria-hidden className="hidden lg:block">
              Foro de Posgrado
            </span>
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center" onPointerLeave={() => setHover(null)}>
              {NAV_ITEMS.map((item, i) => {
                const active = i === activeIndex;
                return (
                  <li key={item.href} className="relative">
                    {hover === i && (
                      <motion.span
                        layoutId="nav-hover"
                        className="nav-hover"
                        transition={SLIDE}
                        aria-hidden
                      />
                    )}
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onPointerEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      onClick={(e) => goTop(e, item.href)}
                      className={cn('nav-link', active && 'is-active')}
                    >
                      {item.label}
                    </Link>
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="nav-active"
                        transition={SLIDE}
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            type="button"
            className="nav-burger md:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((o) => !o)}
            data-menu-button
          >
            <Burger open={open} />
          </button>
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} activeIndex={activeIndex} />
    </>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3 w-4" aria-hidden>
      <motion.span
        className="absolute left-0 h-[1.5px] w-full rounded-full bg-current"
        animate={{ top: open ? 6 : 0, rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <motion.span
        className="absolute left-0 h-[1.5px] w-full rounded-full bg-current"
        animate={{ top: open ? 6 : 12, rotate: open ? -45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    </span>
  );
}

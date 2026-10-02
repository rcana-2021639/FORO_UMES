'use client';

import { usePathname } from 'next/navigation';
import { ViewTransition } from 'react';

/**
 * Transición entre páginas (DESIGN_NOTES §28.3). La clave es la ruta: `app/template.tsx` solo se
 * vuelve a montar cuando cambia la primera parte de la URL, así que de /noticias a una nota (o de
 * una universidad a la siguiente) no había salida ni entrada que animar. Con la ruta como clave,
 * toda navegación anima; los cambios de `?pagina=` o `?vista=` no (misma ruta).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page-in" exit="page-out" default="none">
      <div className="page-enter">{children}</div>
    </ViewTransition>
  );
}

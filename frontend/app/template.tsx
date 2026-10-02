import { ViewTransition } from 'react';

/**
 * Se vuelve a montar en cada cambio de ruta. Dos capas de entrada (DESIGN_NOTES §28.3):
 *
 * - Con View Transitions (Chrome, Edge, Safari 18+, Firefox 144+): la página que se va se aparta y
 *   se desvanece rápido, la nueva sube a su sitio, la barra queda quieta y lo que pulsaste (un
 *   sello, una foto) viaja a su lugar en la página nueva. Ver `::view-transition-*` en v6.css.
 * - Sin ellas: el contenido nuevo entra con un fundido (`.page-enter`, solo opacidad; al terminar
 *   no deja `transform`, para no romper los elementos fijos ni las secciones que GSAP fija).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div className="page-enter">{children}</div>
    </ViewTransition>
  );
}

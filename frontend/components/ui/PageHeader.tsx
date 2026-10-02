import Link from 'next/link';
import type { ReactNode } from 'react';
import { Words } from './Words';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  /** Ruta hasta esta página (sin "Inicio", que siempre va primero). */
  crumbs?: Crumb[];
  /** `article`: título largo de una nota o actividad, a menor tamaño. */
  size?: 'page' | 'article';
  className?: string;
  /**
   * Pieza propia de la página, a la derecha (DESIGN_NOTES §28.4): el anillo de sellos, la cuenta
   * regresiva, el buscador… Con ella, la explicación y el botón pasan bajo el título.
   */
  visual?: ReactNode;
}

/**
 * Cabecera de página interna (v5, DESIGN_NOTES §27): banda lila con migas de pan ("dónde estoy"),
 * la etiqueta con su filete, el título a la izquierda y la explicación a la derecha. La entrada la
 * hace el script de arranque (data-reveal) en el primer pintado: el título ya viene partido desde
 * el servidor, así que al hidratar no cambia nada.
 */
export function PageHeader({
  kicker,
  title,
  intro,
  aside,
  crumbs = [],
  size = 'page',
  className,
  visual,
}: Props) {
  if (visual) {
    return (
      <header className={cn('page-head page-head--visual', className)}>
        <div className="container-x">
          <Crumbs crumbs={crumbs} />
          <div className="page-head__grid">
            <div className="page-head__text">
              <div className="sec-head__top mt-8 md:mt-10">
                <p data-reveal="left" className="sec-head__label eyebrow">
                  <span>{kicker}</span>
                </p>
                <span aria-hidden data-reveal="line" className="sec-head__rule" />
              </div>
              <h1
                data-reveal-group
                data-reveal={typeof title === 'string' ? undefined : 'blur'}
                className={cn(
                  'mt-5 text-fg md:mt-7',
                  size === 'article' ? 'page-head__title--article' : 'page-head__title'
                )}
              >
                {typeof title === 'string' ? <Words text={title} /> : title}
              </h1>
              {intro && (
                <p data-reveal="blur" className="sec-head__intro mt-6">
                  {intro}
                </p>
              )}
              {aside && (
                <div data-reveal="up" className="mt-7">
                  {aside}
                </div>
              )}
            </div>
            <div className="page-head__visual">{visual}</div>
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className={cn('page-head', className)}>
      <div className="container-x">
        <Crumbs crumbs={crumbs} />

        <div className="sec-head__top mt-8 md:mt-10">
          <p data-reveal="left" className="sec-head__label eyebrow">
            <span>{kicker}</span>
          </p>
          <span aria-hidden data-reveal="line" className="sec-head__rule" />
        </div>

        <div className="sec-head__body grid gap-6 md:grid-cols-12 md:gap-x-10">
          <h1
            data-reveal-group
            data-reveal={typeof title === 'string' ? undefined : 'blur'}
            className={cn(
              'text-fg md:col-span-8',
              size === 'article' ? 'page-head__title--article' : 'page-head__title'
            )}
          >
            {typeof title === 'string' ? <Words text={title} /> : title}
          </h1>
          {(intro || aside) && (
            <div className="flex flex-col items-start gap-5 md:col-span-4 md:self-end">
              {intro && (
                <p data-reveal="blur" className="sec-head__intro">
                  {intro}
                </p>
              )}
              {aside && (
                <div data-reveal="up" className="w-full">
                  {aside}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Migas de pan: "dónde estoy". Inicio siempre va primero. */
function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" data-reveal="fade" className="crumbs">
      <ol>
        <li>
          <Link href="/">Inicio</Link>
        </li>
        {crumbs.map((c) => (
          <li key={c.label}>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/nav';

const UNIVERSITIES = ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo', 'UNI'];

/** Colofón: cierre editorial del "acta", no un footer de 4 columnas. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="container-x relative border-t border-line pt-14 pb-10 text-fg">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow text-fg-muted">Colofón</p>
          <p
            className="mt-3 max-w-md font-display text-[1.6rem] leading-tight"
            style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 20" }}
          >
            Nueve universidades, una sola mesa para el posgrado guatemalteco.
          </p>
        </div>
        <nav aria-label="Pie de página" className="md:col-span-3">
          <p className="eyebrow text-fg-muted">Índice</p>
          <ul className="mt-3 space-y-1.5">
            {NAV_ITEMS.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="text-[0.95rem] transition-colors duration-300 hover:text-accent-jade"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <p className="eyebrow text-fg-muted">Las nueve</p>
          <p className="mono-label mt-3 leading-7 text-fg">{UNIVERSITIES.join('  ')}</p>
        </div>
      </div>
      <div className="ui-label mt-14 flex flex-wrap items-center justify-between gap-3 text-fg-muted">
        <span>© {year} Foro Interuniversitario de Estudios de Posgrado</span>
        <span>Guatemala, C. A.</span>
      </div>
    </footer>
  );
}

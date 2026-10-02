import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/nav';
import { api, safe } from '@/lib/api';
import { Emblem } from '@/components/ui/Emblem';
import { BackToTop } from './BackToTop';

/** Si la API no responde, el pie sigue nombrando a las nueve (sin enlace a su perfil). */
const FALLBACK = [
  'Universidad de San Carlos de Guatemala',
  'Universidad Rafael Landívar',
  'Universidad del Valle de Guatemala',
  'Universidad Mariano Gálvez de Guatemala',
  'Universidad del Istmo',
  'Universidad Panamericana',
  'Universidad Mesoamericana',
  'Universidad Galileo',
  'Universidad InterNaciones',
].map((name) => ({ name, href: null as string | null, acronym: null as string | null }));

const SHORTCUTS = [
  { label: 'Buscar un programa', href: '/programas#buscar' },
  { label: 'Próximas actividades', href: '/actividades' },
  { label: 'Escribir al Foro', href: '/contacto' },
  { label: 'Aviso de privacidad', href: '/privacidad' },
];

/**
 * Pie institucional (v5, DESIGN_NOTES §27): banda violeta profunda con el emblema y lo que es el
 * Foro, las nueve universidades enlazadas a su perfil (desde la API, con respaldo fijo), los
 * atajos que más se buscan y una línea que explica el emblema. Abajo, créditos y volver arriba.
 */
export async function Footer() {
  const year = new Date().getFullYear();
  const res = await safe(api.universities(), null);
  const members = res?.data.length
    ? res.data.map((u) => ({
        name: u.name,
        acronym: u.acronym ?? null,
        href: `/universidades/${u.documentId}`,
      }))
    : FALLBACK;

  return (
    <footer className="site-footer">
      <div className="container-x">
        <div data-reveal="up" className="site-footer__lead">
          <Link
            href="/"
            className="site-footer__brand"
            aria-label="Foro Interuniversitario, inicio"
          >
            <Emblem className="h-12 w-12" motion="scroll" />
            <span>
              <span className="site-footer__name">Foro Interuniversitario</span>
              <span className="site-footer__sub">de Estudios de Posgrado · Guatemala</span>
            </span>
          </Link>
          <p className="site-footer__claim">
            Nueve universidades coordinan aquí su oferta de posgrado, sus actividades y sus
            proyectos.
          </p>
        </div>

        <div data-reveal-stagger="up" className="site-footer__grid">
          <nav aria-label="Secciones del sitio">
            <p className="site-footer__head">El sitio</p>
            <ul className="site-footer__list">
              {NAV_ITEMS.map((i) => (
                <li key={i.href}>
                  <Link href={i.href}>{i.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Universidades del Foro" className="site-footer__members">
            <p className="site-footer__head">Las nueve universidades</p>
            <ul className="site-footer__list site-footer__list--cols">
              {members.map((m) => (
                <li key={m.name}>
                  {m.href ? <Link href={m.href}>{m.name}</Link> : <span>{m.name}</span>}
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="site-footer__head">Atajos</p>
            <ul className="site-footer__list">
              {SHORTCUTS.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>
            <div className="site-footer__emblem">
              <Emblem bare className="h-7 w-7" />
              <p>
                El emblema es el número nueve en la numeración maya: la barra vale cinco y cada
                punto, uno. Nueve universidades, un solo foro.
              </p>
            </div>
          </div>
        </div>

        <div data-reveal="fade" className="site-footer__base">
          <span>© {year} Foro Interuniversitario de Estudios de Posgrado</span>
          <span className="flex items-center gap-4">
            Guatemala, C. A.
            <BackToTop />
          </span>
        </div>
      </div>
    </footer>
  );
}

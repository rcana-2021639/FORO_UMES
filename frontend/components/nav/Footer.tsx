import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/nav';
import { api, mediaUrl, safe } from '@/lib/api';
import { brandOf } from '@/lib/universities';
import { Emblem } from '@/components/ui/Emblem';
import { Arrow } from '@/components/ui/Arrow';
import { BackToTop } from './BackToTop';
import { FooterMembers, type FooterMember } from './FooterMembers';

/** Si la API no responde, el pie sigue nombrando a las nueve (sin enlace ni logo). */
const FALLBACK: FooterMember[] = [
  ['Universidad de San Carlos de Guatemala', 'USAC'],
  ['Universidad Rafael Landívar', 'URL'],
  ['Universidad del Valle de Guatemala', 'UVG'],
  ['Universidad Mariano Gálvez de Guatemala', 'UMG'],
  ['Universidad del Istmo', 'UNIS'],
  ['Universidad Panamericana', 'UPANA'],
  ['Universidad Mesoamericana', 'UMES'],
  ['Universidad Galileo', 'Galileo'],
  ['Universidad InterNaciones', 'UNI'],
].map(([name, acronym]) => ({ name, acronym, href: null, brand: brandOf(acronym).primary }));

const SHORTCUTS = [
  { label: 'Buscar un programa', href: '/programas#buscar' },
  { label: 'Próximas actividades', href: '/actividades' },
  { label: 'Comparar universidades', href: '/universidades?vista=comparar' },
  { label: 'Galería de fotos', href: '/galeria' },
];

/**
 * Pie institucional (v7.1): arriba, las nueve universidades con su logo (desde Strapi, enlazadas a
 * su perfil); en medio, el Foro (emblema y qué es), las secciones, los atajos y una invitación a
 * escribir; abajo, créditos, aviso de privacidad y volver arriba.
 */
export async function Footer() {
  const year = new Date().getFullYear();
  const res = await safe(api.universities(), null);
  const members: FooterMember[] = res?.data.length
    ? res.data.map((u) => ({
        name: u.name,
        acronym: u.acronym ?? null,
        href: `/universidades/${u.documentId}`,
        logo: mediaUrl(
          u.logo?.formats?.thumbnail?.url ?? u.logo?.formats?.small?.url ?? u.logo?.url
        ),
        brand: brandOf(u.acronym).primary,
      }))
    : FALLBACK;

  return (
    <footer className="site-footer">
      <div className="container-x">
        <section className="sf-unis" aria-labelledby="sf-unis-title">
          <div className="sf-unis__head" data-reveal="up">
            <p id="sf-unis-title" className="site-footer__head">
              Las {members.length === 9 ? 'nueve' : members.length} universidades del Foro
            </p>
            <Link href="/universidades" className="sf-link">
              Conocerlas <Arrow />
            </Link>
          </div>
          <FooterMembers members={members} />
        </section>

        <div className="sf-main">
          <div className="sf-about" data-reveal="up">
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
            <p className="sf-about__claim">
              Nueve universidades coordinan aquí su oferta de posgrado, sus actividades y sus
              proyectos.
            </p>
            <p className="sf-about__emblem">
              <Emblem bare className="h-5 w-5 flex-none" />
              El emblema es el nueve maya: la barra vale cinco y cada punto, uno.
            </p>
          </div>

          <nav aria-label="Secciones del sitio" data-reveal="up">
            <p className="site-footer__head">El sitio</p>
            <ul className="site-footer__list sf-cols">
              {NAV_ITEMS.map((i) => (
                <li key={i.href}>
                  <Link href={i.href}>{i.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Atajos" data-reveal="up">
            <p className="site-footer__head">Atajos</p>
            <ul className="site-footer__list">
              {SHORTCUTS.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sf-write" data-reveal="up">
            <p className="site-footer__head">¿Dudas o propuestas?</p>
            <p className="sf-write__text">
              La secretaría técnica del Foro lee cada mensaje y responde por correo.
            </p>
            <Link href="/contacto" className="sf-write__btn">
              Escribir al Foro <Arrow />
            </Link>
          </div>
        </div>

        <div data-reveal="fade" className="site-footer__base">
          <span>© {year} Foro Interuniversitario de Estudios de Posgrado</span>
          <span className="sf-base__end">
            <Link href="/privacidad">Aviso de privacidad</Link>
            <span aria-hidden>·</span>
            <span>Guatemala, C. A.</span>
            <BackToTop />
          </span>
        </div>
      </div>
    </footer>
  );
}

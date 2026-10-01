import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactForm } from '@/components/sections/ContactForm';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contacto',
  description:
    'Escribe a la secretaría técnica del Foro Interuniversitario de Estudios de Posgrado.',
  path: '/contacto',
});

export default function ContactoPage() {
  return (
    <section
      data-section-theme="dusk"
      data-fx-root
      className="section-dark section-dark--dusk section-dark--solid relative isolate min-h-svh text-fg"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="dusk-glow" />
        <span className="contact-bigword">Hola</span>
      </div>
      <PageHeader
        crumbs={[{ label: 'Contacto' }]}
        kicker="Universidades, prensa y estudiantes"
        title="Escríbele al Foro"
      />
      <div className="container-x relative z-10 pb-[var(--section-y)]">
        <ContactForm />
      </div>
    </section>
  );
}

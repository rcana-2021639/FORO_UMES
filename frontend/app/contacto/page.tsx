import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactForm } from '@/components/sections/ContactForm';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Escribe a la secretaría técnica del Foro Interuniversitario de Estudios de Posgrado.',
};

export default function ContactoPage() {
  return (
    <section data-section-theme="night" className="min-h-svh text-fg">
      <PageHeader
        kicker="Para universidades, prensa y quien busca un posgrado"
        title="Escríbele a la mesa"
      />
      <div className="container-x pb-[var(--section-y)]">
        <ContactForm />
      </div>
    </section>
  );
}

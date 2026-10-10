import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { pageMetadata } from '@/lib/seo';

/**
 * Términos y condiciones de uso del sitio. Reglas de uso aceptable y responsabilidades.
 * Pendiente del Foro: revisión por quien lo representa legalmente (AUDITORIA-PRODUCCION.md).
 */
export const metadata: Metadata = pageMetadata({
  title: 'Términos y condiciones',
  description:
    'Condiciones de uso del sitio del Foro Interuniversitario de Estudios de Posgrado: qué puedes hacer, qué no, y los límites de responsabilidad.',
  path: '/terminos',
});

const UPDATED = '10 de octubre de 2026';

export default function TerminosPage() {
  return (
    <article>
      <PageHeader
        crumbs={[{ label: 'Términos y condiciones' }]}
        kicker={`Actualizado el ${UPDATED}`}
        title="Términos y condiciones"
        mark={{ word: 'condiciones', kind: 'underline' }}
        intro="Las reglas para usar este sitio. Al navegarlo, aceptas estas condiciones."
      />
      <div className="container-x grid pb-[var(--section-y)] md:grid-cols-12">
        <div className="prose-acta max-w-[68ch] text-[1.05rem] leading-[1.7] text-fg md:col-span-8 md:col-start-4">
          <h2 data-reveal="left">Aceptación</h2>
          <p data-reveal="up">
            Al entrar y usar este sitio aceptas estos términos y nuestro{' '}
            <Link href="/aviso-legal" className="text-accent underline underline-offset-4">
              aviso legal
            </Link>
            . Si no estás de acuerdo, por favor no uses el sitio.
          </p>

          <h2 data-reveal="left">Uso permitido</h2>
          <p data-reveal="up">
            Puedes consultar, leer y compartir la información publicada para fines personales,
            educativos o informativos. El sitio es gratuito y de acceso público; no necesitas crear
            una cuenta para verlo.
          </p>

          <h2 data-reveal="left">Uso que no está permitido</h2>
          <p data-reveal="up">Al usar el sitio, te comprometes a no:</p>
          <ul data-reveal-stagger="up">
            <li>
              intentar acceder a partes restringidas (como el panel de administración) sin
              autorización;
            </li>
            <li>
              realizar ataques, enviar programas dañinos, sobrecargar el servidor o saltarte las
              medidas de seguridad;
            </li>
            <li>
              usar el formulario de contacto para enviar spam, publicidad o mensajes ofensivos;
            </li>
            <li>
              copiar la información de forma masiva y automatizada, ni reutilizarla sin permiso (ver{' '}
              <Link href="/aviso-legal" className="text-accent underline underline-offset-4">
                propiedad intelectual
              </Link>
              );
            </li>
            <li>suplantar a otra persona o institución.</li>
          </ul>

          <h2 data-reveal="left">Lo que tú nos envías</h2>
          <p data-reveal="up">
            Cuando escribes por el formulario de contacto, eres responsable de que la información
            que envías sea veraz y de que tengas derecho a compartirla. Tratamos esos datos como se
            describe en el{' '}
            <Link href="/privacidad" className="text-accent underline underline-offset-4">
              aviso de privacidad
            </Link>
            .
          </p>

          <h2 data-reveal="left">Disponibilidad del sitio</h2>
          <p data-reveal="up">
            Procuramos que el sitio esté siempre disponible, pero puede haber interrupciones por
            mantenimiento, fallas técnicas o causas ajenas a nosotros. No garantizamos que esté
            libre de errores ni disponible sin interrupción.
          </p>

          <h2 data-reveal="left">Exactitud de la información</h2>
          <p data-reveal="up">
            La información es orientativa. Cada universidad es responsable de sus propios datos.
            Antes de tomar una decisión, confírmalos directamente con la universidad
            correspondiente.
          </p>

          <h2 data-reveal="left">Cambios a estos términos</h2>
          <p data-reveal="up">
            Podemos actualizar estos términos cuando sea necesario. La versión publicada aquí, con
            su fecha (arriba), es siempre la vigente.
          </p>

          <h2 data-reveal="left">Ley aplicable</h2>
          <p data-reveal="up">
            Estos términos se rigen por las leyes de la República de Guatemala.
          </p>
        </div>
      </div>
    </article>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { pageMetadata } from '@/lib/seo';

/**
 * Aviso de cookies. El sitio NO usa cookies de analítica ni de publicidad: solo guarda dos datos
 * técnicos en el navegador del visitante (comparación de programas y nivel de efectos visuales),
 * que nunca salen de su dispositivo. Por eso no hay banner de consentimiento. Si algún día se
 * agrega analítica, hay que actualizar este aviso Y la página de privacidad, y evaluar el banner.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Aviso de cookies',
  description:
    'Este sitio no usa cookies de seguimiento ni de publicidad. Solo guarda datos técnicos en tu navegador que nunca salen de tu dispositivo.',
  path: '/cookies',
});

const UPDATED = '10 de octubre de 2026';

export default function CookiesPage() {
  return (
    <article>
      <PageHeader
        crumbs={[{ label: 'Aviso de cookies' }]}
        kicker={`Actualizado el ${UPDATED}`}
        title="Aviso de cookies"
        mark={{ word: 'cookies', kind: 'circle' }}
        intro="En corto: no te rastreamos. Este sitio no usa cookies de publicidad ni de analítica."
      />
      <div className="container-x grid pb-[var(--section-y)] md:grid-cols-12">
        <div className="prose-acta max-w-[68ch] text-[1.05rem] leading-[1.7] text-fg md:col-span-8 md:col-start-4">
          <h2 data-reveal="left">¿Qué es una cookie?</h2>
          <p data-reveal="up">
            Una cookie es un pequeño archivo que algunas webs guardan en tu navegador para
            recordarte, medir tus visitas o mostrarte publicidad. Aquí{' '}
            <strong>no usamos cookies para nada de eso</strong>.
          </p>

          <h2 data-reveal="left">Qué sí guardamos (y por qué no te rastrea)</h2>
          <p data-reveal="up">
            Para que el sitio te funcione cómodo, tu navegador guarda dos datos técnicos en tu
            propio dispositivo. No son cookies de seguimiento, no se envían a ningún servidor y no
            permiten identificarte:
          </p>
          <ul data-reveal-stagger="up">
            <li>
              <strong>Programas que marcas para comparar:</strong> cuando pones la estrella a un
              programa de posgrado para compararlo con otros, se recuerda en tu dispositivo.
            </li>
            <li>
              <strong>Nivel de efectos visuales:</strong> el sitio detecta qué cantidad de animación
              funciona bien en tu equipo y lo recuerda para que no se vea lento.
            </li>
          </ul>
          <p data-reveal="up">
            Ambos se guardan con una función del navegador llamada «almacenamiento local» y se
            quedan solo en tu dispositivo. Puedes borrarlos cuando quieras desde la configuración de
            tu navegador (en la sección de datos de sitios o historial).
          </p>

          <h2 data-reveal="left">Cookies técnicas del panel de administración</h2>
          <p data-reveal="up">
            La parte de administración del sitio (que usan solo las universidades para cargar su
            información, no el público) sí necesita cookies técnicas para mantener la sesión
            iniciada. Esas cookies son imprescindibles para su funcionamiento y no se usan para
            seguimiento.
          </p>

          <h2 data-reveal="left">Videos de YouTube y Vimeo</h2>
          <p data-reveal="up">
            Algunos videos vienen de YouTube o Vimeo. Mientras no le das «reproducir», no reciben
            nada desde aquí. Al reproducir uno, esos servicios pueden usar sus propias cookies según
            su política, como se explica en el{' '}
            <Link href="/privacidad" className="text-accent underline underline-offset-4">
              aviso de privacidad
            </Link>
            .
          </p>

          <h2 data-reveal="left">Si esto cambia</h2>
          <p data-reveal="up">
            Si en el futuro añadimos herramientas de medición de audiencia, actualizaremos este
            aviso, te lo informaremos y, si corresponde, te pediremos tu consentimiento antes de
            activarlas.
          </p>
        </div>
      </div>
    </article>
  );
}

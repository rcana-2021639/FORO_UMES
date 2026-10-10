import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { pageMetadata } from '@/lib/seo';

/**
 * Aviso legal. Identifica a quién opera el sitio y las reglas básicas de responsabilidad y
 * propiedad intelectual. Los datos entre [corchetes] los completa quien representa legalmente
 * al Foro (AUDITORIA-PRODUCCION.md, Fase 7). Si cambia algo, se actualiza aquí con su fecha.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Aviso legal',
  description:
    'Quién opera el sitio del Foro Interuniversitario de Estudios de Posgrado, cómo contactarlo y las condiciones legales de uso de la información publicada.',
  path: '/aviso-legal',
});

const UPDATED = '10 de octubre de 2026';

export default function AvisoLegalPage() {
  return (
    <article>
      <PageHeader
        crumbs={[{ label: 'Aviso legal' }]}
        kicker={`Actualizado el ${UPDATED}`}
        title="Aviso legal"
        mark={{ word: 'legal', kind: 'underline' }}
        intro="Quién es responsable de este sitio, cómo contactarlo y bajo qué condiciones se publica la información."
      />
      <div className="container-x grid pb-[var(--section-y)] md:grid-cols-12">
        <div className="prose-acta max-w-[68ch] text-[1.05rem] leading-[1.7] text-fg md:col-span-8 md:col-start-4">
          <h2 data-reveal="left">Quién es el responsable</h2>
          <p data-reveal="up">
            Este sitio pertenece al <strong>Foro Interuniversitario de Estudios de Posgrado</strong>
            , una iniciativa conjunta de universidades de Guatemala, y lo opera su equipo
            coordinador.
          </p>
          <ul data-reveal-stagger="up">
            <li>Responsable: [NOMBRE LEGAL DEL FORO O ENTIDAD QUE LO REPRESENTA]</li>
            <li>
              Correo de contacto:{' '}
              <a
                href="mailto:[CORREO OFICIAL DEL FORO]"
                className="text-accent underline underline-offset-4"
              >
                [CORREO OFICIAL DEL FORO]
              </a>
            </li>
            <li>Ubicación: Guatemala, C. A.</li>
          </ul>
          <p data-reveal="up">
            Para cualquier consulta puedes escribirnos desde la página de{' '}
            <Link href="/contacto" className="text-accent underline underline-offset-4">
              contacto
            </Link>
            .
          </p>

          <h2 data-reveal="left">Para qué sirve este sitio</h2>
          <p data-reveal="up">
            El sitio tiene un fin <strong>informativo</strong>: dar a conocer las universidades que
            integran el Foro, su oferta de estudios de posgrado, sus actividades y sus noticias. No
            es una plataforma de inscripción ni de pago, y no sustituye la información oficial de
            cada universidad.
          </p>

          <h2 data-reveal="left">Sobre la información publicada</h2>
          <p data-reveal="up">
            La información de cada universidad la carga y mantiene esa misma universidad. Procuramos
            que esté correcta y al día, pero puede contener errores o quedar desactualizada. Antes
            de tomar una decisión (por ejemplo, inscribirte en un programa), confirma los datos
            directamente con la universidad correspondiente a través de su sitio oficial.
          </p>

          <h2 data-reveal="left">Propiedad intelectual</h2>
          <p data-reveal="up">
            Los nombres, logotipos y marcas de cada universidad pertenecen a sus respectivas
            instituciones y se muestran aquí únicamente para identificarlas. Los textos y las
            imágenes publicados son de sus autores o de las universidades que los aportan. Puedes
            compartir enlaces a nuestras páginas; para reutilizar textos o imágenes, pide permiso
            primero escribiéndonos desde{' '}
            <Link href="/contacto" className="text-accent underline underline-offset-4">
              contacto
            </Link>
            .
          </p>

          <h2 data-reveal="left">Enlaces a otros sitios</h2>
          <p data-reveal="up">
            Este sitio enlaza a páginas de las universidades y a videos en plataformas externas. No
            controlamos esos sitios ni respondemos por su contenido ni por sus políticas; al entrar
            en ellos, aplican sus propios términos.
          </p>

          <h2 data-reveal="left">Límite de responsabilidad</h2>
          <p data-reveal="up">
            Hacemos lo razonable para mantener el sitio disponible, seguro y correcto, pero se
            ofrece «tal cual». No respondemos por daños derivados de decisiones tomadas con base en
            la información aquí publicada, ni por interrupciones del servicio ajenas a nuestro
            control.
          </p>

          <h2 data-reveal="left">Legislación aplicable</h2>
          <p data-reveal="up">
            Este aviso se rige por las leyes de la República de Guatemala. Para cualquier
            controversia relacionada con el sitio, las partes se someten a los tribunales
            competentes de [CIUDAD / DEPARTAMENTO QUE INDIQUE EL FORO], salvo que la ley disponga
            otra cosa.
          </p>

          <h2 data-reveal="left">Documentos relacionados</h2>
          <p data-reveal="up">
            Revisa también nuestro{' '}
            <Link href="/privacidad" className="text-accent underline underline-offset-4">
              aviso de privacidad
            </Link>
            , los{' '}
            <Link href="/terminos" className="text-accent underline underline-offset-4">
              términos y condiciones
            </Link>{' '}
            y el{' '}
            <Link href="/cookies" className="text-accent underline underline-offset-4">
              aviso de cookies
            </Link>
            .
          </p>
        </div>
      </div>
    </article>
  );
}

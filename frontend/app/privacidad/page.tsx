import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { pageMetadata } from '@/lib/seo';

/**
 * Aviso de privacidad. Describe lo que el sistema hace DE VERDAD; si cambia algo (un proveedor,
 * un plazo, se agrega analítica) este texto se actualiza en el mismo cambio, con su fecha.
 * - Plazo de los mensajes: CONTACT_RETENTION_DAYS del backend (src/lib/contact-retention.ts).
 * - Quién los ve: solo el Super Admin (SEGURIDAD.md, matriz de permisos).
 * Pendiente del Foro: revisión por quien lo representa legalmente (AUDITORIA-PRODUCCION.md).
 */
export const metadata: Metadata = pageMetadata({
  title: 'Aviso de privacidad',
  description:
    'Qué datos recoge el sitio del Foro Interuniversitario de Estudios de Posgrado, para qué los usa, cuánto tiempo los guarda y cómo pedir que se corrijan o se borren.',
  path: '/privacidad',
});

const UPDATED = '29 de septiembre de 2026';

export default function PrivacidadPage() {
  return (
    <article>
      <PageHeader
        kicker={`Actualizado el ${UPDATED}`}
        title="Aviso de privacidad"
        intro="En corto: solo pedimos tus datos cuando nos escribes, los usamos únicamente para responderte, no los vendemos ni los compartimos para publicidad y se borran solos al año."
      />
      <div className="container-x grid pb-[var(--section-y)] md:grid-cols-12">
        <div className="prose-acta max-w-[68ch] text-[1.05rem] leading-[1.7] text-fg md:col-span-8 md:col-start-4">
          <h2 data-reveal="left">Quién es responsable</h2>
          <p data-reveal="up">
            El Foro Interuniversitario de Estudios de Posgrado, a través de su equipo coordinador,
            es responsable de este sitio y de los datos que recibe. Para cualquier pregunta sobre
            privacidad, escríbenos desde la página de{' '}
            <Link href="/contacto" className="text-accent underline underline-offset-4">
              contacto
            </Link>{' '}
            y pon «Privacidad» en el asunto.
          </p>

          <h2 data-reveal="left">Qué datos recogemos y para qué</h2>
          <h3 data-reveal="left">Cuando nos escribes</h3>
          <p data-reveal="up">
            El formulario de contacto pide tu <strong>nombre</strong>, tu{' '}
            <strong>correo electrónico</strong>, un <strong>asunto</strong> (opcional) y tu{' '}
            <strong>mensaje</strong>. Los usamos solo para leer tu consulta y responderte. No los
            usamos para enviarte publicidad, no los vendemos y no los compartimos con nadie ajeno al
            Foro.
          </p>
          <h3 data-reveal="left">Cuando visitas el sitio</h3>
          <p data-reveal="up">
            Como cualquier página web, nuestro servidor recibe datos técnicos de cada visita: la
            dirección IP y el tipo de navegador. Los usamos solo para mantener el sitio seguro (por
            ejemplo, para frenar a quien intente enviar cientos de mensajes seguidos) y para
            corregir fallas. Se guardan por poco tiempo en los registros técnicos del servidor y no
            se usan para identificarte ni para seguirte.
          </p>
          <h3 data-reveal="left">Sin cookies de seguimiento</h3>
          <p data-reveal="up">
            Este sitio no usa cookies de publicidad ni de analítica. Tu navegador guarda dos datos
            que nunca salen de tu dispositivo: los programas que marcas con la estrella para
            compararlos y el nivel de efectos visuales que mejor funciona en tu equipo. Puedes
            borrarlos cuando quieras desde la configuración de tu navegador.
          </p>

          <h2 data-reveal="left">Quién puede ver tus mensajes</h2>
          <p data-reveal="up">
            Solo el equipo coordinador del Foro. Las personas que actualizan la información de cada
            universidad no tienen acceso a los mensajes de contacto.
          </p>

          <h2 data-reveal="left">Cuánto tiempo los guardamos</h2>
          <p data-reveal="up">
            Cada mensaje se borra automáticamente <strong>un año</strong> después de recibido. Las
            copias de seguridad de la base de datos, que existen para recuperar el sitio ante una
            falla, pueden conservarlo un tiempo más, hasta que esas copias se renuevan.
          </p>

          <h2 data-reveal="left">Servicios que nos ayudan a operar el sitio</h2>
          <p data-reveal="up">
            Para funcionar, el sitio usa proveedores de tecnología que procesan datos solo por
            encargo nuestro y bajo sus propias medidas de seguridad; algunos tienen sus servidores
            fuera de Guatemala:
          </p>
          <ul data-reveal-stagger="up">
            <li>alojamiento de los servidores y de la base de datos (Railway);</li>
            <li>almacenamiento de las imágenes publicadas (Cloudflare);</li>
            <li>envío del aviso de tu mensaje al equipo del Foro (Resend);</li>
            <li>registro de errores técnicos, sin datos personales (Sentry).</li>
          </ul>

          <h2 data-reveal="left">Videos de YouTube y Vimeo</h2>
          <p data-reveal="up">
            Algunos videos de la galería vienen de YouTube o Vimeo. Mientras no le das «reproducir»,
            esos servicios no reciben nada desde aquí; los de YouTube se cargan en su modo de
            privacidad mejorada. Al reproducir uno, el servicio puede recoger datos según su propia
            política:{' '}
            <a
              href="https://policies.google.com/privacy?hl=es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4"
            >
              Google (YouTube)
            </a>{' '}
            y{' '}
            <a
              href="https://vimeo.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4"
            >
              Vimeo
            </a>
            .
          </p>

          <h2 data-reveal="left">Tus derechos</h2>
          <p data-reveal="up">
            Puedes pedirnos en cualquier momento que te digamos qué datos tuyos tenemos, que los
            corrijamos o que los borremos antes del plazo. Escríbenos desde{' '}
            <Link href="/contacto" className="text-accent underline underline-offset-4">
              contacto
            </Link>{' '}
            con el asunto «Privacidad», desde el mismo correo que usaste, y te responderemos dentro
            de los 10 días hábiles siguientes.
          </p>

          <h2 data-reveal="left">Cómo los protegemos</h2>
          <p data-reveal="up">
            El sitio funciona solo con conexión cifrada (HTTPS), los mensajes se guardan en una base
            de datos a la que únicamente accede el equipo coordinador con contraseña, y cada inicio
            de sesión y cada cambio en el panel de administración quedan registrados.
          </p>

          <h2 data-reveal="left">Menores de edad</h2>
          <p data-reveal="up">
            El sitio está dirigido a personas interesadas en estudios de posgrado. No buscamos
            recoger datos de menores de edad; si eres menor, pide a una persona adulta que escriba
            por ti.
          </p>

          <h2 data-reveal="left">Cambios a este aviso</h2>
          <p data-reveal="up">
            Si cambiamos la forma en que tratamos los datos, actualizaremos este aviso y su fecha
            (arriba). La versión publicada aquí es siempre la vigente.
          </p>
        </div>
      </div>
    </article>
  );
}

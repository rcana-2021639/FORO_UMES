import type { Metadata, Viewport } from 'next';
import { Newsreader, Schibsted_Grotesk } from 'next/font/google';
import './globals.css';
import '@/styles/v3.css';
import '@/styles/v4.css';
import '@/styles/v5.css';
import '@/styles/v6.css';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { ToasterMount } from '@/components/feedback/ToasterMount';
import { GooeyDefs } from '@/components/ui/GooeyDefs';
import { SectionThemeObserver } from '@/components/providers/SectionThemeObserver';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/nav/Footer';
import { ClickSparkLayer } from '@/components/fx/ClickSparkLayer';
import { QualityProbe } from '@/components/providers/QualityProbe';
import { QUALITY_SCRIPT } from '@/lib/quality-script';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';
import { INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME, SITE_URL } from '@/lib/site';

// Titulares: Newsreader (eje óptico 6–72: fina en grande, robusta en pequeño). Texto e interfaz:
// Schibsted Grotesk. Elegidas tras comparar 8 parejas con texto real (DESIGN_NOTES §27.5).
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const schibsted = Schibsted_Grotesk({
  variable: '--font-schibsted',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  // Base de toda URL relativa en los metadatos (canónicas, Open Graph): el dominio público
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_SHORT_NAME,
  category: 'education',
  // Solo producción se indexa (lib/site.ts). Vista previa grande en Google Discover y resultados.
  robots: INDEXABLE
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
      }
    : { index: false, follow: false },
  // Google Search Console: el valor que da al elegir "Etiqueta HTML" (la verificación por DNS no lo necesita)
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  // iOS no convierte en enlaces de llamada los números (años, folios) que no son teléfonos
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'es_GT',
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#fdfcff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${newsreader.variable} ${schibsted.variable} h-full antialiased`}
      data-quality="full"
      suppressHydrationWarning
    >
      <head>
        {/* Arranque: nivel de efectos y entradas animadas. Inline y bloqueante a propósito: tiene
            que correr antes del primer pintado para retener cada elemento en su estado inicial */}
        <script dangerouslySetInnerHTML={{ __html: QUALITY_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <GooeyDefs />
        {/* Progreso de lectura: animación ligada al scroll, sin JavaScript */}
        <div aria-hidden className="scroll-progress" />
        <SmoothScroll>
          <Navbar />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <Footer />
        </SmoothScroll>
        <SectionThemeObserver />
        <ClickSparkLayer />
        <ToasterMount />
        <QualityProbe />
      </body>
    </html>
  );
}

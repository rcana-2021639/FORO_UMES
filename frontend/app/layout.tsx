import type { Metadata, Viewport } from 'next';
import { Alegreya, Alegreya_Sans, Alegreya_Sans_SC, Shantell_Sans } from 'next/font/google';
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
import { CommandSearch } from '@/components/nav/CommandSearch';
import { QualityProbe } from '@/components/providers/QualityProbe';
import { OffscreenPause } from '@/components/providers/OffscreenPause';
import { PageBackdrop } from '@/components/fx/PageBackdrop';
import { QUALITY_SCRIPT } from '@/lib/quality-script';
import { DEFAULT_OG_IMAGE } from '@/lib/seo';
import { INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME, SITE_URL } from '@/lib/site';

// v7 "Anuario anotado" (DESIGN_NOTES §29.3): el anuario impreso en Alegreya —de Huerta
// Tipográfica (Argentina); su nombre viene de "alegría"— y, encima, las notas a mano de quien lo
// leyó, en Shantell Sans. Solo el subconjunto latino: ya trae á é í ó ú ñ ü ¿ ¡.
const alegreya = Alegreya({
  variable: '--font-alegreya',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const alegreyaSans = Alegreya_Sans({
  variable: '--font-alegreya-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// Versalitas de verdad para las etiquetas (antes, mayúsculas forzadas con interletra)
const alegreyaSC = Alegreya_Sans_SC({
  variable: '--font-alegreya-sc',
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
});

// Letra a mano para las anotaciones: con ejes de informalidad (INFM) y rebote (BNCE). No se
// precarga: son notas pequeñas y llegan un instante después sin mover nada.
const shantell = Shantell_Sans({
  variable: '--font-shantell',
  subsets: ['latin'],
  axes: ['BNCE', 'INFM'],
  display: 'swap',
  preload: false,
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
      className={`${alegreya.variable} ${alegreyaSans.variable} ${alegreyaSC.variable} ${shantell.variable} h-full antialiased`}
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
        {/* Fondo propio de cada vista (v7 §29.4): detrás de todo, responde al cursor */}
        <PageBackdrop />
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
        <CommandSearch />
        <ToasterMount />
        <QualityProbe />
        <OffscreenPause />
      </body>
    </html>
  );
}

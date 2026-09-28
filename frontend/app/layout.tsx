import type { Metadata, Viewport } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '@/styles/v3.css';
import '@/styles/v4.css';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { ToasterMount } from '@/components/feedback/ToasterMount';
import { GooeyDefs } from '@/components/ui/GooeyDefs';
import { SectionThemeObserver } from '@/components/providers/SectionThemeObserver';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/nav/Footer';
import { ClickSparkLayer } from '@/components/fx/ClickSparkLayer';
import { QualityProbe } from '@/components/providers/QualityProbe';
import { QUALITY_SCRIPT } from '@/lib/quality-script';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const SITE = 'Foro Interuniversitario de Estudios de Posgrado';

export const metadata: Metadata = {
  title: { default: SITE, template: `%s · ${SITE}` },
  description:
    'Nueve universidades de Guatemala coordinan sus estudios de posgrado: programas, actividades, aportes y noticias del Foro.',
  openGraph: { type: 'website', locale: 'es_GT', siteName: SITE },
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
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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

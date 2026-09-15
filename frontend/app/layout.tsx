import type { Metadata, Viewport } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { ToasterMount } from '@/components/feedback/ToasterMount';
import { CustomCursor } from '@/components/cursor/CustomCursor';
import { GooeyDefs } from '@/components/ui/GooeyDefs';
import { SectionThemeObserver } from '@/components/providers/SectionThemeObserver';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/nav/Footer';

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
  themeColor: '#f3eee4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <GooeyDefs />
        <SmoothScroll>
          <Navbar />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <Footer />
        </SmoothScroll>
        <SectionThemeObserver />
        <CustomCursor />
        <ToasterMount />
      </body>
    </html>
  );
}

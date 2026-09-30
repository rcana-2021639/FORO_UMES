import type { Metadata } from 'next';
import { SITE_NAME } from './site';

/** Imagen para compartir por defecto (app/opengraph-image.tsx, generada en el build). */
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

interface PageSeo {
  /** Sin el sufijo del sitio: lo agrega la plantilla del layout. Vacío = título del sitio. */
  title?: string;
  description?: string;
  /** Ruta canónica de la página ("/noticias/abc"); las URL relativas usan metadataBase. */
  path: string;
  /** Imagen propia (portada de la noticia, etc.); sin ella, la del Foro. */
  image?: string | null;
  imageAlt?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

/**
 * Metadatos completos de una página. En Next, el `openGraph` de una página REEMPLAZA entero al
 * del layout (no se combinan), así que cada página arma aquí el suyo completo: canónica, tarjeta
 * para WhatsApp/Facebook/LinkedIn (Open Graph) y para X, siempre con imagen.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
}: PageSeo): Metadata {
  const images = image ? [{ url: image, alt: imageAlt || title || SITE_NAME }] : [DEFAULT_OG_IMAGE];
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: 'es_GT',
      url: path,
      title: title ?? SITE_NAME,
      description,
      images,
      ...(type === 'article'
        ? {
            publishedTime: publishedTime ?? undefined,
            modifiedTime: modifiedTime ?? undefined,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? SITE_NAME,
      description,
      images: images.map((i) => i.url),
    },
  };
}

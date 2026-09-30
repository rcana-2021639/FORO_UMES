import type { MetadataRoute } from 'next';
import { INDEXABLE, absoluteUrl } from '@/lib/site';

/**
 * robots.txt. El sitio público se abre entero a los buscadores (sin excluir /_next: Google
 * necesita el CSS y el JS para ver la página como una persona) y anuncia su sitemap. Cualquier otro
 * despliegue (local, staging con NEXT_PUBLIC_NOINDEX=true) se cierra para no competir con él.
 */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}

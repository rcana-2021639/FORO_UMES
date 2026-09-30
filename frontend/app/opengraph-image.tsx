import { ImageResponse } from 'next/og';
import { BRAND, SITE_NAME } from '@/lib/site';

/**
 * Imagen que aparece al compartir un enlace del Foro (WhatsApp, Facebook, LinkedIn, X). Se genera
 * una vez en el build, con la fuente por defecto de next/og (Geist, la misma del texto del sitio).
 * Las noticias y actividades con portada usan su propia foto (lib/seo.ts).
 */
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACRONYMS = ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo', 'UNI'];

// La misma marca que scripts/generate-icons.mjs (la "F" sobre el círculo violeta)
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${BRAND.violet}"/><stop offset="0.55" stop-color="${BRAND.orchid}"/><stop offset="1" stop-color="${BRAND.violetLight}"/></linearGradient></defs><circle cx="256" cy="256" r="256" fill="url(#g)"/><path fill="#fff" d="M184 128h160v56H240v48h72v52h-72v100h-56z"/></svg>`;
const MARK_SRC = `data:image/svg+xml;base64,${Buffer.from(MARK).toString('base64')}`;

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        color: BRAND.ink,
        backgroundColor: BRAND.paper,
        backgroundImage: `radial-gradient(circle at 92% 12%, ${BRAND.lilac} 0%, rgba(236,228,255,0) 46%), radial-gradient(circle at 8% 100%, #f6f2ff 0%, rgba(246,242,255,0) 40%)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse no usa next/image */}
        <img src={MARK_SRC} width={76} height={76} alt="" />
        <div style={{ fontSize: 30, color: BRAND.inkMuted, letterSpacing: 1 }}>
          Foro de Posgrado · Guatemala
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 34, lineHeight: 1.3, color: BRAND.inkMuted, maxWidth: 900 }}>
          Nueve universidades, una sola oferta de posgrado: programas, actividades y noticias.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          paddingTop: 28,
          borderTop: `2px solid ${BRAND.lilac}`,
        }}
      >
        {ACRONYMS.map((a) => (
          <div
            key={a}
            style={{
              fontSize: 24,
              color: BRAND.violet,
              padding: '6px 16px',
              borderRadius: 999,
              backgroundColor: '#f6f2ff',
            }}
          >
            {a}
          </div>
        ))}
      </div>
    </div>,
    size
  );
}

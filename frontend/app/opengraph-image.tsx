import { ImageResponse } from 'next/og';
import { BRAND, SITE_NAME } from '@/lib/site';

/**
 * Imagen que aparece al compartir un enlace del Foro (WhatsApp, Facebook, LinkedIn, X). Se genera
 * una vez en el build. Composición de la v5 (DESIGN_NOTES §27): papel blanco, el emblema (el 9
 * maya), etiqueta en versalitas con su filete, el nombre del Foro y, abajo, las nueve siglas
 * separadas por puntos. Las noticias y actividades con portada usan su propia foto (lib/seo.ts).
 */
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACRONYMS = ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'Galileo', 'UNI'];

// El mismo emblema de components/ui/Emblem.tsx y scripts/generate-icons.mjs
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="${BRAND.emblem}"/><g fill="#fff">${[9.65, 16.55, 23.45, 30.35].map((cx) => `<circle cx="${cx}" cy="15" r="2.55"/>`).join('')}<rect x="7.1" y="21.6" width="25.8" height="5.2" rx="2.6"/></g></svg>`;
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
        padding: '64px 80px 60px',
        color: BRAND.ink,
        backgroundColor: '#ffffff',
        borderTop: `14px solid ${BRAND.emblem}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse no usa next/image */}
        <img src={MARK_SRC} width={84} height={84} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
            Foro Interuniversitario
          </div>
          <div style={{ fontSize: 19, letterSpacing: 3, color: BRAND.inkMuted }}>
            DE ESTUDIOS DE POSGRADO · GUATEMALA
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 20, letterSpacing: 3, color: BRAND.violetText }}>
            NUEVE UNIVERSIDADES, UNA SOLA OFERTA
          </div>
          <div style={{ flex: 1, height: 2, backgroundColor: BRAND.lilac }} />
        </div>
        <div style={{ fontSize: 70, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1000 }}>
          Programas de posgrado, actividades y noticias de las universidades de Guatemala
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          fontSize: 24,
          color: BRAND.violetText,
        }}
      >
        {ACRONYMS.flatMap((a, i) => [
          ...(i
            ? [
                <div
                  key={`s${a}`}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 6,
                    backgroundColor: BRAND.violetLight,
                  }}
                />,
              ]
            : []),
          <div key={a}>{a}</div>,
        ])}
      </div>
    </div>,
    size
  );
}

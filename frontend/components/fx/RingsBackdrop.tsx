'use client';

import dynamic from 'next/dynamic';

const MagicRings = dynamic(() => import('./MagicRings').then((m) => m.MagicRings), { ssr: false });

interface Props {
  color?: string;
  colorTwo?: string;
  opacity?: number;
  followMouse?: boolean;
  className?: string;
}

/**
 * Fondo de sección con los anillos (MagicRings) cargados en cliente y fundidos con una máscara
 * radial para que no corten en los bordes. Se usa como `backdrop` de <Section>.
 */
export function RingsBackdrop({
  color = '#7c5ae0',
  colorTwo = '#ebcff2',
  opacity = 0.5,
  followMouse = true,
  className,
}: Props) {
  return (
    <div
      aria-hidden
      className={['absolute inset-0', className].filter(Boolean).join(' ')}
      style={{
        opacity,
        maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
      }}
    >
      <MagicRings
        color={color}
        colorTwo={colorTwo}
        ringCount={7}
        speed={0.6}
        attenuation={12}
        lineThickness={1.6}
        baseRadius={0.2}
        radiusStep={0.09}
        scaleRate={0.14}
        noiseAmount={0.05}
        ringGap={1.6}
        followMouse={followMouse}
        mouseInfluence={0.12}
        hoverScale={1.06}
        parallax={0.04}
      />
    </div>
  );
}

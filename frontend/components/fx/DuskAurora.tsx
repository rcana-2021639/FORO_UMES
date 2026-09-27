'use client';

import { AuroraLayer } from '@/components/hero/AuroraLayer';

/**
 * Aurora luminosa (violeta → jade → oro) para el crepúsculo de Contacto: la misma pieza OGL del
 * hero en modo oscuro, en `screen` y con un fundido en los bordes para que no corte.
 */
export function DuskAurora() {
  return (
    <div
      className="absolute inset-x-0 -top-[10%] h-[120%] opacity-70 mix-blend-screen"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
      }}
    >
      <AuroraLayer
        mode="dark"
        colorStops={['#7c5ae0', '#ebcff2', '#f3d9f0']}
        amplitude={1.1}
        blend={0.6}
        speed={0.5}
      />
    </div>
  );
}

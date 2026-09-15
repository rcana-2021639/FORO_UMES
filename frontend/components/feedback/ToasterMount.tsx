'use client';

import { Toaster } from 'sileo';

/** Sistema de feedback del sitio (Sileo). Un solo Toaster en el layout raíz. */
export function ToasterMount() {
  return (
    <Toaster
      position="bottom-center"
      offset={24}
      theme="light"
      options={{
        fill: '#16150f',
        roundness: 6,
        duration: 4200,
        styles: {
          title: 'font-sans text-[0.95rem] font-medium tracking-tight',
          description: 'font-sans text-[0.85rem] opacity-80',
          badge: 'font-mono text-[0.65rem] uppercase tracking-[0.08em]',
          button: 'font-mono text-[0.7rem] uppercase tracking-[0.08em]',
        },
      }}
    />
  );
}

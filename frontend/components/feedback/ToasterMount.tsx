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
        fill: '#101511',
        roundness: 6,
        duration: 4200,
        styles: {
          title: 'font-sans text-[0.95rem] font-medium tracking-tight',
          description: 'font-sans text-[0.85rem] opacity-80',
          badge: 'font-sans text-[0.72rem]',
          button: 'font-sans text-[0.8rem] font-medium',
        },
      }}
    />
  );
}

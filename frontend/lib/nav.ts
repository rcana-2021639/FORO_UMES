/** Rutas principales del sitio. Módulo sin 'use client' para poder usarlo en Server Components. */
export const NAV_ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Universidades', href: '/universidades' },
  { label: 'Programas', href: '/programas' },
  { label: 'Actividades', href: '/actividades' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Galería', href: '/galeria' },
  { label: 'Contacto', href: '/contacto' },
] as const;

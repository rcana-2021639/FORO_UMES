import type { StrapiApp } from '@strapi/strapi/admin';
import { Information } from '@strapi/icons';
import emblema from './extensions/emblema.svg';
import { TRADUCCIONES_ES } from './extensions/traducciones';

/**
 * Personalización del panel administrativo (auditoría de producción, A-11; diseño v7.1).
 *
 * Quienes lo usan son editores de universidades guatemaltecas, no programadores: el panel abre en
 * español. Strapi arranca en inglés salvo que el navegador ya tenga guardado otro idioma, así que
 * solo se fija el español la primera vez; cada persona puede cambiarlo después en su perfil.
 *
 * Diseño: los morados del sitio (en modo claro y oscuro), el emblema del Foro (el nueve maya) en
 * la entrada y en el menú, textos de bienvenida propios y, en la página de inicio, una tarjeta con
 * los pasos básicos y el enlace a la guía para editores. Sin tutoriales ni avisos de Strapi.
 */
const LANGUAGE_KEY = 'strapi-admin-language';

try {
  if (!window.localStorage.getItem(LANGUAGE_KEY)) {
    window.localStorage.setItem(LANGUAGE_KEY, 'es');
  }
} catch {
  // Almacenamiento bloqueado (modo privado estricto): queda en inglés, con el selector de idioma
}

// El aviso de Strapi sobre su nueva biblioteca de medios (en inglés, con enlace a su blog) no le
// sirve a un editor: se da por cerrado.
// La clave lleva el identificador de la instalación ("false" si no tiene, como aquí).
void fetch('/admin/init')
  .then((r) => r.json())
  .then(({ data }: { data?: { uuid?: string | false } }) => {
    const scope = String(data?.uuid ?? false);
    for (const legacy of [true, false])
      window.localStorage.setItem(
        `STRAPI_MEDIA_LIBRARY_BANNER_DISMISSED_FOR_${legacy}:${scope}`,
        'true'
      );
  })
  .catch(() => {});

const BRAND = {
  'app.components.LeftMenu.navbrand.title': 'Foro de Posgrado',
  'app.components.LeftMenu.navbrand.workplace': 'Panel de contenidos',
};

export default {
  config: {
    locales: ['es'],
    auth: { logo: emblema },
    menu: { logo: emblema },
    tutorials: false,
    notifications: { releases: false },
    theme: {
      light: {
        colors: {
          primary100: '#f4f0ff',
          primary200: '#e2d8fc',
          primary500: '#7c5ae0',
          primary600: '#5b3fc0',
          primary700: '#3a2677',
          buttonPrimary500: '#6443c4',
          buttonPrimary600: '#4b2fa8',
        },
      },
      dark: {
        colors: {
          primary100: '#1e1638',
          primary200: '#33266b',
          primary500: '#9b80f0',
          primary600: '#b8a2fa',
          primary700: '#d6cbff',
          buttonPrimary500: '#6f4fd6',
          buttonPrimary600: '#8a6cf0',
        },
      },
    },
    translations: {
      es: {
        ...TRADUCCIONES_ES,
        ...BRAND,
        'Auth.form.welcome.title': 'Panel del Foro de Posgrado',
        'Auth.form.welcome.subtitle': 'Entra con el correo y la contraseña de tu cuenta.',
        'Auth.form.email.placeholder': 'nombre@universidad.edu.gt',
        'HomePage.header.title': 'Hola, {name}',
        'HomePage.header.subtitle':
          'Desde aquí cargas la información de tu universidad en el sitio del Foro.',
        'foro.guia.titulo': 'Cómo cargar información',
      },
      en: {
        ...BRAND,
        'Auth.form.welcome.title': 'Foro de Posgrado admin panel',
        'foro.guia.titulo': 'How to add content',
      },
    },
  },
  register(app: StrapiApp) {
    app.widgets.register({
      icon: Information,
      title: { id: 'foro.guia.titulo', defaultMessage: 'Cómo cargar información' },
      component: async () => (await import('./extensions/GuideWidget')).GuideWidget,
      id: 'foro-guia',
    });
  },
};

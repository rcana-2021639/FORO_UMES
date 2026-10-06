/**
 * Personalización del panel administrativo (auditoría de producción, A-11).
 *
 * Quienes lo usan son editores de universidades guatemaltecas, no programadores: el panel abre en
 * español. Strapi arranca en inglés salvo que el navegador ya tenga guardado otro idioma, así que
 * solo se fija el español la primera vez; cada persona puede cambiarlo después en su perfil.
 */
const LANGUAGE_KEY = 'strapi-admin-language';

try {
  if (!window.localStorage.getItem(LANGUAGE_KEY)) {
    window.localStorage.setItem(LANGUAGE_KEY, 'es');
  }
} catch {
  // Almacenamiento bloqueado (modo privado estricto): queda en inglés, con el selector de idioma
}

export default {
  config: {
    locales: ['es'],
  },
};

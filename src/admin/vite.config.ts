import { mergeConfig, type UserConfig } from 'vite';

/**
 * Servidor de desarrollo del panel (solo `npm run develop`). Su vigilante de archivos miraba todo
 * el repositorio: cada `next build` y cada página que el frontend guarda en `frontend/.next`
 * disparaban recargas del panel y tenían a Strapi ocupando más de un núcleo de CPU mientras se
 * trabajaba en el sitio. Lo mismo que `watchIgnoreFiles` en config/admin.ts, pero para Vite.
 */
export default (config: UserConfig) => {
  return mergeConfig(config, {
    server: {
      watch: {
        ignored: ['**/frontend/**', '**/video/**', '**/.claude/**'],
      },
    },
  });
};

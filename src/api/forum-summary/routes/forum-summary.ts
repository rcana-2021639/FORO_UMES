/**
 * GET /api/forum-summary — datos agregados para la sección de Inicio (Sprint 4, tarea 8).
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/forum-summary',
      handler: 'forum-summary.get',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};

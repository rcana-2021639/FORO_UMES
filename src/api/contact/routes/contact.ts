/**
 * POST /api/contact — formulario de contacto público (Sprint 4, tarea 4).
 * auth: false → accesible sin token; no depende del rol Public de users-permissions.
 * El límite de tasa se aplica en el middleware global rate-limit (Sprint 5).
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/contact',
      handler: 'contact.submit',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};

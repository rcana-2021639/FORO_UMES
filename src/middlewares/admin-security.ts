import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { recordAudit } from '../security/audit';

/**
 * Política de contraseñas del panel (Sprint 3, tarea 7): mínimo 12 caracteres con mayúscula,
 * minúscula, número y símbolo. Strapi solo exige 8 caracteres y no es configurable, por eso
 * se valida aquí, en cada ruta donde se define o cambia una contraseña de administrador.
 */
export const PASSWORD_POLICY = {
  minLength: 12,
  message:
    'La contraseña debe tener al menos 12 caracteres e incluir mayúsculas, minúsculas, números y símbolos.',
};

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_POLICY.minLength &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// Rutas del panel que reciben una contraseña nueva en el cuerpo
const PASSWORD_ROUTES = [
  /^\/admin\/register-admin$/, // primer Super Admin
  /^\/admin\/register$/, // aceptar invitación
  /^\/admin\/reset-password$/, // restablecer por correo
  /^\/admin\/users\/me$/, // cambiar la propia contraseña
  /^\/admin\/users\/\d+$/, // Super Admin editando a otro usuario
];

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: Context, next: Next) => {
    const path = ctx.path;

    if (
      (ctx.method === 'POST' || ctx.method === 'PUT') &&
      PASSWORD_ROUTES.some((r) => r.test(path))
    ) {
      const body = (ctx.request.body ?? {}) as { password?: unknown };
      if (typeof body.password === 'string' && !isStrongPassword(body.password)) {
        ctx.status = 400;
        ctx.body = {
          error: {
            status: 400,
            name: 'ValidationError',
            code: 'WEAK_PASSWORD',
            message: PASSWORD_POLICY.message,
          },
        };
        return;
      }
    }

    await next();

    // Auditoría de inicios de sesión exitosos (sin registrar nunca la contraseña)
    if (ctx.method === 'POST' && path === '/admin/login' && ctx.status === 200) {
      const user = (ctx.body as { data?: { user?: { id: number; email?: string } } })?.data?.user;
      if (user) {
        await recordAudit(strapi, { user, action: 'login', ipAddress: ctx.ip, statusCode: 200 });
      }
    }
  };
};

import type { Core } from '@strapi/strapi';
import { isStrongPassword, PASSWORD_POLICY } from '../middlewares/admin-security';

/**
 * Primer Super Admin desde variables de entorno (DESPLIEGUE.md §8.5).
 *
 * Mientras no existe ningún administrador, cualquiera que abra /admin puede registrarse como
 * Super Admin. En Railway se evitaba creándolo por consola antes de publicar el dominio; en el
 * plan gratuito de Render no hay consola y el dominio es público desde el primer minuto. Por eso,
 * si al arrancar no hay administradores y existen SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD, se crea
 * aquí, antes de que el servidor acepte peticiones: el registro público nunca queda abierto.
 * Después de entrar por primera vez hay que borrar SUPERADMIN_PASSWORD de las variables.
 */
export interface InitialAdminEnv {
  email?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
}

export type InitialAdminPlan =
  | { action: 'skip'; reason: string }
  | { action: 'warn'; reason: string }
  | { action: 'error'; reason: string }
  | { action: 'create'; email: string; password: string; firstname: string; lastname: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initialAdminPlan(hasAdmin: boolean, env: InitialAdminEnv): InitialAdminPlan {
  const email = env.email?.trim().toLowerCase();
  const password = env.password ?? '';
  if (hasAdmin) {
    return password
      ? { action: 'warn', reason: 'ya hay administradores: borra SUPERADMIN_PASSWORD' }
      : { action: 'skip', reason: 'ya hay administradores' };
  }
  if (!email || !password) return { action: 'skip', reason: 'sin SUPERADMIN_EMAIL/PASSWORD' };
  if (!EMAIL.test(email)) return { action: 'error', reason: 'SUPERADMIN_EMAIL no es un correo' };
  if (!isStrongPassword(password))
    return { action: 'error', reason: `SUPERADMIN_PASSWORD: ${PASSWORD_POLICY.message}` };
  return {
    action: 'create',
    email,
    password,
    firstname: env.firstname?.trim() || 'Super',
    lastname: env.lastname?.trim() || 'Admin',
  };
}

export async function ensureInitialAdmin(strapi: Core.Strapi): Promise<void> {
  const users = strapi.service('admin::user');
  const plan = initialAdminPlan(await users.exists(), {
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
    firstname: process.env.SUPERADMIN_FIRSTNAME,
    lastname: process.env.SUPERADMIN_LASTNAME,
  });
  if (plan.action === 'skip') return;
  if (plan.action === 'warn') {
    strapi.log.warn(`[admin] ${plan.reason}`);
    return;
  }
  if (plan.action === 'error') {
    strapi.log.error(`[admin] no se creó el primer Super Admin: ${plan.reason}`);
    return;
  }
  const role = await strapi.service('admin::role').getSuperAdmin();
  if (!role) {
    strapi.log.error('[admin] no existe el rol Super Admin todavía');
    return;
  }
  await users.create({
    email: plan.email,
    firstname: plan.firstname,
    lastname: plan.lastname,
    password: plan.password,
    isActive: true,
    registrationToken: null,
    roles: [role.id],
  });
  strapi.log.warn(
    `[admin] primer Super Admin creado (${plan.email}). Entra al panel y borra SUPERADMIN_PASSWORD de las variables del servidor.`
  );
}

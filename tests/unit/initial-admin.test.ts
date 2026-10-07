/**
 * Primer Super Admin desde variables de entorno (src/security/initial-admin.ts).
 */
import { initialAdminPlan } from '../../src/security/initial-admin';

const STRONG = 'Foro-Posgrado-2026!';

describe('initialAdminPlan', () => {
  it('con administradores no crea nada; avisa si la contraseña sigue en las variables', () => {
    expect(initialAdminPlan(true, {}).action).toBe('skip');
    expect(initialAdminPlan(true, { email: 'a@b.gt', password: STRONG }).action).toBe('warn');
  });

  it('sin variables no hace nada (desarrollo, Railway con consola)', () => {
    expect(initialAdminPlan(false, {}).action).toBe('skip');
    expect(initialAdminPlan(false, { email: 'a@b.gt' }).action).toBe('skip');
  });

  it('rechaza un correo inválido o una contraseña débil', () => {
    expect(initialAdminPlan(false, { email: 'no-es-correo', password: STRONG }).action).toBe(
      'error'
    );
    expect(initialAdminPlan(false, { email: 'a@b.gt', password: 'corta' }).action).toBe('error');
    expect(
      initialAdminPlan(false, { email: 'a@b.gt', password: 'sinsimbolos2026AAA' }).action
    ).toBe('error');
  });

  it('crea con el correo normalizado y nombre por defecto', () => {
    expect(initialAdminPlan(false, { email: ' Admin@Foro.GT ', password: STRONG })).toEqual({
      action: 'create',
      email: 'admin@foro.gt',
      password: STRONG,
      firstname: 'Super',
      lastname: 'Admin',
    });
  });
});

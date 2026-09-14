import adminSecurity, { isStrongPassword } from '../../src/middlewares/admin-security';

jest.mock('../../src/security/audit', () => ({
  recordAudit: jest.fn().mockResolvedValue(undefined),
}));
import { recordAudit } from '../../src/security/audit';

describe('isStrongPassword', () => {
  it('exige 12+ caracteres con mayúscula, minúscula, número y símbolo', () => {
    expect(isStrongPassword('Segura!Clave2026')).toBe(true);
    expect(isStrongPassword('corta1!A')).toBe(false); // < 12
    expect(isStrongPassword('sinmayusculas1!!')).toBe(false);
    expect(isStrongPassword('SINMINUSCULAS1!!')).toBe(false);
    expect(isStrongPassword('SinNumeros!!!!!!')).toBe(false);
    expect(isStrongPassword('SinSimbolos12345')).toBe(false);
  });
});

const makeCtx = (method: string, path: string, body?: unknown) =>
  ({
    method,
    path,
    ip: '127.0.0.1',
    status: 200,
    body: undefined as unknown,
    request: { body },
  }) as never;

const mw = adminSecurity(undefined, { strapi: {} as never });

describe('middleware admin-security', () => {
  it('bloquea contraseñas débiles en las rutas de alta/cambio', async () => {
    for (const path of [
      '/admin/register-admin',
      '/admin/register',
      '/admin/reset-password',
      '/admin/users/me',
      '/admin/users/3',
    ]) {
      const ctx = makeCtx(
        path === '/admin/users/me' || path === '/admin/users/3' ? 'PUT' : 'POST',
        path,
        { password: 'debil' }
      );
      const next = jest.fn();
      await mw(ctx, next);
      expect(next).not.toHaveBeenCalled();
      expect((ctx as { status: number }).status).toBe(400);
      expect((ctx as { body: { error: { code: string } } }).body.error.code).toBe('WEAK_PASSWORD');
    }
  });
  it('deja pasar contraseñas fuertes y rutas sin contraseña', async () => {
    const ok = makeCtx('POST', '/admin/register', { password: 'Segura!Clave2026' });
    const next = jest.fn();
    await mw(ok, next);
    expect(next).toHaveBeenCalled();
    const other = makeCtx('PUT', '/admin/users/me', { firstname: 'Ana' });
    const next2 = jest.fn();
    await mw(other, next2);
    expect(next2).toHaveBeenCalled();
  });
  it('audita el login exitoso sin registrar la contraseña', async () => {
    const ctx = makeCtx('POST', '/admin/login', { email: 'a@b.c', password: 'x' });
    const next = jest.fn().mockImplementation(async () => {
      (ctx as { body: unknown }).body = { data: { user: { id: 5, email: 'a@b.c' } } };
    });
    await mw(ctx, next);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'login', user: { id: 5, email: 'a@b.c' } })
    );
    expect(JSON.stringify((recordAudit as jest.Mock).mock.calls)).not.toContain('"password"');
  });
});

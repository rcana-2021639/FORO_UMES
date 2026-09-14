/**
 * Validación y sanitización del formulario de contacto (Sprint 4, tarea 4).
 * Funciones puras, sin dependencia de Strapi, para poder probarlas unitariamente.
 */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 200 },
  email: { max: 255 },
  subject: { max: 250 },
  message: { min: 10, max: 2000 },
} as const;

/** Campo trampa (honeypot). Un humano no lo ve ni lo llena; un bot sí. */
export const HONEYPOT_FIELD = 'website';

export type ContactInput = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type ContactValidation =
  | { ok: true; data: ContactInput }
  | { ok: false; errors: Array<{ field: string; message: string }> };

// Formato de correo pragmático (RFC 5322 completo es innecesario aquí)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Quita etiquetas HTML, caracteres de control y espacios repetidos. */
export function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return (
    value
      .replace(/<[^>]*>/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

export function isHoneypotFilled(body: Record<string, unknown>): boolean {
  const value = body[HONEYPOT_FIELD];
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function validateContact(body: Record<string, unknown>): ContactValidation {
  const errors: Array<{ field: string; message: string }> = [];

  const name = sanitizeText(body.name);
  const email = sanitizeText(body.email).toLowerCase();
  const subject = sanitizeText(body.subject);
  const message = sanitizeText(body.message);

  if (name.length < CONTACT_LIMITS.name.min) {
    errors.push({ field: 'name', message: 'El nombre es obligatorio.' });
  } else if (name.length > CONTACT_LIMITS.name.max) {
    errors.push({
      field: 'name',
      message: `El nombre no puede superar ${CONTACT_LIMITS.name.max} caracteres.`,
    });
  }

  if (!email) {
    errors.push({ field: 'email', message: 'El correo es obligatorio.' });
  } else if (email.length > CONTACT_LIMITS.email.max || !EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'El correo no tiene un formato válido.' });
  }

  if (subject.length > CONTACT_LIMITS.subject.max) {
    errors.push({
      field: 'subject',
      message: `El asunto no puede superar ${CONTACT_LIMITS.subject.max} caracteres.`,
    });
  }

  if (message.length < CONTACT_LIMITS.message.min) {
    errors.push({
      field: 'message',
      message: `El mensaje es obligatorio (mínimo ${CONTACT_LIMITS.message.min} caracteres).`,
    });
  } else if (message.length > CONTACT_LIMITS.message.max) {
    errors.push({
      field: 'message',
      message: `El mensaje no puede superar ${CONTACT_LIMITS.message.max} caracteres.`,
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: { name, email, subject: subject || undefined, message } };
}

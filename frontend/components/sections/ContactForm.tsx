'use client';

import dynamic from 'next/dynamic';
import { useId, useState, type FormEvent } from 'react';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/Button';
import { api, ApiError, describeError } from '@/lib/api';
import { cn } from '@/lib/cn';

const Orb = dynamic(() => import('./Orb').then((m) => m.Orb), { ssr: false });

const LIMITS = { name: [2, 200], email: [0, 255], subject: [0, 250], message: [10, 2000] } as const;

type Field = 'name' | 'email' | 'subject' | 'message';
type Errors = Partial<Record<Field, string>>;

function validate(v: Record<Field, string>): Errors {
  const e: Errors = {};
  if (v.name.trim().length < LIMITS.name[0]) e.name = 'Escribe tu nombre (mínimo 2 caracteres).';
  if (v.name.length > LIMITS.name[1]) e.name = 'El nombre es demasiado largo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Escribe un correo válido.';
  if (v.subject.length > LIMITS.subject[1]) e.subject = 'El asunto es demasiado largo.';
  if (v.message.trim().length < LIMITS.message[0])
    e.message = 'Cuéntanos un poco más (mínimo 10 caracteres).';
  if (v.message.length > LIMITS.message[1]) e.message = 'El mensaje supera los 2000 caracteres.';
  return e;
}

/**
 * Capítulo 10 · Contacto. POST /api/contact con `sileo.promise` (pendiente → éxito/error).
 * Los errores 4xx/5xx del backend llegan como ApiError y se muestran con `sileo.error`.
 * Incluye el honeypot `website` (vacío) que exige el backend.
 */
export function ContactForm() {
  const id = useId();
  const [values, setValues] = useState<Record<Field, string>>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    if (errors[f]) setErrors((er) => ({ ...er, [f]: undefined }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      sileo.warning({ title: 'Falta algo en el formulario', description: Object.values(errs)[0] });
      return;
    }
    setSending(true);
    try {
      await sileo.promise(
        api.contact({
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim() || undefined,
          message: values.message.trim(),
          website: '',
        }),
        {
          loading: { title: 'Llevando tu mensaje a la mesa', description: 'Un momento…' },
          success: {
            title: 'Recibido',
            description: 'La secretaría técnica te responderá al correo que dejaste.',
          },
          error: (err) => {
            const d = describeError(err);
            if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.details) {
              return {
                title: d.title,
                description: 'El servidor rechazó algunos campos. Revísalos.',
              };
            }
            return d;
          },
        }
      );
      setSent(true);
      setValues({ name: '', email: '', subject: '', message: '' });
    } catch {
      /* ya notificado por sileo.promise */
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setValues({ name: '', email: '', subject: '', message: '' });
    setErrors({});
    sileo.info({ title: 'Formulario en blanco' });
  };

  return (
    <div className="relative grid gap-12 md:grid-cols-12">
      <div className="relative md:col-span-5">
        <div
          className="relative aspect-square w-full max-w-[26rem] md:sticky md:top-32"
          data-cursor=""
        >
          <Orb />
          <p className="eyebrow pointer-events-none absolute inset-x-0 bottom-4 text-center text-fg-muted">
            Secretaría técnica del Foro
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="md:col-span-7"
        aria-describedby={`${id}-help`}
      >
        <p id={`${id}-help`} className="mb-8 max-w-[52ch] leading-relaxed text-fg-muted">
          Si representas a una universidad, escribes desde un medio o buscas un posgrado y no sabes
          por dónde empezar, este es el canal. La secretaría técnica responde al correo que dejes.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field id={`${id}-name`} label="Nombre" error={errors.name}>
            <input
              id={`${id}-name`}
              name="name"
              autoComplete="name"
              required
              value={values.name}
              onChange={set('name')}
              className={inputCls(!!errors.name)}
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field id={`${id}-email`} label="Correo" error={errors.email}>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={set('email')}
              className={inputCls(!!errors.email)}
              aria-invalid={!!errors.email}
            />
          </Field>
          <Field
            id={`${id}-subject`}
            label="Asunto (opcional)"
            error={errors.subject}
            className="sm:col-span-2"
          >
            <input
              id={`${id}-subject`}
              name="subject"
              value={values.subject}
              onChange={set('subject')}
              className={inputCls(!!errors.subject)}
              aria-invalid={!!errors.subject}
            />
          </Field>
          <Field
            id={`${id}-message`}
            label="Mensaje"
            error={errors.message}
            className="sm:col-span-2"
            hint={`${values.message.length}/2000`}
          >
            <textarea
              id={`${id}-message`}
              name="message"
              rows={6}
              required
              value={values.message}
              onChange={set('message')}
              className={cn(inputCls(!!errors.message), 'resize-y')}
              aria-invalid={!!errors.message}
            />
          </Field>
          {/* Honeypot: los humanos no lo ven ni lo llenan */}
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
            <label htmlFor={`${id}-website`}>Sitio web</label>
            <input
              id={`${id}-website`}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button type="submit" loading={sending} loadingLabel="Enviando">
            {sent ? 'Enviar otro mensaje' : 'Enviar a la mesa'}
          </Button>
          <Button variant="ghost" onClick={reset} disabled={sending}>
            Limpiar
          </Button>
        </div>
      </form>
    </div>
  );
}

function inputCls(invalid: boolean) {
  return cn(
    'peer w-full border-0 border-b bg-transparent px-0 py-3 text-[1.05rem] text-fg outline-none transition-colors duration-300',
    'placeholder:text-fg-muted focus:border-transparent',
    invalid ? 'border-accent' : 'border-line'
  );
}

function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="ui-label text-fg-muted">
          {label}
        </label>
        {hint && <span className="mono-label text-fg-muted">{hint}</span>}
      </div>
      <div className="relative">
        {children}
        {/* Línea jade que se dibuja al enfocar el campo */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-accent-jade transition-transform duration-500 ease-(--ease-snap) peer-focus:scale-x-100"
        />
      </div>
      {error && (
        <p role="alert" className="ui-label mt-2 text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

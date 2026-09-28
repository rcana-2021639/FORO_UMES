'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { sileo } from 'sileo';
import { api, ApiError, describeError } from '@/lib/api';
import { cn } from '@/lib/cn';

const AUDIENCES = [
  {
    who: 'Universidad',
    what: 'Incorporación, convenios y actividades conjuntas.',
    subject: 'Universidad: ',
  },
  {
    who: 'Prensa',
    what: 'Comunicados, entrevistas y material gráfico.',
    subject: 'Prensa: ',
  },
  {
    who: 'Estudiante',
    what: 'Orientación sobre programas y requisitos.',
    subject: 'Orientación sobre posgrados',
  },
];

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
 * Contacto: sin recuadros. Todo flota sobre el violeta profundo del cierre: a la izquierda, a
 * quién le escribes (tres palabras que se subrayan al elegirlas y rellenan el asunto); a la
 * derecha, campos de una sola línea con etiqueta flotante. POST /api/contact con `sileo.promise`
 * y el honeypot `website` que exige el backend.
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
  const [audience, setAudience] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const pick = (i: number) => {
    setAudience(i);
    setValues((v) => ({ ...v, subject: AUDIENCES[i].subject }));
    nameRef.current?.focus({ preventScroll: true });
  };

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
          loading: { title: 'Enviando tu mensaje', description: 'Un momento…' },
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
      setAudience(null);
      setValues({ name: '', email: '', subject: '', message: '' });
    } catch {
      /* ya notificado por sileo.promise */
    } finally {
      setSending(false);
    }
  };

  const done = [
    values.name.trim().length >= LIMITS.name[0],
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email),
    values.message.trim().length >= LIMITS.message[0],
  ].filter(Boolean).length;
  const ready = done === 3;

  return (
    <div className="contact grid gap-16 lg:grid-cols-12 lg:gap-12">
      {/* A quién le escribes */}
      <div data-reveal="up" className="lg:col-span-5">
        <p className="contact__lead">
          Tu mensaje llega a la secretaría técnica que coordina a las nueve universidades.
        </p>
        <p className="contact__kicker mt-10">¿Quién escribe?</p>
        <ul
          data-reveal-stagger="left"
          className="mt-4"
          role="radiogroup"
          aria-label="Quién escribe"
        >
          {AUDIENCES.map((a, i) => (
            <li key={a.who} className="contact__who-row">
              <button
                type="button"
                role="radio"
                aria-checked={audience === i}
                onClick={() => pick(i)}
                className="contact__who"
              >
                <span className="contact__who-n" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="contact__who-word">{a.who}</span>
                <span className="contact__who-arrow" aria-hidden>
                  →
                </span>
              </button>
              <span className="contact__who-what" aria-hidden>
                {a.what}
              </span>
            </li>
          ))}
        </ul>
        <p className="contact__hint" aria-live="polite">
          {audience === null
            ? 'Elige una opción y dejamos el asunto listo. También puedes escribir directamente.'
            : AUDIENCES[audience].what}
        </p>
        <dl className="contact__facts">
          <div>
            <dt>Quién responde</dt>
            <dd>La secretaría técnica del Foro</dd>
          </div>
          <div>
            <dt>Dónde</dt>
            <dd>Al correo que dejes en el formulario</dd>
          </div>
        </dl>
      </div>

      {/* Formulario sin recuadros */}
      <form
        data-reveal="up"
        onSubmit={onSubmit}
        noValidate
        className="lg:col-span-7"
        aria-describedby={`${id}-help`}
      >
        <p id={`${id}-help`} className="sr-only">
          Todos los campos son obligatorios salvo el asunto.
        </p>
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2 sm:gap-y-9">
          <FloatField id={`${id}-name`} n="01" label="Nombre" error={errors.name}>
            <input
              ref={nameRef}
              id={`${id}-name`}
              name="name"
              autoComplete="name"
              placeholder=" "
              required
              value={values.name}
              onChange={set('name')}
              aria-invalid={!!errors.name}
              className="contact__input"
            />
          </FloatField>
          <FloatField id={`${id}-email`} n="02" label="Correo" error={errors.email}>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              placeholder=" "
              required
              value={values.email}
              onChange={set('email')}
              aria-invalid={!!errors.email}
              className="contact__input"
            />
          </FloatField>
          <FloatField
            id={`${id}-subject`}
            n="03"
            label="Asunto (opcional)"
            error={errors.subject}
            className="sm:col-span-2"
          >
            <input
              id={`${id}-subject`}
              name="subject"
              placeholder=" "
              value={values.subject}
              onChange={set('subject')}
              aria-invalid={!!errors.subject}
              className="contact__input"
            />
          </FloatField>
          <FloatField
            id={`${id}-message`}
            n="04"
            label="Mensaje"
            error={errors.message}
            hint={`${values.message.length}/2000`}
            className="sm:col-span-2"
          >
            <textarea
              id={`${id}-message`}
              name="message"
              rows={4}
              placeholder=" "
              required
              value={values.message}
              onChange={set('message')}
              aria-invalid={!!errors.message}
              className="contact__input resize-y"
            />
          </FloatField>
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

        <div className="contact__progress mt-10" aria-live="polite">
          <span className="contact__progress-track" aria-hidden>
            <span className="contact__progress-fill" style={{ transform: `scaleX(${done / 3})` }} />
          </span>
          <span className="mono-label">
            {ready ? 'Listo para enviar' : `${done} de 3 campos obligatorios`}
          </span>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <button
            type="submit"
            className="contact__send"
            data-ready={ready}
            disabled={sending}
            aria-busy={sending}
          >
            <span>{sending ? 'Enviando…' : sent ? 'Enviar otro mensaje' : 'Enviar mensaje'}</span>
            <span className="contact__send-line" aria-hidden />
            <span className="contact__send-arrow" aria-hidden>
              →
            </span>
          </button>
          {sent && !sending && (
            <span className="ui-label text-[var(--color-violet-200)]">
              Mensaje enviado. Te responderemos pronto.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function FloatField({
  id,
  n,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  n: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('contact__field', error && 'is-invalid', className)}>
      {children}
      <label htmlFor={id} className="contact__label">
        <span className="contact__label-n" aria-hidden>
          {n}
        </span>
        {label}
      </label>
      <div className="mt-2 flex min-h-[1.2em] items-start justify-between gap-4">
        {error ? (
          <p role="alert" className="ui-label text-[#f3b4d8]">
            {error}
          </p>
        ) : (
          <span />
        )}
        {hint && <span className="mono-label opacity-60">{hint}</span>}
      </div>
    </div>
  );
}

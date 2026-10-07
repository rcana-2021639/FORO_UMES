'use client';

import Link from 'next/link';
import { useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Emblem } from '@/components/ui/Emblem';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { sileo } from 'sileo';
import { api, ApiError, describeError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Arrow } from '@/components/ui/Arrow';

const AUDIENCES = [
  {
    who: 'Universidad',
    what: 'Convenios, actividades conjuntas o los datos de tu universidad en este sitio.',
    subject: 'Universidad: ',
  },
  {
    who: 'Prensa',
    what: 'Entrevistas, comunicados y fotografías del Foro.',
    subject: 'Prensa: ',
  },
  {
    who: 'Estudiante',
    what: 'Orientación para elegir un posgrado entre las nueve universidades.',
    subject: 'Orientación sobre posgrados',
  },
];

/** Qué pasa con el mensaje, en tres pasos. */
const HOW = ['Escribes aquí', 'Lo lee la secretaría técnica', 'Te responde a tu correo'];

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
 * Contacto (el mismo en la portada y en /contacto): sin recuadros, sobre el violeta profundo del
 * cierre. A la izquierda, a quién le escribes y sobre qué (tres opciones con su descripción, que
 * se subrayan al elegirlas y rellenan el asunto); debajo, qué pasa con el mensaje en tres pasos y
 * el aviso de que las inscripciones las hace cada universidad. A la derecha, campos de una línea
 * con etiqueta flotante. POST /api/contact con `sileo.promise` y el honeypot `website` que exige
 * el backend.
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
  /** A quién se le confirmó el envío (los campos ya se vaciaron). */
  const [receipt, setReceipt] = useState<{ name: string; email: string } | null>(null);
  const reduced = useReducedMotion();
  /** Tras "Escribir otro mensaje", el cursor vuelve al nombre cuando el formulario termina de entrar. */
  const refocus = useRef(false);
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
      setReceipt({ name: values.name.trim().split(/\s+/)[0], email: values.email.trim() });
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
    <div className="contact grid gap-x-12 gap-y-14 lg:grid-cols-12">
      {/* Qué es y sobre qué escribes */}
      <div data-reveal="up" className="lg:col-span-5">
        <p className="contact__lead">¿Una pregunta, una propuesta o una entrevista?</p>
        <p className="contact__sub">
          La secretaría técnica del Foro coordina a las nueve universidades: lee cada mensaje y te
          responde al correo que dejes.
        </p>
        <p className="contact__kicker mt-9" id={`${id}-who`}>
          ¿Sobre qué escribes?
        </p>
        <ul
          data-reveal-stagger="left"
          className="mt-3"
          role="radiogroup"
          aria-labelledby={`${id}-who`}
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
                <span className="contact__who-text">
                  <span className="contact__who-word">{a.who}</span>
                  <span className="contact__who-what">{a.what}</span>
                </span>
                <span className="contact__who-arrow" aria-hidden>
                  <Arrow />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="contact__hint" aria-live="polite">
          {audience === null
            ? 'Al elegir una, el asunto queda escrito. Es opcional.'
            : 'Listo: el asunto ya está escrito. Ahora tu nombre y tu correo.'}
        </p>
        {/* Lo que el Foro no hace: las inscripciones (se enciende al elegir «Estudiante») */}
        <aside className="contact__aside" data-hl={audience === 2 || undefined}>
          <p>
            <b>¿Quieres inscribirte en un programa?</b> La inscripción la hace cada universidad:
            busca el programa y abre su ficha oficial.
          </p>
          <Link href="/programas" className="contact__aside-link">
            Buscar un programa <Arrow />
          </Link>
        </aside>
      </div>

      {/* Formulario sin recuadros; al enviarse, da paso al acuse con el sello del Foro */}
      <div data-reveal="up" className="relative lg:col-span-7">
        {/* Qué pasa con el mensaje, de un vistazo */}
        <ol className="contact__how" aria-label="Qué pasa con tu mensaje">
          {HOW.map((h, i) => (
            <li key={h} style={{ '--i': i } as React.CSSProperties}>
              <span className="contact__how-n" aria-hidden>
                {i + 1}
              </span>
              {h}
            </li>
          ))}
        </ol>
        <AnimatePresence mode="wait" initial={false}>
          {receipt ? (
            <motion.div
              key="receipt"
              className="contact-receipt"
              role="status"
              initial={reduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              <Emblem motion="assemble" className="contact-receipt__seal" />
              <p className="contact-receipt__kicker">Mensaje recibido</p>
              <p className="contact-receipt__title">Gracias, {receipt.name}.</p>
              <p className="contact-receipt__text">
                La secretaría técnica del Foro lo leerá y te responderá a <b>{receipt.email}</b>.
                Revisa también la carpeta de correo no deseado.
              </p>
              <button
                type="button"
                className="contact-receipt__again"
                onClick={() => {
                  setReceipt(null);
                  refocus.current = true;
                }}
              >
                Escribir otro mensaje <Arrow />
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onAnimationComplete={() => {
                if (!refocus.current) return;
                refocus.current = false;
                nameRef.current?.focus({ preventScroll: true });
              }}
              onSubmit={onSubmit}
              noValidate
              aria-describedby={`${id}-help`}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: 16, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p id={`${id}-help`} className="contact__form-head">
                Tu mensaje <span>· todo es obligatorio salvo el asunto</span>
              </p>
              <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2 sm:gap-y-6">
                <FloatField id={`${id}-name`} n="01" label="Tu nombre" error={errors.name}>
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
                <FloatField id={`${id}-email`} n="02" label="Tu correo" error={errors.email}>
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
                  label="Tu mensaje"
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
                  <span
                    className="contact__progress-fill"
                    style={{ transform: `scaleX(${done / 3})` }}
                  />
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
                  <span>
                    {sending ? 'Enviando…' : sent ? 'Enviar otro mensaje' : 'Enviar mensaje'}
                  </span>
                  <span className="contact__send-line" aria-hidden />
                  <span className="contact__send-arrow" aria-hidden>
                    <Arrow />
                  </span>
                </button>
              </div>
              <p className="mt-6 max-w-[56ch] text-[0.85rem] leading-relaxed text-fg-muted">
                Usamos tu nombre y tu correo solo para responderte; el mensaje se borra solo al año.
                Más detalles en el{' '}
                <Link href="/privacidad" className="underline underline-offset-4 hover:text-fg">
                  aviso de privacidad
                </Link>
                .
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
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

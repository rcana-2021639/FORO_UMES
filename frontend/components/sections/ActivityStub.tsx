'use client';

import Link from 'next/link';
import { ViewTransition, type CSSProperties } from 'react';
import { CalendarPlusIcon } from '@phosphor-icons/react/dist/ssr';
import { Arrow } from '@/components/ui/Arrow';
import { MayaNumber, mayaReading } from '@/components/ui/MayaNumber';
import { RollingNumber } from '@/components/ui/RollingNumber';
import { useClientValue } from '@/hooks/useClientValue';
import { ACTIVITY_INK, daysUntil, relativeDay } from '@/lib/activity-ink';
import { ACTIVITY_LABEL, formatDate } from '@/lib/format';
import { buildIcs, icsFileName } from '@/lib/ics';
import { SITE_URL } from '@/lib/site';
import type { ActivityType } from '@/lib/types';

export interface StubActivity {
  documentId: string;
  title: string;
  type: ActivityType;
  date: string;
  summary?: string;
}

const MON = new Intl.DateTimeFormat('es-GT', { month: 'long' });
const WEEKDAY = new Intl.DateTimeFormat('es-GT', { weekday: 'long' });

/**
 * El talón de una actividad, en grande (DESIGN_NOTES §28.4, fase 5): la tinta de su tipo, el día
 * enorme, cuánto falta (o cuánto pasó) contado en el navegador —la página es estática y la fecha de
 * hoy cambia— con su numeral maya, y "Agregar al calendario" si todavía no ocurre.
 *
 * - `upcoming`: cabecera de /actividades, con el título y el enlace a la actividad.
 * - `detail`: cabecera de la actividad. Viniendo de su boleto, el talón vuela hasta aquí
 *   (`share` del tipo `act-ticket`).
 */
export function ActivityStub({
  activity: a,
  variant,
}: {
  activity: StubActivity;
  variant: 'upcoming' | 'detail';
}) {
  const ink = ACTIVITY_INK[a.type];
  const d = new Date(`${a.date}T12:00:00`);
  const days = useClientValue<number | null>(() => daysUntil(a.date), null);
  const future = days != null && days >= 0;

  const addToCalendar = () => {
    const ics = buildIcs({
      uid: a.documentId,
      date: a.date,
      title: a.title,
      description: [a.summary, `${SITE_URL}/actividades/${a.documentId}`]
        .filter(Boolean)
        .join('\n\n'),
      url: `${SITE_URL}/actividades/${a.documentId}`,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = icsFileName(a.title);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const card = (
    <div
      className="act-stub"
      style={{ '--ink': ink.bg, '--stub': ink.stub, '--accent': ink.accent } as CSSProperties}
    >
      <span aria-hidden className="act-stub__holes" />
      <div className="act-stub__date">
        <span className="act-stub__type">{ACTIVITY_LABEL[a.type]}</span>
        <span className="act-stub__month">{MON.format(d)}</span>
        <span className="act-stub__day">{d.getDate()}</span>
        <span className="act-stub__year">
          {WEEKDAY.format(d)} · {d.getFullYear()}
        </span>
      </div>
      <div className="act-stub__body">
        {variant === 'upcoming' && <p className="act-stub__kicker">Próxima actividad</p>}
        {variant === 'upcoming' && <p className="act-stub__title">{a.title}</p>}
        <div className="act-stub__count" aria-live="polite">
          {days == null ? (
            <span className="act-stub__when">{formatDate(a.date)}</span>
          ) : future && days > 1 ? (
            <>
              <span className="act-stub__when">Faltan</span>
              <span className="act-stub__num">
                <RollingNumber value={days} delay={0.5} />
                <span className="act-stub__unit">días</span>
              </span>
              <span className="act-stub__maya" title={mayaReading(days)}>
                <MayaNumber value={days} />
              </span>
            </>
          ) : (
            <span className="act-stub__when act-stub__when--big">{relativeDay(days)}</span>
          )}
        </div>
        <div className="act-stub__actions">
          {variant === 'upcoming' && (
            <Link href={`/actividades/${a.documentId}`} className="act-stub__go">
              Ver actividad <Arrow />
            </Link>
          )}
          {future && (
            <button type="button" className="act-stub__cal" onClick={addToCalendar}>
              <CalendarPlusIcon aria-hidden weight="bold" />
              Agregar al calendario
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (variant !== 'detail') return card;
  return (
    <ViewTransition
      name={`stub-${a.documentId}`}
      share={{ 'act-ticket': 'stub-morph', default: 'none' }}
      default="none"
    >
      {card}
    </ViewTransition>
  );
}

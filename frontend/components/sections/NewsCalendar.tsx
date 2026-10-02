import Link from 'next/link';
import type { CSSProperties } from 'react';
import { formatDate } from '@/lib/format';

export interface CalendarNote {
  documentId: string;
  title: string;
  publishedAt: string;
}

/** Años que caben como columnas; con más, se muestran los más recientes. */
const MAX_YEARS = 8;

/**
 * Cabecera de /noticias (DESIGN_NOTES §28.4, fase 5): el archivo entero en puntos, una columna
 * por año y un punto por nota (la misma gramática de puntos del sitio), apilados del más antiguo al
 * más reciente. Se ve de un vistazo desde cuándo publica el Foro y con qué ritmo. Cada punto es un
 * enlace a su nota y muestra el título al señalarlo o enfocarlo (el globo es CSS, sin JavaScript).
 */
export function NewsCalendar({ notes, now }: { notes: CalendarNote[]; now: Date }) {
  const byYear = new Map<number, CalendarNote[]>();
  for (const n of notes) {
    const y = new Date(n.publishedAt).getFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), n]);
  }
  const first = Math.min(...byYear.keys(), now.getFullYear());
  const last = now.getFullYear();
  const from = Math.max(first, last - MAX_YEARS + 1);
  const years = Array.from({ length: last - from + 1 }, (_, i) => from + i);
  for (const list of byYear.values())
    list.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const max = Math.max(3, ...years.map((y) => byYear.get(y)?.length ?? 0));

  return (
    <figure className="news-cal" aria-label={`${notes.length} notas publicadas desde ${first}`}>
      <div
        className="news-cal__grid"
        style={{ '--rows': max, '--cols': years.length } as CSSProperties}
      >
        {years.map((y, i) => {
          const list = byYear.get(y) ?? [];
          return (
            <div key={y} className="news-cal__col" data-empty={!list.length}>
              <span className="news-cal__n" aria-hidden>
                {list.length || ''}
              </span>
              <ul className="news-cal__dots" aria-label={`${y}: ${list.length} notas`}>
                {list.map((n, k) => (
                  <li key={n.documentId}>
                    <Link
                      href={`/noticias/${n.documentId}`}
                      className="news-cal__dot"
                      data-tip={n.title}
                      aria-label={`${n.title}, ${formatDate(n.publishedAt)}`}
                      style={{ '--d': i * 2 + k } as CSSProperties}
                    />
                  </li>
                ))}
              </ul>
              <span className="news-cal__month" aria-hidden>
                {y}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="news-cal__cap">
        <span>
          <b>{notes.length}</b> {notes.length === 1 ? 'nota publicada' : 'notas publicadas'} desde{' '}
          {first}
        </span>
        <span>Un punto, una nota</span>
      </figcaption>
    </figure>
  );
}

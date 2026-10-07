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

/** Inclinación y largo de cada periódico, fijos por posición (sin azar: igual en servidor y cliente). */
const tilt = (i: number, k: number) => (((i * 7 + k * 5) % 7) - 3) * 0.55;
const length = (i: number, k: number) => 84 + ((i * 3 + k * 11) % 5) * 4;

/**
 * Cabecera de /noticias · la hemeroteca (v7.1): el archivo entero como pilas de periódicos
 * doblados, una pila por año y un periódico por nota, del más antiguo (abajo) al más reciente.
 * Se ve de un vistazo desde cuándo publica el Foro y con qué ritmo. Al llegar, los periódicos
 * caen uno a uno en su pila; cada uno es un enlace a su nota y, al señalarlo o enfocarlo, se
 * asoma y muestra el título (el globo es CSS, sin JavaScript). Sustituye a la columna de puntos.
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
  const max = Math.max(4, ...years.map((y) => byYear.get(y)?.length ?? 0));
  const newest = [...notes].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  // Orden de caída: año por año, de abajo arriba
  const startOf = years.map((_, i) =>
    years.slice(0, i).reduce((sum, y) => sum + (byYear.get(y)?.length ?? 0), 0)
  );

  return (
    <figure className="hemero" aria-label={`${notes.length} notas publicadas desde ${first}`}>
      <header className="hemero__mast" aria-hidden>
        <span className="hemero__title">Hemeroteca del Foro</span>
        <span className="hemero__meta">
          {notes.length} {notes.length === 1 ? 'nota' : 'notas'} · desde {first}
        </span>
      </header>
      <div
        className="hemero__shelf"
        style={{ '--rows': max, '--cols': years.length } as CSSProperties}
      >
        {years.map((y, i) => {
          const list = byYear.get(y) ?? [];
          return (
            <div key={y} className="hemero__col" data-empty={!list.length || undefined}>
              <span className="hemero__n" aria-hidden>
                {list.length || ''}
              </span>
              <ul className="hemero__stack" aria-label={`${y}: ${list.length} notas`}>
                {list.map((n, k) => (
                  <li key={n.documentId}>
                    <Link
                      href={`/noticias/${n.documentId}`}
                      className="hemero__paper"
                      data-tip={`${n.title} · ${formatDate(n.publishedAt)}`}
                      data-new={n.documentId === newest?.documentId || undefined}
                      aria-label={`${n.title}, ${formatDate(n.publishedAt)}`}
                      style={
                        {
                          '--d': startOf[i] + k,
                          '--r': `${tilt(i, k)}deg`,
                          '--w': `${length(i, k)}%`,
                        } as CSSProperties
                      }
                    />
                  </li>
                ))}
              </ul>
              <span className="hemero__year" aria-hidden>
                {y}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="hemero__cap">
        Cada periódico es una nota: señálalo para ver su título.
      </figcaption>
    </figure>
  );
}

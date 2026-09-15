'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LEVEL_LABEL, MODALITY_LABEL, acronymOf } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AcademicProgram, ProgramLevel, ProgramModality } from '@/lib/types';

const LEVELS: ProgramLevel[] = ['Maestria', 'Doctorado', 'Especializacion', 'Diplomado'];
const MODALITIES: ProgramModality[] = ['Presencial', 'Virtual', 'Hibrida'];

/** Catálogo completo de programas con filtros por nivel, modalidad y universidad (cliente). */
export function ProgramsCatalog({ programs }: { programs: AcademicProgram[] }) {
  const [level, setLevel] = useState<ProgramLevel | ''>('');
  const [modality, setModality] = useState<ProgramModality | ''>('');
  const [uni, setUni] = useState('');
  const [q, setQ] = useState('');

  const universities = useMemo(() => {
    const m = new Map<string, string>();
    programs.forEach(
      (p) => p.university && m.set(p.university.documentId, acronymOf(p.university))
    );
    return Array.from(m, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [programs]);

  const visible = useMemo(
    () =>
      programs.filter(
        (p) =>
          (!level || p.level === level) &&
          (!modality || p.modality === modality) &&
          (!uni || p.university?.documentId === uni) &&
          (!q || p.name.toLowerCase().includes(q.toLowerCase()))
      ),
    [programs, level, modality, uni, q]
  );

  const select =
    'mono-label rounded-[2px] border border-line bg-transparent px-3 py-2 text-fg outline-none focus:border-jade-2';

  return (
    <div>
      <div className="grid gap-3 border-y border-line py-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <input
          type="search"
          placeholder="Buscar programa…"
          aria-label="Buscar programa"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={cn(select, 'normal-case tracking-normal')}
        />
        <select
          aria-label="Nivel"
          value={level}
          onChange={(e) => setLevel(e.target.value as ProgramLevel | '')}
          className={select}
        >
          <option value="">Todos los niveles</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABEL[l]}
            </option>
          ))}
        </select>
        <select
          aria-label="Modalidad"
          value={modality}
          onChange={(e) => setModality(e.target.value as ProgramModality | '')}
          className={select}
        >
          <option value="">Toda modalidad</option>
          {MODALITIES.map((m) => (
            <option key={m} value={m}>
              {MODALITY_LABEL[m]}
            </option>
          ))}
        </select>
        <select
          aria-label="Universidad"
          value={uni}
          onChange={(e) => setUni(e.target.value)}
          className={select}
        >
          <option value="">Todas las universidades</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mono-label mt-4 text-fg-muted" aria-live="polite">
        {visible.length} de {programs.length} programas
      </p>

      <ol className="mt-8 divide-y divide-line border-b border-line">
        {visible.map((p, i) => (
          <li
            key={p.documentId}
            className="group grid gap-2 py-6 md:grid-cols-12 md:items-baseline md:gap-6"
          >
            <span className="mono-label text-fg-muted md:col-span-1">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="text-[1.35rem] leading-tight text-fg md:col-span-6">{p.name}</h2>
            <div className="mono-label flex flex-wrap gap-x-4 gap-y-1 text-fg-muted md:col-span-3">
              <span className={cn(p.level === 'Doctorado' && 'text-amber')}>
                {LEVEL_LABEL[p.level]}
              </span>
              <span>{MODALITY_LABEL[p.modality]}</span>
              {p.duration && <span>{p.duration}</span>}
            </div>
            <div className="mono-label md:col-span-2 md:text-right">
              {p.university && (
                <Link
                  href={`/universidades/${p.university.documentId}`}
                  className="text-jade underline-offset-4 hover:underline"
                >
                  {acronymOf(p.university)}
                </Link>
              )}
              {p.infoUrl && (
                <a
                  href={p.infoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-fg-muted hover:text-fg"
                >
                  info ↗
                </a>
              )}
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-10 text-fg-muted">No hay programas con esos filtros.</li>
        )}
      </ol>
    </div>
  );
}

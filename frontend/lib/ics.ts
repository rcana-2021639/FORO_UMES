/**
 * Archivo de calendario (.ics, RFC 5545) para "Agregar al calendario" de una actividad. Evento de
 * día completo (el Foro publica la fecha, no la hora): Google Calendar, Outlook y el calendario del
 * teléfono lo abren igual. Se genera en el navegador; no pasa por ningún servidor.
 */
export interface IcsEvent {
  uid: string;
  /** Fecha AAAA-MM-DD. */
  date: string;
  title: string;
  description?: string;
  url?: string;
}

/** Texto seguro dentro de un campo: \ ; , y saltos de línea van escapados. */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Las líneas no pueden pasar de 75 octetos: se parten y la continuación empieza con un espacio.
 * Se cuenta en bytes UTF-8 sin partir un carácter (las tildes ocupan dos).
 */
export function icsFold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // la continuación ya lleva el espacio inicial
    if (size + n > limit) {
      out.push(cur);
      cur = '';
      size = 0;
    }
    cur += ch;
    size += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const compact = (iso: string) => iso.replace(/-/g, '');

/** El día siguiente (DTEND de un evento de día completo es exclusivo). */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function buildIcs(e: IcsEvent, now = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Foro Interuniversitario de Estudios de Posgrado//Actividades//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@foro-posgrado`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(e.date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
    `SUMMARY:${icsEscape(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${icsEscape(e.description)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(icsFold).join('\r\n') + '\r\n';
}

/** Nombre de archivo legible y sin caracteres raros: "encuentro-anual-del-foro-2026.ics". */
export function icsFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'actividad'}.ics`;
}

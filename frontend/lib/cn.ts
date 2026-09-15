/** Une clases ignorando falsy. Suficiente sin clsx/tailwind-merge: no mezclamos clases en conflicto. */
export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

import type { Core } from '@strapi/strapi';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitización de campos richtext al guardar (Sprint 5, tarea 10) para prevenir XSS almacenado.
 * Los campos richtext de Strapi son Markdown; Markdown admite HTML embebido, así que se
 * eliminan etiquetas y atributos peligrosos (script, iframe, on*, javascript:) y se conserva
 * el formato básico. El frontend debe sanitizar de nuevo al renderizar (defensa en profundidad).
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'blockquote',
    'code',
    'pre',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'a',
    'img',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'sub',
    'sup',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  // Markdown legítimo usa < y > como texto (p. ej. "a < b"); no se escapan porque no son etiquetas
  disallowedTagsMode: 'discard',
};

export const sanitizeRichText = (value: string): string => sanitizeHtml(value, OPTIONS);

/** Nombres de atributos richtext por content-type, calculados una vez al arrancar. */
function richTextFieldsByUid(strapi: Core.Strapi): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const contentTypes = strapi.contentTypes as unknown as Record<
    string,
    { attributes: Record<string, { type: string }> }
  >;
  for (const [uid, ct] of Object.entries(contentTypes)) {
    if (!uid.startsWith('api::')) continue;
    const fields = Object.entries(ct.attributes)
      .filter(([, attr]) => attr.type === 'richtext')
      .map(([name]) => name);
    if (fields.length) map.set(uid, fields);
  }
  return map;
}

/**
 * Middleware del servicio de documentos: se ejecuta en TODAS las escrituras (panel, API interna,
 * seed), por lo que no hay forma de guardar richtext sin sanitizar.
 */
export function registerRichTextSanitizer(strapi: Core.Strapi): void {
  const fieldsByUid = richTextFieldsByUid(strapi);

  strapi.documents.use(async (context, next) => {
    if (context.action === 'create' || context.action === 'update') {
      const fields = fieldsByUid.get(context.uid);
      const data = (context.params as { data?: Record<string, unknown> }).data;
      if (fields && data) {
        for (const field of fields) {
          if (typeof data[field] === 'string')
            data[field] = sanitizeRichText(data[field] as string);
        }
      }
    }
    return next();
  });

  strapi.log.info(
    `[security] sanitización de richtext activa en ${fieldsByUid.size} content-types`
  );
}

/**
 * Formato de los documentId de Strapi 5 (cuid2: 24 minúsculas y dígitos; margen por si cambia).
 * Lo comparten proxy.ts (404 de verdad antes de renderizar) y lib/api.ts (no consultar la API).
 */
const DOCUMENT_ID = /^[a-z0-9]{20,32}$/;

export const isDocumentId = (id: string) => DOCUMENT_ID.test(id);

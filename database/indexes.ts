import type { Core } from '@strapi/strapi';

/**
 * Índices adicionales para las consultas frecuentes del sitio público (plan técnico, sección 7.3).
 *
 * Se aplican en `bootstrap` (src/index.ts) y no en `database/migrations` porque Strapi 5 ejecuta
 * las migraciones ANTES de crear/sincronizar las tablas: en una base nueva la migración correría
 * sin que existan las tablas. `CREATE INDEX IF NOT EXISTS` es idempotente, así que ejecutarlo en
 * cada arranque es seguro y barato. Strapi solo elimina índices que él mismo creó, por lo que
 * estos se conservan entre sincronizaciones de esquema.
 *
 * Nota: en Strapi 5 las relaciones viven en tablas `_lnk` (p. ej. academic_programs_university_lnk),
 * que ya traen índices propios. Por eso el índice compuesto (universidad, nivel) del plan se
 * traduce en un índice sobre `academic_programs.level`; el filtro por universidad lo cubre la tabla lnk.
 */
export const EXTRA_INDEXES: ReadonlyArray<{ table: string; name: string; columns: string[] }> = [
  // Listado de noticias ordenado por más reciente y filtrado por "solo publicadas"
  { table: 'news', name: 'news_published_at_idx', columns: ['published_at'] },
  // Filtro de actividades por año / periodo
  { table: 'activities', name: 'activities_date_idx', columns: ['date'] },
  // Filtro "programas de esta universidad por nivel"
  { table: 'academic_programs', name: 'academic_programs_level_idx', columns: ['level'] },
  // Listado de aportes por fecha
  { table: 'contributions', name: 'contributions_published_on_idx', columns: ['published_on'] },
  // Bandeja de mensajes de contacto: pendientes primero
  { table: 'contact_messages', name: 'contact_messages_handled_idx', columns: ['handled'] },
];

export async function ensureExtraIndexes(strapi: Core.Strapi): Promise<void> {
  const knex = strapi.db.connection;

  for (const index of EXTRA_INDEXES) {
    if (!(await knex.schema.hasTable(index.table))) {
      strapi.log.warn(`[indexes] tabla ${index.table} no existe; se omite ${index.name}`);
      continue;
    }
    const cols = index.columns.map((c) => `"${c}"`).join(', ');
    await knex.raw(`CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}" (${cols})`);
  }

  strapi.log.info(`[indexes] ${EXTRA_INDEXES.length} índices adicionales verificados`);
}

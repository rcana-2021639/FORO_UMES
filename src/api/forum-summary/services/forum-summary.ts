import type { Core } from '@strapi/strapi';

const IMAGE_FIELDS = ['url', 'alternativeText', 'width', 'height', 'formats'] as const;

export type ForumSummary = {
  counts: {
    universities: number;
    academicPrograms: number;
    activitiesThisYear: number;
    contributions: number;
  };
  latestNews: unknown[];
  upcomingActivities: unknown[];
  generatedAt: string;
};

const CACHE_TTL_MS = 60 * 1000;
let cache: { value: ForumSummary; expiresAt: number } | null = null;

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /** Resumen con cache en memoria de 60 s: 5 consultas agregadas que cambian pocas veces al día. */
  async get(): Promise<ForumSummary> {
    if (cache && cache.expiresAt > Date.now()) return cache.value;

    const year = new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);
    const published = { status: 'published' as const };

    const [
      universities,
      academicPrograms,
      activitiesThisYear,
      contributions,
      latestNews,
      upcomingActivities,
    ] = await Promise.all([
      strapi.documents('api::university.university').count(published),
      strapi.documents('api::academic-program.academic-program').count(published),
      strapi.documents('api::activity.activity').count({
        ...published,
        filters: { date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } },
      }),
      strapi.documents('api::contribution.contribution').count(published),
      strapi.documents('api::news.news').findMany({
        ...published,
        fields: ['title', 'summary', 'publishedAt'],
        populate: { coverImage: { fields: [...IMAGE_FIELDS] } },
        sort: { publishedAt: 'desc' },
        limit: 3,
      }),
      strapi.documents('api::activity.activity').findMany({
        ...published,
        fields: ['title', 'type', 'date'],
        populate: {
          coverImage: { fields: [...IMAGE_FIELDS] },
          participatingUniversities: { fields: ['name', 'acronym'] },
        },
        filters: { date: { $gte: today } },
        sort: { date: 'asc' },
        limit: 3,
      }),
    ]);

    const value: ForumSummary = {
      counts: { universities, academicPrograms, activitiesThisYear, contributions },
      latestNews,
      upcomingActivities,
      generatedAt: new Date().toISOString(),
    };
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  },

  invalidate() {
    cache = null;
  },
});

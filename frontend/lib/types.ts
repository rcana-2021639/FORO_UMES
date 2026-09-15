/**
 * Tipos de la API pública del backend (Strapi 5). Derivados a mano de openapi.yaml y de
 * src/api/<tipo>/content-types/<tipo>/schema.json. Las enumeraciones van sin tildes (convención
 * del backend); las etiquetas bonitas viven en lib/format.ts.
 */

export type ProgramLevel = 'Maestria' | 'Doctorado' | 'Especializacion' | 'Diplomado';
export type ProgramModality = 'Presencial' | 'Virtual' | 'Hibrida';
export type ActivityType = 'Encuentro' | 'Conferencia' | 'Seminario' | 'Reunion' | 'Proyecto';
export type ContributionType = 'Resultado' | 'Iniciativa' | 'Beneficio';
export type GalleryType = 'Foto' | 'Video';

export interface MediaFormat {
  url: string;
  width: number;
  height: number;
}

export interface Media {
  id: number;
  documentId: string;
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string;
  formats?: Partial<Record<'thumbnail' | 'small' | 'medium' | 'large', MediaFormat>> | null;
}

interface Base {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface UniversityRef {
  id: number;
  documentId: string;
  name: string;
  acronym?: string | null;
}

export interface University extends Base {
  name: string;
  acronym?: string | null;
  displayOrder: number;
  shortDescription?: string | null;
  logo?: Media | null;
  website?: string | null;
  joinedForumAt?: string | null;
  representatives?: Representative[];
  academicPrograms?: AcademicProgram[];
}

export interface Representative extends Base {
  fullName: string;
  position?: string | null;
  institutionalEmail: string;
  photo?: Media | null;
  shortBio?: string | null;
  university?: UniversityRef | null;
}

export interface AcademicProgram extends Base {
  name: string;
  level: ProgramLevel;
  modality: ProgramModality;
  duration?: string | null;
  description?: string | null;
  infoUrl?: string | null;
  university?: UniversityRef | null;
}

export interface Activity extends Base {
  title: string;
  type: ActivityType;
  date: string;
  description?: string | null;
  coverImage?: Media | null;
  participatingUniversities?: UniversityRef[];
  contributions?: Contribution[];
  galleryItems?: GalleryItem[];
}

export interface Contribution extends Base {
  title: string;
  description: string;
  type: ContributionType;
  publishedOn: string;
  relatedActivity?: { id: number; documentId: string; title?: string } | null;
}

export interface NewsItem extends Base {
  title: string;
  summary?: string | null;
  content: string;
  coverImage?: Media | null;
}

export interface GalleryItem extends Base {
  title?: string | null;
  type: GalleryType;
  file?: Media | null;
  videoUrl?: string | null;
  date?: string | null;
  relatedActivity?: { id: number; documentId: string; title?: string } | null;
}

export interface ForumSummary {
  counts: {
    universities: number;
    academicPrograms: number;
    activitiesThisYear: number;
    contributions: number;
  };
  latestNews: Pick<
    NewsItem,
    'id' | 'documentId' | 'title' | 'summary' | 'publishedAt' | 'coverImage'
  >[];
  upcomingActivities: Pick<
    Activity,
    'id' | 'documentId' | 'title' | 'type' | 'date' | 'coverImage' | 'participatingUniversities'
  >[];
  generatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: { pagination: Pagination };
}

export interface SingleResponse<T> {
  data: T;
  meta: Record<string, never>;
}

/** Formato estándar de error del backend (src/middlewares/api-errors). */
export interface ApiErrorBody {
  error: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Honeypot: siempre vacío. */
  website: '';
}

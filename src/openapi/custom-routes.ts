/**
 * Documentación OpenAPI de las rutas personalizadas que el plugin de documentación
 * no genera solo (Sprint 4, tarea 9): POST /api/contact y GET /api/forum-summary.
 * Se registra como "override" en src/index.ts.
 */
const IMAGE_SCHEMA = {
  type: 'object',
  nullable: true,
  properties: {
    url: { type: 'string' },
    alternativeText: { type: 'string', nullable: true },
    width: { type: 'integer' },
    height: { type: 'integer' },
    formats: { type: 'object', nullable: true },
  },
};

const API_ERROR = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        status: { type: 'integer' },
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        message: { type: 'string' },
        requestId: { type: 'string' },
        details: { type: 'object' },
      },
      required: ['status', 'code', 'message'],
    },
  },
};

export const CUSTOM_ROUTES_OPENAPI = {
  paths: {
    '/contact': {
      post: {
        tags: ['Contact'],
        summary: 'Enviar un mensaje desde el formulario de contacto',
        description:
          'Público. Incluye un campo trampa (honeypot) `website` que debe enviarse VACÍO u omitirse; si viene relleno la solicitud se descarta silenciosamente. Límite de tasa: 5 envíos por hora por IP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'message'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 200 },
                  email: { type: 'string', format: 'email', maxLength: 255 },
                  subject: { type: 'string', maxLength: 250 },
                  message: { type: 'string', minLength: 10, maxLength: 2000 },
                  website: { type: 'string', description: 'Honeypot. Dejar vacío.', example: '' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Mensaje recibido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: { received: { type: 'boolean' }, message: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Campos inválidos',
            content: { 'application/json': { schema: API_ERROR } },
          },
          '429': {
            description: 'Demasiados envíos',
            content: { 'application/json': { schema: API_ERROR } },
          },
        },
      },
    },
    '/forum-summary': {
      get: {
        tags: ['Forum-summary'],
        summary: 'Resumen agregado para la sección de Inicio',
        description:
          'Público. Contadores, últimas 3 noticias publicadas y próximas 3 actividades. Cache de 60 s.',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        counts: {
                          type: 'object',
                          properties: {
                            universities: { type: 'integer' },
                            academicPrograms: { type: 'integer' },
                            activitiesThisYear: { type: 'integer' },
                            contributions: { type: 'integer' },
                          },
                        },
                        latestNews: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              documentId: { type: 'string' },
                              title: { type: 'string' },
                              summary: { type: 'string', nullable: true },
                              publishedAt: { type: 'string', format: 'date-time' },
                              coverImage: IMAGE_SCHEMA,
                            },
                          },
                        },
                        upcomingActivities: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              documentId: { type: 'string' },
                              title: { type: 'string' },
                              type: { type: 'string' },
                              date: { type: 'string', format: 'date' },
                              coverImage: IMAGE_SCHEMA,
                              participatingUniversities: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    name: { type: 'string' },
                                    acronym: { type: 'string' },
                                  },
                                },
                              },
                            },
                          },
                        },
                        generatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

import type { Core } from '@strapi/strapi';

// Solo imágenes rasterizadas. SVG queda excluido a propósito: puede contener scripts (XSS).
const allowedMediaTypes = ['image/png', 'image/jpeg', 'image/webp'];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB por imagen

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },

  upload: {
    config: {
      sizeLimit: MAX_UPLOAD_BYTES,
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
      // Producción: almacenamiento de objetos compatible con S3 (Cloudflare R2).
      // Si no hay bucket configurado (desarrollo) se usa el disco local (public/uploads).
      ...(env('S3_BUCKET')
        ? {
            provider: 'aws-s3',
            providerOptions: {
              baseUrl: env('S3_PUBLIC_URL'), // URL pública del bucket (dominio de R2 o CDN)
              s3Options: {
                endpoint: env('S3_ENDPOINT'), // R2: https://<account-id>.r2.cloudflarestorage.com
                region: env('S3_REGION', 'auto'),
                forcePathStyle: env.bool('S3_FORCE_PATH_STYLE', true),
                credentials: {
                  accessKeyId: env('S3_ACCESS_KEY_ID'),
                  secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
                },
                params: { Bucket: env('S3_BUCKET') },
              },
            },
            actionOptions: { upload: {}, uploadStream: {}, delete: {} },
          }
        : {}),
    },
  },

  // Correo transaccional por SMTP (Resend: smtp.resend.com:465, usuario "resend", contraseña = API key).
  // Sin SMTP_HOST (desarrollo) el lifecycle de contacto solo escribe en el log.
  email: {
    config: env('SMTP_HOST')
      ? {
          provider: 'nodemailer',
          providerOptions: {
            host: env('SMTP_HOST'),
            port: env.int('SMTP_PORT', 465),
            secure: env.bool('SMTP_SECURE', true),
            auth: { user: env('SMTP_USER'), pass: env('SMTP_PASSWORD') },
          },
          settings: {
            defaultFrom: env('MAIL_FROM', 'no-reply@example.org'),
            defaultReplyTo: env('MAIL_REPLY_TO', env('MAIL_FROM', 'no-reply@example.org')),
          },
        }
      : {},
  },

  // Monitoreo de errores en producción (Sprint 6, tarea 4). Solo se activa con SENTRY_DSN.
  // sendMetadata: false → no se envían cabeceras ni cuerpo de la petición (datos personales).
  sentry: {
    enabled: Boolean(env('SENTRY_DSN')),
    config: {
      dsn: env('SENTRY_DSN', ''),
      sendMetadata: false,
      init: {
        environment: env('SENTRY_ENVIRONMENT', env('NODE_ENV', 'development')),
        release: env('SENTRY_RELEASE', undefined),
        tracesSampleRate: 0,
      },
    },
  },

  // Especificación OpenAPI generada en /documentation (Sprint 4, tarea 9)
  documentation: {
    enabled: true,
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'API del Foro Interuniversitario de Estudios de Posgrado',
        description:
          'API REST de solo lectura para el sitio público, más el formulario de contacto y el resumen de inicio.',
      },
      'x-strapi-config': {
        plugins: [], // no documentar endpoints de plugins (users-permissions, upload)
      },
      servers: [{ url: `${env('PUBLIC_URL', 'http://localhost:1337')}/api`, description: 'API' }],
    },
  },
});

export default config;

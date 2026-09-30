/**
 * Se ejecuta antes de cada archivo de pruebas. Fuerza el entorno de pruebas:
 * base de datos separada, logs silenciosos y proxy de confianza (para simular IPs distintas).
 * Los secretos y credenciales se leen del `.env` normal (Strapi lo carga al arrancar).
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_NAME = process.env.TEST_DATABASE_NAME || 'foro_posgrado_test';
process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL || 'error';
process.env.TRUST_PROXY = 'true';
process.env.PORT = '0';
process.env.CONTACT_NOTIFY_EMAIL = 'pruebas@example.org';
// Valor fijo (no el del .env) para probar el cupo propio del servidor del frontend
process.env.FRONTEND_API_TOKEN = 'token-de-pruebas-del-frontend-0123456789';
process.env.CRON_ENABLED = 'false'; // las tareas se prueban llamándolas, no esperando al reloj
delete process.env.SMTP_HOST; // nunca enviar correos reales desde las pruebas
delete process.env.SENTRY_DSN;
delete process.env.S3_BUCKET;

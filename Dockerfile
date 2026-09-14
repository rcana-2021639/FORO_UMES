# Imagen de producción del backend (Sprint 8). Multi-etapa: se compila con todas las
# dependencias y se ejecuta solo con las de producción, como usuario sin privilegios.
# Railway la detecta automáticamente (railway.json → builder DOCKERFILE).

# ---------- 1. Compilación ----------
FROM node:24-alpine AS build
WORKDIR /app
# sharp (procesado de imágenes) necesita estas librerías en Alpine
RUN apk add --no-cache libc6-compat vips-dev python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Claves ficticias solo para que `strapi build` compile el panel; NO se copian a la imagen final
ENV NODE_ENV=production \
    APP_KEYS=build-key \
    API_TOKEN_SALT=build \
    ADMIN_JWT_SECRET=build \
    JWT_SECRET=build \
    TRANSFER_TOKEN_SALT=build \
    ENCRYPTION_KEY=build-encryption-key-32-chars!!
RUN npm run build && npm prune --omit=dev

# ---------- 2. Ejecución ----------
FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache libc6-compat vips curl \
 && addgroup -S strapi && adduser -S strapi -G strapi
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337
COPY --from=build --chown=strapi:strapi /app/package.json /app/tsconfig.json ./
COPY --from=build --chown=strapi:strapi /app/node_modules ./node_modules
COPY --from=build --chown=strapi:strapi /app/dist ./dist
COPY --from=build --chown=strapi:strapi /app/config ./config
COPY --from=build --chown=strapi:strapi /app/database ./database
COPY --from=build --chown=strapi:strapi /app/src ./src
COPY --from=build --chown=strapi:strapi /app/public ./public
COPY --from=build --chown=strapi:strapi /app/favicon.png ./
USER strapi
EXPOSE 1337
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:1337/_health | grep -q 204 || exit 1
CMD ["npm", "run", "start"]

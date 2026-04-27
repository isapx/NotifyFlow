# Dockerfile para NotificApp
FROM node:20-alpine AS base

# Instalar dependencias necesarias para compilar
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

# Instalar dependencias de runtime
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copiar archivos necesarios desde la etapa base
COPY --from=base /app/package*.json ./
COPY --from=base /app/dist ./dist
COPY --from=base /app/server ./server
COPY --from=base /app/migrations ./migrations
COPY --from=base /app/shared ./shared
COPY --from=base /app/drizzle.config.ts ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar permisos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["npm", "start"]
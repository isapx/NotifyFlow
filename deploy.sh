#!/bin/bash

# Script de despliegue para NotificApp
# Uso: ./deploy.sh [ambiente]
# ambiente: development | production (default: production)

set -e

ENVIRONMENT=${1:-production}
PROJECT_DIR="/var/www/notifyapp"
BACKUP_DIR="/var/backups/notifyapp"

echo "🚀 Iniciando despliegue de NotificApp en $ENVIRONMENT"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encuentra package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Backup de base de datos si existe
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Creando backup de base de datos..."
    mkdir -p $BACKUP_DIR
    if command -v pg_dump &> /dev/null; then
        pg_dump $(grep DATABASE_URL .env.production | cut -d '=' -f2) > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
        print_status "Backup creado en $BACKUP_DIR"
    else
        print_warning "pg_dump no encontrado, saltando backup de BD"
    fi
fi

# Instalar dependencias
print_status "Instalando dependencias..."
npm ci --production=false

# Verificar que las dependencias se instalaron correctamente
if [ $? -ne 0 ]; then
    print_error "Error instalando dependencias"
    exit 1
fi

# Build de la aplicación
print_status "Construyendo aplicación..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Error en el build"
    exit 1
fi

# Ejecutar migraciones de base de datos
print_status "Aplicando migraciones de base de datos..."
npm run db:push

if [ $? -ne 0 ]; then
    print_error "Error aplicando migraciones"
    exit 1
fi

# Reiniciar servicios
if command -v pm2 &> /dev/null; then
    print_status "Reiniciando aplicación con PM2..."
    pm2 restart notifyapp || pm2 start npm --name "notifyapp" -- start
    pm2 save
else
    print_warning "PM2 no encontrado. Reinicia manualmente la aplicación."
    print_warning "Ejecuta: npm start"
fi

# Verificar que la aplicación está corriendo
print_status "Verificando que la aplicación responde..."
sleep 5

if curl -f http://localhost:3000/api/health 2>/dev/null; then
    print_status "✅ Aplicación desplegada exitosamente!"
    print_status "URL: http://tu-dominio.com"
else
    print_warning "La aplicación puede estar iniciándose. Verifica los logs:"
    print_warning "pm2 logs notifyapp"
fi

print_status "🎉 Despliegue completado!"
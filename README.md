# NotificApp — Instrucciones de instalación y ejecución

Este README explica cómo preparar y ejecutar la aplicación NotificApp en otra máquina (desarrollo y producción). Incluye requisitos, configuración, y soluciones para acceso desde móviles.

**Resumen rápido**
- Recomendado: Node 20.x (LTS). Node 22 puede funcionar pero la repo fue desarrollada con Node 20.
- Postgres local o Neon para producción.
- Para usar la cámara en móviles en desarrollo: usar `mkcert` o `ngrok`.

**Requisitos**
- Git
- Node.js (recomiendo 20.x) y npm
- PostgreSQL (local) o una DB remota (Neon está soportado)
- Opcional: `mkcert` (certificados locales) o `ngrok` (tunelización HTTPS)

1) Clonar el repo
```powershell
git clone <repo-url> NotifyFlow
cd NotifyFlow
```

2) Instalar dependencias
```powershell
npm install
```

3) Variables de entorno
- Hay un `.env.development` en el repo y una plantilla `.env.production.template`.
- Ajusta al menos estas variables:
  - `DATABASE_URL` — cadena de conexión a Postgres
  - `SESSION_SECRET` — secreto para sesiones
  - `SENDGRID_API_KEY` — (opcional)
  - `APP_URL` — URL de la app (emails)

Ejemplo: editar `.env.development`
```powershell
notepad .env.development
```

4) Base de datos
- Si usas Postgres local, crea la BD y usuario:
```sql
-- en psql
CREATE DATABASE notify;
CREATE USER notify_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE notify TO notify_user;
\q
```
- Actualiza `DATABASE_URL` en `.env.development`:
```
DATABASE_URL=postgresql://notify_user:tu_password@localhost:5432/notify
```

5) Aplicar esquema / migraciones
```powershell
npm run db:push
```

6) Ejecutar en desarrollo
- Scripts útiles (definidos en `package.json`):
  - `npm run dev:client` — inicia Vite (HTTPS dev server, por defecto en 5173)
  - `npm run dev:server` — inicia backend Express en `:3000`
  - `npm run dev:both` — arranca ambos en paralelo (usa `concurrently`)

- Opción recomendada (cliente en HTTPS + backend separado):
  - Terminal A:
    ```powershell
    npm run dev:server
    ```
  - Terminal B:
    ```powershell
    npm run dev:client
    ```

7) Acceso desde móvil / HTTPS
- Problema: la cámara en navegadores móviles requiere contexto seguro (HTTPS) y certificado confiable.

Opciones:

- ngrok (recomendado para pruebas móviles, fácil):
  1. Descarga e instala `ngrok`.
  2. Arranca Vite (`npm run dev:client`) y en otra terminal:
     ```powershell
     ngrok http 5173
     ```
  3. Abre la URL `https://xxxx.ngrok.io` en tu móvil (certificado válido y sin pasos extra).

- mkcert (mejor si quieres confianza local):
  1. Instala mkcert (Windows con Chocolatey):
     ```powershell
     choco install mkcert
     mkcert -install
     mkdir certs
     mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 <PC_IP> ::1
     ```
  2. Vite está configurado para usar `certs/localhost*.pem` si existen. Reinicia `npm run dev:client`.
  3. En móviles puede ser necesario confiar la CA de mkcert (requiere pasos distintos según iOS/Android).

8) Ejecutar en producción
1. Copia y edita la plantilla de producción:
```powershell
copy .env.production.template .env.production
notepad .env.production
```
2. Build y start:
```powershell
npm run build
npm start
```

9) Troubleshooting rápido
- `concurrently` no encontrado: ejecutar `npm install`.
- Error de certificado / cámara en móvil: usa `ngrok` o `mkcert`.
- Error de base de datos: revisa `DATABASE_URL` y que el servidor Postgres acepte conexiones.
- Si el servidor intenta servir archivos estáticos en desarrollo y falla por `build` faltante: para desarrollo usa `SKIP_VITE=true` o usa `npm run dev:both` (ya configurado en el repo) que evita montar Vite en el backend.

10) Comandos útiles (PowerShell)
```powershell
# Instalar dependencias
npm install

# Levantar backend
npm run dev:server

# Levantar cliente Vite
npm run dev:client

# Levantar ambos (en una terminal)
npm run dev:both

# Generar certificados mkcert (opcional)
mkcert -install
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 <PC_IP> ::1

# Exponer con ngrok (opcional)
ngrok http 5173
```

---

## 🚀 Despliegue en Producción

Para "subir" la app a un servidor y hacerla accesible públicamente, tienes varias opciones. Aquí te explico las más comunes:

### Opción 1: VPS (Servidor Virtual Privado) - Recomendado

**Proveedores populares:**
- DigitalOcean Droplets ($6/mes)
- Linode VPS ($5/mes)
- Vultr Cloud Compute ($2.50/mes)
- AWS EC2 (gratuito por 12 meses)
- Google Cloud Platform (créditos gratuitos)

**Pasos para desplegar:**

1. **Crear VPS Ubuntu/Debian:**
   ```bash
   # Conecta por SSH
   ssh root@tu-servidor-ip
   ```

2. **Instalar Node.js y PostgreSQL:**
   ```bash
   # Actualizar sistema
   apt update && apt upgrade -y
   
   # Instalar Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   
   # Instalar PostgreSQL
   apt install postgresql postgresql-contrib -y
   
   # Instalar PM2 (gestor de procesos)
   npm install -g pm2
   ```

3. **Configurar PostgreSQL:**
   ```bash
   # Cambiar a usuario postgres
   su - postgres
   
   # Crear base de datos y usuario
   psql
   CREATE DATABASE notify_prod;
   CREATE USER notify_user WITH PASSWORD 'tu_password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE notify_prod TO notify_user;
   ALTER USER notify_user CREATEDB;
   \q
   exit
   ```

4. **Subir código al servidor:**
   ```bash
   # En tu máquina local
   scp -r . root@tu-servidor-ip:/var/www/notifyapp
   
   # O usando Git
   git clone https://github.com/tuusuario/notifyflow.git /var/www/notifyapp
   ```

5. **Configurar la aplicación:**
   ```bash
   cd /var/www/notifyapp
   
   # Instalar dependencias
   npm install
   
   # Configurar variables de entorno
   cp .env.production.template .env.production
   nano .env.production
   ```

   Edita `.env.production`:
   ```bash
   DATABASE_URL=postgresql://notify_user:tu_password_seguro@localhost:5432/notify_prod
   SESSION_SECRET=tu_session_secret_muy_seguro_aqui
   SENDGRID_API_KEY=tu_sendgrid_api_key
   APP_URL=https://tu-dominio.com
   NODE_ENV=production
   ```

6. **Configurar base de datos:**
   ```bash
   npm run db:push
   ```

7. **Build y despliegue:**
   ```bash
   npm run build
   
   # Usar PM2 para mantener la app corriendo
   pm2 start npm --name "notifyapp" -- start
   pm2 startup
   pm2 save
   ```

8. **Configurar Nginx (opcional pero recomendado):**
   ```bash
   apt install nginx -y
   
   # Crear configuración
   nano /etc/nginx/sites-available/notifyapp
   ```

   Contenido del archivo:
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Habilitar sitio
   ln -s /etc/nginx/sites-available/notifyapp /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

9. **SSL con Let's Encrypt (gratuito):**
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d tu-dominio.com
   ```

### Opción 2: Railway - Fácil y rápido

Railway es una plataforma moderna para desplegar apps Node.js:

1. Ve a [railway.app](https://railway.app) y crea cuenta
2. Conecta tu repo de GitHub
3. Railway detectará automáticamente Node.js
4. Configura variables de entorno en el dashboard
5. Railway proveerá PostgreSQL automáticamente
6. Despliegue automático en cada push

### Opción 3: Vercel + Railway

- **Frontend (Vercel):** Despliega solo el cliente React
- **Backend (Railway):** API y base de datos

### Opción 4: Heroku (tradicional)

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create notifyapp-tu-nombre

# Configurar base de datos
heroku addons:create heroku-postgresql:hobby-dev

# Configurar variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=tu_secret
# ... otras variables

# Desplegar
git push heroku main
```

### Opción 5: Docker (avanzado)

Si prefieres contenedores:

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build y run
docker build -t notifyapp .
docker run -p 3000:3000 notifyapp
```

### Opción 6: Despliegue automatizado con scripts incluidos

He incluido archivos de configuración para facilitar el despliegue:

#### Archivos incluidos:
- `deploy.sh` — Script de despliegue automatizado para VPS
- `ecosystem.config.js` — Configuración de PM2 para gestión de procesos
- `nginx.conf` — Configuración de Nginx como proxy reverso
- `Dockerfile` — Contenedor Docker para la aplicación
- `docker-compose.yml` — Orquestación completa con PostgreSQL y Nginx

#### Despliegue con script (VPS recomendado):
```bash
# Hacer ejecutable el script
chmod +x deploy.sh

# Ejecutar despliegue
./deploy.sh production
```

#### Despliegue con Docker:
```bash
# Variables de entorno (crea un .env)
cp .env.production.template .env

# Ejecutar con docker-compose
docker-compose up -d
```

#### Configuración de Nginx (VPS):
```bash
# Copiar configuración
sudo cp nginx.conf /etc/nginx/sites-available/notifyapp

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/notifyapp /etc/nginx/sites-enabled/

# Instalar certificado SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Costos aproximados mensuales:
- VPS básico: $5-15
- Railway: $5-10 (con DB incluida)
- Vercel: $0-20 (gratuito para apps pequeñas)
- Heroku: $7-25

### Checklist antes de desplegar:
- [ ] Variables de entorno configuradas (`.env.production`)
- [ ] Base de datos creada y migrada (`npm run db:push`)
- [ ] `npm run build` funciona correctamente
- [ ] `npm start` funciona en local
- [ ] Archivos de despliegue configurados:
  - [ ] `deploy.sh` tiene permisos de ejecución (`chmod +x deploy.sh`)
  - [ ] `nginx.conf` actualizado con tu dominio
  - [ ] `ecosystem.config.js` configurado si usas PM2
  - [ ] `docker-compose.yml` configurado si usas Docker
- [ ] Certificado SSL configurado (Let's Encrypt o similar)
- [ ] Firewall configurado (solo puertos 22, 80, 443, 3000 si necesario)
- [ ] Backups de base de datos programados
- [ ] PM2 instalado si usas el script de despliegue (`npm install -g pm2`)

¿Necesitas ayuda con alguna opción específica o tienes un proveedor de hosting en mente?

# NotifyFlow — Instrucciones de instalación y ejecución

Este README explica cómo preparar y ejecutar la aplicación NotifyFlow en otra máquina (desarrollo y producción). Incluye requisitos, configuración, y soluciones para acceso desde móviles.

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

Si quieres, puedo:
- añadir un script `dev:ngrok` que arranque Vite y cree el túnel ngrok automáticamente, o
- generar instrucciones mkcert específicas si me das la IP local de la máquina.

Archivo creado: `README.md` (raíz del repo)

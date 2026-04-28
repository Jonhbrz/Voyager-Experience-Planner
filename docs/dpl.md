# DPL — Despliegue y control de versiones

## Repositorio

Estructura en raíz habitual:

| Ruta | Contenido |
|------|-----------|
| `backend/` | Laravel (API), `composer.json`, `Dockerfile`, `.env.example` |
| `frontend/` | Vue + Vite, `package.json`, `Dockerfile` |
| `nginx/` | Proxy (p. ej. `default.conf`) hacia frontend estático y PHP-FPM |
| `docker-compose.yml` | Servicios locales / integrados |
| `docs/` | Documentación MkDocs (`mkdocs.yml` apunta aquí) |

Documentación construible con **MkDocs** (`pip install mkdocs mkdocs-material` y `mkdocs serve` / `mkdocs build`).

## Docker

El archivo **`docker-compose.yml`** del repositorio define:

| Servicio | Rol |
|---------|-----|
| `postgres` | PostgreSQL 15, volumen `pgdata`, healthcheck |
| `backend` | PHP-FPM, montaje `./backend:/var/www`, variables DB apuntando a `postgres`; Lee **`backend/.env`** si existe (`env_file`) |
| `frontend` | Imagen construida con build estático típico |
| `nginx` | Puerto host `${HTTP_PORT:-8000}`, proxy a backend y ficheros SPA |

Ejecución local típica:

```bash
docker compose up -d --build
```

Migraciones Laravel (dentro del contenedor backend cuando aplique):

```bash
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan test
```

**Override de producción:** en este repositorio no hay un segundo compose con nombre fijo; en despliegue real suele repetirse el mismo `docker-compose.yml` cambiando **variables de entorno** (`APP_ENV=production`, `APP_DEBUG=false`, secretos PostgreSQL fuertes) o añadirse un `docker-compose.prod.yml` opcional como `-f`. No debe versionarse el `.env` con secretos.

## Entorno y variables

- **Backend**: credenciales y `APP_*` en **`backend/.env`** (tomar valores de **`backend/.env.example`** como plantilla).
- **Compose**: variables como `HTTP_PORT`, `POSTGRES_*`, `APP_URL`, `CACHE_STORE`, `QUEUE_*` pueden definirse en `.env` en la raíz del proyecto de despliegue o exportarse en CI.

Separación práctica desarrollo vs producción: mismo árbol, distintos valores de **`APP_ENV`**, **`APP_DEBUG`**, URLs y credenciales (no usar `.env` de desarrollo en producción).

## Frontend

| Comando | Uso |
|---------|-----|
| `npm install` / `npm ci` | Dependencias (`frontend/`) |
| `npm run dev` | Vite en desarrollo (HMR); proxy opcional `/api` hacia backend |
| `npm run build` | Salida típica `dist/` para servir tras Nginx/contenedor frontend |

El **Dockerfile** del frontend ejecuta normalmente instalación + `npm run build` para servir sólo artefactos estáticos.

## Backend en producción

Comandos habituales post-deploy (adaptar al runner):

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

(No sustituyen migraciones ni `APP_KEY` ya configurados.)

## Git

- Rama y commits por función o área (**backend**/ **frontend**/ **tests**/ **docs**) con mensajes claros en español o inglés, según convención del equipo.
- No commitear `backend/.env` ni ficheros `.env*` con secretos.

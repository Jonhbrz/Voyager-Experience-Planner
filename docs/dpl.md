# DPL — Despliegue, Docker, CI/CD y control de versiones

## Repositorio

Estructura en raíz:

| Ruta | Contenido |
|------|-----------|
| `backend/` | Laravel 12 (API REST), `composer.json`, `Dockerfile`, `.env.example`, `php-fpm.d/`, `php/conf.d/` |
| `frontend/` | Vue 3 + Vite + TypeScript, `package.json`, `Dockerfile`, `nginx/` para imagen estática |
| `nginx/` | Reverse proxy del stack integrado (`default.conf` con SPA + PHP-FPM + cabeceras de seguridad) |
| `docs/` | Documentación MkDocs (origen del sitio que se despliega en GitHub Pages) |
| `mkdocs.yml` | Configuración del sitio (tema Material, navegación, ODS/IPW/SOJ/etc.) |
| `docker-compose.dev.yml` | Stack **desarrollo** (HMR Vite, `artisan serve`, puertos alternativos) |
| `docker-compose.prod.yml` | Stack **producción local / ensayo** (build estático del frontend + `vite preview`) |
| `docker-compose.portainer.yml` | Stack para **Portainer** (segundo entorno diferenciado con variables) |
| `dev.env`, `prod.env`, `portainer.env` | Variables por stack (no incluir secretos reales en repo público real) |
| `.github/workflows/` | Pipelines de **CI** (`ci.yml`) y **despliegue de docs** (`deploy-docs.yml`) |
| `README.md` | Resumen de arranque rápido y enlaces a la documentación |

Documentación construible con **MkDocs** (`pip install mkdocs mkdocs-material` y luego `mkdocs serve` / `mkdocs build`). El sitio se publica automáticamente en **GitHub Pages** (sección [CI/CD](#cicd-github-actions)).

## Arquitectura de despliegue

| Capa | Tecnología | Rol en despliegue |
|------|------------|-------------------|
| Frontend | Vue 3 + Vite + TS (SPA) | En dev: `vite` (HMR). En prod local: `vite preview` sobre el build. En el stack integrado: imagen estática servida por **NGINX** (`frontend/nginx/`). |
| Backend | Laravel 12 (PHP 8.4) + Sanctum | API REST `/api`. En dev/prod compose se usa **`php artisan serve`**; el stack integrado de la raíz prevé **PHP-FPM + NGINX**. |
| BBDD | PostgreSQL 15 | Servicio `db` (o `postgres` en el stack integrado), con healthcheck y volumen persistente por entorno. |
| Proxy | NGINX | En el stack integrado expone la SPA y el backend bajo el mismo origen. |
| Orquestación | **Docker Compose** | 3 ficheros (`dev`, `prod`, `portainer`) para escenarios separados; opcionalmente un compose raíz integrado con NGINX. |
| Despliegue gestionado | **Portainer** | `docker-compose.portainer.yml` con variables (`portainer.env`) listas para pegar en *Stacks*. |
| Docs hosting | **GitHub Pages** | Sitio MkDocs publicado por workflow desde `docs/`. |

## Docker: tres formas de levantar el proyecto

### 1) `docker-compose.dev.yml` — desarrollo (`name: vep-dev`)

Pensado para iteración rápida (HMR Vite + bind-mount del código backend):

| Servicio | Host → contenedor | Notas |
|----------|-------------------|--------|
| `db` | PostgreSQL 15, **`5434:5432`**, BD `app_dev` | Nombre DNS interno **`db`** (no `postgres`). Volumen `vep_dev_pgdata`. |
| `backend` | **`8002:8000`**, `php artisan serve --no-reload` | Bind `./backend:/var/www` + volumen **`vep_dev_vendor`** en `/var/www/vendor` para no pisar dependencias con el bind. `env_file: dev.env`. |
| `frontend` | **`5173:5173`**, `npm run dev` (Vite HMR) | `VITE_API_BASE_URL=http://localhost:8002/api`. Volumen `vep_dev_node_modules`. |

**Composer en arranque:** sólo se ejecuta `composer install` si falta el paquete dev esperado (`vendor/laravel/pail/...`). Esto evita reinstalar en cada reinicio y corrige el caso de `vendor` vacío o heredado de imagen `--no-dev`. A continuación: `php artisan migrate --force` y `php artisan serve`.

Arranque (PowerShell, desde la raíz del repo):

```powershell
docker compose -f docker-compose.dev.yml up --build
```

En segundo plano:

```powershell
docker compose -f docker-compose.dev.yml up --build -d
```

**URLs típicas:** SPA `http://localhost:5173`, API `http://localhost:8002/api`.

### 2) `docker-compose.prod.yml` — ensayo tipo producción (`name: vep-prod`)

| Servicio | Host → contenedor | Notas |
|----------|-------------------|--------|
| `db` | **`5433:5432`**, BD `app_prod` | Mismo nombre interno **`db`**. Volumen `vep_prod_pgdata`. |
| `backend` | **`8001:8000`**, `php artisan serve --no-reload` | **Sin bind del código**: la imagen ya trae `composer install --no-dev` del propio Dockerfile. Al arrancar: `migrate --force`, `config:cache` y servidor. `env_file: prod.env`. |
| `frontend` | **`5174:5174`** | Build dentro de la imagen (Dockerfile inline `npm ci` + `npm run build`) y servido con **`npm run preview`** sobre el `dist/`. **`VITE_API_BASE_URL=http://localhost:8001/api`** se fija en build. |

```powershell
docker compose -f docker-compose.prod.yml up --build
```

En segundo plano:

```powershell
docker compose -f docker-compose.prod.yml up --build -d
```

**URLs típicas:** SPA `http://localhost:5174`, API `http://localhost:8001/api`.

> **Importante (frontend prod):** la URL del API queda fijada en el build estático. Si cambias el puerto/dominio del backend hay que **reconstruir** la imagen del frontend (`docker compose ... up --build`). Detalle técnico en **[DEW](dew.md)**.

### 3) `docker-compose.portainer.yml` — despliegue gestionado (`name: vep-portainer`)

Stack pensado para subirse desde **Portainer** (interfaz gráfica de gestión de Docker) como **segundo entorno diferenciado** del local. Toda la configuración pasa por **variables de entorno** (`portainer.env`), no hay valores quemados:

| Servicio | Variables clave | Notas |
|----------|-----------------|--------|
| `db` | `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST_PORT` | Volumen `vep_portainer_pgdata`. Healthcheck con las mismas credenciales. |
| `backend` | `BACKEND_HOST_PORT`, `APP_ENV`, `APP_DEBUG`, `APP_KEY`, `APP_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DRIVER`, `QUEUE_CONNECTION`, `CACHE_STORE`, `DB_*` | Build desde `${PROJECT_BUILD}/backend` y bind `${PROJECT_MOUNT}/backend:/var/www`. |
| `frontend` | `FRONTEND_HOST_PORT`, `VITE_API_BASE_URL` | Imagen `node:20-alpine` con bind `${PROJECT_MOUNT}/frontend:/app` y `npm run dev` (HMR). |

Las variables **`PROJECT_BUILD`** y **`PROJECT_MOUNT`** distinguen dos rutas:

- **`PROJECT_BUILD`**: ruta vista *dentro* del contenedor de Portainer (de ahí se lee el contexto de build). Requiere arrancar Portainer con `-v c:/Users/jonat/PRW-VEP:/projects/vep` (ejemplo Windows + Docker Desktop).
- **`PROJECT_MOUNT`**: ruta en el **host del daemon** (Docker Desktop traduce las rutas Windows a paths Linux), usada por los bind-mounts de los contenedores hijos.

Pasos típicos en Portainer:

1. *Stacks → Add stack*.
2. **Build method:** *Repository* (apuntando al repo) o *Web editor* pegando `docker-compose.portainer.yml`.
3. **Environment variables:** *Load variables from .env file* y subir `portainer.env` (o pegar las claves manualmente).
4. *Deploy the stack*.

Puertos por defecto elegidos para no chocar con `vep-dev` y `vep-prod`:

- **DB:** `5435 → 5432`
- **Backend:** `8003 → 8000`
- **Frontend:** `5175 → 5173`
- **`VITE_API_BASE_URL=http://localhost:8003/api`**

> **`APP_KEY`:** el `portainer.env` trae una clave distinta a las de dev/prod; **no reutilices** claves entre entornos en despliegues reales.

### Puertos: evitar solapes entre stacks

| Recurso | Dev (`vep-dev`) | Prod compose (`vep-prod`) | Portainer (`vep-portainer`) |
|---------|-----------------|---------------------------|------------------------------|
| API HTTP | 8002 | 8001 | 8003 |
| Frontend | 5173 | 5174 | 5175 |
| PostgreSQL host | 5434 | 5433 | 5435 |

Los tres stacks pueden convivir simultáneamente sin pisarse, lo que satisface el criterio de **dos (o más) entornos diferenciados**.

## Entorno y variables (importante para despliegue)

- **`docker-compose.dev.yml`, `docker-compose.prod.yml`, `docker-compose.portainer.yml`:** el servicio se llama **`db`** → **`DB_HOST=db`** en `dev.env` / `prod.env` / `portainer.env`. Si Laravel intenta resolver `postgres` con estos stacks, fallará con error de DNS dentro del contenedor.
- **`backend/.env`:** útil para desarrollo local *sin* compose; debe ser coherente con el stack que uses (no mezclar valores).
- No versionar secretos reales: aunque `dev.env` y `prod.env` están listados como excepción en `.gitignore` (sólo para que el proyecto académico sea reproducible), en un despliegue real se sustituirán por valores no versionados o secretos de la plataforma.

Separación dev vs prod vs portainer: mismo árbol, distintos valores de **`APP_ENV`**, **`APP_DEBUG`**, URLs, credenciales y `env_file`. Detalle de la matriz:

| Variable | `dev.env` | `prod.env` | `portainer.env` |
|----------|-----------|-----------|------------------|
| `APP_ENV` | `local` | `production` | `local` |
| `APP_DEBUG` | `true` | `false` | `true` |
| `APP_URL` | `http://localhost:8000` (referencia) | `http://localhost:8001` | `http://localhost:8003` |
| `FRONTEND_URL` / CORS / Sanctum | `localhost:5173` | `localhost:5174` | `localhost:5175` |
| `DB_DATABASE` | `app_dev` | `app_prod` | `app_portainer` |

## Datos iniciales y usuario superadmin

Las migraciones se ejecutan al arrancar el backend en **dev**, **prod** y **portainer** (el `command` de cada compose lo invoca con `migrate --force`). **No** se ejecuta el seeder automáticamente.

Tras el primer arranque (o cuando se necesite recrear el usuario administrador):

```powershell
docker compose -f docker-compose.dev.yml exec backend php artisan db:seed --force
```

Para el stack prod local:

```powershell
docker compose -f docker-compose.prod.yml exec backend php artisan db:seed --force
```

Para el stack Portainer (desde la consola del contenedor en la UI o por CLI con `docker exec`):

```bash
docker exec -it <id-contenedor-backend> php artisan db:seed --force
```

El **`DatabaseSeeder`** garantiza el usuario **superadmin** `jonathanborza02@gmail.com` con contraseña **`123456`** (plan `premium`). En código, la contraseña en el seeder va en **texto plano** porque el modelo `User` declara cast `password => 'hashed'`; si se usara `Hash::make()` en el seeder, el login fallaría por doble hash. Detalle técnico en **[DSW](dsw.md)**.

## Comandos útiles (migraciones, tests, caché)

Migraciones manuales (sustituir el fichero `-f` según el stack):

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan migrate --force
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose -f docker-compose.portainer.yml exec backend php artisan migrate --force
```

Tests:

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan test
```

Post-deploy en servidores reales (el compose `prod` ya ejecuta `config:cache` al iniciar):

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Frontend (resumen despliegue)

| Comando | Uso |
|---------|-----|
| `npm install` / `npm ci` | Instalación de dependencias (`frontend/`) |
| `npm run dev` | Vite en desarrollo (HMR); en Docker dev/portainer el compose lanza este comando |
| `npm run build` | Genera el `dist/`; en Docker prod el build ocurre dentro de la imagen |
| `npm run preview` | Sirve el `dist/` (lo que hace Docker prod en `5174`) |
| `npm run type-check` / `lint` | Calidad de código (TypeScript, ESLint, oxlint, Prettier) |

En Docker **prod** la URL de la API se fija en build con **`VITE_API_BASE_URL`**. Si cambias el puerto o dominio del backend, hay que **reconstruir** la imagen del frontend. Detalle de la SPA en **[DEW](dew.md)**.

## CI/CD (GitHub Actions)

El proyecto cumple los puntos de **integración continua** y **despliegue continuo de la documentación** mediante dos workflows en `.github/workflows/`:

### `ci.yml` — Integración continua

Se dispara en cualquier `push` y `pull_request`. Ejecuta:

1. **Frontend:** `npm ci` + `npm run build` (Node 22, caché de npm sobre `frontend/package-lock.json`).
2. **Backend:** `composer install` + `php artisan test` (PHP 8.4, SQLite en memoria con `.env.example`).
3. **Documentación:** `pip install mkdocs mkdocs-material` + `mkdocs build`.

Si cualquiera de los tres pasos falla, el commit/PR queda marcado como roto. Esto da **trazabilidad** del estado del proyecto en cada cambio.

### `deploy-docs.yml` — Despliegue continuo de la documentación

Se dispara en `push` a `main`/`master` cuando cambia `docs/**`, `mkdocs.yml` o el propio workflow. El job:

1. Calcula automáticamente `site_url` para subruta de **GitHub Pages** (`https://<owner>.github.io/<repo>/`).
2. Construye el sitio con MkDocs Material.
3. Sube el artefacto y hace deploy con `actions/deploy-pages@v4` al *environment* `github-pages`.

Resultado: la documentación queda disponible **online** y accesible desde GitHub Pages cumpliendo el criterio de despliegue de documentación (Surge/Vercel serían alternativas equivalentes).

## Git y control de versiones

- **Repositorio Git** con `main` como rama principal protegida en práctica (lo que entra debe pasar el CI).
- **Mensajes de commit** descriptivos en español/inglés según el área (`backend`, `frontend`, `docs`, `tests`).
- **`.gitignore`** ignora `node_modules/`, `vendor/`, `dist/`, `site/` (build de MkDocs), todos los `.env*` excepto `.env.example`, `dev.env` y `prod.env` (estos últimos están en repo a propósito por el carácter académico del proyecto).
- **Ramas/commits** organizados por funcionalidad o capa cuando aplica; los hitos del proyecto (configuración inicial, despliegue Portainer, etc.) están reflejados en el historial.
- **Tags/releases** opcionales para marcar entregas. La versión actual se refleja también en `mkdocs.yml` (`extra.version`).

## Resumen de cumplimiento DPL (criterios)

| Criterio | Implementación en el proyecto |
|----------|-------------------------------|
| Instala y configura elementos de despliegue (NGINX, Docker, Backend, Frontend) | `nginx/default.conf`, `backend/Dockerfile` (PHP-FPM 8.4 + Composer), `frontend/Dockerfile` y Dockerfile inline de prod, Vue+Vite y Laravel arrancando en contenedor. |
| Orquesta servicios y dependencias con Docker Compose | 3 ficheros compose (`dev`, `prod`, `portainer`) con `depends_on`, healthchecks de Postgres y volúmenes nombrados. |
| Despliega en dos entornos diferenciados (Portainer/Kamal) | Stacks **`vep-prod`** local y **`vep-portainer`** vía Portainer, con puertos, BBDD y `APP_KEY` distintos. |
| Control de versiones | Git en `main`, `.gitignore` curado, historial de commits e issues si aplica. |
| CI/CD con GitHub Actions | `ci.yml` (build front + tests Laravel + build docs) y `deploy-docs.yml` (Pages). |
| Documentación con generador automático | **MkDocs Material** desde `docs/` con `mkdocs.yml`. |
| Documentación desplegada online | **GitHub Pages** vía workflow `deploy-docs.yml`. |

# DPL — Despliegue y control de versiones

## Repositorio

Estructura en raíz habitual:

| Ruta | Contenido |
|------|-----------|
| `backend/` | Laravel (API), `composer.json`, `Dockerfile`, `.env.example` |
| `frontend/` | Vue + Vite, `package.json`, `Dockerfile` |
| `nginx/` | Proxy (p. ej. `default.conf`) hacia frontend estático y PHP-FPM |
| `docker-compose.yml` | Stack integrado clásico (PostgreSQL + PHP-FPM + frontend + Nginx) |
| `docker-compose.dev.yml` | Stack **desarrollo** (HMR, `artisan serve`, puertos alternativos) |
| `docker-compose.prod.yml` | Stack **producción local / ensayo** (build estático + preview + API) |
| `.env.dev` / `.env.prod` | Variables para los compose anteriores (no secretos reales en repo) |
| `docs/` | Documentación MkDocs (`mkdocs.yml` apunta aquí) |

Documentación construible con **MkDocs** (`pip install mkdocs mkdocs-material` y `mkdocs serve` / `mkdocs build`).

## Docker: tres formas de levantar el proyecto

### 1) `docker-compose.yml` (integrado con Nginx)

| Servicio | Rol |
|---------|-----|
| `postgres` | PostgreSQL 15, volumen `pgdata`, healthcheck |
| `backend` | PHP-FPM, montaje `./backend:/var/www`, `DB_HOST=postgres`; opcional **`backend/.env`** (`env_file`) |
| `frontend` | Imagen con build estático |
| `nginx` | Puerto host `${HTTP_PORT:-8000}`, proxy a backend y SPA |

```bash
docker compose up -d --build
```

### 2) `docker-compose.dev.yml` — desarrollo rápido (`name: vep-dev`)

Evita conflictos con otros stacks y mejora el arranque del backend:

| Servicio | Host → contenedor | Notas |
|----------|-------------------|--------|
| `db` | PostgreSQL, `5434:5432`, BD `app_dev` | El nombre DNS interno es **`db`**, no `postgres`. |
| `backend` | `8002:8000`, `artisan serve` | Bind `./backend:/var/www` + volumen **`vep_dev_vendor`** en `/var/www/vendor` para no pisar dependencias con el montaje. |
| `frontend` | `5173:5173`, `npm run dev` (Vite HMR) | `VITE_API_BASE_URL=http://localhost:8002/api` |

Arranque (PowerShell, desde la raíz del repo):

```powershell
docker compose -f docker-compose.dev.yml up --build
```

En segundo plano:

```powershell
docker compose -f docker-compose.dev.yml up --build -d
```

**Variables:** `env_file: .env.dev` en backend (`DB_HOST=db`, `DB_DATABASE=app_dev`, `APP_URL` acorde al puerto 8002, CORS/Sanctum hacia `5173`). El frontend no usa `backend/.env` para la API: usa **`VITE_API_BASE_URL`** definida en el compose.

**Composer en arranque:** solo ejecuta `composer install` si falta el paquete de desarrollo esperado (evita reinstalar en cada reinicio y corrige el caso de `vendor` vacío o heredado de imagen `--no-dev`). Después: `php artisan migrate --force` y `php artisan serve`.

**URLs típicas:** SPA `http://localhost:5173`, API `http://localhost:8002/api`.

### 3) `docker-compose.prod.yml` — ensayo tipo producción (`name: vep-prod`)

| Servicio | Host → contenedor | Notas |
|----------|-------------------|--------|
| `db` | `5433:5432`, BD `app_prod` | Mismo nombre interno **`db`**. |
| `backend` | `8001:8000`, `artisan serve` | Sin bind del código: imagen con `composer install` en build. Al arrancar: migraciones, `config:cache`, servidor. |
| `frontend` | `5174:5174` | Build en imagen (`npm run build`) y `vite preview`; **`VITE_API_BASE_URL=http://localhost:8001/api`** fijada en el Dockerfile inline del compose. |

```powershell
docker compose -f docker-compose.prod.yml up --build
```

En segundo plano:

```powershell
docker compose -f docker-compose.prod.yml up --build -d
```

**Variables:** `env_file: .env.prod` (`DB_HOST=db`, `DB_DATABASE=app_prod`, `APP_URL` hacia `8001`, CORS/Sanctum hacia `5174`).

**URLs típicas:** SPA `http://localhost:5174`, API `http://localhost:8001/api`.

### Puertos: evitar solapes entre stacks

| Recurso | Dev (`vep-dev`) | Prod compose (`vep-prod`) | Compose raíz |
|---------|-----------------|---------------------------|--------------|
| API HTTP | 8002 | 8001 | vía Nginx (p. ej. 8000) |
| Frontend | 5173 | 5174 | Nginx |
| PostgreSQL host | 5434 | 5433 | configurable |

Pueden convivir **dev** y **prod** compose a la vez si el equipo lo necesita; el raíz puede chocar por puertos según configuración.

## Entorno y variables (importante para despliegue)

- **`docker-compose.yml` (raíz):** el servicio de base de datos se llama **`postgres`** → en variables Laravel suele usarse `DB_HOST=postgres`.
- **`docker-compose.dev.yml` y `docker-compose.prod.yml`:** el servicio se llama **`db`** → **`DB_HOST=db`** en `.env.dev` / `.env.prod`. Si Laravel intenta resolver `postgres` con estos stacks, fallará con error de DNS en contenedor.
- **`backend/.env`:** útil para desarrollo local sin compose o para el stack raíz; debe ser coherente con el compose que uses. No mezclar valores de un stack con otro.
- No versionar secretos reales: `backend/.env`, `.env.dev`, `.env.prod` con contraseñas fuertes en entornos reales.

Separación desarrollo vs producción: mismo árbol, distintos valores de **`APP_ENV`**, **`APP_DEBUG`**, URLs, credenciales y ficheros `env_file` por stack.

## Datos iniciales y usuario superadmin

Las migraciones se ejecutan al arrancar backend en **dev** y **prod** compose (según el `command` de cada fichero). **No** se ejecuta el seeder automáticamente.

Tras el primer arranque (o cuando haga falta recrear el usuario administrador), ejecutar:

```powershell
docker compose -f docker-compose.dev.yml exec backend php artisan db:seed --force
```

o, para el stack prod local:

```powershell
docker compose -f docker-compose.prod.yml exec backend php artisan db:seed --force
```

El **`DatabaseSeeder`** garantiza el usuario **superadmin** `jonathanborza02@gmail.com` con contraseña **`123456`** (plan premium). En código, la contraseña en el seeder va en **texto plano** porque el modelo `User` declara cast `password => 'hashed'`: si se usara `Hash::make()` en el seeder, el login fallaría por doble hash. Detalle técnico en **[DSW](dsw.md)**.

## Comandos útiles (migraciones, tests, caché)

Migraciones manuales (sustituir el fichero `-f` según el stack):

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan migrate --force
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose exec backend php artisan migrate --force
```

Tests (normalmente contra entorno configurado):

```bash
docker compose exec backend php artisan test
```

Post-deploy en servidores reales (adaptar al runner; el compose prod local ya ejecuta `config:cache` al iniciar):

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Frontend (resumen despliegue)

| Comando | Uso |
|---------|-----|
| `npm install` / `npm ci` | Dependencias (`frontend/`) |
| `npm run dev` | Vite en desarrollo (HMR); en Docker dev el compose ya lanza este comando |
| `npm run build` | Artefactos en `dist/`; en Docker prod el build ocurre dentro de la imagen |

En Docker **prod** compose, la URL de la API se fija en build con **`VITE_API_BASE_URL`**. Si cambias el puerto o dominio del API, hay que **reconstruir** la imagen del frontend. Más detalle en **[DEW](dew.md)**.

## Git

- Rama y commits por función o área (**backend**/ **frontend**/ **tests**/ **docs**) con mensajes claros en español o inglés, según convención del equipo.
- No commitear `backend/.env` ni ficheros `.env*` con secretos reales.

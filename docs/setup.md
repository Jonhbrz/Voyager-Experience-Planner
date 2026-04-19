# Entorno e instalación

Esta guía describe cómo preparar el proyecto **PRW-VEP** (Voyager Experience Planner) para desarrollo o pruebas locales.

---

## Requisitos

### Para desarrollo con Docker (recomendado)

- **Docker Engine** y **Docker Compose** v2
- Navegador actual
- (Opcional) **Git**

### Para desarrollo nativo (sin contenedores de app)

| Componente | Versión orientativa |
|------------|---------------------|
| **PHP** | 8.3+ (coincide con `composer.json`: `^8.3`) |
| **Composer** | 2.x |
| **Node.js** | 20.19+ o ≥ 22.12 (`engines` en `frontend/package.json`) |
| **npm** | Incluido con Node |
| **PostgreSQL** | 15 (alineado con la imagen `postgres:15` del compose) |

---

## Estructura del repositorio

```
PRW-VEP/
├── backend/          # Laravel (API)
├── frontend/         # Vue 3 + Vite (SPA)
├── nginx/            # default.conf — proxy SPA + PHP
├── docker-compose.yml
├── mkdocs.yml
└── docs/             # Esta documentación
```

Para **clonar**, **ramas**, **commits** y buenas prácticas con Git/GitHub, consulta la guía [Control de versiones (Git y GitHub)](version-control.md).

---

## Instalación con Docker Compose

### 1. Clonar y situarse en la raíz

```bash
git clone <url-del-repositorio> PRW-VEP
cd PRW-VEP
```

### 2. Variables de entorno del backend

En la carpeta `backend/`:

- Copia `.env.example` a `.env` si aún no existe.
- Ajusta, como mínimo, coherencia con PostgreSQL del compose:
  - `DB_CONNECTION=pgsql`
  - `DB_HOST=postgres` (nombre del servicio en Docker)
  - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` alineados con `POSTGRES_*` del `docker-compose.yml`

El fichero `backend/.env` se monta en el contenedor como `env_file` opcional; las variables críticas también pueden definirse vía `environment` del servicio `backend` en `docker-compose.yml`.

### 3. Arrancar servicios

```bash
docker compose up -d --build
```

Servicios definidos:

| Servicio | Rol |
|----------|-----|
| **postgres** | Base de datos PostgreSQL |
| **backend** | PHP-FPM + Laravel |
| **frontend** | Imagen con build estático de la SPA (servido en puerto interno 80) |
| **nginx** | Punto de entrada HTTP (`HTTP_PORT`, por defecto **8000** en el host) |

### 4. Migraciones y (opcional) datos

Con el backend en marcha:

```bash
docker compose exec backend php artisan migrate --force
```

Si existen seeders relevantes para tu entorno:

```bash
docker compose exec backend php artisan db:seed
```

### 5. Acceso

- Aplicación (SPA + API bajo el mismo origen): `http://localhost:8000` (o el valor de `HTTP_PORT`).

La API queda bajo el prefijo **`/api`** (ver `nginx/default.conf`).

---

## Instalación nativa (referencia)

### Backend

```bash
cd backend
composer install
cp .env.example .env   # si aplica
php artisan key:generate
# Configurar DB_* en .env hacia tu PostgreSQL local
php artisan migrate
php artisan serve      # opcional; en producción suele ir detrás de PHP-FPM
```

### Frontend

```bash
cd frontend
npm ci
```

Crea `frontend/.env` o `.env.local` con la URL del API, por ejemplo:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Desarrollo con recarga en caliente:

```bash
npm run dev
```

Build de producción:

```bash
npm run build
```

---

## Comandos útiles de calidad

| Ubicación | Comando | Descripción |
|-----------|---------|-------------|
| `frontend/` | `npm run lint` | ESLint + Oxlint |
| `frontend/` | `npm run type-check` | `vue-tsc` |
| `backend/` | `php artisan test` | PHPUnit |

---

## Problemas frecuentes

!!! note "Puerto 8000 ocupado"
    Cambia `HTTP_PORT` en el entorno de Compose o en `.env` a nivel de host, según cómo lances Docker.

!!! note "CORS / URL del API en el front"
    El `baseURL` de Axios se toma de `VITE_API_BASE_URL` o por defecto `/api`. En Docker unificado, las peticiones van al mismo origen; en desarrollo mixto (Vite en un puerto, API en otro) debes alinear la variable y la configuración CORS de Laravel (`config/cors.php`).

---

## Referencias cruzadas

- Control de versiones (Git, GitHub, flujo de trabajo): [Control de versiones](version-control.md)
- Arquitectura general: [Arquitectura](architecture.md)
- Despliegue detallado: [Despliegue](deployment.md)

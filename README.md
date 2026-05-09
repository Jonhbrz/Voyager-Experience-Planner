# Voyager Experience Planner

Aplicación web full-stack para la **planificación de viajes**: crear, gestionar y visualizar itinerarios dinámicos por días, con actividades, transportes, estancias y control de gasto estimado.

Stack: **Vue 3 + TypeScript + Vite** (frontend), **Laravel 12 + PHP 8.4** (API REST con Sanctum), **PostgreSQL 15**, **Docker Compose** y **Portainer** para el despliegue, **GitHub Actions** para CI/CD y **MkDocs Material** publicado en **GitHub Pages**.

## Documentación

La documentación del proyecto vive en la carpeta [`docs/`](docs/):

| Documento | Contenido |
|-----------|-----------|
| [**Despliegue (DPL)**](docs/dpl.md) | Docker (`dev`, `prod`, `portainer`), puertos, variables (`dev.env` / `prod.env` / `portainer.env`), seed del superadmin, CI/CD y GitHub Pages |
| [**Backend (DSW)**](docs/dsw.md) | API Laravel, NGINX/PHP-FPM, Sanctum, lógica de negocio |
| [**Frontend (DEW)**](docs/dew.md) | Vue + Vite + TS, SFC, Composition API, Pinia, Router, composables, slots, integración con la API |
| [**Interfaces (DOR)**](docs/dor.md) | Responsive, WCAG, Bootstrap utilities, paleta y usabilidad |
| [**Sistema de gestión (SSG)**](docs/ssg.md) | Gestión de usuarios, formularios y paneles de control |
| [**Empleabilidad (IPW)**](docs/ipw.md) | Plan de marketing y plan de sostenibilidad |
| [**Sostenibilidad (SOJ)**](docs/soj.md) | ODS y matriz de materialidad |
| [**Uso de la aplicación**](docs/usage.md) | Guía para usuario final |
| [**Índice general**](docs/index.md) | Mapa del resto de secciones |

Para generar el sitio con MkDocs en local: `pip install mkdocs mkdocs-material` y `mkdocs serve` (configuración en `mkdocs.yml`). El sitio publicado se actualiza automáticamente en **GitHub Pages** mediante `.github/workflows/deploy-docs.yml`.

## Arranque rápido con Docker

Desde la raíz del repositorio:

```powershell
# Desarrollo (Vite HMR + API en puertos alternativos)
docker compose -f docker-compose.dev.yml up --build

# Ensayo tipo producción (build estático + preview)
docker compose -f docker-compose.prod.yml up --build

# Despliegue gestionado en Portainer (segundo entorno diferenciado)
docker compose -f docker-compose.portainer.yml --env-file portainer.env up --build
```

URLs y detalles (`DB_HOST`, `VITE_API_BASE_URL`, seeders, puertos, variables) en [**docs/dpl.md**](docs/dpl.md).

# Voyager-Experience-Planner

Aplicación web full-stack para la planificación de viajes, diseñada para crear, gestionar y visualizar itinerarios dinámicos. Permite organizar días, actividades y destinos de forma intuitiva, rápida e interactiva.

## Documentación

La documentación del proyecto vive en la carpeta [`docs/`](docs/). En GitHub puedes abrirla directamente:

| Documento | Contenido |
|-----------|-----------|
| [**Despliegue (DPL)**](docs/dpl.md) | Docker (`docker-compose.yml`, dev, prod), puertos, variables, seed del superadmin |
| [**Backend (DSW)**](docs/dsw.md) | API Laravel, Sanctum, lógica de negocio |
| [**Frontend (DEW)**](docs/dew.md) | Vue, Vite, Pinia, integración con la API |
| [**Índice general**](docs/index.md) | Mapa del resto de secciones (uso, diseño, etc.) |

Para generar el sitio con MkDocs: `pip install mkdocs mkdocs-material` y `mkdocs serve` (configuración en `mkdocs.yml`).

## Arranque rápido con Docker

Desde la raíz del repositorio:

```powershell
# Desarrollo (Vite HMR + API en puertos alternativos)
docker compose -f docker-compose.dev.yml up --build

# Ensayo tipo producción (build + preview)
docker compose -f docker-compose.prod.yml up --build
```

URLs y detalles (`DB_HOST`, `VITE_API_BASE_URL`, seed, etc.) están en [**docs/dpl.md**](docs/dpl.md).

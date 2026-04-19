# Arquitectura del sistema

Este documento describe la arquitectura lógica y física del **Voyager Experience Planner (PRW-VEP)** y cómo interactúan sus capas.

---

## Visión general

El sistema sigue un patrón **cliente–servidor** clásico para aplicaciones web modernas:

1. El **navegador** ejecuta una **SPA** (Single Page Application) construida con **Vue 3**.
2. La SPA consume una **API REST** implementada en **Laravel**, autenticada con **tokens Bearer** (Laravel Sanctum).
3. Laravel persiste el estado en **PostgreSQL**.
4. **NGINX** actúa como **único punto de entrada HTTP** en el entorno Docker: sirve la SPA por proxy inverso y enruta las peticiones PHP hacia **PHP-FPM**.

```
[Navegador + Vue SPA] ──HTTP──► [NGINX :80]
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               │
              [frontend:80]   [PHP-FPM backend]    │
               (estáticos)         │               │
                                    ▼               │
                             [PostgreSQL:5432] ◄────┘
```

Los nombres de servicio en Docker son `frontend`, `backend`, `postgres` y `nginx` (ver `docker-compose.yml`).

---

## Flujo de una petición típica

### Carga inicial de la aplicación

1. El usuario abre `http://localhost:8000` (o el host/puerto configurado).
2. NGINX envía la petición `GET /` al servicio **frontend** (contenedor que sirve los ficheros estáticos del build de Vite).
3. El navegador descarga HTML, JS y CSS; Vue Router toma el control en el cliente.

### Login y datos privados

1. El usuario envía credenciales a `POST /api/login`.
2. NGINX enruta `/api` al **document root** de Laravel (`public/`) y las peticiones PHP a **FastCGI** (`backend:9000`).
3. Laravel valida credenciales y devuelve un **token** Sanctum.
4. El cliente guarda el token (p. ej. `localStorage`) y lo adjunta en cabecera `Authorization: Bearer …` en peticiones posteriores (interceptor Axios).

### Lectura de un viaje

1. La SPA llama a `GET /api/trips/{id}` con el token.
2. Laravel aplica middleware `auth:sanctum`, resuelve el viaje y comprueba **pertenencia al usuario** (política de recursos propios).
3. Se cargan relaciones anidadas (días → actividades, transportes, estancias) vía Eloquent y se serializan a JSON (API Resources).

---

## Separación de responsabilidades

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación | Vue 3, componentes, Pinia | UI, validación UX, estado de sesión cliente, llamadas HTTP |
| API | Laravel controladores + Form Requests + Resources | Reglas de negocio servidor, autorización, validación, formato JSON |
| Datos | Eloquent ORM + PostgreSQL | Integridad referencial, persistencia |
| Entrega | NGINX | TLS terminación (si se configura), cabeceras de seguridad, enrutado estático vs PHP |

---

## Seguridad en el perímetro (NGINX)

El fichero `nginx/default.conf` incluye cabeceras como:

- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, etc.

La API bajo `/api` usa el prefijo `^~` para prioridad sobre otras ubicaciones. El endpoint Laravel `/up` se expone para comprobaciones de salud.

---

## Escalabilidad y límites

- La SPA es **stateless** respecto al servidor salvo el token; el escalado horizontal del API implica sesiones/token store coherentes (tabla `personal_access_tokens` en base de datos por defecto).
- El índice de viajes puede paginarse (`per_page` en `TripController@index`) para listas grandes.

---

## Referencias

- Instalación: [Entorno e instalación](setup.md)
- API detallada: [Backend (Laravel)](backend.md)
- Despliegue: [Despliegue](deployment.md)

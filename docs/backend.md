# Backend (Laravel)

API del **Voyager Experience Planner** en `backend/`, framework **Laravel 13** con **PHP 8.3+**.

---

## Estructura relevante

| Ruta | Contenido |
|------|-----------|
| `routes/api.php` | Definición de rutas REST y legacy anotadas |
| `app/Http/Controllers/Api/` | Controladores de dominio |
| `app/Http/Requests/` | Form Requests (validación de entrada) |
| `app/Http/Resources/` | API Resources (forma JSON de salida) |
| `app/Models/` | Eloquent: `User`, `Trip`, `Day`, `Activity`, `Transport`, `Stay` |
| `app/Http/Controllers/Api/Concerns/` | Traits reutilizables (p. ej. autorización de recursos propios) |
| `database/migrations/` | Esquema evolutivo de PostgreSQL |
| `tests/Feature/Api/` | Pruebas de API (PHPUnit) |

---

## API REST

Todas las rutas bajo el prefijo **`/api`** (sin versión en URL en el estado actual del proyecto).

### Autenticación pública

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/register` | Alta de usuario + emisión de token Sanctum |
| `POST` | `/api/login` | Login; limitado por `throttle:5,1` (intentos por minuto) |

### Rutas protegidas (`auth:sanctum`)

Requieren cabecera:

```http
Authorization: Bearer {token}
```

Ejemplos de recursos (no exhaustivo; ver `routes/api.php`):

| Recurso | Patrón | Notas |
|---------|--------|--------|
| Viajes | `GET/POST /api/trips`, `GET/PUT/PATCH/DELETE /api/trips/{id}` | `apiResource` con parámetro `{id}` |
| Días | `apiResource('days')` excepto `store` | Alta por rutas dedicadas `POST /api/days`, `POST /api/trips/{tripId}/days` |
| Actividades | `apiResource('activities')` excepto `store` | Alta: `POST /api/activities`, `POST /api/days/{dayId}/activities` |
| Transportes | CRUD + `POST /api/days/{dayId}/transports` | |
| Estancias | CRUD + `POST /api/days/{dayId}/stays` | |
| Sesión | `POST /api/logout` | Revoca el token actual |

Existe ruta **`OPTIONS {any}`** para preflight CORS.

---

## Controladores

Cada controlador encapsula la lógica HTTP de su agregado:

- **`TripController`**: listado (opcionalmente paginado con `per_page`), detalle, creación con **generación automática de días** entre `start_date` y `end_date`, actualización y borrado.
- **`DayController`**, **`ActivityController`**, **`TransportController`**, **`StayController`**: CRUD y anidación por día/viaje según rutas.
- **`AuthController`**: registro, login, logout.

Los listados de viajes suelen usar **`with()`** selectivo de columnas para reducir payload y consultas N+1.

---

## Validación

Las peticiones mutables pasan por **Form Requests** de Laravel (`StoreTripRequest`, `UpdateTripRequest`, `StoreActivityRequest`, etc.) con reglas declarativas (`rules()`).

Ventajas:

- Validación centralizada y testeable.
- Respuestas 422 coherentes con errores por campo.

---

## Autenticación y autorización

### Laravel Sanctum

- Tras login o registro se emite un **personal access token** (nombre interno p. ej. `auth_token`) con caducidad configurada en código (p. ej. 7 días en `AuthController`).
- El middleware `auth:sanctum` protege las rutas de negocio.

### Propiedad de datos

El trait **`AuthorizesOwnedApiResources`** (y lógica equivalente en controladores) garantiza que un usuario solo opera sobre **viajes y entidades hijas que le pertenecen** (`user_id` en `trips`).

---

## Formato de respuesta

El controlador base define `successResponse` con esta forma JSON:

```json
{
  "success": true,
  "data": { }
}
```

El código HTTP acompaña la operación (`200`, `201`, etc.). El frontend debe leer el cuerpo según este contrato (o la capa de servicio que lo adapte).

---

## Tests

En `tests/Feature/Api/` hay pruebas que cubren flujos de API (autenticación, viajes, días, transportes, estancias, etc.). Ejecutar:

```bash
cd backend && php artisan test
```

---

## Referencias

- Modelo de datos: [Base de datos](database.md)
- Rutas y proxy: [Arquitectura](architecture.md) y [Despliegue](deployment.md)

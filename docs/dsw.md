# DSW — Backend (servidor)

## Cumplimiento de criterios DSW

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se ha utilizado **NGINX** como servidor de aplicación? | **Sí**. En el stack integrado (`docker-compose.yml` raíz) NGINX (`nginx/default.conf`) actúa como reverse proxy y front controller hacia **PHP-FPM** del backend (`fastcgi_pass backend:9000`) y hacia el contenedor del frontend; añade además cabeceras de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-XSS-Protection`, `Cross-Origin-Opener-Policy`). En los stacks `dev`/`prod`/`portainer` se sirve la API directamente con `php artisan serve` para iteración rápida. |
| ¿Se ha utilizado **PHP** como backend? | **Sí**. PHP **8.4-fpm** (imagen `php:8.4-fpm` en `backend/Dockerfile`) con extensiones `pdo_pgsql`, `opcache`, `mbstring`, `bcmath`, `tokenizer`. |
| ¿Han utilizado **Laravel**? | **Sí**. Laravel **12** (`laravel/framework: ^12.0` en `backend/composer.json`), Sanctum **4**, Tinker **3** y `barryvdh/laravel-dompdf` para PDF. |
| ¿Se ha realizado la implementación de una **API REST** (PHP/Laravel)? | **Sí**. Rutas REST bajo el prefijo **`/api`** en `routes/api.php` con `Route::apiResource(...)` para `trips`, `days`, `activities`, `transports`, `stays`; respuestas JSON; auth por **Sanctum** (Bearer token); validación con Form Requests; recursos serializados con `JsonResource`. |

## Arquitectura

| Área | Ubicación |
|------|-----------|
| Rutas API | `routes/api.php` |
| Controladores API | `app/Http/Controllers/Api/` |
| Autenticación (adaptación API de Breeze) | `app/Http/Controllers/Auth/` |
| Perfil | `app/Http/Controllers/ProfileController.php` |
| Form Requests | `app/Http/Requests/` |
| Middleware rol admin | `app/Http/Middleware/EnsureSuperadmin.php`, alias `superadmin` |
| Trait de autorización por propiedad | `app/Http/Controllers/Api/Concerns/AuthorizesOwnedApiResources.php` |
| Servicios de negocio | `app/Services/PremiumUpgradeService`, `app/Services/PremiumDowngradeService` |
| Caché de API | `app/Support/ApiCache.php` |
| Migraciones / seeders | `database/migrations/`, `database/seeders/DatabaseSeeder.php` |

Las rutas en `routes/api.php` están organizadas en tres bloques:

1. **Públicas** (sin token): `POST /register`, `POST /login` (con `throttle:5,1`), `POST /forgot-password`, `POST /reset-password`.
2. **Zona usuario** (con `auth:sanctum`): `/user`, `/logout`, `/profile`, `/upgrade`, `/downgrade`, `/payment/simulate`, `/invoices`, `/invoices/{id}/pdf`, y los recursos REST `trips`, `days`, `activities`, `transports`, `stays`.
3. **Zona superadmin** (`prefix('admin')` + middleware `superadmin`): `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/{user}/plan`, `/api/admin/users/{user}` (DELETE), `/api/admin/invoices`.

## Autenticación

- **Sanctum**: rutas protegidas con `Authorization: Bearer {token}` emitido en `/api/login`.
- **Sesiones Laravel**: la SPA no usa sesión cookie por defecto en Axios; las rutas heredadas de Breeze se han adaptado para devolver JSON y trabajar contra el cliente Axios.

## Roles y planes (`users`)

| Campo | Valores |
|-------|---------|
| `role` | `superadmin`, `user` |
| `plan` | `free`, `premium` |

- Middleware **`EnsureSuperadmin`**: protege las rutas `/api/admin/*`.
- Propiedad de recurso: trait **`AuthorizesOwnedApiResources`** (helpers `findTripForUserOrAbort`, `findDayForUserOrAbort`, etc.) — un `user` solo accede a sus propios trips/días/actividades/transportes/estancias; el `superadmin` los ve todos.

### Seeder y contraseñas

- **`database/seeders/DatabaseSeeder.php`** crea o actualiza el superadmin **`jonathanborza02@gmail.com`** con contraseña **`123456`** y plan `premium`. No se ejecuta automáticamente al levantar contenedores: hay que lanzar `php artisan db:seed` cuando corresponda (comandos en **[DPL](dpl.md)**).
- El modelo **`User`** declara cast **`password ⇒ 'hashed'`**: al persistir, Laravel hashea el valor. Por eso, en el seeder debe usarse la contraseña en **texto plano** (`'123456'`), no `Hash::make(...)`, para evitar doble hash y fallos de login (`422` / mensaje de credenciales incorrectas).

## Lógica de negocio implementada

### Viajes (`TripController`)

- **`POST /api/trips`**: crea viaje con validación `StoreTripRequest` (`name`, `description`, `start_date`, `end_date` formato `Y-m-d`; `end_date ≥ start_date`).
- Asignación de **`user_id`** del usuario autenticado.
- Generación automática de **días** en BD para el intervalo `start_date`–`end_date`.
- **Plan free**: máximo **3 viajes** por usuario; cuarta creación → **403** JSON con mensaje fijo.
- **Premium**: sin tope.
- **Superadmin**: ignora el límite (`User::isAdmin()`).
- Respuesta de creación **`201`**: `{ success, message: "Viaje creado correctamente.", data }` (trip con relaciones cargadas mediante `TripResource`).
- **`GET /api/trips`**: resultado cacheado con TTL corto (`ApiCache::userTripsKey`); invalidación en crear/editar/borrar viaje y en cambios de plan.

### Suscripción (`SubscriptionController` + servicios)

- **`PremiumUpgradeService`**: solo desde `plan === free`; pasa a `premium`, crea **`Invoice`** (importe en céntimos `999`), invalida `ApiCache::forgetAdminStats()` y `forgetUserTrips($user)`.
- **`PremiumDowngradeService`**: solo desde `premium`; pasa a `free`, log `plan.downgrade`; mismas invalidaciones de caché.
- Endpoints: `POST /api/upgrade` y `POST /api/downgrade` (ambos con `throttle:5,1`).

### Pago simulado (`PaymentController`)

- **`POST /api/payment/simulate`** con `method`: `card` | `transfer` y objeto **`payment_data`** según método (validación con `Request::validate()`):
  - **Tarjeta:** titular, número, expiración, CVV.
  - **Transferencia:** IBAN, titular, cantidad.
- Reusa `PremiumUpgradeService` para la transición a premium y la generación de la factura.

### Facturas y PDF

- **`UserInvoiceController`**: **`GET /api/invoices`** lista facturas del usuario actual.
- **`InvoicePdfController`**: **`GET /api/invoices/{invoice}/pdf`** descarga el PDF (DomPDF) si la factura es del usuario o el actor es `superadmin`.
- **`AdminController`**: estadísticas con caché corta (`ApiCache::adminStatsKey`), usuarios con `withCount('trips')`, listado global de facturas.

### Días, actividades, transportes y estancias

- `DayController`, `ActivityController`, `TransportController`, `StayController` exponen CRUD bajo `apiResource` con **renombrado de parámetro a `{id}`** y endpoints anidados de creación (`POST /trips/{tripId}/days`, `POST /days/{dayId}/activities`, etc.).
- Validaciones por Form Request (ej. `prepareForValidation` normaliza horas `9:30 → 09:30` antes de `date_format:H:i`).

## Validación y Form Requests

- Viajes: `StoreTripRequest` / `UpdateTripRequest`; atributos en español en `attributes()` cuando aplica (`StoreTripRequest`).
- Actividades: `StoreActivityRequest` / `UpdateActivityRequest`.
- Errores API: `ValidationException` renderizada como JSON en `bootstrap/app.php` con `success: false`, `errors`; **403 HTTP** para mensajes de `abort(...)` configurados ahí mismo.

## Caché

- Claves en **`App\Support\ApiCache`**: `admin:stats`, `user:{id}:trips`.
- Invalidación en operaciones que afecten al cómputo de KPIs admin o a la lista de viajes del usuario (incluye operaciones sobre días/actividades/transportes/estancias y cambios de plan).

## Base de datos (tablas nucleares)

- **`users`**: incluye `role`, `plan`.
- **`trips`**, **`days`**, **`activities`**, **`transports`**, **`stays`**: modelo viaje jerárquico (un viaje agrupa días; cada día puede tener actividades, transportes y estancias).
- **`invoices`**: `user_id`, `amount`, `plan`, `created_at` (no se borran viajes en downgrade).
- **`personal_access_tokens`**: tokens Sanctum.

## Despliegue del backend

| Stack | Mecanismo | Servidor HTTP |
|-------|-----------|---------------|
| `docker-compose.dev.yml` | `php artisan serve --no-reload` (bind del código + composer al arrancar si falta vendor) | Servidor embebido de Laravel |
| `docker-compose.prod.yml` | `php artisan serve --no-reload` (imagen con `composer install --no-dev` en build, `migrate --force` y `config:cache` al arrancar) | Servidor embebido de Laravel |
| `docker-compose.portainer.yml` | Igual que dev, pero parametrizado por variables (`portainer.env`) | Servidor embebido de Laravel |
| `docker-compose.yml` (integrado) | **PHP-FPM** detrás de **NGINX** (`nginx/default.conf`) | NGINX → PHP-FPM (`backend:9000`) |

Detalles de puertos, volúmenes y comandos en **[DPL](dpl.md)**.

## Tests

Tests de características API en `tests/Feature/Api/` (auth, viajes, límites de plan free, admin, suscripciones, facturas/PDF). Comando típico: `php artisan test`. El workflow `ci.yml` los ejecuta sobre SQLite en memoria con `.env.example`.

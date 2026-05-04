# DSW — Backend (servidor)

API REST Laravel bajo el prefijo `/api`; respuestas JSON. Las vistas Blade no forman parte del uso habitual del cliente SPA.

## Arquitectura

| Área | Ubicación |
|------|-----------|
| Rutas | `routes/api.php` |
| Controladores API | `app/Http/Controllers/Api/` |
| Autenticación (adaptación API de Breeze) | `app/Http/Controllers/Auth/` |
| Perfil | `app/Http/Controllers/ProfileController.php` |
| Form Requests | `app/Http/Requests/` |
| Middleware rol admin | `app/Http/Middleware/EnsureSuperadmin.php`, alias `superadmin` |

Las rutas registradas OPTIONS/`auth:sanctum` están ordenadas en `api.php`: públicas (login, registro, reset password); zona usuario (`upgrade`, `downgrade`, `payment/simulate`, facturas propias, CRUD viajes/días/actividades…); prefijo `superadmin` para `/api/admin/*`.

## Autenticación

- **Sanctum**: rutas protegidas con `Authorization: Bearer {token}`.
- **Sesiones Laravel**: sin usar SPA típicamente en llamadas desde Axios (`routes/auth/*.php` adaptadas como estado sin vistas Blade cliente pesadas donde aplique).

## Roles y planes (`users`)

| Campo | Valores |
|-------|---------|
| `role` | `superadmin`, `user` |
| `plan` | `free`, `premium` |

- Middleware **`EnsureSuperadmin`**: rutas `/api/admin/*`.
- Propiedad de recurso: trait **`AuthorizesOwnedApiResources`** (trips/días/actividades solo si pertenecen al usuario).

### Seeder y contraseñas

- **`database/seeders/DatabaseSeeder.php`** crea o actualiza el superadmin **`jonathanborza02@gmail.com`** con contraseña **`123456`** y plan premium. No se ejecuta solo al levantar contenedores: hay que lanzar `php artisan db:seed` cuando corresponda (comandos en **[DPL](dpl.md)**).
- El modelo **`User`** declara cast **`password` ⇒ `hashed`**: al persistir, Laravel hashea el valor. Por tanto, en el seeder debe usarse la contraseña en **texto plano** (`'123456'`), no `Hash::make(...)`, para evitar doble hash y fallos de login (`422` / mensaje de credenciales incorrectas).

## Lógica de negocio implementada

### Viajes (`TripController`)

- **`POST /api/trips`**: crea viaje con validación `StoreTripRequest` (`name`, `description`, `start_date`, `end_date` formato `Y-m-d`; fin ≥ inicio).
- Asignación **`user_id`** del usuario autenticado.
- Generación automática de **días** en BD para el intervalo fecha inicio–fin.
- **Plan free**: máximo **3 viajes**. Comprobación con `Trip::where('user_id', …)->count()` **≥ 3** ⇒ `403` con mensaje fijo acordado.
- **Premium**: sin ese tope en creación.
- **`superadmin`**: sin límite aunque el plan sea `free` (`User::isAdmin()`).
- Respuesta creación **`201`**: `{ success, message: "Viaje creado correctamente.", data }` (trip con relaciones cargadas mediante `TripResource`).
- **`GET /api/trips`**: resultado cacheado con TTL corto (`ApiCache::userTripsKey`). Invalidación al crear/editar/borrar viaje.

### Suscripción (`SubscriptionController` + servicios)

- **`PremiumUpgradeService`**: solo desde `plan === free`; pasa a `premium`, crea **`Invoice`** (importe en céntimos 999), `ApiCache::forgetAdminStats()` y **`forgetUserTrips`** del usuario.
- **`PremiumDowngradeService`**: solo desde `premium` a `free`; log `plan.downgrade`; mismas invalidaciones de caché pertinentes (stats + lista viajes usuario).
- Endpoints: `POST /api/upgrade`, `POST /api/downgrade` (throttle en rutas configuradas).

### Pago simulado (`PaymentController`)

- **`POST /api/payment/simulate`** con `method`: `card` \| `transfer` y objeto **`payment_data`** según método (validación con **`Request::validate()`** en **`PaymentController`**, reglas diferenciadas tarjeta vs transferencia): titular/número/expiry/CVV; transferencia IBAN/titular/cantidad.
- Misma transición a premium que el upgrade (reutiliza **`PremiumUpgradeService`**).

### Facturas y PDF

- **`UserInvoiceController`**: **`GET /api/invoices`** lista facturas donde `user_id` = usuario actual.
- **`InvoicePdfController`**: **`GET /api/invoices/{invoice}/pdf`**: descarga PDF (DomPDF) si el invoice es del usuario **o** el actor es **`superadmin`**.
- **`AdminController`**: estadísticas cacheadas cortas (`ApiCache`), usuarios con `withCount('trips')`, listado global de invoices para admin.

## Validación y Form Requests

- Viajes: `StoreTripRequest` / `UpdateTripRequest`; atributos en español en `attributes()` donde aplica (`StoreTripRequest`).
- Actividades: `StoreActivityRequest` / `UpdateActivityRequest`; **`prepareForValidation`** normaliza horas tipo `9:30` → `09:30` antes de **`date_format:H:i`**.
- Errores API: **`ValidationException`** renderizada JSON en `bootstrap/app.php` con `success: false`, `errors`; **403 HTTP** para mensajes de `abort(...)` configurados ahí mismo.

## Caché

- Claves en **`App\Support\ApiCache`**: `admin:stats`, `user:{id}:trips`.
- Invalidación en creación/edición/eliminación de viajes/días/actividades relacionadas transportes/estancias; también tras cambios de plan (upgrade/downgrade servicios).

## Base de datos (tablas nucleares)

- **`users`**: incluye `role`, `plan`.
- **`trips`**, **`days`**, **`activities`**, **`transports`**, **`stays`**: modelo viaje jerárquico.
- **`invoices`**: `user_id`, `amount`, `plan`, `created_at` (sin teardown de viajes en downgrade).

## Tests

Tests de características API en **`tests/Feature/Api/`** (auth, viajes, límites free, admin, suscripciones, facturas/PDF). Comando típico: `php artisan test` (o vía contenedor si se usa Docker).

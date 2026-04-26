# DSW - Desarrollo en Servidor

## Backend Laravel API

El servidor está desarrollado con **Laravel** como API REST bajo `/api`. No renderiza vistas para la aplicación principal: la interfaz la proporciona Vue y Laravel responde en JSON.

Elementos principales:

- `routes/api.php`: rutas públicas, rutas autenticadas y rutas de administración.
- `app/Http/Controllers`: controladores de autenticación, perfil, viajes, suscripción y administración.
- `app/Http/Middleware/EnsureSuperadmin.php`: middleware para proteger el panel admin.
- `app/Http/Requests`: validación de formularios y operaciones sensibles.
- `app/Models`: modelos Eloquent y relaciones de base de datos.

## Autenticación y Autorización

La autenticación usa **Laravel Sanctum** con tokens Bearer. Breeze se adaptó a API para login, registro, logout y recuperación de contraseña desde la SPA.

La autorización se basa en:

- `auth:sanctum` para rutas privadas.
- `role = superadmin` para rutas `/api/admin/*`.
- Comprobaciones de propiedad para que cada usuario gestione solo sus viajes.

## Lógica Implementada

### Viajes

El usuario crea viajes con fechas de inicio y fin. Al crear un viaje, Laravel genera automáticamente los días del intervalo.

### Planes Free/Premium

Los usuarios tienen un campo `plan`:

- `free`: máximo 3 viajes.
- `premium`: viajes ilimitados.

El límite se aplica en backend al crear viajes, por lo que no depende solo del frontend.

### Roles

Los usuarios tienen un campo `role`:

- `user`: uso normal de la aplicación.
- `superadmin`: acceso al panel de administración.

El usuario `jonathanborza02@gmail.com` se asigna como `superadmin` y `premium` de forma segura mediante migración/seeder.

### Suscripciones e Invoices

`POST /api/upgrade` cambia el plan del usuario a Premium y crea una invoice simulada. El endpoint está autenticado y limitado con `throttle`.

### Administración

El backend expone endpoints para:

- Listar usuarios.
- Cambiar plan.
- Eliminar usuarios, evitando que el admin se borre a sí mismo.
- Listar invoices.
- Obtener estadísticas: usuarios, planes, viajes y revenue simulado.

## Validación

Se usan Form Requests y validación Laravel para:

- Login y registro.
- Perfil.
- Cambio de contraseña con contraseña actual.
- Creación/edición de viajes y elementos asociados.
- Cambio de plan desde admin.

Las respuestas de error se devuelven como JSON con código 422 o 403 según corresponda.

## Base de Datos

Tablas principales:

- `users`: usuario, email, contraseña, `role`, `plan`.
- `personal_access_tokens`: tokens Sanctum.
- `trips`: viajes del usuario.
- `days`: días de cada viaje.
- `activities`, `transports`, `stays`: elementos planificados.
- `invoices`: importes simulados de upgrades a Premium.

Relación principal: un usuario tiene muchos viajes y muchas invoices; un viaje tiene días; cada día puede tener actividades, transportes y estancias.

## Pruebas

El backend incluye tests de API para:

- Autenticación.
- Límites del plan Free.
- Gestión de viajes.
- Upgrade a Premium.
- Panel admin.
- Recuperación de contraseña.

Comando usado para verificación: `docker compose exec backend php artisan test`.
# DSW - Desarrollo en Servidor

## Arquitectura Laravel API

El backend está implementado con **Laravel** como API REST JSON bajo el prefijo `/api`. La aplicación no depende de vistas Blade para la interfaz: Laravel expone datos y operaciones, y la SPA Vue consume esos endpoints mediante Axios.

La estructura principal se divide en:

- **Rutas** en `routes/api.php`, agrupadas por autenticación y por rol.
- **Controladores** en `app/Http/Controllers`, separados entre autenticación, perfil, suscripciones, administración y recursos de viaje.
- **Modelos Eloquent** para `User`, `Trip`, `Day`, `Activity`, `Transport`, `Stay` e `Invoice`.
- **Middleware** para proteger rutas sensibles, como `auth:sanctum` y `superadmin`.
- **Form Requests** para validar entradas complejas y mantener los controladores limpios.

## Controladores, Middleware y Rutas

Las rutas públicas gestionan login, registro y recuperación de contraseña. Las rutas protegidas requieren token Sanctum:

- `GET/POST /api/trips` y recursos relacionados.
- `GET/PATCH /api/profile`.
- `POST /api/upgrade`.
- `GET /api/admin/*` para administración.

El middleware `superadmin` restringe el panel administrativo a usuarios con rol `superadmin`. Esto evita que usuarios estándar accedan a listados globales, invoices o acciones de gestión.

## Autenticación con Sanctum y Breeze Adaptado

Laravel Breeze se adaptó a una arquitectura API. En lugar de sesiones Blade, el backend devuelve tokens de Sanctum al iniciar sesión o registrarse. La SPA guarda el token y lo envía en la cabecera:

```http
Authorization: Bearer {token}
```

También se implementó recuperación de contraseña API-first: Laravel genera el enlace, pero apunta a la ruta Vue `/reset-password` con `token` y `email` en query params.

## Lógica de Negocio

### Límite del Plan Free

El plan `free` permite crear hasta 3 viajes. La restricción se aplica en el backend dentro de la creación de viajes, por lo que no depende solo de la interfaz:

- Usuario `free`: máximo 3 viajes.
- Usuario `premium`: viajes ilimitados.
- `superadmin`: no queda limitado aunque esté en plan Free.

### Sistema de Suscripción

El endpoint `POST /api/upgrade` cambia el plan del usuario autenticado a `premium` y crea una invoice simulada. Este endpoint está autenticado y rate-limited para evitar abuso.

### Control Administrativo

El panel admin usa endpoints protegidos para:

- Listar usuarios.
- Cambiar planes.
- Eliminar usuarios con protección contra auto-eliminación.
- Consultar invoices.
- Consultar estadísticas agregadas del sistema.

## Validación con Form Requests

La validación se centraliza en Form Requests cuando la entrada tiene reglas relevantes:

- Actualización de perfil.
- Cambio de contraseña con contraseña actual.
- Validación de recursos de viaje.

Esto mantiene los controladores más legibles y garantiza respuestas 422 coherentes para el frontend.

## Estructura de Base de Datos

Las tablas principales son:

- **`users`**: datos de cuenta, `role` (`superadmin`/`user`) y `plan` (`free`/`premium`).
- **`trips`**: viajes del usuario autenticado.
- **`days`**, **`activities`**, **`transports`**, **`stays`**: planificación detallada del viaje.
- **`invoices`**: registros simulados generados al actualizar a Premium.

La migración de suscripción asigna de forma segura `superadmin` y `premium` al usuario `jonathanborza02@gmail.com` si existe, sin modificar otros usuarios.

# DEW - Desarrollo en Cliente

## Frontend Vue SPA

El cliente está desarrollado con **Vue 3**, **TypeScript**, **Vite**, **Pinia** y **Vue Router**. Es una SPA que consume la API Laravel mediante Axios.

Estructura principal:

- `views/`: pantallas completas.
- `components/`: piezas reutilizables.
- `layouts/`: estructura común con navbar, sidebar y contenido.
- `stores/`: estado global con Pinia.
- `services/api.ts`: cliente Axios con token Sanctum.
- `utils/`: helpers de formato, fechas y cálculos.

## Vistas Implementadas

- `DashboardView`: viajes, plan actual, límite Free y upgrade.
- `TripView`: detalle del viaje con días, actividades, transportes y estancias.
- `ProfileView`: actualización de perfil y contraseña.
- `AdminView`: usuarios, planes, invoices y estadísticas.
- Vistas de autenticación: login, registro, recuperación y reset de contraseña.

## Estado con Pinia

`auth.ts` guarda:

- Token de sesión.
- Usuario autenticado.
- Rol (`superadmin` o `user`).
- Plan (`free` o `premium`).
- Acciones de login, registro, logout, perfil y upgrade.

`trips.ts` guarda:

- Lista de viajes.
- Estados de carga.
- Mensajes de éxito/error.
- Operaciones CRUD contra `/api/trips`.

## Rutas y Protección

Vue Router separa:

- Rutas públicas: login, registro y recuperación de contraseña.
- Rutas privadas: dashboard, viaje y perfil.
- Ruta admin: `/admin`, solo si el usuario es `superadmin`.

Si no hay token, se redirige a login. Si no hay rol admin, se vuelve al dashboard.

## Comunicación con API

Axios añade automáticamente el token en cada petición privada:

- Base URL: `/api`.
- Header `Authorization`.
- Limpieza de sesión ante 401.

Así se evita repetir lógica de autenticación en cada componente.

## UI/UX Implementada

La interfaz incluye:

- Badges visuales: `👑 Superadmin`, `💎 Premium`, `🆓 Free`.
- Mensajes de límite para usuarios Free.
- Botón de upgrade a Premium.
- Empty states: “No trips created yet”, “No users found”, “No invoices available yet”.
- Formato monetario reutilizable con helper de moneda.
- Toasts para feedback de éxito/error.
- Botones deshabilitados durante operaciones.

## Panel Admin

`AdminView` muestra:

- Tarjetas de estadísticas.
- Tabla de usuarios.
- Selector de plan.
- Botón para eliminar usuario.
- Tabla de invoices.
- Modal con detalle de invoice.

El frontend no decide permisos críticos: solo oculta o redirige. La protección real está en Laravel.

## Responsive

El layout se adapta con CSS propio:

- Navbar flexible.
- Sidebar colapsable.
- Grids para tarjetas.
- Scroll horizontal en tablas administrativas.

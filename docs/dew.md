# DEW — Frontend (cliente)

SPA **Vue 3** con **TypeScript**, **Vite**, **Pinia** y **Vue Router**. Las llamadas HTTP usan **Axios** (`services/api.ts`) con token Sanctum y manejo global de **401**.

## Estructura

| Carpeta / archivo | Uso |
|-------------------|-----|
| `views/` | Pantallas: dashboard, viaje, perfil, admin, auth |
| `layouts/MainLayout.vue` | Navbar, sidebar de viajes, área principal |
| `components/` | Dashboard, trip, trip layout, toast, etc. |
| `stores/auth.ts` | Sesión, usuario, plan, rol, login/logout, perfil, simulación de pago, downgrade |
| `stores/trips.ts` | Lista de viajes, CRUD, sync, mensajes, colas de reintento en red |
| `services/api.ts` | Cliente Axios base `/api` |
| `services/invoices.ts` | `GET /invoices`, descarga PDF blob |
| `services/admin.ts` | Endpoints `/api/admin/*` + reexport de descarga PDF |
| `router/index.ts` | Rutas; `meta.requiresAuth` / `requiresAdmin`; `fetchProfile` antes de comprobar admin |

## Vistas principales

- **Dashboard (`DashboardView.vue`)**: creación de viaje (formulario fechas + nombre), listado, banner de mejora de plan (solo `free` y no `superadmin`), panel de límite free a 3 viajes, **modal de pago simulado** (Tarjeta / Transferencia con campos y validación básica en cliente), botón **volver a plan free** (solo `premium` y no `superadmin`).
- **Trip (`TripView.vue`)**: detalle con días, actividades, transportes, estancias (subcomponentes y composables bajo `composables/trip/`).
- **Perfil (`ProfileView.vue`)**: datos, contraseña, sección **Mis facturas** (tabla, ver detalle modal, descargar PDF).
- **Admin (`AdminView.vue`)**: estadísticas, usuarios (selector `free`/`premium`, eliminar), facturas globales (ver + descargar PDF).
- **Auth**: login, registro, forgot/reset password.

## Estado (Pinia)

**`auth`**: `user` con `role` y `plan`; `isAdmin` / `isPremium`; `simulatePremiumPayment({ method, payment_data })`, `downgradeToFree`, `fetchProfile`, persistencia en `localStorage` según constantes en `constants/authStorage`.

**`trips`**: `trips[]`, `isLoading`, `isCreatingTrip`, `initialLoadDone`, `syncPendingCount`, `errorMessage`, `successMessage`; `addTrip` envía payload alineado con `StoreTripRequest`; `setError` prioriza **422** `errors` de Laravel luego `message`; Toasts globales vía **`App.vue`** que observa mensajes del store.

## Integración API

- Base URL configurable **`VITE_API_BASE_URL`** o por defecto `/api` (proxy Vite en desarrollo local sin Docker).
- Respuesta creación viaje: usa `message` del JSON si existe para el toast de éxito.
- Errores 403 límite viajes: mensaje mostrado desde cuerpo API.

### Docker (stacks dev / prod)

En **`docker-compose.dev.yml`** el frontend recibe por entorno `VITE_API_BASE_URL=http://localhost:8002/api` (puerto publicado del backend en el host).

En **`docker-compose.prod.yml`** la URL se inyecta en el **build** de la imagen (`VITE_API_BASE_URL=http://localhost:8001/api`). Si cambias dominio o puerto del API, hay que **reconstruir** el servicio frontend (`docker compose ... up --build`). Detalle operativo en **[DPL](dpl.md)**.

## UX implementada (resumen)

- Badges en layout y perfil: **superadmin**, **premium**, **free** (texto acordado en español salvo esas palabras clave).
- Banner y modales con estados **cargando** y botones **deshabilitados** durante procesamiento.
- Textos de interfaz en **español** en flujos principales (formularios, límites, admin, perfil).

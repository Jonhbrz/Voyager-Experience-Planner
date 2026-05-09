# DEW — Frontend (cliente)

SPA **Vue 3** con **TypeScript**, **Vite**, **Pinia**, **Vue Router** y **Axios**. Componentes escritos como **Single File Components (SFC)** con **`<script setup lang="ts">`** (Composition API). Las llamadas HTTP usan `services/api.ts` con token Sanctum y manejo global de **401**.

## Cumplimiento de criterios DEW

| Criterio | Implementación |
|----------|----------------|
| Vue + TypeScript + SFC + Composition API | Todos los `.vue` en `frontend/src` usan `<script setup lang="ts">`. |
| Aplicación no continua (SPA con páginas) | Vue Router en modo `createWebHistory()` con rutas `/login`, `/register`, `/`, `/trip/:id`, `/profile`, `/admin`, etc. |
| Vue Router | `frontend/src/router/index.ts` con guardas `meta.requiresAuth` y `meta.requiresAdmin`. |
| Reactividad: `ref`, `reactive`, `computed` | `ref` en stores y vistas; `reactive` en `ProfileView.vue` (formularios) y `useTripPageContext`; `computed` en `auth.ts` (`isAdmin`, `isPremium`), layouts y componentes. |
| `localStorage` | `stores/auth.ts` (token y usuario), `composables/useTheme.ts` (modo oscuro), `composables/useLastVisitedTrip.ts`. |
| `sessionStorage` | `composables/useSessionStorage.ts` (composable genérico) usado por `useTheme.ts`. |
| `props` / `emits` | `defineProps` y `defineEmits` en `TripSidebarItem`, `TripDayCard`, `TripActivityItem`, `TripList`, `TripActions`, `TripStayForm`, `TripTransportForm`, etc. |
| Pinia | Stores `auth`, `trips`, `layout`, `toast` (`stores/`). |
| Slots | `<slot />` en `layouts/MainLayout.vue` (área de contenido principal donde Vue Router renderiza la vista). |
| Composables | `useTheme`, `useSessionStorage`, `useLastVisitedTrip` y la familia `composables/trip/` (`useTripDays`, `useTripActivities`, `useTripStays`, `useTripTransport`, `useTripForms`, `useTripPageContext`). |

## Estructura

| Carpeta / archivo | Uso |
|-------------------|-----|
| `views/` | Pantallas de la SPA: `DashboardView`, `TripView`, `ProfileView`, `AdminView`, `LoginView`, `RegisterView`, `ForgotPasswordView`, `ResetPasswordView`. |
| `layouts/MainLayout.vue` | Layout con navbar, sidebar de viajes y `<slot />` para el contenido (vistas inyectadas por router). |
| `components/` | Subcarpetas `dashboard/` y `trip/` con SFC reutilizables; `Toast.vue`, `TripSidebarItem.vue`. |
| `composables/` | Lógica reutilizable: tema, last visited trip, session storage genérico y la familia `trip/` para encapsular el estado de la pantalla de viaje. |
| `stores/auth.ts` | Sesión, usuario, plan, rol, login/logout, perfil, simulación de pago, downgrade. |
| `stores/trips.ts` | Lista de viajes, CRUD, sync, mensajes y reintentos. |
| `stores/layout.ts` | Estado del sidebar (colapsado/expandido). |
| `stores/toast.ts` | Cola de notificaciones consumida por `Toast.vue`. |
| `services/api.ts` | Cliente Axios con `baseURL` configurable y *interceptor* de 401. |
| `services/invoices.ts` | `GET /api/invoices` y descarga PDF blob. |
| `services/admin.ts` | Endpoints `/api/admin/*`. |
| `router/index.ts` | Definición de rutas y guardas (`requiresAuth`, `requiresAdmin`, `fetchProfile` antes de comprobar admin). |
| `constants/authStorage.ts` | Claves usadas en `localStorage` para token y usuario. |
| `types/` | Tipos compartidos (`AuthUser`, `Trip`, `PaymentPayload`, etc.). |
| `assets/styles.css` | Estilos globales, variables CSS de tema (claro/oscuro). |

## Vistas principales

- **Dashboard (`DashboardView.vue`)**: creación de viaje (formulario fechas + nombre + descripción), listado, banner de mejora de plan (solo `free` y no `superadmin`), panel de límite free a 3 viajes, **modal de pago simulado** (Tarjeta / Transferencia con campos y validación básica en cliente), botón **volver a plan free** (solo `premium` y no `superadmin`).
- **Trip (`TripView.vue`)**: detalle del viaje con días, actividades, transportes y estancias (subcomponentes y composables bajo `composables/trip/`).
- **Perfil (`ProfileView.vue`)**: datos personales, cambio de contraseña, sección **Mis facturas** (tabla, ver detalle modal, descargar PDF).
- **Admin (`AdminView.vue`)**: estadísticas, gestión de usuarios (cambiar plan free/premium, eliminar), facturas globales (ver + descargar PDF).
- **Auth**: login, registro, forgot/reset password.

## Estado (Pinia)

**`auth`**: `user` con `role` y `plan`; `isAdmin` / `isPremium` como `computed`; acciones `login`, `logout`, `register`, `fetchProfile`, `simulatePremiumPayment({ method, payment_data })`, `downgradeToFree`. Persistencia en **`localStorage`** según constantes en `constants/authStorage`.

**`trips`**: `trips[]`, `isLoading`, `isCreatingTrip`, `initialLoadDone`, `syncPendingCount`, `errorMessage`, `successMessage`. `addTrip` envía un payload alineado con `StoreTripRequest`. `setError` prioriza `errors` 422 de Laravel y luego `message`. Toasts globales se observan desde **`App.vue`** sobre los mensajes del store.

**`layout`** y **`toast`**: estado del sidebar y cola de notificaciones del UI.

## Uso de slots

`layouts/MainLayout.vue` define `<main><slot /></main>` y envuelve la SPA: la navbar, sidebar de viajes y el botón de tema viven en el layout, mientras que cada vista (`DashboardView`, `TripView`, …) se proyecta en el slot al cambiar de ruta. Esto evita repetir chrome/UI por vista.

## Composables destacados

| Composable | Función |
|------------|---------|
| `useTheme` | Modo oscuro/claro: lee/escribe `localStorage` y refleja la clase `.dark` en `document.documentElement`. Usa `useSessionStorage` para estado en sesión. |
| `useSessionStorage<T>` | Composable genérico tipado que sincroniza un `ref` con `sessionStorage` (con `JSON.parse`/`stringify` y limpieza si se vacía). |
| `useLastVisitedTrip` | Recuerda el último viaje abierto (UX de continuidad entre sesiones). |
| `composables/trip/useTripPageContext` | Devuelve un `reactive(...)` con todo el estado de la pantalla de viaje, evitando prop-drilling entre `TripView`, `TripDayCard`, `TripActivityItem`, etc. |
| `useTripDays`, `useTripActivities`, `useTripStays`, `useTripTransport`, `useTripForms` | Encapsulan el CRUD de cada subentidad llamando al store y a la API, con manejo de mensajes e *idempotencia*. |

## Props/emits

Componentes hijos exponen una API tipada con `defineProps<...>()` y `defineEmits<...>()`. Ejemplos:

- **`TripSidebarItem.vue`**: `defineProps<{ tripId: number; tripName: string }>()` y `defineEmits<{ open: [number] }>()`.
- **`TripDayCard.vue`**: `defineProps<{ day: Day; index: number }>()`.
- **`TripActivityItem.vue`** / **`TripStayForm.vue`** / **`TripTransportForm.vue`**: props del modelo + emits `submit`, `cancel`, `delete`, etc.

## Integración API

- **Base URL** configurable por **`VITE_API_BASE_URL`** o por defecto `/api` (proxy Vite en desarrollo local sin Docker).
- Respuesta de creación de viaje: usa `message` del JSON si existe para el toast de éxito.
- Errores 403 de límite de viajes: mensaje mostrado desde el cuerpo del API.
- Interceptor 401 de Axios: cierra sesión y redirige a `/login`.

### Docker (stacks dev / prod / portainer)

En **`docker-compose.dev.yml`** el frontend recibe por entorno `VITE_API_BASE_URL=http://localhost:8002/api` (puerto del backend en el host).

En **`docker-compose.prod.yml`** la URL se inyecta en el **build** de la imagen (`VITE_API_BASE_URL=http://localhost:8001/api`). Si cambias dominio o puerto del backend, hay que **reconstruir** el servicio frontend (`docker compose ... up --build`).

En **`docker-compose.portainer.yml`** la URL se pasa por variable (`portainer.env` la define como `http://localhost:8003/api`). Detalle operativo en **[DPL](dpl.md)**.

## UX implementada (resumen)

- Badges en navbar y perfil: **superadmin**, **premium**, **free**.
- Banner y modales con estados de **carga** y botones **deshabilitados** durante el procesamiento.
- Textos de interfaz en **español** en flujos principales (formularios, límites, admin, perfil).
- Toasts globales de éxito/error coordinados con los stores.
- Detalle visual y de accesibilidad en **[DOR](dor.md)**.

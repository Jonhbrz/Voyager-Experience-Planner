# Frontend (Vue 3)

Documentación técnica del cliente **Voyager Experience Planner**, ubicado en `frontend/`.

---

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| **Vue 3** | Framework UI (Composition API con `<script setup>`) |
| **TypeScript** | Tipado estático |
| **Vite** | Bundler y servidor de desarrollo |
| **Vue Router** | Rutas: login, registro, dashboard, detalle de viaje |
| **Pinia** | Estado global (auth, viajes, layout, toasts) |
| **Axios** | Cliente HTTP hacia `/api` |
| **Bootstrap 5** | Utilidades y componentes base donde se integran |
| **vuedraggable** | Reordenación de elementos en listas (donde aplique en la UI de viaje) |
| **lodash** | Utilidades de datos |

---

## Estructura de carpetas (`src/`)

| Ruta | Contenido |
|------|-----------|
| `views/` | Páginas de alto nivel: `DashboardView`, `TripView`, `LoginView`, `RegisterView` |
| `layouts/` | `MainLayout.vue` — marco con barra superior, **sidebar de viajes** y área principal |
| `components/` | Piezas reutilizables: `Toast`, `TripSidebarItem`, carpeta `dashboard/`, carpeta `trip/` |
| `stores/` | Pinia: `auth`, `trips`, `layout`, `toast` (y otros si existen) |
| `composables/` | Lógica reutilizable: `useTheme`, `useSessionStorage`, `useLastVisitedTrip`, módulos bajo `composables/trip/` |
| `services/` | `api.ts` — instancia Axios, interceptores (token, 401) |
| `router/` | Definición de rutas y guardas `beforeEach` (rutas protegidas) |
| `types/` | Tipos TypeScript del dominio viaje (`trip.ts`) |
| `utils/` | Cálculos de totales (`tripTotals.ts`), fechas, mapas, UI |
| `assets/` | Estilos globales (`styles.css`) |
| `constants/` | Claves de almacenamiento (`authStorage.ts`) |

---

## Flujo de la aplicación en el cliente

1. **`main.ts`**: crea la app Vue, registra Pinia y el router, monta `App.vue`.
2. **`App.vue`**: contenedor raíz (toasts globales, etc.).
3. **Router**: rutas públicas (`login`, `register`) vs protegidas (`dashboard`, `trip`). Si falta token y la ruta exige autenticación, redirección a login con `redirect` en query.
4. **`api.ts`**: añade `Authorization: Bearer` desde `localStorage`; en **401** limpia sesión, resetea stores y redirige a login salvo rutas públicas.

---

## Pinia y gestión de estado

### `stores/auth.ts`

- Sesión del usuario: token, datos básicos de usuario.
- Acciones típicas: login, registro, logout, `clearSession`.

### `stores/trips.ts`

- Lista de viajes y operaciones CRUD vía API.
- Carga inicial al entrar en dashboard o tras autenticación.

### `stores/layout.ts`

- Estado de la **barra lateral** (colapsada / expandida) para navegación entre viajes.

### `stores/toast.ts`

- Mensajes transitorios de feedback al usuario.

---

## Composables destacados

| Composable | Función |
|------------|---------|
| `useTheme` | Modo claro / oscuro persistido |
| `useLastVisitedTrip` | Recordar último viaje visitado (mejora UX en sidebar) |
| `useTripDays`, `useTripActivities`, … | Lógica de página de viaje modularizada |
| `useTripPageContext` | Contexto compartido entre componentes del detalle de viaje |

---

## Componentes de producto

- **`MainLayout`**: navbar (marca, usuario, cerrar sesión, tema), **sidebar** con lista de viajes (`TripSidebarItem`), slot para vista principal.
- **Dashboard**: título *Mi Experiencia*, creación de viaje, listado de tarjetas/resumen.
- **Vista viaje (`TripView`)**: cabecera del viaje, días (`TripDayCard`), bloques de actividades, transportes y estancias, acciones de edición.
- **Formularios** (`TripTransportForm`, `TripStayForm`, …): alta/edición de ítems ligados a un día.

---

## Optimizaciones y buenas prácticas aplicadas

- **Carga eager/lazy del router**: el dashboard puede cargarse en eager import; login/register en lazy import para reducir el bundle inicial.
- **Tipado** de entidades viaje en `types/trip.ts` alineado con la API.
- **Totales de gasto** calculados en cliente con funciones puras (`tripTotals.ts`): suma de `price` en actividades, transportes y estancias por día y por viaje, con saneo de valores (`clampPrice`).
- **Interceptores Axios** centralizados para no repetir lógica de token ni manejo de sesión caducada.
- **UI responsive**: layout adaptable (sidebar colapsable / drawer en viewport estrecho) documentado en código; estilos en componentes y `assets/styles.css`.

---

## Variables de entorno (Vite)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL del API (por defecto relativo `/api` si no se define) |

---

## Referencias

- Backend y contrato de API: [Backend (Laravel)](backend.md)
- Uso funcional para no desarrolladores: [Uso de la aplicación](usage.md)

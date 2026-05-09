# SSG — Sistema de gestión y lógica de negocio

Resumen orientado al **comportamiento implementado** en PRW-VEP (Voyager Experience Planner) y a los criterios SSG: **gestión de clientes/usuarios**, **formularios** y **paneles de control**.

## Cumplimiento de criterios SSG

| Criterio | Implementación |
|----------|----------------|
| **Gestión de clientes / usuarios** | Registro, login, perfil, cambio de contraseña, recuperación, planes (`free`/`premium`), roles (`user`/`superadmin`), CRUD admin sobre usuarios (cambio de plan y borrado). |
| **Formularios** | Auth (login, registro, forgot, reset), perfil/contraseña, creación y edición de viajes/días/actividades/transportes/estancias, modal de pago simulado (tarjeta/transferencia), filtros y selectores en panel admin. Validación cliente + servidor (Form Requests Laravel). |
| **Paneles de control** | **Dashboard** del usuario con tarjetas de viajes y resumen, **panel de viaje** con días/actividades/transportes/estancias y totales, **Mis facturas** en perfil, **Panel administrativo** (`AdminView`) con KPIs (estadísticas globales, listado de usuarios, listado global de facturas). |

---

## Usuarios y roles

| Rol | Comportamiento |
|-----|----------------|
| **`user`** | Acceso SPA estándar: sus viajes, perfil, facturas propias. No accede a `/admin`. |
| **`superadmin`** | Acceso a **`GET /api/admin/*`**: estadísticas globales, listado de usuarios e invoices, cambio/borrado de usuarios (salvo borrado propio), descarga de cualquier PDF de factura. |

El rol se muestra como badge **superadmin** en la UI; la autorización real es **servidor** (middleware **`EnsureSuperadmin`**). Detalle de la API en **[DSW](dsw.md)**.

---

## Planes (`free` / `premium`)

| Plan | Viajes nuevos |
|------|----------------|
| **`free`** | Máximo **3** registros en `trips` para ese `user_id`. La cuarta creación devuelve **403** JSON con mensaje de límite. |
| **`premium`** | Sin tope aplicado en `TripController::store`. |

**Superadmin** ignora el tope mediante `User::isAdmin()`, aunque el campo `plan` siga siendo `free` en BD.

Los controles UX (banner de mejora, panel de límite, estadísticas resumidas ocultando detalle cuando es free no admin…) reflejan el mismo modelo; el servidor es la **autoridad** del número de viajes.

---

## Suscripción simulada (sin pasarela real)

- **Subida (`PremiumUpgradeService`)** desde plan `free`: actualiza `plan` a `premium`, genera **`Invoice`** (importe fijo `999` céntimos = **9,99 €**), invalida cachés (`admin:stats`, `user:{id}:trips`).
- **Vías de llamada** desde la API:
  - `POST /api/upgrade` (compatibilidad, con throttle).
  - `POST /api/payment/simulate` con `method`: `card` / `transfer` y `payment_data` validado en servidor.
- **Interfaz**: modal con dos tabs (**Tarjeta** / **Transferencia**); envía `method` + `payment_data`; al recibir el JSON refresca el perfil del usuario y `loadTrips()`.
- **Bajada (`PremiumDowngradeService`)** vía `POST /api/downgrade`: pasa `premium → free`, registra log `plan.downgrade`, invalida cachés. **No** borra viajes ya existentes (si el usuario tenía más de 3 viajes, se quedan; sólo no podrá crear nuevos hasta volver a premium o ser admin).

---

## Gestión trip → día → actividad

- **Creación de viaje**: el servidor inserta en cascada todos los **`days`** consecutivos con título “Día n”.
- **Días**: `DayController` con `POST /trips/{tripId}/days` y los demás verbos REST; comprobación previa de pertenencia con `findTripForUserOrAbort`.
- **Actividades**: `ActivityController`; `POST /days/{dayId}/activities` con normalización de hora (`H:i`).
- **Transportes** y **Estancias**: rutas paralelas bajo `/days/{dayId}/transports` y `/days/{dayId}/stays`.

Todas las acciones pasan por la verificación de propiedad (`findTripForUserOrAbort` / `findDayForUserOrAbort`) antes de cualquier escritura.

---

## Facturación e invoices

| Acción | Implementación |
|--------|----------------|
| Generación tras upgrade simulado | Una fila en `invoices` por upgrade (`plan = premium`, `amount` en céntimos). |
| Lista del usuario autenticado | `GET /api/invoices` (sólo donde `user_id` = actor). Vista **Perfil** → "Mis facturas". |
| PDF | `GET /api/invoices/{invoice}/pdf`: descarga DomPDF si la factura es del usuario o el actor es `superadmin`. Plantilla en `resources/views/invoices/pdf.blade.php`. |
| Listado global admin | `GET /api/admin/invoices` con `user` anidado para mostrar por usuario. |

---

## Paneles y métricas

### Panel de usuario (Dashboard)

- Listado de viajes con **tarjetas** (días, actividades, total estimado).
- Botón **Crear viaje** con modal/formulario.
- **Banner de mejora** si el plan es `free` (no se muestra a admin).
- **Panel de límite free** mostrando "X / 3" y CTA a premium.
- Botón **volver a plan free** si el usuario es `premium` y no admin.

### Panel de viaje

- Listado de **días** con apertura/cierre por tarjeta.
- Subbloques de **actividades** (con título, hora, estado *hecho*, precio), **transportes** (origen/destino/tipo/precio) y **estancias** (alojamiento/ubicación/precio).
- Totales por día y total del viaje en encabezado.

### Panel de perfil

- Datos personales y cambio de contraseña.
- Sección **Mis facturas** con tabla, modal de detalle y descarga PDF.

### Panel administrativo (`AdminView`)

- KPIs desde `/api/admin/stats`: total de usuarios, free vs premium, viajes totales, ingresos sumados (€).
- Tabla de usuarios con `withCount('trips')` y acciones: cambiar plan (`free`/`premium`) y eliminar (excepto el propio admin).
- Tabla global de **facturas** con descarga PDF.

---

## Formularios clave

| Formulario | Frontend | Backend |
|------------|----------|---------|
| Login | `LoginView.vue` | `AuthenticatedSessionController@store` (throttle 5/min) |
| Registro | `RegisterView.vue` | `RegisteredUserController@store` |
| Recuperación | `ForgotPasswordView.vue` / `ResetPasswordView.vue` | `PasswordResetLinkController` / `NewPasswordController` |
| Perfil / contraseña | `ProfileView.vue` (form `reactive`) | `ProfileController@show/update/updatePassword` |
| Crear viaje | `DashboardView.vue` (modal) | `StoreTripRequest` |
| Editar viaje | `TripView.vue` / `TripHeader.vue` | `UpdateTripRequest` |
| Actividad / día / transporte / estancia | Componentes de `components/trip/` con `defineProps`/`defineEmits` | `Store*Request` / `Update*Request` |
| Pago simulado | `DashboardView.vue` (modal Tarjeta/Transferencia) | `PaymentController::simulate` (validación inline) |
| Cambio de plan (admin) | `AdminView.vue` | `AdminController::updateUserPlan` |

En el cliente, la validación básica complementa al servidor (fechas de viaje, no enviar campos vacíos prohibidos, etc.). Los mensajes de error del API se muestran preferentemente "crudos" si el JSON los entrega para conservar la información.

---

## Resumen

El sistema combina **control de acceso por token** (Sanctum), **rol admin** (middleware), **plan comercial simulado con invoices/PDF**, **límites numéricos en servidor** y **experiencia cliente coherente** (toasts, banners, modales, perfil con historial de facturas) sin depender de un PSP externo, cubriendo de forma completa los criterios SSG de gestión de usuarios, formularios y paneles de control.

# SSG — Sistema de gestión y lógica de negocio

Resumen orientado al **comportamiento implementado** en PRW‑VEP (Voyager Experience Planner).

---

## Usuarios y roles

| Rol | Comportamiento |
|-----|----------------|
| **`user`** | Acceso SPA estándar: sus viajes, perfil, facturas propias, sin `/admin`. |
| **`superadmin`** | **`GET /api/admin/*`**, estadísticas globales, listados de usuarios e invoices todas, cambio/remoción usuarios salvo borrado propio, descarga cualquier PDF facturable según rutas autorizadas. |

El rol se muestra como badge texto **superadmin** en UI; la autorización real es servidor (middleware **`EnsureSuperadmin`**).

---

## Planes (`free` / `premium`)

| Plan | Viajes nuevos |
|------|----------------|
| **`free`** | Máximo **3** registros en **`trips`** para ese **`user_id`**. Cuarta creación ⇒ **403** JSON con mensaje de límite. |
| **`premium`** | Sin tope aplicado en `TripController::store`. |

**Superadmin** ignora el toque de cantidad mediante **`User::isAdmin()`**, aunque el campo `plan` siga **`free`** en BD.

Los controles UX (banner mejora, panel límite, estadísticas resumidas ocultando detalle cuando free no admin…) reflejan el mismo modelo; el servidor es la autoridad para el número de viajes.

---

## Suscripción simulada (sin pasarela real)

- **Subida**: `PremiumUpgradeService` desde plan **free**: actualiza **`plan`** a **premium**, genera **`Invoice`** (precio único código en backend 999 ≈ €9.99 como céntimos), invalida caches admin/viajes usuario.
- **Vías de llamada desde API**: `POST /api/upgrade` (compatibilidad breve throttle) y `POST /api/payment/simulate` con método **tarjeta** (`card`) / **transfer** (`transfer`) + **`payment_data`** validado servidor.
- **Interfaz**: modal tipo flujo (**Tarjeta** / **Transferencia**); envío método + objeto datos; espera resultado JSON y refresca perfil usuario + **`loadTrips()`** cliente.
- **Bajada**: `POST /api/downgrade` (`PremiumDowngradeService`): **`premium`** → **`free`**; log interno **`plan.downgrade`**; caches invalidados; ningún borrado de viajes ya existentes (con más de 3 sólo impedirán creación nuevos si no se mejora o no es admin).

---

## Gestión trip → día → actividad

- **Creación trip**: servidor inserta todas las **`days`** consecutivas con título “Día n”.
- **Días**: `DayController` válido rutas **`POST /trips/{trip}/days`** (título…) con **trip** autorizado usuario.
- **Actividades**: `ActivityController`, **`POST /days/{day}/activities`**, tiempo normalizado H:i servidor.
- También están **transportes** y **estancias** bajo día con rutas paralelas código.

Todo ello sólo después de chequear **`findTripForUserOrAbort`** / **`findDayForUserOrAbort`**.

---

## Facturación e invoices

| Acción | Implementación breve |
|--------|-----------------------|
| Generación tras upgrade simulación | Una fila **invoices** por upgrade con `plan` premium y **`amount`** céntimos. |
| Lista usuario autenticado | **`GET /api/invoices`**: sólo donde **user_id** = actor. Vista **Perfil** “Mis facturas”. |
| PDF | **`GET /api/invoices/{invoice}/pdf`**: mismo invoice propio cualquier usuario autentificado o cualquier **`superadmin`** usando DomPDF en blade **`resources/views/invoices/pdf.blade.php`**. |
| Global admin JSON | **`GET /api/admin/invoices`** datos enriquecidos con **`user`** anidados. |

---

## Paneles y métricas

- **Usuario (dashboard)** viajes ordenados próximos, creación nueva, restricciones visibles cuando free, mejoras/downgrade donde corresponden.
- **Admin** (`AdminView`): filas KPI desde **`/api/admin/stats`** (**users totals**, free versus premium counts, trip count, sum income invoices), tablas usuario y factura, acciones select plan y delete y descarga PDF.

---

## Formularios clave

| Formulario | Backend |
|------------|---------|
| Login / registro / reset | controladores auth + validación request |
| Perfil / contraseña | **ProfileController** + requests |
| Crear viaje | **StoreTripRequest** |
| Pago simulado | **PaymentController** validación inline |
| Actividad / día / transporte / estancia | requests dedicados / reglas parciales resource |

En cliente, validación básica complementa (fechas viaje, campos pago simulado, no enviar vacíos prohibidos) y los mensajes error API se muestran preferentemente crudos si JSON lo entrega.

---

## Resumen

El sistema combina **control de acceso por token**, **rol admin**, **plan comercial simulado con invoices/PDF**, **límites numéricos en servidor** y **experiencia cliente coherente** (toasts, banner, modales, perfil con historial factura) sin depender de un PSP externo.

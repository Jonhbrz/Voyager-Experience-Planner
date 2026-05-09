# DOR — Diseño de interfaces

## Cumplimiento de criterios DOR

| Criterio | Implementación |
|----------|----------------|
| Aplicación **responsive** | Layout fluido con grids `auto-fill`, sidebar colapsable, navbar adaptable, tablas con scroll horizontal y media queries en `assets/styles.css`. La SPA es usable de móvil a escritorio. |
| **WCAG / Accesibilidad** | Atributos ARIA (`aria-label`, `aria-labelledby`, `aria-modal`, `aria-busy`, `aria-live`), roles semánticos (`role="banner"`, `role="dialog"`, `role="status"`, `role="alert"`), foco programable en *modals*, contraste por variables de tema, etiquetas visibles en formularios y `<label>` asociado a `<input>`. |
| **Framework CSS** | **Bootstrap 5** (utilities) importado en `main.ts` (`bootstrap/dist/css/bootstrap-utilities.min.css`) y usado en vistas (espaciados, flex, grid, display); CSS propio sobre eso para componentes y tema. |
| **Gama de color apropiada** | Paleta principal **verde** (asociada a viaje/exploración) en botones de marca, premium y elementos de acción; rojos suavizados para restricciones/errores; modo oscuro completo con variables `:root`/`.dark`. |
| **Usabilidad** | Estados de carga, botones deshabilitados durante peticiones, toasts globales, validaciones inline en formularios, mensajes claros de error/éxito en español, navegación predecible (router con guardas), atajos visuales por badges (rol/plan). |

## Principio visual

La UI gira en torno al **`MainLayout`**: marca en navbar, zona de usuario / plan / admin, modo oscuro, sidebar listando viajes por nombre, zona central para vistas (proyectada con `<slot />`).

## Estilos

- **CSS propio** con **variables `:root`** (`--primary`, `--navbar`, `--card`, `--border`, `--sidebar`, …) en `frontend/src/assets/styles.css` y variantes para modo oscuro vía `:global(.dark)` y `<html class="dark">`.
- **`scoped`** en cada SFC para evitar fugas y mantener encapsulado.
- **Bootstrap utilities** para *spacing* y *flex* puntuales (`m-*`, `p-*`, `d-flex`, `gap-*`, etc.).

## Responsive

- **Navbar** flexible en pantallas estrechas; logo y controles reorganizados con `flex-wrap`.
- **Sidebar** colapsable (`stores/layout.ts`, `useLayoutStore`): ancho reducido o oculta en móvil con toggle tipográfico **⮜**.
- **Grids tipo dashboard** (`auto-fill`, anchos mínimos) para tarjetas de viajes.
- **Tablas administrativas** con `overflow-x: auto` y ancho mínimo para scroll horizontal sin romper el layout general.
- **Modales** ocupan la pantalla en móvil y se centran en pantallas grandes; el overlay es siempre clicable para cerrar.

## Componentes repetidos

- **Badges** de plan/rol (`plan-badge`, `role-badge`, variantes `--free` / `--premium`).
- **Tarjetas** (`stat-card`, `admin-card`, `card-hover`): bordes, sombra ligera al `:hover`.
- **Modales** (pago simulado, factura admin, factura perfil): fondo oscurecido pantalla completa, cierre por overlay o botón, `role="dialog"`, `aria-modal="true"`, foco accesible.
- **Toasts** globales (`Toast.vue`) consumidos del store `toast` y observados desde `App.vue` para los mensajes de los stores `auth`/`trips`.

## Accesibilidad practicada (WCAG)

- **`aria-label`** / **`aria-labelledby`** en navbar, sidebar y modales.
- **`aria-modal="true"`** y **`role="dialog"`** en cuadros modales (pago, factura).
- **`role="alert"`** en errores formales (`create-trip-error`, errores de perfil/admin) y **`role="status"` + `aria-busy="true"`** en zonas de carga (skeletons, indicadores de viajes/días).
- **`aria-live="polite"`** en avisos no críticos (cargando navbar).
- **Etiquetas visibles** y `<label for="...">` en formularios; placeholders sólo orientativos.
- **Contraste** mediante variables CSS de tema; modo oscuro mantiene ratios legibles.
- **Foco visible** y orden de tabulación coherente.
- **Navegación con teclado**: botones en lugar de divs clicables, enlaces con `<router-link>`, cierre de modales con la tecla `Esc` (gestionado por el componente).

## Retroalimentación y flujos

- **Errores** API: Axios → Pinia (`errorMessage`) → toast de error (y en dashboard a veces bloque inline `createTripFormError`).
- **Éxitos**: toast verde cuando el store marca `successMessage` (viajes, pagos, perfil).
- **Flujos** principales:
  1. Login → dashboard (con `redirect` query si venía de una ruta protegida).
  2. Crear viaje → redirección a `/trip/:id` si la creación es OK.
  3. Mejora de plan → modal de pago → recarga del usuario y los viajes.
  4. Admin solo si `role === 'superadmin'`.
  5. Perfil muestra historial de facturas con descarga PDF.

## Decisiones coherentes visuales

- Paleta **verde** primaria coherentemente en botón “Crear viaje”, badges premium y elementos de marca.
- Límite **free**: mensajería en tono de restricción (rojo suavizado en algunos banners).
- Tipografía: heredada del sistema (sans-serif por defecto), mejorando rendimiento y legibilidad.
- Idioma de interfaz: **español**, manteniendo términos técnicos de plan donde se acordó (`free`, `premium`, `superadmin`, `admin`).

## Modo oscuro

- Conmutador en navbar (`useTheme`): persiste preferencia en `localStorage` y refleja `class="dark"` en `<html>`.
- Variables CSS `:root` (claro) y `.dark` (oscuro) garantizan paridad visual completa.

## Usabilidad

- Botones con etiquetas claras y deshabilitación visible durante operaciones (evita doble-click).
- Skeletons y *spinners* mientras se cargan datos para reducir percepción de latencia.
- Mensajes de error legibles, en español, priorizando los del backend cuando los hay.
- Sidebar con el viaje en curso resaltado y memoria de "último viaje visitado" (`useLastVisitedTrip`) para retomar tareas.

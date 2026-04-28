# DOR — Diseño de interfaces

## Principio visual

La UI gira en torno al **`MainLayout`**: marca en navbar, zona de usuario/plan/admin, modo oscuro, sidebar listando viajes por nombre, zona central para vistas.

Estilos: **CSS propio** (variables `:root` tipo `--primary`, `--navbar`, `--card`, `--border`, `--sidebar`) en `frontend/src/assets/styles.css` y **`scoped`** en vistas/componentes tema claro / dark (`:global(.dark)` donde toca).

## Responsive

- Navbar enrollable/flexible en vista estrecha; logo y controles reorganizados.
- Sidebar **colapsable** (`layoutStore`): ancho reducido o ocultamiento en móvil con toggle fijo tipográfico **⮜**.
- Grids tipo **dashboard** (`auto-fill`, anchos mínimos) para tarjetas de viajes.
- Tablas administrativas con **`overflow-x: auto`** y ancho mínimo para scroll horizontal sin romper el layout general.

## Componentes repetidos

- **Badges** plan/rol (`plan-badge`, `role-badge`, variantes `--free` / `--premium`).
- **Tarjetas** (`stat-card`, `admin-card`, `card-hover`): bordes, sombra ligera hover.
- **Modales** (pago simulado, factura admin, factura perfil): fondo oscurecido pantalla completa, cierre por overlay o botón, `role="dialog"`, foco accesible básico.
- Toasts globales (**`Toast.vue`**) desde store de mensajes cortos (`useToastStore` + observación desde `App.vue` de mensajes trips).

## Accesibilidad practicada

- `aria-label` / `aria-labelledby` / `aria-modal` donde corresponde (navbar admin, skeletons cargando viajes/días).
- `role="alert"` en errores formales (`create-trip-error`, errores perfil/admin).
- `role="status"` en zonas cargando texto **Cargando…** / skeletons **aria-busy="true`**.
- Formularios: etiquetas visibles (**Nombre**, **Fecha**, etc.) y placeholders orientativos.
- Contraste: texto sobre `--navbar`/`--card` mediante variables tema y modo oscuro.

## Retroalimentación y flujos

- **Errores** API: Axios → Pinia **`errorMessage`** → toast error (y en dashboard a veces bloque texto formulario **`createTripFormError`**).
- **Éxitos**: toast verde cuando el store marca `successMessage` (viajes, pagos perfilizado).
- Flujos: login → dashboard; crear viaje → redirección a `/trip/:id` si creación OK; mejora plan → modal pago → recarga usuario y viajes; admin solo si rol superadmin; perfil muestra lista facturas usuaria.

## Decisiones coherentes visuales

- Paleta **verde** primaria coherentemente en botón crear, badges premium y elementos de marca.
- Límite **free**: panel/mensajes en tono restricción (rojo suavizado en algunos banners).
- Un solo idioma de interfaz prácticamente (**español**), manteniendo términos técnicos de plan donde se solicitó (**free**, **premium**, **superadmin**, **admin** en enlaces/nav).

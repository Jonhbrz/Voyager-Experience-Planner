# DOR - Diseño de Interfaces

## Enfoque General de Interfaz

La interfaz de **Voyager Experience Planner** busca ser clara, práctica y consistente. Se organiza alrededor de un layout principal con:

- Navbar superior.
- Sidebar de viajes.
- Área central para dashboard, detalle de viaje, perfil o administración.

La aplicación mantiene una estética coherente mediante variables CSS globales para color, fondo, bordes y tarjetas.

## Diseño Responsive

El diseño se adapta a distintos tamaños de pantalla:

- La navbar permite que las acciones se reorganicen en pantallas pequeñas.
- La sidebar puede colapsarse y funcionar como panel lateral.
- Las tarjetas del dashboard usan grids flexibles.
- Las tablas del panel admin tienen contenedor con scroll horizontal para no romper el layout.

## CSS y Frameworks

El proyecto utiliza CSS propio sobre Vue Single File Components y utilidades de Bootstrap donde encaja. La mayor parte del diseño se controla con:

- Variables en `assets/styles.css`.
- Estilos scoped en cada vista.
- Clases reutilizadas para tarjetas, botones, errores y estados vacíos.

No se depende de un framework visual pesado: la UI se adapta a las necesidades del producto.

## Paleta y Consistencia Visual

La paleta gira alrededor de tonos verdes para la identidad principal:

- `--primary` para acciones principales.
- `--navbar` para la barra superior.
- `--card` para contenedores.
- `--border` para separación visual.
- `--activity` para fondos suaves.

Los badges refuerzan el estado del usuario:

- `🆓 Free`: color neutro.
- `💎 Premium`: color destacado.
- `👑 Superadmin`: destacado administrativo.

## Accesibilidad

Se aplican varias medidas:

- Formularios con `label` visible.
- Estados `role="alert"` para errores.
- Estados `role="status"` para carga.
- Botones deshabilitados durante operaciones en curso.
- Texto con contraste suficiente usando variables de tema.
- `aria-label` en acciones relevantes como navegación, cierre de sesión o toggle de sidebar.

## Usabilidad

La navegación es directa:

- Dashboard como punto de entrada.
- Sidebar para viajes.
- Navbar para perfil, plan, admin y logout.
- Panel admin visible solo para superadmin.

La aplicación muestra feedback al usuario mediante:

- Toasts de éxito/error.
- Mensajes inline en formularios.
- Empty states como “No trips created yet”, “No users found” y “No invoices available yet”.
- Mensaje claro al alcanzar el límite Free.

## Paneles y Formularios

Los formularios siguen un patrón consistente:

- Campos agrupados.
- Botón principal visible.
- Validación de frontend básica.
- Errores de backend mostrados de forma clara.
- Carga indicada con textos como “Guardando…” o “Actualizando…”.

El resultado es una interfaz entendible para usuario final y para administración sin mezclar flujos ni sobrecargar pantallas.

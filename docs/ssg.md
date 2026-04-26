# Sistema de Gestión (SSG)

Esta sección resume las funcionalidades de gestión implementadas en **Voyager Experience Planner** y las relaciona con los criterios de evaluación del sistema.

---

## Realiza gestión de clientes/usuarios

La aplicación incorpora una gestión de usuarios basada en autenticación con Laravel Sanctum y una separación clara de roles:

- **`user`**: usuario estándar que puede registrarse, iniciar sesión, gestionar su perfil y planificar sus propios viajes.
- **`superadmin`**: usuario administrador con acceso al panel `/admin`, desde donde puede consultar y gestionar usuarios e invoices.

Cada usuario tiene además un plan:

- **`free`**: plan gratuito con límite de 3 viajes.
- **`premium`**: plan de pago simulado con viajes ilimitados.

El panel de administración permite:

- Consultar todos los usuarios registrados.
- Ver nombre, email, rol, plan y número de viajes de cada usuario, con badges visuales para `superadmin`, `free` y `premium`.
- Cambiar el plan de un usuario entre `free` y `premium`.
- Eliminar usuarios, con protección para impedir que un superadmin se elimine a sí mismo.
- Consultar invoices generadas por upgrades a Premium y abrir su detalle en modal.
- Ver estadísticas globales: total de usuarios, usuarios Free, usuarios Premium, total de viajes y revenue simulado.

En backend, estas operaciones están protegidas con middleware de rol `superadmin` y se exponen bajo `/api/admin/*`.

---

## Se han generado formularios

El proyecto incluye formularios funcionales conectados a la API:

### Login y registro

Los formularios de login y registro permiten crear una cuenta e iniciar sesión. El backend valida credenciales, email único y contraseña confirmada, y devuelve un token Sanctum para la SPA.

### Recuperación de contraseña

El flujo de "forgot password" y "reset password" está adaptado a Vue SPA. Laravel genera un enlace hacia el frontend con `token` y `email` en query params, y el formulario de reset envía la nueva contraseña a `/api/reset-password`.

### Perfil de usuario

La sección de perfil permite:

- Consultar nombre y email.
- Actualizar datos personales.
- Cambiar contraseña solicitando la contraseña actual.

La validación se realiza en backend con Form Requests y evita, por ejemplo, cambiar el email a uno ya existente.

### Upgrade a Premium

El dashboard muestra el plan actual y, si el usuario está en Free, ofrece un botón **Upgrade to Premium**. Esta acción llama a `/api/upgrade`, cambia el plan a Premium y crea una invoice simulada.

### Acciones de administración

El panel admin incluye controles para:

- Cambiar el plan de un usuario mediante un selector.
- Eliminar usuarios mediante botón con confirmación.
- Abrir el detalle de una invoice con el botón **View Invoice**.

Todos los formularios y acciones muestran estados de carga, mensajes de éxito o error, y deshabilitan botones mientras se procesa la operación.

---

## Se han creado paneles de control

### User dashboard

El dashboard de usuario muestra la experiencia principal de la aplicación:

- Listado de viajes.
- Creación de nuevos viajes.
- Acceso a cada viaje y sus días, actividades, transportes y estancias.
- Badge visible del plan actual (`🆓 Free` o `💎 Premium`) y rol admin (`👑 Superadmin`) cuando aplica.
- Mensaje claro cuando un usuario Free alcanza el límite de 3 viajes.

Para usuarios Free se restringe la creación de más viajes al llegar al límite. Para usuarios Premium y superadmin, el límite no aplica.

### Admin panel

El panel `/admin` está disponible solo para usuarios con rol `superadmin`. Incluye:

- Tabla de usuarios.
- Gestión del plan de cada usuario.
- Eliminación segura de usuarios.
- Listado de invoices.
- Modal de detalle de invoice con email, plan, importe formateado en euros y fecha.

### Admin stats dashboard

Dentro del panel admin se añadió una sección de estadísticas con tarjetas:

- Total de usuarios.
- Usuarios Free.
- Usuarios Premium.
- Total de viajes.
- Revenue simulado acumulado a partir de invoices.

Estos datos se obtienen desde `/api/admin/stats`, evitando cálculos duplicados en frontend y manteniendo la lógica de negocio centralizada en el backend.

---

## Resumen funcional

El sistema permite gestionar usuarios, planes, invoices y límites de uso sin romper la arquitectura SPA existente. La API permanece bajo `/api`, las rutas sensibles están protegidas con Sanctum y middleware de rol, y la interfaz mantiene una experiencia coherente para usuarios estándar y administradores.

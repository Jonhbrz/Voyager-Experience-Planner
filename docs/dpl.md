# DPL - Despliegue y Control de Versiones

## Repositorio

El proyecto se organiza en una raíz común:

- `backend/`: API Laravel.
- `frontend/`: SPA Vue.
- `nginx/`: configuración de proxy.
- `docker-compose.yml`: servicios locales.
- `docs/`: documentación final.

El control de versiones se realiza con **Git**.

## Flujo de Trabajo Git

Flujo recomendado:

1. Crear una rama para cada cambio.
2. Implementar una funcionalidad o corrección concreta.
3. Ejecutar pruebas o build.
4. Crear commits claros.
5. Integrar la rama tras revisión.

Ramas habituales:

- `feature/...` para nuevas funcionalidades.
- `fix/...` para correcciones.
- `docs/...` para documentación.

Los commits deben agrupar cambios relacionados, por ejemplo backend + frontend + tests cuando forman parte de la misma funcionalidad.

## Entorno Docker

El proyecto usa **Docker Compose** para ejecutar el sistema completo.

Servicios:

- `postgres`: base de datos PostgreSQL.
- `backend`: Laravel con PHP-FPM.
- `frontend`: build estático de Vue.
- `nginx`: punto de entrada HTTP y proxy hacia frontend/API.

NGINX sirve la SPA y enruta `/api` hacia Laravel.

## Variables y Base de Datos

El backend usa `.env` para configurar:

- `APP_KEY`.
- Conexión PostgreSQL.
- Configuración de correo.
- URL del frontend para reset de contraseña.

Las migraciones crean la estructura de usuarios, viajes, planes, roles e invoices.

## Ejecución Local

Pasos principales:

1. Levantar servicios con Docker Compose.
2. Ejecutar migraciones Laravel.
3. Acceder a la aplicación desde el puerto configurado.

Comandos principales:

- `docker compose up -d --build`
- `docker compose exec backend php artisan migrate --force`
- `docker compose exec backend php artisan test`

## Desarrollo Frontend

Para desarrollo con recarga en caliente se usa Vite dentro de `frontend/`.

Comandos:

- `npm install` o `npm ci`.
- `npm run dev`.
- `npm run build`.

El build genera `dist/`, que puede servirse como frontend estático.

## Verificación Final

Antes de entregar:

- Ejecutar tests del backend.
- Ejecutar build del frontend.
- Revisar que `/api` funciona con Sanctum.
- Comprobar login, viajes, perfil, upgrade y admin.
- Confirmar que no se versionan secretos como `.env`.

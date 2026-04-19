# Despliegue

Guía orientativa para desplegar **PRW-VEP** (Voyager Experience Planner) usando el stack definido en el repositorio: **Docker Compose**, **NGINX**, **PHP-FPM**, **PostgreSQL** y **SPA estática**.

---

## Artefactos involucrados

| Artefacto | Ubicación | Función |
|-----------|-----------|---------|
| `docker-compose.yml` | Raíz | Orquestación de servicios |
| `backend/Dockerfile` | Backend | Imagen PHP-FPM + extensiones + Composer + app |
| `frontend/Dockerfile` | Frontend | Build de Vite y servidor nginx ligero **dentro** del contenedor frontend |
| `nginx/default.conf` | Raíz `nginx/` | Virtual host del contenedor **nginx** público |

---

## Servicios en `docker-compose.yml`

### `postgres`

- Imagen oficial **PostgreSQL 15**.
- Volumen persistente `pgdata`.
- Variables `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (con valores por defecto en el compose).
- **Healthcheck** con `pg_isready` para que servicios dependientes arranquen cuando la BD está lista.

### `backend`

- **Build** desde `./backend` con `Dockerfile`.
- Código montado en `/var/www` para desarrollo (hot reload no incluido en PHP por defecto; en producción se suele copiar código en build).
- Variables de entorno de aplicación y conexión a `postgres`.
- **Healthcheck** con `php-fpm -t`.

### `frontend`

- **Build** desde `./frontend`.
- Expone puerto **80** internamente con el resultado del `npm run build` servido por un servidor web mínimo en la imagen.

### `nginx`

- Imagen **nginx:alpine**.
- Publica el puerto host `${HTTP_PORT:-8000}` → `80` del contenedor.
- Monta el código de Laravel (`./backend`) para poder resolver `index.php` bajo `/api`.
- Monta `default.conf` como configuración del virtual host.

**Dependencias:** `nginx` espera a que `backend` y `frontend` estén *healthy*.

---

## Flujo de tráfico (NGINX)

1. **`location /`** → `proxy_pass http://frontend:80` — entrega la SPA.
2. **`location ^~ /api`** → Laravel `public/` con `try_files` hacia `index.php` — enrutado a FastCGI.
3. **`location = /up`** — comprobación de salud Laravel.
4. **`location ~ \.php$`** → **FastCGI** a `backend:9000`.

Cabeceras de seguridad HTTP se añaden a nivel de servidor (ver comentarios en `default.conf`).

---

## Flujo de despliegue recomendado

### Entorno de integración / staging

1. Definir ficheros `.env` o variables de CI para **secretos** (`POSTGRES_PASSWORD`, `APP_KEY`, etc.).
2. Ejecutar `docker compose build` con tags versionados.
3. Ejecutar `docker compose up -d`.
4. Lanzar migraciones: `docker compose exec backend php artisan migrate --force`.
5. (Opcional) Seeders o datos de demostración.
6. Verificar `/up` y una petición de smoke a `GET /api/...` autenticada.

### Producción (consideraciones adicionales)

- **TLS:** terminar HTTPS delante del contenedor nginx (balanceador, Cloudflare, otro reverse proxy) o configurar certificados en NGINX.
- **Secretos:** no versionar `.env` con contraseñas reales; usar gestores de secretos o variables de orquestador.
- **`APP_DEBUG=false`** y **`APP_ENV=production`** (ya sugeridos en compose).
- **Copias de seguridad** periódicas del volumen `pgdata`.
- **Logs:** agregar driver de logging centralizado si el entorno lo exige.

---

## Escalado horizontal (nota)

El diseño actual es apto para **una instancia** de stack por entorno. Escalar el servicio `backend` implica:

- Balanceo de carga delante de múltiples contenedores PHP-FPM.
- Sesión/token store coherente (la tabla de tokens Sanctum en PostgreSQL ya es compartida).
- Revisión de volúmenes de código montados (en producción, imagen inmutable).

---

## Referencias

- Instalación local: [Entorno e instalación](setup.md)
- Arquitectura: [Arquitectura](architecture.md)

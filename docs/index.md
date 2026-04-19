# Voyager Experience Planner

Bienvenido a la documentación del proyecto **PRW-VEP** (*Voyager Experience Planner*): una aplicación web para planificar viajes por días, con actividades, transportes, estancias y seguimiento de gastos estimados.

Esta documentación está preparada para generarse con **[MkDocs](https://www.mkdocs.org/)** y está organizada en bloques claros para **evaluación académica**, **mantenimiento del equipo** y **usuarios finales**.

---

## Cómo está organizada

| Sección | Audiencia | Contenido |
|--------|-----------|-----------|
| **[Uso de la aplicación](usage.md)** | Usuario final | Registro, viajes, días, actividades, transportes, estancias, gastos y panel principal |
| **[Entorno e instalación](setup.md)** | Desarrolladores | Requisitos, Docker, variables de entorno, migraciones |
| **[Control de versiones](version-control.md)** | Desarrolladores / evaluación | Git, GitHub, ramas, commits, changelog, utilidad en el proyecto |
| **[Arquitectura](architecture.md)** | Desarrolladores / revisores | Vue, Laravel, PostgreSQL, NGINX y flujo de peticiones |
| **[Frontend](frontend.md)** | Desarrolladores | Vue 3, Pinia, composables, estructura de carpetas |
| **[Backend](backend.md)** | Desarrolladores | Laravel, API REST, validación, Sanctum |
| **[Base de datos](database.md)** | Desarrolladores | Modelo relacional, tablas, campo `price` |
| **[Despliegue](deployment.md)** | DevOps / desarrolladores | `docker-compose`, NGINX, flujo de despliegue |
| **[Empleabilidad (IPW)](ipw.md)** | Tutoría / negocio | Mercado, marketing, sostenibilidad económica-social-ambiental, normativa |
| **[Sostenibilidad (SOJ)](soj.md)** | Tutoría / ODS | ODS vinculados, impactos, evaluación de materialidad |

---

## Resumen del producto

- **Frontend:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios; interfaz responsive con Bootstrap como base de utilidades donde aplica.
- **Backend:** Laravel 13 (PHP 8.3), API REST JSON, autenticación con **Laravel Sanctum** (tokens Bearer).
- **Datos:** PostgreSQL 15.
- **Entorno integrado:** contenedores Docker (PostgreSQL, PHP-FPM, build del frontend estático, NGINX como proxy y front door).

---

## Convenciones

- Las rutas de API se indican respecto al prefijo `/api`.
- Los fragmentos de código o comandos asumen raíz del repositorio salvo que se indique otra carpeta.

Si detectas desalineación entre esta documentación y el código, prima el comportamiento del repositorio y actualiza la documentación en la misma iteración.

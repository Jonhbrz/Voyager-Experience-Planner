# Voyager Experience Planner

Documentación final del proyecto **PRW-VEP** (*Voyager Experience Planner*), preparada para una defensa académica. La aplicación permite **planificar viajes** por días, gestionar **actividades**, **transportes**, **estancias**, **planes de usuario** (free/premium) e **invoices simuladas con PDF**.

---

## Cómo está organizada

| Sección | Audiencia | Contenido |
|---------|-----------|-----------|
| **[DSW](dsw.md)** | Evaluación | Backend Laravel 12, NGINX/PHP-FPM, API REST, Sanctum, lógica de negocio y base de datos |
| **[DEW](dew.md)** | Evaluación | Frontend Vue 3 + TS SPA: SFC, Composition API, Router, Pinia, composables, slots, props/emits, `localStorage`/`sessionStorage` |
| **[DPL](dpl.md)** | Evaluación | Despliegue, Docker (dev/prod/portainer), CI/CD GitHub Actions, MkDocs en GitHub Pages, Git |
| **[DOR](dor.md)** | Evaluación | Diseño responsive, accesibilidad WCAG, Bootstrap utilities, paleta y usabilidad |
| **[SSG](ssg.md)** | Evaluación / negocio | Gestión de usuarios, formularios y paneles de control |
| **[Uso de la aplicación](usage.md)** | Usuario final | Registro, viajes, días, actividades, transportes, estancias y gastos |
| **[IPW](ipw.md)** | Tutoría / negocio | Plan de marketing (mercado, 4P) y plan de sostenibilidad (triple impacto y normativa) |
| **[SOJ](soj.md)** | Tutoría / ODS | ODS justificados, impactos con cálculo de materialidad |

---

## Resumen del producto

- **Frontend:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios; SPA con SFC + Composition API. Bootstrap utilities + CSS propio con variables de tema (claro/oscuro).
- **Backend:** Laravel 12 (PHP 8.4), API REST JSON bajo `/api`, autenticación con **Laravel Sanctum** (tokens Bearer), DomPDF para facturas.
- **Datos:** PostgreSQL 15.
- **Orquestación / despliegue:** Docker Compose en tres variantes —
  - **`docker-compose.dev.yml`** (Vite HMR + `artisan serve`),
  - **`docker-compose.prod.yml`** (build estático + `vite preview`),
  - **`docker-compose.portainer.yml`** (segundo entorno gestionado vía **Portainer** con variables en `portainer.env`).

  Detalle completo en **[DPL](dpl.md)**.
- **CI/CD:** GitHub Actions (`ci.yml` para build/tests/docs y `deploy-docs.yml` para publicar la propia documentación en **GitHub Pages**).

---

## Estructura final

Sólo se mantienen los documentos relevantes para presentación, evaluación y uso. El contenido técnico general está consolidado en DSW, DEW, DPL y DOR para evitar duplicidades; los documentos de negocio (IPW) y sostenibilidad (SOJ) referencian los técnicos cuando aporta contexto.

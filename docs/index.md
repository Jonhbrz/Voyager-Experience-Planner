# Voyager Experience Planner

Documentación final del proyecto **PRW-VEP** (*Voyager Experience Planner*), preparada para una defensa académica. La aplicación permite planificar viajes por días, gestionar actividades, transportes, estancias, planes de usuario e invoices simuladas.

---

## Cómo está organizada

| Sección | Audiencia | Contenido |
|--------|-----------|-----------|
| **[DSW](dsw.md)** | Evaluación | Backend Laravel, API, Sanctum, lógica de negocio y base de datos |
| **[DEW](dew.md)** | Evaluación | Frontend Vue SPA, estado, rutas, componentes e interacción con API |
| **[DPL](dpl.md)** | Evaluación | Despliegue, Docker, Git, ramas, commits y build |
| **[DOR](dor.md)** | Evaluación | Diseño responsive, accesibilidad, estilos y usabilidad |
| **[Sistema de Gestión (SSG)](ssg.md)** | Evaluación / negocio | Gestión de usuarios, formularios y paneles de control |
| **[Uso de la aplicación](usage.md)** | Usuario final | Registro, viajes, días, actividades, transportes, estancias y gastos |
| **[Empleabilidad (IPW)](ipw.md)** | Tutoría / negocio | Mercado, marketing, sostenibilidad económica-social-ambiental, normativa |
| **[Sostenibilidad (SOJ)](soj.md)** | Tutoría / ODS | ODS vinculados, impactos, evaluación de materialidad |

---

## Resumen del producto

- **Frontend:** Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios; interfaz responsive con Bootstrap como base de utilidades donde aplica.
- **Backend:** Laravel 13 (PHP 8.3), API REST JSON, autenticación con **Laravel Sanctum** (tokens Bearer).
- **Datos:** PostgreSQL 15.
- **Entorno integrado:** contenedores Docker (PostgreSQL, PHP-FPM, build del frontend estático, NGINX como proxy y front door).

---

## Estructura Final

Solo se mantienen documentos relevantes para presentación, evaluación y uso. El contenido técnico general se ha consolidado en DSW, DEW y DPL para evitar duplicidades.

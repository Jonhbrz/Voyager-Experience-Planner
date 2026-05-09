# IPW — Itinerario personal para la empleabilidad II

Documento orientado a la **evaluación académica** y a la **justificación de viabilidad** del proyecto **Voyager Experience Planner (PRW-VEP)** en el marco de empleabilidad, mercado y responsabilidad empresarial. Se compone de un **Plan de Marketing** y un **Plan de Sostenibilidad**, alineados con los criterios IPW.

## Cumplimiento de criterios IPW

| Criterio | Sección donde se desarrolla |
|----------|------------------------------|
| Análisis completo y bien fundamentado del **mercado**, **clientes** y **competencia**, con uso correcto de datos | [§ Plan de Marketing — Mercado](#plan-de-marketing) |
| **Producto**, **precio**, **distribución** y **promoción** bien justificados y coherentes (4P) | [§ Plan de Marketing — Mix 4P](#mix-de-marketing-4p) |
| Identifica claramente **impactos ambientales, sociales y económicos** | [§ Plan de Sostenibilidad — Triple impacto](#triple-impacto) |
| Tiene en cuenta la **normativa y buenas prácticas** básicas | [§ Plan de Sostenibilidad — Normativa](#normativa-y-buenas-practicas) |
| Redactado, ordenado y fácil de entender | Estructura por epígrafes y tablas en ambos planes |

---

# Plan de Marketing

## Contexto del producto

**Voyager Experience Planner** es una aplicación web SPA que permite **planificar viajes** por días y registrar **actividades**, **transportes** y **estancias**, con una **estimación de gasto** agregada por día y por viaje. El valor para el usuario es la **claridad del itinerario** y el **control presupuestario simple** sin hojas de cálculo dispersas.

## Mercado

### Sector de viajes y tecnología

El sector turístico se apoya cada vez más en **herramientas digitales** para inspiración, reserva y organización. Algunos datos de referencia (uso académico, citados en la presentación):

- El comercio electrónico turístico (compras online de viajes) representa una parte muy relevante del gasto turístico mundial, según informes de **OMT/UNWTO** y **Statista** (sector "Online Travel Booking").
- En España, **INE/FAMILITUR** publica datos de viajes de los residentes y peso del turismo en el PIB; el porcentaje de viajeros que organizan total o parcialmente sus viajes por internet supera el 70 % en los segmentos más jóvenes.
- Crecen los **viajes "do it yourself"** (DIY): el viajero combina varios canales (OTAs, web del operador, alojamientos directos) y necesita un **cuadro de mando único** del viaje. Ése es el hueco de PRW-VEP.

### Clientes objetivo (segmentación)

| Segmento | Perfil | Necesidad que cubre PRW-VEP |
|----------|--------|------------------------------|
| **Viajero particular** (25-55) | Trabaja, viaja 2-4 veces al año, mezcla canales | Itinerario por días + gasto estimado en un solo sitio |
| **Pequeño grupo** (familia/amigos) | Reparte tareas y gastos | Visión clara del plan compartido (extensible a multi-usuario en futuras versiones) |
| **Estudiante de turismo / TIC** | Aprendizaje, demos | Caso de uso real con stack moderno (Vue + Laravel + PostgreSQL + Docker) |
| **Microagencias / "travel planners"** | Organizan paquetes a medida | Marca blanca / licencia (evolución del proyecto) |

### Competencia

Existen alternativas en el mercado, agrupadas en tres familias:

| Familia | Ejemplos típicos | Limitación frente a PRW-VEP |
|---------|------------------|-------------------------------|
| **Agregadores / OTAs** | Booking, Expedia, Skyscanner | Foco en compra/comparación, no en planificación detallada por día |
| **Hojas de cálculo y notas** | Excel, Google Sheets, Notion | Flexibles pero sin validación, sin acceso multiplataforma estructurado, sin lógica de roles ni planes |
| **Apps de itinerario comerciales** | TripIt, Wanderlog, Roadtrippers | Modelo cerrado/freemium con publicidad y poca transparencia del modelo de datos |

**Propuesta diferencial** de PRW-VEP:

- **Modelo de datos explícito** (viaje → día → actividades/transportes/estancias).
- **Control de gasto** integrado en la misma interfaz, sin pasarela externa.
- **Despliegue Docker** reproducible (dev/prod/portainer) para demos y formación.
- Origen **académico/abierto**, ideal como portfolio técnico del autor.

## Mix de marketing (4P)

### Producto

- Núcleo: planificación por **días** con **actividades**, **transportes** y **estancias**.
- Valor añadido: **totales de precio** por día y por viaje, planes (`free`/`premium`) con simulación de pago y **facturación con PDF**.
- Soporte multiplataforma: **web responsive** (móvil/escritorio).
- Calidad del producto: **CI** que ejecuta tests Laravel y build Vite en cada cambio (ver **[DPL](dpl.md)**).

### Precio

- En despliegue **educativo / demo** el producto es gratuito.
- Modelo comercial hipotético:
  - **Freemium**: hasta **3 viajes activos** gratis (límite ya implementado), suscripción para uso ilimitado.
  - **Suscripción premium** simulada en el proyecto: **9,99 € / único** (importe en `invoices` = 999 céntimos). En producción real se modelaría como cuota recurrente.
  - **Licencia / marca blanca** para microagencias (precio a negociar).

### Distribución

- **Demo online** del frontend y la API en infraestructura institucional o nube (Docker → cualquier proveedor).
- **Portainer** como segundo entorno gestionado (ver **[DPL](dpl.md)**) para mostrar el producto a clientes potenciales.
- **Documentación pública** en GitHub Pages (MkDocs) como material de soporte para evaluadores y nuevos desarrolladores.
- **Repositorio público** en GitHub (donde la política lo permita) como portfolio técnico.

### Promoción

- **Vídeo corto** mostrando el flujo: registro → crear viaje → añadir ítems → ver totales.
- **Entrada de blog técnico** con la arquitectura, ODS y el plan de sostenibilidad.
- **Pitch de 3 minutos** problema-solución-demo en feria de proyectos.
- **Redes sociales** orientadas a viajeros DIY: capturas de itinerarios reales, casos de uso.

---

# Plan de Sostenibilidad

## Triple impacto

### Impacto ambiental

- **Digitalización** del plan reduce impresos y fotocopias de itinerarios.
- **Despliegue en contenedor** permite optimizar recursos de servidor frente a máquinas dedicadas mal dimensionadas (cuando se opera en nube con autoescalado responsable).
- **Riesgo:** consumo energético de centros de datos.
- **Mitigación:** proveedores con **electricidad renovable**, apagado de entornos de demo fuera de horario, imágenes Docker optimizadas (`composer install --no-dev`, multi-stage en producciones futuras), caché HTTP en NGINX y caché de aplicación en Laravel (`ApiCache`).

### Impacto social

- **Inclusión:** interfaz en español, diseño responsive y modo oscuro facilitan acceso desde distintos dispositivos y condiciones de luz; cumplimiento de criterios **WCAG** (ver **[DOR](dor.md)**).
- **Transparencia:** el usuario controla sus datos de planificación; políticas de privacidad y derechos ARCO+ contemplados en el plan.
- **Riesgo:** brecha digital para usuarios sin acceso estable a internet.
- **Mitigación:** documentación clara (**[Uso de la aplicación](usage.md)**), formación breve, requisitos mínimos del cliente publicados.

### Impacto económico

- **Ahorro de tiempo** en la preparación del viaje: una sola herramienta para itinerario y gasto.
- **Mejor decisión de gasto** al ver totales estimados por día y viaje antes de salir.
- **Empleabilidad** del autor/equipo: el stack (**Vue 3 + TS + Vite + Laravel 12 + PostgreSQL + Docker + Portainer + CI/CD**) coincide con perfiles full-stack y DevOps junior demandados en el mercado TIC español.
- **Coste operativo bajo** del despliegue (un compose, recursos modestos), favoreciendo modelos freemium sostenibles.

## Normativa y buenas prácticas

### Protección de datos (RGPD / LOPDGDD en España)

La aplicación trata datos personales (nombre, correo, contenido de viajes como notas personales, facturas con plan e importe). Aplican:

- **Minimización**: se recogen sólo los datos necesarios para el servicio.
- **Base jurídica** clara (consentimiento o ejecución de contrato, según el caso de uso).
- **Política de privacidad** y, si aplica, **registro de actividades de tratamiento** en el entorno académico/empresarial real.
- **Seguridad técnica**:
  - Contraseñas **hasheadas** por Laravel (cast `password ⇒ 'hashed'` en `User`).
  - **HTTPS** en producción (terminación TLS en el reverse proxy/CDN).
  - **Tokens Sanctum** con caducidad razonable.
  - **Cabeceras de seguridad HTTP** en NGINX (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-XSS-Protection`).
  - **CORS** limitado a los orígenes esperados (`CORS_ALLOWED_ORIGINS` por entorno).
- **Derechos ARCO+:** procedimiento para consulta, rectificación, supresión y portabilidad (a definir en despliegue real).

### Buenas prácticas de desarrollo y operación

- **Validación servidor + cliente** donde corresponde (Form Requests Laravel, validaciones Vue).
- **Pruebas automatizadas** de la API (PHPUnit) ejecutadas en CI sobre SQLite en memoria.
- **CI/CD** con GitHub Actions (`ci.yml`, `deploy-docs.yml`).
- **Documentación viva** publicada en GitHub Pages (MkDocs) que se actualiza con cada `push` a `main`.
- **Separación de entornos** (`dev.env`, `prod.env`, `portainer.env`) con `APP_KEY` distinta por entorno y cualquier secreto idealmente fuera del repo en producción real.

## Indicadores ESG sugeridos (seguimiento)

| Indicador | Tipo | Cómo medirlo |
|-----------|------|--------------|
| Energía estimada del despliegue | Ambiental | kWh/mes en proveedor cloud × factor emisiones del mix |
| Usuarios activos mensuales | Social/Económico | Cuentas con ≥ 1 viaje actualizado en el mes |
| Tiempo medio de creación de viaje | Económico | Telemetría desde apertura del formulario hasta guardado |
| Tasa de incidencias 401/403 | Gobernanza | Logs de la API filtrados |
| Cobertura de tests backend | Calidad | `php artisan test` con `--coverage` |

---

## Competencias demostradas (empleabilidad)

| Competencia | Evidencia en el proyecto |
|-------------|---------------------------|
| Frontend moderno | Vue 3, TypeScript, Pinia, Vue Router, diseño responsive con Bootstrap utilities |
| Backend API | Laravel 12, Sanctum, Form Requests, Resources, DomPDF |
| Datos | PostgreSQL 15, migraciones, modelo relacional |
| DevOps | Docker Compose (dev/prod/portainer), NGINX, healthchecks, **Portainer** |
| CI/CD | GitHub Actions (build + tests + docs + Pages) |
| Documentación | MkDocs Material, guía de usuario y técnica |
| Sostenibilidad | Análisis ESG y vinculación con ODS (**[SOJ](soj.md)**) |

---

## Referencias cruzadas

- Uso funcional: **[Uso de la aplicación](usage.md)**
- Sostenibilidad y ODS: **[SOJ](soj.md)**
- Despliegue y CI/CD: **[DPL](dpl.md)**

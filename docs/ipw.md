# Empleabilidad e iniciativa profesional (IPW)

Documento orientado a **evaluación académica** y a la **justificación de viabilidad** del proyecto **Voyager Experience Planner (PRW-VEP)** en el marco de empleabilidad, mercado y responsabilidad empresarial.

---

## Contexto del producto

**Voyager Experience Planner** es una aplicación web que permite **planificar viajes** por días, registrar **actividades**, **transportes** y **estancias**, y disponer de una **estimación de gasto** agregada. El valor para el usuario es la **claridad del itinerario** y el **control presupuestario simple** sin hojas de cálculo dispersas.

---

## Mercado

### Sector de viajes y tecnología

El sector turístico se apoya cada vez más en **herramientas digitales** para inspiración, reserva y organización. Paralelamente, crece el segmento de **planificación «do it yourself»**: viajeros que combinan canales de compra (OTA, líneas aéreas, alojamiento directo) pero necesitan un **cuadro de mando único** del viaje.

### Clientes objetivo

| Segmento | Necesidad que cubre el producto |
|----------|--------------------------------|
| Viajeros particulares | Itinerario por días y presupuesto estimado en un solo sitio |
| Pequeños grupos (familia, amigos) | Reparto claro de días y actividades (extensible en futuras versiones) |
| Estudiantes de turismo / proyectos formativos | Caso de uso real de stack moderno (Vue + Laravel + PostgreSQL) |

### Competencia

Existen múltiples alternativas en el mercado:

- **Agregadores y OTAs** (enfoque en compra, no siempre en planificación detallada por día).
- **Hojas de cálculo y notas** (flexibles pero sin validación ni acceso multiplataforma estructurado).
- **Apps de itinerarios** comerciales (ecosistema cerrado, publicidad, modelo freemium).

**Propuesta diferencial** de PRW-VEP: **código abierto en entorno académico**, **modelo de datos explícito** (viaje → día → ítems), **control de gasto** integrado en la misma interfaz y **despliegue Docker** reproducible para demostraciones y Píldoras formativas.

---

## Marketing (mix 4P)

### Producto

- Núcleo: planificación por **días** con **actividades**, **transportes** y **estancias**.
- Valor añadido: **totales de precio** por día y viaje.
- Canales de entrega: **web responsive** (acceso desde móvil y escritorio).

### Precio

En un despliegue educativo o de demostración el producto puede ser **gratuito para el usuario final**. En un modelo comercial hipotético:

- **Freemium**: funciones básicas gratis, informes o colaboración en pago.
- **Suscripción baja** orientada a viajeros frecuentes.
- **Licencia** para agencias pequeñas que quieran marca blanca (evolución del proyecto).

### Distribución

- **Demo online** en infraestructura institucional o nube.
- **Repositorio público** (si la política del centro lo permite) como portfolio técnico.
- **Documentación MkDocs** como material de soporte a evaluadores y nuevos desarrolladores.

### Promoción

- **Vídeo corto** de uso (registro → crear viaje → añadir ítems).
- **Entrada de blog técnico** (arquitectura, sostenibilidad, ODS).
- **Feria de proyectos** / pitch de 3 minutos centrado en problema–solución–demo.

---

## Sostenibilidad (dimensión IPW: triple impacto)

### Impacto ambiental

- **Digitalización** del plan reduce impresos y fotocopias de itinerarios.
- **Despliegue en contenedor** permite optimizar recursos de servidor frente a máquinas dedicadas mal dimensionadas (cuando se opera en nube con autoescalado responsable).
- **Riesgo:** consumo energético de centros de datos; mitigación: proveedores con **electricidad renovable** y políticas de apagado de entornos de demo.

### Impacto social

- **Inclusión:** interfaz en español y diseño responsive facilitan acceso a usuarios con distintos dispositivos.
- **Transparencia:** el usuario controla sus datos de planificación (sujeto a la política de privacidad desplegada).
- **Riesgo:** brecha digital para usuarios sin acceso estable a internet; mitigación: formación breve y requisitos mínimos claros en documentación.

### Impacto económico

- **Ahorro de tiempo** en la preparación del viaje (menos fricción entre herramientas).
- **Mejor decisión de gasto** al ver totales estimados por día.
- **Empleabilidad** de quien desarrolla el stack (demanda de perfiles full-stack y DevOps junior).

---

## Normativa y buenas prácticas

### Protección de datos (RGPD / LOPDGDD en España)

Si la aplicación trata **datos personales** (nombre, correo, contenido de viajes como notas personales), aplica la normativa de protección de datos. Buenas prácticas:

- **Minimización:** recoger solo datos necesarios para el servicio.
- **Base jurídica** clara (consentimiento o ejecución de contrato según el caso).
- **Política de privacidad** y, si aplica, **registro de actividades de tratamiento** en el entorno académico/empresarial real.
- **Seguridad:** contraseñas **hasheadas** (Laravel por defecto), conexión **HTTPS** en producción, tokens con **caducidad** razonable (p. ej. 7 días en la implementación actual de referencia).
- **Derechos ARCO+:** procedimiento para consulta, rectificación y supresión (a definir en despliegue real).

### Buenas prácticas de desarrollo

- Validación **servidor** y **cliente** donde corresponda.
- Pruebas automatizadas de API en Laravel.
- Cabeceras de seguridad HTTP en NGINX (`X-Frame-Options`, `X-Content-Type-Options`, etc.).

---

## Competencias demostradas (empleabilidad)

| Competencia | Evidencia en el proyecto |
|-------------|-------------------------|
| Frontend moderno | Vue 3, TypeScript, Pinia, diseño responsive |
| Backend API | Laravel, Sanctum, Form Requests, Resources |
| Datos | PostgreSQL, migraciones, modelo relacional |
| DevOps básico | Docker Compose, NGINX, healthchecks |
| Documentación | MkDocs, guía de usuario y técnica |

---

## Referencias cruzadas

- Uso funcional: [Uso de la aplicación](usage.md)
- Sostenibilidad ODS: [Sostenibilidad (SOJ)](soj.md)

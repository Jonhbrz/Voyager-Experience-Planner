# SOJ — Sostenibilidad aplicada al sistema productivo

Este apartado vincula el proyecto **Voyager Experience Planner (PRW-VEP)** con los **Objetivos de Desarrollo Sostenible (ODS)** de la Agenda 2030 y analiza **impactos**, **riesgos** y **oportunidades** con un **cálculo de materialidad** explícito, adecuado para memoria académica o informe de sostenibilidad simplificado.

## Cumplimiento de criterios SOJ

| Criterio | Sección |
|----------|---------|
| Identificar y **justificar** los ODS con los que se alinea la aplicación | [§ Objetivos de Desarrollo Sostenible](#objetivos-de-desarrollo-sostenible-ods-relevantes) |
| Identificar al menos **5 impactos / riesgos / oportunidades** con cálculo de materialidad | [§ Impactos y materialidad](#impactos-riesgos-y-oportunidades-minimo-cinco) |

---

## Objetivos de Desarrollo Sostenible (ODS) relevantes

| ODS | Título (ONU) | Justificación de alineación con PRW-VEP |
|-----|----------------|------------------------------------------|
| **ODS 8** | Trabajo decente y crecimiento económico | La digitalización de la planificación **ahorra tiempo** y mejora la **productividad** del viajero. Además, el stack (Vue + Laravel + PostgreSQL + Docker + Portainer + CI/CD) corresponde a perfiles laborales demandados, generando empleabilidad técnica para quien lo desarrolla. |
| **ODS 9** | Industria, innovación e infraestructura | Uso de **infraestructura web moderna** (API REST, contenedores, orquestación con Compose, despliegue con Portainer) como ejemplo de **innovación accesible** en servicios turísticos; la documentación pública aporta conocimiento reutilizable. |
| **ODS 11** | Ciudades y comunidades sostenibles | Facilita **movilidad planificada** y conocimiento del mix de **transportes** del viaje, apoyando visitas más ordenadas a destinos urbanos y culturales y permitiendo decisiones que reducen la presión turística mal distribuida. |
| **ODS 12** | Producción y consumo responsables | Visibiliza **gastos estimados** por día y por viaje (campo `price` en actividades, transportes y estancias), fomentando **decisiones de consumo más conscientes** (elegir menos tramos caros, repartir actividades, elegir alojamientos coherentes con el presupuesto). |
| **ODS 13** | Acción por el clima | Indirectamente: al explicitar los **transportes** del viaje, el usuario puede **comparar** modos de mayor/menor emisión (vuelo vs tren). El software no calcula huella de carbono por defecto, pero **habilita la transparencia** que es la base para futuras métricas (extensión propuesta como mejora). |
| **ODS 4** | Educación de calidad | Como proyecto **académico** con documentación pública en MkDocs/GitHub Pages, sirve de material formativo (caso real de stack moderno y buenas prácticas DevOps). |

### Justificación breve

PRW-VEP no resuelve por sí solo un ODS ambiental complejo, pero **encaja** como herramienta de:

- **Transparencia y organización** (ODS 12).
- **Movilidad planificada** (ODS 11).
- **Infraestructura digital** (ODS 9) y **educación** (ODS 4).
- **Empleabilidad y valor del tiempo** (ODS 8).
- **Habilitador** indirecto de **acción climática** (ODS 13) cuando se completa con criterio.

El impacto positivo depende del **uso** (datos introducidos y decisiones del viajero), por lo que se prioriza la **transparencia metodológica** sobre afirmaciones de mejora absoluta.

---

## Impactos, riesgos y oportunidades (mínimo cinco)

### Metodología de cálculo de materialidad

Se aplica una matriz **probabilidad × impacto** con escala 1–5:

- **Probabilidad (P)**: 1 (improbable) — 5 (casi seguro).
- **Impacto (I)**: 1 (insignificante) — 5 (muy alto).
- **Score = P × I**.
- Umbral de **materialidad**: *Score ≥ 9*. Por debajo se considera **no material** (conviene monitorizar pero no priorizar en la memoria).

### Impactos identificados

#### 1. Reducción de material impreso (ambiental — oportunidad)

- **Descripción:** itinerarios y notas concentrados en la app reducen impresiones y fotocopias.
- **Riesgo asociado:** se sustituye por consumo energético de dispositivos y servidores.
- **P × I:** 4 × 2 = **8** → **No material** (impacto bajo; la población usuaria ya digitaliza estas notas).

#### 2. Mayor claridad presupuestaria (económico — oportunidad)

- **Descripción:** los campos `price` agregados por día y viaje ayudan a detectar desviaciones antes del viaje.
- **Riesgo asociado:** falsa sensación de exactitud si los precios no se actualizan.
- **P × I:** 5 × 4 = **20** → **Material** para el objetivo del producto (planificación con coste).

#### 3. Desigualdad digital (social — riesgo)

- **Descripción:** usuarios sin dispositivo adecuado o sin competencias digitales pueden quedar excluidos.
- **Mitigación:** guía de usuario clara (**[Uso](usage.md)**), diseño responsive, modo oscuro, criterios WCAG en la UI (**[DOR](dor.md)**).
- **P × I:** 3 × 3 = **9** → **Material** (típico de servicios web; se gestiona con accesibilidad y formación).

#### 4. Consumo energético del despliegue (ambiental — riesgo)

- **Descripción:** cada petición HTTP y cada contenedor consume electricidad en el centro de datos.
- **Mitigación:** imágenes optimizadas (`composer install --no-dev` en build), caché en API y NGINX, apagado de entornos demo fuera de horario, elección de proveedor con mix renovable.
- **P × I:** 4 × 3 = **12** → **Material** (sube en producción masiva; en demo académica es contenido).

#### 5. Privacidad y huella de datos (social/gobernanza — riesgo)

- **Descripción:** los viajes pueden revelar **patrones personales** (fechas, lugares, notas).
- **Mitigación:** HTTPS, tokens con caducidad, política de privacidad, minimización de datos, cabeceras de seguridad en NGINX, contraseñas hasheadas (cast `password ⇒ 'hashed'` en `User`).
- **P × I:** 5 × 4 = **20** → **Material** en cualquier despliegue con usuarios reales (cumplimiento RGPD obligatorio).

#### 6. Empleabilidad y formación (económico/social — oportunidad)

- **Descripción:** el stack Vue + Laravel + PostgreSQL + Docker + Portainer + CI/CD es **transferible** al mercado laboral TIC.
- **P × I:** 5 × 4 = **20** → **Material** en contexto formativo (núcleo del SOJ ligado al capital humano).

#### 7. Riesgo de dependencia de terceros (gobernanza — riesgo)

- **Descripción:** uso de servicios externos en despliegue real (proveedor cloud, GitHub Actions, GitHub Pages, registro de imágenes).
- **Mitigación:** stack 100 % open source y dockerizado: portable a cualquier proveedor con `docker compose`. La documentación incluye un segundo entorno (Portainer) gestionado por el propio equipo.
- **P × I:** 3 × 3 = **9** → **Material** (a vigilar en planificación de continuidad).

### Tabla resumen de materialidad

| # | Impacto | Tipo | P | I | Score | ¿Material? |
|---|---------|------|---|---|-------|------------|
| 1 | Reducción material impreso | Ambiental — oportunidad | 4 | 2 | 8 | No |
| 2 | Claridad presupuestaria | Económico — oportunidad | 5 | 4 | **20** | Sí |
| 3 | Desigualdad digital | Social — riesgo | 3 | 3 | **9** | Sí |
| 4 | Consumo energético | Ambiental — riesgo | 4 | 3 | **12** | Sí |
| 5 | Privacidad / huella datos | Social/Gobernanza — riesgo | 5 | 4 | **20** | Sí |
| 6 | Empleabilidad y formación | Económico/Social — oportunidad | 5 | 4 | **20** | Sí |
| 7 | Dependencia de terceros | Gobernanza — riesgo | 3 | 3 | **9** | Sí |

> **Conclusión:** seis de siete impactos resultan **materiales** y se priorizan en la memoria de sostenibilidad. El proyecto debe vigilar especialmente la **claridad presupuestaria** (núcleo del producto), la **privacidad** (cumplimiento RGPD) y la **empleabilidad** (eje del marco IPW).

---

## Evaluación global por dimensión

| Dimensión | Impacto neto estimado | Comentario |
|-----------|------------------------|------------|
| Ambiental | **Medio** | Digitalización favorable; energía y equipos como contrapeso. |
| Social | **Medio** | Accesibilidad web e idioma como ejes positivos; datos personales como riesgo. |
| Económico | **Medio–alto** | Valor de uso, ahorro de tiempo y empleabilidad; riesgo de percepción de exactitud presupuestaria. |
| Gobernanza | **Medio** | Cumplimiento RGPD y dependencia de terceros como ejes a vigilar. |

La **materialidad** (qué impactos priorizar al informar) depende del **contexto de despliegue**:

- En **proyecto académico**, prima la **transparencia metodológica**, el análisis de riesgos y la **empleabilidad**.
- En **producto comercial**, prima el **cumplimiento RGPD**, la **seguridad** y la **huella** del hosting.

---

## Indicadores de seguimiento (sugeridos)

| Indicador | Tipo | Ejemplo de medición |
|-----------|------|---------------------|
| Usuarios activos mensuales | Social / económico | Nº de cuentas con al menos un viaje actualizado en el mes |
| Viajes con precios completados | ODS 12 | % de viajes con ≥ 1 ítem con `price` > 0 |
| Tiempo medio de creación de viaje | ODS 8 | Segundos desde apertura del formulario hasta guardado (telemetría ética) |
| Incidencias de seguridad | Gobernanza | Nº de eventos 401/403 anómalos monitorizados |
| Energía estimada del despliegue | Ambiental | kWh/mes × factor de emisiones del mix eléctrico |

---

## Referencias

- Marco de empleabilidad y plan de marketing/sostenibilidad: **[IPW](ipw.md)**
- Despliegue y eficiencia operativa: **[DPL](dpl.md)**
- Accesibilidad y diseño: **[DOR](dor.md)**

# Sostenibilidad y ODS (SOJ)

Este apartado enlaza el proyecto **Voyager Experience Planner (PRW-VEP)** con los **Objetivos de Desarrollo Sostenible (ODS)** de la Agenda 2030 y analiza **impactos**, **riesgos**, **oportunidades** y una **evaluación de materialidad** cualitativa, adecuada para memoria académica o informe de sostenibilidad simplificado.

---

## Objetivos de Desarrollo Sostenible (ODS) relevantes

| ODS | Título (ONU) | Vinculación con PRW-VEP |
|-----|----------------|-------------------------|
| **ODS 8** | Trabajo decente y crecimiento económico | Digitalización de la planificación que **ahorra tiempo** y mejora la **productividad** del viajero; perfiles técnicos empleables en el sector digital. |
| **ODS 9** | Industria, innovación e infraestructura | Uso de **infraestructura web moderna** (API, contenedores) como ejemplo de **innovación accesible** en servicios turísticos. |
| **ODS 11** | Ciudades y comunidades sostenibles | Facilita **movilidad planificada** y conocimiento de desplazamientos (**transportes**), apoyando visitas más ordenadas a destinos urbanos y culturales. |
| **ODS 12** | Producción y consumo responsables | Visibiliza **gastos estimados** por día y viaje, fomentando **decisiones de consumo** más conscientes (elegir menos tramos caros, repartir actividades, etc.). |
| **ODS 13** | Acción por el clima | Indirectamente: al explicitar **transportes**, el usuario puede **comparar** modos más intensivos en emisiones (vuelo vs tren) si completa el plan con criterio; el software no calcula huella de carbono por defecto, pero **habilita la transparencia** de trayectos. |

### Justificación breve

El producto no resuelve por sí solo un ODS ambiental complejo, pero **encaja** como herramienta de **transparencia y organización** (ODS 12), **movilidad planificada** (ODS 11), **infraestructura digital** (ODS 9) y **valor económico del tiempo** (ODS 8). Para un trabajo académico de sostenibilidad conviene **matizar**: el impacto positivo depende del **uso** (datos introducidos y decisiones del viajero).

---

## Impactos (mínimo cinco)

### 1. Reducción de material impreso (ambiental — oportunidad)

**Descripción:** Itinerarios y notas concentrados en la aplicación pueden reducir impresiones.

**Riesgo:** Sustitución por consumo energético de dispositivos y servidores.

**Valoración materialidad:** **Media** (depende del comportamiento del usuario).

---

### 2. Mayor claridad presupuestaria (económico — oportunidad)

**Descripción:** Los campos `price` agregados por día y viaje ayudan a detectar desviaciones antes del viaje.

**Riesgo:** Falsa sensación de exactitud si los precios no se actualizan.

**Valoración materialidad:** **Alta** para el objetivo de producto (planificación con coste).

---

### 3. Desigualdad digital (social — riesgo)

**Descripción:** Usuarios sin dispositivo adecuado o sin competencias digitales pueden quedar excluidos.

**Mitigación:** Guía de usuario clara, diseño responsive, formación breve.

**Valoración materialidad:** **Media** (típico de servicios web).

---

### 4. Consumo energético del despliegue (ambiental — riesgo)

**Descripción:** Cada petición HTTP y cada contenedor consumen electricidad en el centro de datos.

**Mitigación:** Imágenes optimizadas, caché donde proceda, apagar entornos de demo fuera de horario, elegir proveedor con mix renovable.

**Valoración materialidad:** **Media** (baja en demo académica; sube en producción masiva).

---

### 5. Privacidad y huella de datos (social / gobernanza — riesgo)

**Descripción:** Los viajes pueden revelar **patrones personales** (fechas, lugares, notas).

**Mitigación:** HTTPS, tokens con caducidad, política de privacidad, mínimo tratamiento.

**Valoración materialidad:** **Alta** en cualquier despliegue con usuarios reales.

---

### 6. Empleabilidad y formación (económico / social — oportunidad)

**Descripción:** El stack Vue + Laravel + PostgreSQL + Docker es **transferible** al mercado laboral TIC.

**Valoración materialidad:** **Alta** en contexto formativo (SOJ vinculado a capital humano).

---

## Evaluación global (materialidad)

| Dimensión | Impacto estimado | Comentario |
|-----------|------------------|------------|
| Ambiental | **Medio** | Digitalización favorable; energía y equipos como contrapeso |
| Social | **Medio** | Accesibilidad web y datos personales como ejes |
| Económico | **Medio–alto** | Valor de uso y ahorro de tiempo; riesgo de percepción de exactitud presupuestaria |

La **materialidad** (qué impactos son prioritarios para informar) depende del **contexto de despliegue**:

- En **proyecto académico**, prima la **transparencia metodológica** y el análisis de riesgos.
- En **producto comercial**, prima el **cumplimiento RGPD**, la **seguridad** y la **huella** del hosting.

---

## Indicadores de seguimiento (sugeridos)

| Indicador | Tipo | Ejemplo de medición |
|-----------|------|---------------------|
| Usuarios activos mensuales | Social / económico | Número de cuentas con al menos un viaje actualizado en el mes |
| Viajes con precios completados | ODS 12 | % de viajes con ≥1 ítem con `price` > 0 |
| Tiempo medio de creación de viaje | ODS 8 | Segundos desde apertura de formulario hasta guardado (telemetría ética) |
| Incidencias de seguridad | Gobernanza | Número de eventos 401/403 anómalos monitorizados |

---

## Referencias

- Marco de empleabilidad y negocio: [Empleabilidad (IPW)](ipw.md)
- Despliegue y eficiencia operativa: [Despliegue](deployment.md)

# Base de datos

El sistema utiliza **PostgreSQL** como motor relacional. El esquema se gestiona con **migraciones Laravel** en `backend/database/migrations/`.

---

## Modelo conceptual

Un **usuario** posee muchos **viajes**. Cada **viaje** tiene muchos **días** ordenados. Cada **día** puede tener:

- muchas **actividades** (con orden y horarios),
- muchos **transportes**,
- muchas **estancias** (alojamientos).

Las entidades hijas de un día se eliminan en cascada si se borra el día o el viaje correspondiente (según restricciones `onDelete` definidas en migraciones).

---

## Tablas principales

### `users`

Usuarios de la aplicación. Laravel añade convenciones estándar; la autenticación API usa **Sanctum** (`personal_access_tokens` u otras tablas que aporte la publicación de Sanctum).

### `trips`

| Campo (orientativo) | Descripción |
|---------------------|-------------|
| `id` | Clave primaria |
| `user_id` | FK al propietario |
| `name` | Nombre del viaje |
| `description` | Texto libre opcional |
| `start_date`, `end_date` | Rango del viaje (tras migraciones de fechas) |
| `timestamps` | `created_at`, `updated_at` |

Al **crear** un viaje con fechas válidas, el backend puede generar automáticamente un **día por cada fecha** del intervalo.

### `days`

| Campo | Descripción |
|-------|-------------|
| `trip_id` | FK a `trips` |
| `title` | Etiqueta del día (p. ej. «Día 1») |
| `order` | Orden dentro del viaje |

### `activities`

| Campo | Descripción |
|-------|-------------|
| `day_id` | FK a `days` |
| `title` | Nombre de la actividad |
| `order` | Orden dentro del día |
| `start_time`, `end_time` | Ventana horaria (tras migraciones) |
| `completed` | Marca de hecho (boolean) |
| `price` | Importe estimado en euros (decimal, ver siguiente apartado) |

### `transports`

| Campo | Descripción |
|-------|-------------|
| `day_id` | FK |
| `from`, `to` | Origen y destino del trayecto |
| `type` | Tipo de transporte (texto / categoría según diseño) |
| `price` | Importe estimado |
| `duration`, `notes` | Metadatos opcionales |

### `stays`

| Campo | Descripción |
|-------|-------------|
| `day_id` | FK |
| `name`, `location` | Identificación del alojamiento |
| `price` | Importe estimado |
| `check_in`, `check_out` | Fechas/horas de entrada y salida |
| `notes` | Notas libres |

---

## Campo `price` y lógica de gastos

### Definición en base de datos

La migración `2026_04_18_120000_add_price_to_activity_transport_stay` añade:

- `activities.price` — `decimal(10,2)`, **por defecto 0**
- `transports.price` — idem
- `stays.price` — idem

No existe en el modelo actual una tabla separada de «líneas de factura»; el **presupuesto estimado** se deriva de la **suma** de estos importes.

### Capa de aplicación

- **Laravel:** los modelos hacen **cast** a `decimal:2` donde corresponde, garantizando salida JSON numérica coherente.
- **Frontend:** funciones en `frontend/src/utils/tripTotals.ts`:
  - `clampPrice`: evita negativos y valores no numéricos.
  - `getActivitiesTotal`, `getTransportsTotal`, `getStaysTotal`: subtotales por tipo en un día.
  - `getDayTotal`: suma de los tres anteriores.
  - `getTripTotal`: suma de todos los días del viaje.
  - `formatSpentEUR`: presentación con símbolo `€` y dos decimales.

Así, el **mismo criterio de negocio** (sumar precios explícitos en ítems planificados) se documenta en dos capas: persistencia y presentación.

---

## Rendimiento

Existen migraciones de **índices** orientadas a consultas frecuentes por `trip_id`, `day_id`, etc. (p. ej. `2026_04_14_100000_add_performance_indexes_to_trip_tables.php`). Revisar el fichero para el listado exacto de índices creados.

---

## Referencias

- API que expone estos datos: [Backend (Laravel)](backend.md)
- Instalación y migraciones: [Entorno e instalación](setup.md)

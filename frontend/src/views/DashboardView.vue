<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { useTripsStore } from '@/stores/trips'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Trip } from '@/types/trip'
import {
  getNextFutureActivity,
  getTripActivityPreview,
  getTripProgress,
  tripActivityCount,
} from '@/utils/tripUi'
import { getTripDuration } from '@/utils/tripDates'

const tripsStore = useTripsStore()
const router = useRouter()

const showCreateTrip = ref(false)
const newTripName = ref('')
const newTripDescription = ref('')
const startDate = ref('')
const endDate = ref('')
const createTripFormError = ref<string | null>(null)

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const openCreateTripPanel = () => {
  if (tripsStore.isLoading || tripsStore.isCreatingTrip) return
  createTripFormError.value = null
  if (!startDate.value || !endDate.value) {
    const today = new Date()
    const end = new Date(today)
    end.setDate(end.getDate() + 6)
    startDate.value = toYmd(today)
    endDate.value = toYmd(end)
  }
  showCreateTrip.value = true
}

const cancelCreateTrip = () => {
  showCreateTrip.value = false
  newTripName.value = ''
  newTripDescription.value = ''
  startDate.value = ''
  endDate.value = ''
  createTripFormError.value = null
}

watch(startDate, (s) => {
  if (s && endDate.value && endDate.value < s) {
    endDate.value = s
  }
})

const submitCreateTrip = async () => {
  if (tripsStore.isLoading || tripsStore.isCreatingTrip) return
  createTripFormError.value = null
  const name = newTripName.value.trim()
  if (!name) return
  if (!startDate.value || !endDate.value) {
    createTripFormError.value = 'Indica fecha de inicio y fin.'
    return
  }
  if (endDate.value < startDate.value) {
    createTripFormError.value = 'La fecha de fin debe ser igual o posterior a la de inicio.'
    return
  }
  const idsBefore = new Set(tripsStore.trips.map((t) => t.id))
  await tripsStore.addTrip(name, newTripDescription.value.trim(), startDate.value, endDate.value)
  await nextTick()
  if (!tripsStore.errorMessage) {
    const created = tripsStore.trips.find((t) => !idsBefore.has(t.id))
    cancelCreateTrip()
    if (created) {
      await router.push(`/trip/${created.id}`)
    }
  }
}

function dayCount(trip: Trip) {
  return trip.days?.length ?? 0
}

function activityCount(trip: Trip) {
  return tripActivityCount(trip)
}

function activityPreview(trip: Trip) {
  return getTripActivityPreview(trip, 2)
}

function nextActivityLine(trip: Trip): string | null {
  const next = getNextFutureActivity(trip)
  if (!next) return null
  return `🕘 Próxima pendiente: ${next.title} — ${next.start_time}`
}

function nextActivityStatus(trip: Trip): 'empty' | 'no-pending' | 'has-next' {
  const total = tripActivityCount(trip)
  if (total === 0) return 'empty'
  if (!getNextFutureActivity(trip)) return 'no-pending'
  return 'has-next'
}

onMounted(() => {
  tripsStore.loadTrips()
})

const tripsSorted = computed(() =>
  [...tripsStore.trips].sort((a, b) => a.name.localeCompare(b.name, 'es'))
)

const totalDays = computed(() => {
  return tripsStore.trips.reduce((total, trip) => {
    const d = getTripDuration(trip)
    if (d === null) return total
    return total + d
  }, 0)
})

const goTrip = (id: number) => {
  router.push(`/trip/${id}`)
}

function tripProgress(trip: Trip) {
  return getTripProgress(trip)
}
</script>

<template>
  <MainLayout>
    <div class="dashboard-head">
      <h1>Mi Experiencia</h1>
      <button
        type="button"
        class="btn-create"
        :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip"
        aria-label="Abrir formulario para crear un nuevo viaje"
        @click="openCreateTripPanel"
      >
        Crear viaje
      </button>
    </div>

    <div v-if="showCreateTrip" class="create-trip-panel card-hover">
      <h2 class="create-trip-title">Nuevo viaje</h2>
      <form class="create-trip-form" @submit.prevent="submitCreateTrip">
        <label class="create-trip-field">
          <span>Nombre</span>
          <input
            v-model="newTripName"
            type="text"
            autocomplete="off"
            placeholder="Ej. Primavera en Kyoto"
            :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip"
            required
          />
        </label>
        <label class="create-trip-field">
          <span>Descripción</span>
          <textarea
            v-model="newTripDescription"
            rows="3"
            placeholder="Notas o resumen del viaje (opcional)"
            :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip"
          />
        </label>
        <div class="create-trip-dates">
          <label class="create-trip-field create-trip-field--inline">
            <span>Inicio</span>
            <input v-model="startDate" type="date" required :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip" />
          </label>
          <label class="create-trip-field create-trip-field--inline">
            <span>Fin</span>
            <input
              v-model="endDate"
              type="date"
              required
              :min="startDate || undefined"
              :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip"
            />
          </label>
        </div>
        <p v-if="createTripFormError" class="create-trip-error" role="alert">
          {{ createTripFormError }}
        </p>
        <div class="create-trip-actions">
          <button
            type="submit"
            class="btn-create-submit"
            :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip || !newTripName.trim() || !startDate || !endDate"
          >
            {{ tripsStore.isCreatingTrip ? 'Creando...' : 'Crear' }}
          </button>
          <button type="button" class="btn-create-cancel" :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip" @click="cancelCreateTrip">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="tripsStore.isBootstrapping && !tripsSorted.length"
      class="dashboard-skeleton"
      aria-busy="true"
      aria-label="Cargando viajes"
    >
      <div class="stats stats--skeleton">
        <div class="skeleton skeleton-card stat-skeleton" />
      </div>
      <h2 class="trips-heading">Tus viajes</h2>
      <ul class="trip-grid trip-grid--skeleton">
        <li v-for="n in 6" :key="n" class="skeleton skeleton-card trip-card-skeleton">
          <div class="skeleton skeleton-text skel-title" />
          <div class="skeleton skeleton-text skel-meta" />
          <div class="skeleton skeleton-text skel-meta short" />
          <div class="skeleton skeleton-text skel-preview" />
        </li>
      </ul>
    </div>

    <template v-else>
    <div class="dashboard-stats">
      <p class="dashboard-stats-label">🌍 Días de viaje totales</p>
      <h2 v-if="totalDays > 0" class="dashboard-stats-value">{{ totalDays }}</h2>
      <p v-else class="dashboard-stats-empty">Aún no has planificado días de viaje ✈️</p>
    </div>

    <div class="stats">
      <div class="stat-card card-hover">
        <h3>Total de viajes</h3>
        <p class="stat-value">{{ tripsStore.totalTrips }}</p>
      </div>
    </div>

    <h2 class="trips-heading">Tus viajes</h2>

    <ul v-if="tripsSorted.length" class="trip-grid">
      <li
        v-for="trip in tripsSorted"
        :key="trip.id"
        class="trip-card"
        role="button"
        tabindex="0"
        @click="goTrip(trip.id)"
        @keydown.enter.prevent="goTrip(trip.id)"
        @keydown.space.prevent="goTrip(trip.id)"
      >
        <h3 class="trip-name">{{ trip.name }}</h3>
        <ul class="trip-meta">
          <li>{{ dayCount(trip) }} {{ dayCount(trip) === 1 ? 'día' : 'días' }}</li>
          <li>{{ activityCount(trip) }} {{ activityCount(trip) === 1 ? 'actividad' : 'actividades' }}</li>
          <li v-if="activityCount(trip) > 0" class="trip-progress-meta">
            Progreso {{ tripProgress(trip) }}%
          </li>
        </ul>
        <div
          v-if="activityCount(trip) > 0"
          class="trip-progress-bar"
          role="progressbar"
          :aria-valuenow="tripProgress(trip)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progreso del viaje ${trip.name}: ${tripProgress(trip)} por ciento`"
        >
          <div class="trip-progress-fill" :style="{ width: `${tripProgress(trip)}%` }" />
        </div>
        <ul v-if="activityPreview(trip).length" class="trip-preview">
          <li v-for="(row, idx) in activityPreview(trip)" :key="idx" class="trip-preview-row">
            <span class="trip-preview-time">🕘 {{ row.start_time }}</span>
            <span class="trip-preview-title">{{ row.title }}</span>
          </li>
        </ul>
        <p v-if="nextActivityStatus(trip) === 'has-next'" class="trip-next">
          {{ nextActivityLine(trip) }}
        </p>
        <p v-else-if="nextActivityStatus(trip) === 'no-pending'" class="trip-next muted">
          Sin actividades pendientes
        </p>
        <p v-else class="trip-next muted">
          Sin actividades todavía — abre el viaje para planificar
        </p>
        <span class="trip-cta">Abrir →</span>
      </li>
    </ul>

    <p v-else class="empty-dash">
      Aún no hay viajes. Crea uno para empezar 🚀
    </p>
    </template>
  </MainLayout>
</template>

<style scoped>
.dashboard-stats {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 20px;
  background: var(--bg);
}

.dashboard-stats-label {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-light);
}

.dashboard-stats-value {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  color: var(--primary);
}

.dashboard-stats-empty {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-light);
  line-height: 1.45;
}

.dashboard-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

h1 {
  margin: 0;
}

.btn-create {
  padding: 10px 18px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
}

.btn-create:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.create-trip-panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px 22px;
  margin-bottom: 24px;
  max-width: 520px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.create-trip-title {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 700;
}

.create-trip-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.create-trip-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text);
}

.create-trip-field input,
.create-trip-field textarea {
  font-weight: 400;
  font-size: 1rem;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
}

.create-trip-field textarea {
  resize: vertical;
  min-height: 72px;
}

.create-trip-field input::placeholder,
.create-trip-field textarea::placeholder {
  color: var(--text-light);
}

.create-trip-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.create-trip-field--inline {
  flex: 1;
  min-width: 140px;
}

.create-trip-error {
  margin: 0;
  font-size: 0.9rem;
  color: #b00020;
}

.create-trip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.btn-create-submit {
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}

.btn-create-submit:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-create-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-create-cancel {
  padding: 10px 18px;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-weight: 600;
}

.btn-create-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dashboard-skeleton {
  margin-bottom: 8px;
}

.stats--skeleton {
  margin-bottom: 24px;
}

.stat-skeleton {
  max-width: 240px;
  min-height: 88px;
}

.trip-grid--skeleton {
  margin-top: 4px;
}

.trip-card-skeleton {
  min-height: 168px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.skel-title {
  width: 70%;
  height: 1.15rem;
}

.skel-meta {
  width: 55%;
  height: 0.85rem;
}

.skel-meta.short {
  width: 40%;
}

.skel-preview {
  width: 90%;
  margin-top: 6px;
  height: 0.8rem;
}

.stats {
  margin-bottom: 28px;
}

.stat-card {
  background: var(--card);
  padding: 18px 22px;
  border-radius: 12px;
  max-width: 240px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.stat-card h3 {
  margin: 0 0 8px;
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.85;
}

.stat-value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
}

.trips-heading {
  margin: 0 0 14px;
  font-size: 1.15rem;
}

.trip-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.trip-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 20px 18px;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s ease;
}

.trip-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  border-color: var(--border);
}

.trip-card:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.trip-name {
  margin: 0 0 12px;
  font-size: 1.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-meta {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  font-size: 0.92rem;
  color: var(--text-light);
}

.trip-meta li {
  margin-bottom: 4px;
}

.trip-progress-meta {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--primary);
}

.trip-progress-bar {
  height: 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 0 12px;
  overflow: hidden;
}

.trip-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4px;
  transition: width 0.22s ease;
}

.trip-preview {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--text-light);
}

.trip-preview-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.trip-preview-row:last-child {
  margin-bottom: 0;
}

.trip-preview-time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #2e7d32;
  flex-shrink: 0;
}

.trip-preview-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-next {
  margin: 0 0 12px;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.trip-next.muted {
  color: var(--text-light);
  font-style: italic;
}

.trip-cta {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary);
}

.empty-dash {
  color: var(--text-light);
  font-size: 1rem;
  margin-top: 8px;
}

:global(.dark) .stat-card,
:global(.dark) .trip-card {
  border-color: var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

:global(.dark) .create-trip-panel {
  border-color: var(--border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

:global(.dark) .create-trip-field input,
:global(.dark) .create-trip-field textarea {
  background: var(--card);
  border-color: var(--border);
  color: var(--text);
}

:global(.dark) .create-trip-field input::placeholder,
:global(.dark) .create-trip-field textarea::placeholder {
  color: var(--text-light);
}

:global(.dark) .btn-create-cancel {
  border-color: var(--border);
  color: var(--text);
}

:global(.dark) .trip-meta,
:global(.dark) .trip-next,
:global(.dark) .trip-preview {
  color: var(--text);
}

:global(.dark) .trip-next.muted,
:global(.dark) .empty-dash {
  color: var(--text-light);
}

:global(.dark) .trip-preview-time {
  color: #81c784;
}
</style>

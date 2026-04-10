<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { useTripsStore } from '@/stores/trips'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Trip } from '@/types/trip'
import { getFirstScheduledActivity, tripActivityCount } from '@/utils/tripUi'

const tripsStore = useTripsStore()
const router = useRouter()

const createTrip = async () => {
  const name = prompt('Nombre del viaje:')

  if (name) {
    await tripsStore.addTrip(name.trim())
  }
}

function dayCount(trip: Trip) {
  return trip.days?.length ?? 0
}

function activityCount(trip: Trip) {
  return tripActivityCount(trip)
}

function nextActivityLine(trip: Trip) {
  const next = getFirstScheduledActivity(trip)
  if (!next) return null
  return `🕘 Próxima: ${next.title} — ${next.start_time}`
}

onMounted(() => {
  tripsStore.loadTrips()
})

const tripsSorted = computed(() =>
  [...tripsStore.trips].sort((a, b) => a.name.localeCompare(b.name, 'es'))
)

const goTrip = (id: number) => {
  router.push(`/trip/${id}`)
}
</script>

<template>
  <MainLayout>
    <div class="dashboard-head">
      <h1>Mi Experiencia</h1>
      <button :disabled="tripsStore.isLoading" class="btn-create" @click="createTrip">
        {{ tripsStore.isLoading ? 'Creando...' : 'Crear viaje' }}
      </button>
    </div>

    <Transition name="feedback">
      <p v-if="tripsStore.errorMessage" class="feedback feedback-error" role="alert">
        {{ tripsStore.errorMessage }}
      </p>
    </Transition>
    <Transition name="feedback">
      <p v-if="tripsStore.successMessage" class="feedback feedback-success">
        {{ tripsStore.successMessage }}
      </p>
    </Transition>

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
        class="trip-card card-hover"
        role="button"
        tabindex="0"
        @click="goTrip(trip.id)"
        @keydown.enter="goTrip(trip.id)"
      >
        <h3 class="trip-name">{{ trip.name }}</h3>
        <ul class="trip-meta">
          <li>{{ dayCount(trip) }} {{ dayCount(trip) === 1 ? 'día' : 'días' }}</li>
          <li>{{ activityCount(trip) }} {{ activityCount(trip) === 1 ? 'actividad' : 'actividades' }}</li>
        </ul>
        <p v-if="nextActivityLine(trip)" class="trip-next">
          {{ nextActivityLine(trip) }}
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
  </MainLayout>
</template>

<style scoped>
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
  background: #007bff;
  color: #fff;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.35);
}

.btn-create:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.feedback {
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.feedback-error {
  background: #ffebee;
  color: #b00020;
  border: 1px solid #ffcdd2;
}

.feedback-success {
  background: #e8f5e9;
  color: #1b5e20;
  border: 1px solid #c8e6c9;
}

.feedback-enter-active,
.feedback-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.stats {
  margin-bottom: 28px;
}

.stat-card {
  background: var(--card);
  padding: 18px 22px;
  border-radius: 12px;
  max-width: 240px;
  border: 1px solid #e5e5e5;
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
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.trip-card:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.trip-name {
  margin: 0 0 12px;
  font-size: 1.15rem;
}

.trip-meta {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
  font-size: 0.92rem;
  color: #555;
}

.trip-meta li {
  margin-bottom: 4px;
}

.trip-next {
  margin: 0 0 12px;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #333;
}

.trip-next.muted {
  color: #888;
  font-style: italic;
}

.trip-cta {
  font-size: 0.88rem;
  font-weight: 600;
  color: #007bff;
}

.empty-dash {
  color: #666;
  font-size: 1rem;
  margin-top: 8px;
}

:global(.dark) .stat-card,
:global(.dark) .trip-card {
  border-color: #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

:global(.dark) .trip-meta,
:global(.dark) .trip-next {
  color: #ccc;
}

:global(.dark) .feedback-error {
  background: #3e2723;
  color: #ffcdd2;
  border-color: #5d4037;
}

:global(.dark) .feedback-success {
  background: #1b3a1e;
  color: #c8e6c9;
  border-color: #2e4a32;
}
</style>

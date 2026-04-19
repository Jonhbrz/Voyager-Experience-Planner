<template>
  <li class="trip-card-wrap">
    <button
      type="button"
      class="trip-card"
      :aria-labelledby="`trip-card-title-${trip.id}`"
      @click="emit('open', trip.id)"
    >
      <h3 :id="`trip-card-title-${trip.id}`" class="trip-name">{{ trip.name }}</h3>
      <ul class="trip-meta">
        <li>{{ trip.daysLabel }}</li>
        <li>{{ trip.activitiesLabel }}</li>
        <li class="trip-spent">{{ trip.spentLabel }}</li>
        <li v-if="trip.progress > 0" class="trip-progress-meta">Progreso {{ trip.progress }}%</li>
      </ul>
      <div
        v-if="trip.progress > 0"
        class="trip-progress-bar"
        aria-hidden="true"
      >
        <div class="trip-progress-fill" :style="{ width: `${trip.progress}%` }" />
      </div>
      <ul v-if="trip.preview.length" class="trip-preview">
        <li
          v-for="(row, idx) in trip.preview"
          :key="idx"
          class="trip-preview-row"
          :aria-label="`Actividad a las ${row.start_time}: ${row.title}`"
        >
          <span class="trip-preview-time">
            <span aria-hidden="true">🕘 </span>{{ row.start_time }}
          </span>
          <span class="trip-preview-title">{{ row.title }}</span>
        </li>
      </ul>
      <p v-if="trip.nextStatus === 'has-next'" class="trip-next">
        {{ trip.nextLine }}
      </p>
      <p v-else-if="trip.nextStatus === 'no-pending'" class="trip-next muted">
        Sin actividades pendientes
      </p>
      <p v-else class="trip-next muted">
        Sin actividades todavía — abre el viaje para planificar
      </p>
      <span class="trip-cta" aria-hidden="true">Abrir →</span>
    </button>
  </li>
</template>

<script setup lang="ts">
interface TripPreviewRow {
  start_time: string
  title: string
}

interface DashboardTripItemVm {
  id: number
  name: string
  daysLabel: string
  activitiesLabel: string
  spentLabel: string
  progress: number
  preview: TripPreviewRow[]
  nextLine: string | null
  nextStatus: 'empty' | 'no-pending' | 'has-next'
}

defineProps<{
  trip: DashboardTripItemVm
}>()

const emit = defineEmits<{
  open: [tripId: number]
}>()
</script>

<style scoped>
.trip-card-wrap {
  display: contents;
}

.trip-card {
  appearance: none;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 20px 18px;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s ease;
  font: inherit;
  color: inherit;
  width: 100%;
  margin: 0;
  display: block;
}

.trip-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  border-color: var(--border);
}

.trip-card:focus-visible {
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

.trip-spent {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary);
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

:global(.dark) .trip-card {
  border-color: var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

:global(.dark) .trip-meta,
:global(.dark) .trip-next,
:global(.dark) .trip-preview {
  color: var(--text);
}

:global(.dark) .trip-next.muted {
  color: var(--text-light);
}

:global(.dark) .trip-preview-time {
  color: #81c784;
}
</style>

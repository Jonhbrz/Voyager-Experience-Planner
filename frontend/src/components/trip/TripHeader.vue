<template>
  <header class="trip-page-header section">
    <div class="trip-header card-hover">
      <div v-if="!editingTrip" class="trip-header-view">
        <div class="trip-header-text">
          <h1>{{ tripName }}</h1>
          <p v-if="tripDurationDays !== null" class="trip-duration">
            {{ tripDurationDays }} {{ tripDurationDays === 1 ? 'día' : 'días' }}
          </p>
          <p v-if="tripDateRange" class="trip-date-range">{{ tripDateRange }}</p>
          <p v-if="tripSpentLabel" class="trip-spent">{{ tripSpentLabel }}</p>
          <p v-if="tripDescription?.trim()" class="trip-desc-readonly">{{ tripDescription }}</p>
          <div v-if="tripHasActivities" class="trip-progress-block" role="group" aria-label="Progreso del itinerario">
            <div class="trip-progress-head">
              <span>Progreso del viaje</span>
              <span class="trip-progress-value">{{ tripProgressPercent }}%</span>
            </div>
            <div
              class="trip-progress-bar trip-progress-bar--header"
              role="progressbar"
              :aria-valuenow="tripProgressPercent"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`Progreso del viaje: ${tripProgressPercent} por ciento`"
            >
              <div class="trip-progress-fill" :style="{ width: `${tripProgressPercent}%` }" />
            </div>
          </div>
        </div>
        <div class="actions">
          <button type="button" :disabled="isBootstrapping" aria-label="Editar nombre del viaje" @click="emit('start-edit')">
            ✏️
          </button>
          <button type="button" :disabled="isBootstrapping" aria-label="Eliminar viaje" @click="emit('delete-trip')">
            🗑
          </button>
        </div>
      </div>

      <form v-else class="trip-edit-name-form" @submit.prevent="emit('save-edit')">
        <label class="sr-only" for="edit-trip-name-input">Nombre del viaje</label>
        <input
          id="edit-trip-name-input"
          :value="editTripName"
          placeholder="Nombre del viaje"
          :disabled="isBootstrapping"
          autocomplete="off"
          @input="onNameInput"
        />
        <button type="submit" :disabled="isBootstrapping || !editTripName.trim()" aria-label="Guardar nombre del viaje">
          Guardar
        </button>
        <button type="button" :disabled="isBootstrapping" aria-label="Cancelar edición del viaje" @click="emit('cancel-edit')">
          Cancelar
        </button>
      </form>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  tripName: string
  tripDescription: string | null | undefined
  tripDurationDays: number | null
  tripDateRange: string | null
  tripHasActivities: boolean
  tripProgressPercent: number
  /** Total estimado del viaje (EUR), ej. €123.45 */
  tripSpentLabel?: string
  editingTrip: boolean
  editTripName: string
  isBootstrapping: boolean
}>()

const emit = defineEmits<{
  'start-edit': []
  'save-edit': []
  'cancel-edit': []
  'delete-trip': []
  'update:editTripName': [value: string]
}>()

function onNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:editTripName', target.value)
}
</script>

<style scoped>
.trip-header-view {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.trip-header-text {
  flex: 1;
  min-width: 0;
}

h1 {
  margin: 0 0 10px;
}

.trip-duration {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary);
}

.trip-date-range {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-light);
}

.trip-spent {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary);
}

.trip-desc-readonly {
  margin: 0;
  max-width: 48rem;
  line-height: 1.55;
  color: var(--text-light);
  font-size: 0.98rem;
  white-space: pre-wrap;
}

.trip-progress-block {
  margin-top: 14px;
  max-width: 22rem;
}

.trip-progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 6px;
}

.trip-progress-value {
  font-variant-numeric: tabular-nums;
  color: var(--primary);
}

.trip-progress-bar--header {
  height: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.trip-progress-bar--header .trip-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 6px;
  transition: width 0.22s ease;
}

.trip-edit-name-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

:global(.dark) .trip-duration {
  color: #4ade80;
}

:global(.dark) .trip-date-range {
  color: #b6d6c9;
}

:global(.dark) .trip-desc-readonly {
  color: #c8ddd4;
}
</style>

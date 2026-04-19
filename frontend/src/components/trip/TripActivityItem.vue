<script setup lang="ts">
import type { Activity, Day } from '@/types/trip'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'
import { clampPrice, formatSpentEUR } from '@/utils/tripTotals'

defineProps<{
  day: Day
  activity: Activity
  actIndex: number
}>()

const page = useTripPageContext()
</script>

<template>
  <div
    class="timeline-item"
    :class="{
      'timeline-item--flash': page.flashActivityId === activity.id,
      'timeline-item--completed': !!(activity.completed ?? false),
    }"
  >
    <div
      class="timeline-axis activity-drag-handle"
      title="Arrastrar para reordenar"
      aria-hidden="true"
    >
      <span class="timeline-dot" />
      <span
        v-if="actIndex < (day.activities || []).length - 1"
        class="timeline-stem"
        aria-hidden="true"
      />
    </div>
    <div
      class="timeline-panel"
      :class="{ 'timeline-panel--editing': page.editingActivityId === activity.id }"
    >
      <div v-if="page.editingActivityId !== activity.id" class="timeline-row">
        <label class="activity-done-label" @click.stop>
          <input
            type="checkbox"
            :checked="!!(activity.completed ?? false)"
            :disabled="page.tripsStore.isBootstrapping"
            :aria-label="
              (activity.completed ?? false)
                ? 'Marcar actividad como pendiente'
                : 'Marcar actividad como completada'
            "
            @change="
              page.onToggleActivityCompleted(
                activity.id,
                ($event.target as HTMLInputElement).checked
              )
            "
          />
        </label>
        <div
          class="timeline-main timeline-main--clickable"
          role="button"
          tabindex="0"
          :aria-label="`Editar actividad: ${activity.title}`"
          @click="page.onActivityMainClick(day.id, activity)"
          @keydown.enter.prevent="page.onActivityMainClick(day.id, activity)"
          @keydown.space.prevent="page.onActivityMainClick(day.id, activity)"
        >
          <div class="timeline-time-line">
            <span class="timeline-emoji" aria-hidden="true">🕘</span>
            <time class="timeline-time">{{ activity.start_time || '—' }}</time>
            <span v-if="activity.end_time" class="timeline-end">
              — {{ activity.end_time }}
            </span>
          </div>
          <div class="timeline-title-row">
            <span class="type-icon" aria-hidden="true">📍</span>
            <span class="timeline-title">{{ activity.title }}</span>
            <span v-if="clampPrice(activity.price) > 0" class="item-price">{{ formatSpentEUR(activity.price ?? 0) }}</span>
            <a
              v-if="activity.title.trim()"
              class="map-link"
              :href="page.googleMapsSearchUrl(activity.title)"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Buscar «${activity.title}» en Google Maps (abre en nueva pestaña)`"
              @click.stop
            >
              Mapa
            </a>
          </div>
        </div>
        <div class="timeline-actions">
          <button
            type="button"
            :disabled="page.tripsStore.isBootstrapping"
            aria-label="Editar actividad"
            title="Editar"
            @click.stop="page.startEditActivity(day.id, activity)"
          >
            ✏️
          </button>
          <button
            type="button"
            :disabled="page.tripsStore.isBootstrapping"
            aria-label="Eliminar actividad"
            @click.stop="page.deleteActivity(day.id, activity.id)"
          >
            🗑
          </button>
        </div>
      </div>

      <form
        v-else
        class="activity-edit"
        @submit.prevent="page.saveEditActivity(day.id, activity.id)"
      >
        <label class="sr-only" :for="`act-title-${activity.id}`">Nombre de la actividad</label>
        <input
          :id="`act-title-${activity.id}`"
          v-model="page.editActivityTitle"
          placeholder="Nombre"
          :disabled="page.tripsStore.isBootstrapping"
          autocomplete="off"
          @keydown.esc.prevent="page.cancelEditActivity"
        />
        <label class="sr-only" :for="`act-start-${activity.id}`">Hora de inicio</label>
        <input
          :id="`act-start-${activity.id}`"
          v-model="page.editActivityStart"
          type="time"
          :disabled="page.tripsStore.isBootstrapping"
          @keydown.esc.prevent="page.cancelEditActivity"
        />
        <label class="sr-only" :for="`act-end-${activity.id}`">Hora de fin</label>
        <input
          :id="`act-end-${activity.id}`"
          v-model="page.editActivityEnd"
          type="time"
          :disabled="page.tripsStore.isBootstrapping"
          @keydown.esc.prevent="page.cancelEditActivity"
        />
        <label class="sr-only" :for="`act-price-${activity.id}`">Precio (EUR)</label>
        <input
          :id="`act-price-${activity.id}`"
          v-model.number="page.editActivityPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="Precio"
          class="activity-edit-price"
          :disabled="page.tripsStore.isBootstrapping"
          @keydown.esc.prevent="page.cancelEditActivity"
        />
        <button type="submit" :disabled="page.tripsStore.isBootstrapping || !page.editActivityTitle.trim()" aria-label="Guardar actividad">
          Guardar
        </button>
        <button
          type="button"
          :disabled="page.tripsStore.isBootstrapping"
          aria-label="Cancelar edición de actividad"
          @click="page.cancelEditActivity"
        >
          Cancelar
        </button>
      </form>
    </div>
  </div>
</template>

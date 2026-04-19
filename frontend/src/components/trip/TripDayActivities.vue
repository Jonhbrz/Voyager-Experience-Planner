<script setup lang="ts">
import type { Day } from '@/types/trip'
import draggable from 'vuedraggable'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'
import TripActivityItem from '@/components/trip/TripActivityItem.vue'

defineProps<{
  day: Day
}>()

const page = useTripPageContext()
</script>

<template>
  <div class="section-block section-activities">
    <div class="section-activities-head">
      <h4><span class="section-badge"><span aria-hidden="true">📍 </span>Actividades</span></h4>
      <button
        v-if="(day.activities || []).length"
        type="button"
        class="clear-day-btn"
        :disabled="page.tripsStore.isBootstrapping"
        aria-label="Eliminar todas las actividades del día"
        @click.stop="page.onClearDayActivities(day.id)"
      >
        Vaciar día
      </button>
    </div>

    <p v-if="!(day.activities || []).length" class="empty-hint">
      Añade tu primera actividad <span aria-hidden="true">🚀</span>
    </p>

    <div v-else class="activity-timeline">
      <draggable
        v-model="day.activities"
        item-key="id"
        class="timeline-draggable"
        handle=".activity-drag-handle"
        ghost-class="activity-sort-ghost"
        chosen-class="activity-sort-chosen"
        drag-class="activity-sort-drag"
        :delay="180"
        :delay-on-touch-only="true"
        :disabled="page.editingActivityId !== null"
        :animation="220"
        @end="page.saveOrder"
      >
        <template #item="{ element: activity, index: actIndex }">
          <TripActivityItem :day="day" :activity="activity" :act-index="actIndex" />
        </template>
      </draggable>
    </div>

    <button
      type="button"
      class="quick-add-activity-btn"
      :disabled="page.tripsStore.isBootstrapping"
      aria-label="Añadir actividad al día"
      @click="page.toggleQuickAdd(day.id)"
    >
      + Añadir actividad
    </button>

    <Transition name="fade-slide">
      <form
        v-if="page.quickAddOpen[day.id]"
        :key="`quick-add-${day.id}`"
        class="quick-add-row"
        @submit.prevent="page.submitQuickAdd(day.id)"
      >
        <label class="sr-only" :for="`quick-add-time-${day.id}`">Hora de la nueva actividad</label>
        <input
          :id="`quick-add-time-${day.id}`"
          v-model="page.activityNew(day.id).start_time"
          class="quick-add-time"
          type="time"
          :disabled="page.tripsStore.isBootstrapping"
          @keydown.esc.prevent="page.closeQuickAdd(day.id)"
        />
        <label class="sr-only" :for="`quick-add-title-${day.id}`">Título de la nueva actividad</label>
        <input
          :ref="(el) => page.setQuickAddTitleRef(day.id, el)"
          :id="`quick-add-title-${day.id}`"
          v-model="page.activityNew(day.id).title"
          class="quick-add-title"
          type="text"
          placeholder="Actividad"
          :disabled="page.tripsStore.isBootstrapping"
          autocomplete="off"
          @keydown.esc.prevent="page.closeQuickAdd(day.id)"
        />
        <button
          type="submit"
          class="quick-add-save"
          :disabled="page.tripsStore.isBootstrapping || !page.activityNew(day.id).title.trim()"
          aria-label="Guardar nueva actividad"
        >
          Añadir
        </button>
      </form>
    </Transition>
  </div>
</template>

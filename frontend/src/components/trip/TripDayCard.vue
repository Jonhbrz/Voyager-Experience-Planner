<script setup lang="ts">
import type { Day } from '@/types/trip'
import { computed } from 'vue'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'
import { formatSpentEUR, getDayTotal } from '@/utils/tripTotals'
import TripDayActivities from '@/components/trip/TripDayActivities.vue'
import TripDayTransportBlock from '@/components/trip/TripDayTransportBlock.vue'
import TripDayStayBlock from '@/components/trip/TripDayStayBlock.vue'

const props = defineProps<{
  day: Day
  index: number
}>()

const page = useTripPageContext()

const isDayOpen = computed(() => page.openDays.includes(props.day.id))
const dayHeadingText = computed(() => page.dayHeadingLine(props.day, props.index))
const daySpentLabel = computed(() => formatSpentEUR(getDayTotal(props.day)))
</script>

<template>
  <div
    class="day-card card-hover"
    :class="{ 'day-card--flash': page.dayFlashId === day.id }"
    :ref="(el) => page.registerDayCardEl(day.id, el)"
  >
    <div
      v-if="page.editingDayId !== day.id"
      class="day-header"
    >
      <span class="day-drag-handle" title="Arrastrar" aria-hidden="true">⋮⋮</span>
      <button
        type="button"
        class="day-title-toggle"
        :aria-expanded="isDayOpen"
        :aria-controls="`day-body-${day.id}`"
        :aria-label="
          isDayOpen
            ? `Contraer ${dayHeadingText}`
            : `Expandir ${dayHeadingText}`
        "
        @click="page.toggleDay(day.id)"
      >
        <span class="accordion-chevron" :class="{ open: isDayOpen }">▸</span>
        <span>
          {{ dayHeadingText }}
        </span>
      </button>

      <span class="day-header-total" :title="'Total gastos del día'">{{ daySpentLabel }}</span>
      <div class="actions">
        <button
          type="button"
          :disabled="page.tripsStore.isBootstrapping"
          aria-label="Editar día"
          @click.stop="page.startEditDay(day)"
        >
          ✏️
        </button>
        <button
          type="button"
          :disabled="page.tripsStore.isBootstrapping"
          aria-label="Eliminar día"
          @click.stop="page.deleteDay(day.id)"
        >
          🗑
        </button>
      </div>
    </div>

    <form v-else class="day-edit-form" @submit.prevent="page.saveEditDay(day.id)">
      <label class="sr-only" :for="`day-title-input-${day.id}`">Nombre del día</label>
      <input
        :id="`day-title-input-${day.id}`"
        v-model="page.editTitle"
        placeholder="Nombre del día"
        :disabled="page.tripsStore.isBootstrapping"
        autocomplete="off"
      />
      <button type="submit" :disabled="page.tripsStore.isBootstrapping || !page.editTitle.trim()" aria-label="Guardar nombre del día">
        Guardar
      </button>
      <button
        type="button"
        :disabled="page.tripsStore.isBootstrapping"
        aria-label="Cancelar edición del día"
        @click="page.cancelEditDay"
      >
        Cancelar
      </button>
    </form>

    <Transition name="accordion">
      <div
        v-if="isDayOpen"
        :id="`day-body-${day.id}`"
        class="day-body-outer"
      >
        <div class="day-body">
          <TripDayActivities :day="day" />
          <TripDayTransportBlock :day="day" />
          <TripDayStayBlock :day="day" />
        </div>
      </div>
    </Transition>
  </div>
</template>

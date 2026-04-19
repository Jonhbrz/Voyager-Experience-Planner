<script setup lang="ts">
import draggable from 'vuedraggable'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'
import TripDayCard from '@/components/trip/TripDayCard.vue'

const page = useTripPageContext()
</script>

<template>
  <section class="trip-page-dias section" aria-labelledby="trip-days-heading">
    <h2 id="trip-days-heading">Días</h2>

    <draggable
      v-if="page.trip && page.trip.days.length > 0"
      v-model="page.trip.days"
      item-key="id"
      class="days-container"
      handle=".day-drag-handle"
      :delay="180"
      :delay-on-touch-only="true"
      @end="page.saveOrder"
      animation="200"
    >
      <template #item="{ element: day, index }">
        <TripDayCard :day="day" :index="index" />
      </template>
    </draggable>

    <div v-else>
      <p class="empty-hint">No hay días todavía — crea el primero arriba.</p>
    </div>
  </section>
</template>

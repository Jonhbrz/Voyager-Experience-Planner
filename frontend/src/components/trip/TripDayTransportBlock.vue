<script setup lang="ts">
import type { Day } from '@/types/trip'
import TripTransportForm from '@/components/trip/TripTransportForm.vue'
import TripTransportItem from '@/components/trip/TripTransportItem.vue'

defineProps<{
  day: Day
}>()
</script>

<template>
  <div class="section-block section-transport">
    <h4><span class="section-badge">Transportes</span></h4>

    <TripTransportForm :day="day" />

    <p v-if="!(day.transports || []).length" class="empty-hint muted">
      No hay transportes todavía
    </p>

    <ul v-else class="simple-list">
      <TripTransportItem
        v-for="t in (day.transports || [])"
        :key="t.id"
        :day="day"
        :transport="t"
      />
    </ul>
  </div>
</template>

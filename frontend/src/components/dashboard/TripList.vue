<template>
  <ul v-if="trips.length" class="trip-grid">
    <TripListItem v-for="trip in trips" :key="trip.id" :trip="trip" @open="emit('open', $event)" />
  </ul>
  <p v-else class="empty-dash">
    No trips created yet
  </p>
</template>

<script setup lang="ts">
import TripListItem from '@/components/dashboard/TripListItem.vue'

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
  trips: DashboardTripItemVm[]
}>()

const emit = defineEmits<{
  open: [tripId: number]
}>()
</script>

<style scoped>
.trip-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.empty-dash {
  color: var(--text-light);
  font-size: 1rem;
  margin: 12px 0 0;
  padding: 24px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--card);
}

:global(.dark) .empty-dash {
  color: var(--text-light);
}
</style>

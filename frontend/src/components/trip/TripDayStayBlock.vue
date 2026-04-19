<script setup lang="ts">
import type { Day } from '@/types/trip'
import TripStayForm from '@/components/trip/TripStayForm.vue'
import TripStayItem from '@/components/trip/TripStayItem.vue'

defineProps<{
  day: Day
}>()
</script>

<template>
  <div class="section-block section-stay">
    <h4><span class="section-badge"><span aria-hidden="true">🏨 </span>Estancia</span></h4>

    <TripStayForm :day="day" />

    <p v-if="!(day.stays || []).length" class="empty-hint muted">
      Añade tu estancia <span aria-hidden="true">🏨</span>
    </p>

    <ul v-else class="simple-list">
      <TripStayItem
        v-for="s in (day.stays || [])"
        :key="s.id"
        :day="day"
        :stay="s"
      />
    </ul>
  </div>
</template>

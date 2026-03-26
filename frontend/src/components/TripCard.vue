<template>
  <div class="trip-card">
    <h3>{{ trip.name }}</h3>
  </div>
</template>

<script setup lang="ts">
interface Trip {
  id: number
  name: string
}

defineProps<{
  trip: Trip
}>()
</script>

<style scoped>
.trip-card {
  border: 1px solid #ccc;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
}
</style>

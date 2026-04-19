<template>
  <li>
    <button
      type="button"
      class="trip-link-btn"
      :aria-label="`Abrir viaje ${tripName}`"
      @click="emit('open', tripId)"
    >
      <span class="label">{{ tripName }}</span>
    </button>
  </li>
</template>

<script setup lang="ts">
defineProps<{
  tripId: number
  tripName: string
}>()

const emit = defineEmits<{
  open: [tripId: number]
}>()
</script>

<style scoped>
.trip-link-btn {
  appearance: none;
  background: none !important;
  border: none;
  padding: 0;
  margin: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  display: inline;
}

.trip-link-btn:hover .label {
  text-decoration: underline;
}

.trip-link-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>

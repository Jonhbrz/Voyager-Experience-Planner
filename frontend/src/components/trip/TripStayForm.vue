<script setup lang="ts">
import type { Day } from '@/types/trip'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'

defineProps<{
  day: Day
}>()

const page = useTripPageContext()
</script>

<template>
  <form class="inline-form stay-form" @submit.prevent="page.submitAddStay(day.id)">
    <label class="sr-only" :for="`stay-name-${day.id}`">Nombre del alojamiento</label>
    <input
      :id="`stay-name-${day.id}`"
      v-model="page.stayDraft(day.id).name"
      placeholder="Hotel / Airbnb"
      :disabled="page.tripsStore.isBootstrapping"
      autocomplete="off"
    />
    <label class="sr-only" :for="`stay-loc-${day.id}`">Ubicación del alojamiento</label>
    <input
      :id="`stay-loc-${day.id}`"
      v-model="page.stayDraft(day.id).location"
      placeholder="Ubicación"
      :disabled="page.tripsStore.isBootstrapping"
      autocomplete="off"
    />
    <label class="sr-only" :for="`stay-price-${day.id}`">Precio (EUR)</label>
    <input
      :id="`stay-price-${day.id}`"
      v-model.number="page.stayDraft(day.id).price"
      type="number"
      min="0"
      step="0.01"
      placeholder="€"
      class="stay-price-input"
      :disabled="page.tripsStore.isBootstrapping"
    />
    <button
      type="submit"
      :disabled="page.tripsStore.isBootstrapping || !page.canAddStay(day.id)"
      aria-label="Añadir estancia"
    >
      Añadir
    </button>
  </form>
</template>

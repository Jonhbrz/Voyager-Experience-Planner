<script setup lang="ts">
import type { Day } from '@/types/trip'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'

defineProps<{
  day: Day
}>()

const page = useTripPageContext()
</script>

<template>
  <form class="inline-form transport-form" @submit.prevent="page.submitAddTransport(day.id)">
    <label class="sr-only" :for="`transport-from-${day.id}`">Origen del transporte</label>
    <input
      :id="`transport-from-${day.id}`"
      v-model="page.transportDraft(day.id).from"
      placeholder="Desde"
      :disabled="page.tripsStore.isBootstrapping"
      autocomplete="off"
    />
    <span class="transport-arrow" aria-hidden="true">→</span>
    <label class="sr-only" :for="`transport-to-${day.id}`">Destino del transporte</label>
    <input
      :id="`transport-to-${day.id}`"
      v-model="page.transportDraft(day.id).to"
      placeholder="Hasta"
      :disabled="page.tripsStore.isBootstrapping"
      autocomplete="off"
    />
    <label class="sr-only" :for="`transport-type-${day.id}`">Tipo de transporte</label>
    <input
      :id="`transport-type-${day.id}`"
      v-model="page.transportDraft(day.id).type"
      placeholder="Tipo (coche, tren…)"
      :disabled="page.tripsStore.isBootstrapping"
      autocomplete="off"
    />
    <label class="sr-only" :for="`transport-price-${day.id}`">Precio (EUR)</label>
    <input
      :id="`transport-price-${day.id}`"
      v-model.number="page.transportDraft(day.id).price"
      type="number"
      min="0"
      step="0.01"
      placeholder="€"
      class="transport-price-input"
      :disabled="page.tripsStore.isBootstrapping"
    />
    <button
      type="submit"
      :disabled="page.tripsStore.isBootstrapping || !page.canAddTransport(day.id)"
      aria-label="Añadir transporte"
    >
      Añadir
    </button>
  </form>
</template>

<script setup lang="ts">
import type { Day, Stay } from '@/types/trip'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'
import { clampPrice, formatSpentEUR } from '@/utils/tripTotals'

defineProps<{
  day: Day
  stay: Stay
}>()

const page = useTripPageContext()
</script>

<template>
  <li class="list-row card-hover">
    <span class="list-main">
      <span class="type-icon" aria-hidden="true">🏨</span>
      <span>
        <strong>{{ stay.name }}</strong> — {{ stay.location }}
        <span v-if="clampPrice(stay.price) > 0" class="item-price">{{ formatSpentEUR(stay.price ?? 0) }}</span>
      </span>
      <a
        v-if="page.stayMapQuery(stay)"
        class="map-link"
        :href="page.googleMapsSearchUrl(page.stayMapQuery(stay) ?? '')"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`Buscar estancia en mapa: ${page.stayMapQuery(stay)} (nueva pestaña)`"
      >Mapa</a>
    </span>
    <button
      type="button"
      :disabled="page.tripsStore.isBootstrapping"
      class="linkish"
      aria-label="Eliminar estancia"
      @click="page.removeStayRow(day.id, stay.id)"
    >
      Eliminar
    </button>
  </li>
</template>

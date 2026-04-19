<script setup lang="ts">
import type { Day, Transport } from '@/types/trip'
import { useTripPageContext } from '@/composables/trip/useTripPageContext'
import { clampPrice, formatSpentEUR } from '@/utils/tripTotals'

defineProps<{
  day: Day
  transport: Transport
}>()

const page = useTripPageContext()
</script>

<template>
  <li class="list-row card-hover">
    <span class="list-main">
      <span class="type-icon" aria-hidden="true">{{ page.transportIcon(transport.type) }}</span>
      <span>
        {{ transport.from }} → {{ transport.to }}
        <em class="transport-type">({{ transport.type }})</em>
        <span v-if="clampPrice(transport.price) > 0" class="item-price">{{ formatSpentEUR(transport.price ?? 0) }}</span>
      </span>
      <span class="map-links">
        <a
          v-if="transport.from.trim()"
          class="map-link"
          :href="page.googleMapsSearchUrl(transport.from)"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Buscar origen «${transport.from}» en Google Maps (nueva pestaña)`"
        >Origen</a>
        <a
          v-if="transport.to.trim()"
          class="map-link"
          :href="page.googleMapsSearchUrl(transport.to)"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Buscar destino «${transport.to}» en Google Maps (nueva pestaña)`"
        >Destino</a>
      </span>
    </span>
    <button
      type="button"
      :disabled="page.tripsStore.isBootstrapping"
      class="linkish"
      aria-label="Eliminar transporte"
      @click="page.removeTransportRow(day.id, transport.id)"
    >
      Eliminar
    </button>
  </li>
</template>

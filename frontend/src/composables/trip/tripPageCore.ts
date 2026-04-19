import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { Router } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { googleMapsSearchUrl } from '@/utils/maps'
import {
  formatTripDateRange,
  getTripDuration,
} from '@/utils/tripDates'
import { getTripProgress, transportIcon } from '@/utils/tripUi'
import type { Trip } from '@/types/trip'

export type TripPageCoreSlice = {
  tripId: ComputedRef<number>
  router: Router
  tripsStore: ReturnType<typeof useTripsStore>
  trip: ComputedRef<Trip | undefined>
  tripDateRange: ComputedRef<string | null>
  tripDurationDays: ComputedRef<number | null>
  tripProgressPercent: ComputedRef<number>
  tripHasActivities: ComputedRef<boolean>
  googleMapsSearchUrl: typeof import('@/utils/maps').googleMapsSearchUrl
  transportIcon: typeof import('@/utils/tripUi').transportIcon
}

export function buildTripPageCore(
  tripId: ComputedRef<number>,
  router: Router
): TripPageCoreSlice {
  const tripsStore = useTripsStore()

  const trip = computed<Trip | undefined>(() =>
    tripsStore.trips.find(t => t.id === tripId.value)
  )

  const tripDateRange = computed(() => (trip.value ? formatTripDateRange(trip.value) : null))

  const tripDurationDays = computed(() => (trip.value ? getTripDuration(trip.value) : null))

  const tripProgressPercent = computed(() =>
    trip.value ? getTripProgress(trip.value) : 0
  )

  const tripHasActivities = computed(() =>
    (trip.value?.days ?? []).some(d => (d.activities ?? []).length > 0)
  )

  return {
    tripId,
    router,
    tripsStore,
    trip,
    tripDateRange,
    tripDurationDays,
    tripProgressPercent,
    tripHasActivities,
    googleMapsSearchUrl,
    transportIcon,
  }
}

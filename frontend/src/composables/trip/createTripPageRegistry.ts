import type { ComputedRef } from 'vue'
import type { Router } from 'vue-router'
import { buildTripPageCore } from '@/composables/trip/tripPageCore'
import type { TripPageRegistry } from '@/composables/trip/tripPageRegistry.types'
import { buildTripDaysSlice } from '@/composables/trip/useTripDays'
import { buildTripFormsSlice } from '@/composables/trip/useTripForms'
import { buildTripActivitiesSlice } from '@/composables/trip/useTripActivities'
import { buildTripTransportSlice } from '@/composables/trip/useTripTransport'
import { buildTripStaysSlice } from '@/composables/trip/useTripStays'

export function createTripPageRegistry(
  tripId: ComputedRef<number>,
  router: Router
): TripPageRegistry {
  const core = buildTripPageCore(tripId, router)
  const { days, triggerDayFlash } = buildTripDaysSlice(core)
  const forms = buildTripFormsSlice(core, triggerDayFlash)
  const activities = buildTripActivitiesSlice(core)
  const transport = buildTripTransportSlice(core)
  const stays = buildTripStaysSlice(core)

  return {
    ...core,
    ...days,
    ...forms,
    ...activities,
    ...transport,
    ...stays,
  }
}

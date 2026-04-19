import type { ComputedRef } from 'vue'
import { inject, provide, reactive } from 'vue'
import type { InjectionKey } from 'vue'
import type { Router } from 'vue-router'
import { createTripPageRegistry } from '@/composables/trip/createTripPageRegistry'
import type { TripPageContext } from '@/composables/trip/tripPageRegistry.types'

export { useTripDays } from '@/composables/trip/useTripDays'
export { useTripForms } from '@/composables/trip/useTripForms'
export { useTripActivities } from '@/composables/trip/useTripActivities'
export { useTripTransport } from '@/composables/trip/useTripTransport'
export { useTripStays } from '@/composables/trip/useTripStays'
export { createTripPageRegistry } from '@/composables/trip/createTripPageRegistry'
export type { TripPageRegistry, TripPageContext } from '@/composables/trip/tripPageRegistry.types'

export function useTripPage(tripId: ComputedRef<number>, router: Router) {
  return reactive(createTripPageRegistry(tripId, router)) as TripPageContext
}

export const tripPageContextKey: InjectionKey<TripPageContext> = Symbol('TripPageContext')

export function provideTripPageContext(ctx: TripPageContext) {
  provide(tripPageContextKey, ctx)
}

export function useTripPageContext(): TripPageContext {
  const ctx = inject(tripPageContextKey)
  if (!ctx) {
    throw new Error('useTripPageContext() debe usarse bajo TripView')
  }
  return ctx
}

import { reactive } from 'vue'
import type { TripPageCoreSlice } from '@/composables/trip/tripPageCore'
import type { TripPageContext, TripPageRegistry } from '@/composables/trip/tripPageRegistry.types'
import type { Stay } from '@/types/trip'

export type TripStaysSlice = Pick<
  TripPageRegistry,
  | 'stayMapQuery'
  | 'stayDraft'
  | 'canAddStay'
  | 'submitAddStay'
  | 'removeStayRow'
>

export function buildTripStaysSlice(core: TripPageCoreSlice): TripStaysSlice {
  const { tripId, tripsStore } = core

  function stayMapQuery(s: Stay): string | null {
    const parts = [s.location?.trim(), s.name?.trim()].filter(Boolean)
    const q = parts.join(' ').trim()
    return q || null
  }

  const stayDrafts = reactive<Record<number, { name: string; location: string; price: number }>>({})

  function stayDraft(dayId: number) {
    if (!stayDrafts[dayId]) {
      stayDrafts[dayId] = { name: '', location: '', price: 0 }
    }
    return stayDrafts[dayId]
  }

  const canAddStay = (dayId: number) => {
    const d = stayDraft(dayId)
    return Boolean(d.name.trim() && d.location.trim())
  }

  const submitAddStay = async (dayId: number) => {
    if (tripsStore.isBootstrapping) return
    const d = stayDraft(dayId)
    if (!canAddStay(dayId)) return

    await tripsStore.addStay(tripId.value, dayId, {
      name: d.name.trim(),
      location: d.location.trim(),
      price: Number.isFinite(d.price) && d.price >= 0 ? d.price : 0,
    })

    d.name = ''
    d.location = ''
    d.price = 0
  }

  const removeStayRow = async (dayId: number, stayId: number) => {
    if (tripsStore.isBootstrapping) return
    await tripsStore.removeStay(tripId.value, dayId, stayId)
  }

  return {
    stayMapQuery,
    stayDraft,
    canAddStay,
    submitAddStay,
    removeStayRow,
  }
}

export function useTripStays(reg: TripPageContext) {
  return {
    stayMapQuery: reg.stayMapQuery,
    stayDraft: reg.stayDraft,
    canAddStay: reg.canAddStay,
    submitAddStay: reg.submitAddStay,
    removeStayRow: reg.removeStayRow,
  }
}

import { reactive } from 'vue'
import type { TripPageCoreSlice } from '@/composables/trip/tripPageCore'
import type { TripPageContext, TripPageRegistry } from '@/composables/trip/tripPageRegistry.types'

export type TripTransportSlice = Pick<
  TripPageRegistry,
  | 'transportDraft'
  | 'canAddTransport'
  | 'submitAddTransport'
  | 'removeTransportRow'
>

export function buildTripTransportSlice(core: TripPageCoreSlice): TripTransportSlice {
  const { tripId, tripsStore } = core

  const transportDrafts = reactive<Record<number, { from: string; to: string; type: string; price: number }>>({})

  function transportDraft(dayId: number) {
    if (!transportDrafts[dayId]) {
      transportDrafts[dayId] = { from: '', to: '', type: '', price: 0 }
    }
    return transportDrafts[dayId]
  }

  const canAddTransport = (dayId: number) => {
    const d = transportDraft(dayId)
    return Boolean(d.from.trim() && d.to.trim() && d.type.trim())
  }

  const submitAddTransport = async (dayId: number) => {
    if (tripsStore.isBootstrapping) return
    const d = transportDraft(dayId)
    if (!canAddTransport(dayId)) return

    await tripsStore.addTransport(tripId.value, dayId, {
      from: d.from.trim(),
      to: d.to.trim(),
      type: d.type.trim(),
      price: Number.isFinite(d.price) && d.price >= 0 ? d.price : 0,
    })

    d.from = ''
    d.to = ''
    d.type = ''
    d.price = 0
  }

  const removeTransportRow = async (dayId: number, transportId: number) => {
    if (tripsStore.isBootstrapping) return
    await tripsStore.removeTransport(tripId.value, dayId, transportId)
  }

  return {
    transportDraft,
    canAddTransport,
    submitAddTransport,
    removeTransportRow,
  }
}

export function useTripTransport(reg: TripPageContext) {
  return {
    transportDraft: reg.transportDraft,
    canAddTransport: reg.canAddTransport,
    submitAddTransport: reg.submitAddTransport,
    removeTransportRow: reg.removeTransportRow,
  }
}

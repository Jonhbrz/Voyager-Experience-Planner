import { nextTick, ref, toRef } from 'vue'
import type { TripPageCoreSlice } from '@/composables/trip/tripPageCore'
import type { TripPageContext, TripPageRegistry } from '@/composables/trip/tripPageRegistry.types'

export type TripFormsSlice = Pick<
  TripPageRegistry,
  | 'editingTrip'
  | 'editTripName'
  | 'startEditTrip'
  | 'saveTripEdit'
  | 'cancelTripEdit'
  | 'deleteTrip'
  | 'showForm'
  | 'newDayTitle'
  | 'addDay'
  | 'cancelAddDay'
>

export function buildTripFormsSlice(
  core: TripPageCoreSlice,
  triggerDayFlash: (dayId: number) => void
): TripFormsSlice {
  const { tripId, router, tripsStore, trip } = core

  const editingTrip = ref(false)
  const editTripName = ref('')

  const startEditTrip = () => {
    if (tripsStore.isBootstrapping) return
    if (!trip.value) return
    editingTrip.value = true
    editTripName.value = trip.value.name
  }

  const saveTripEdit = () => {
    if (tripsStore.isBootstrapping) return
    if (!editTripName.value.trim()) return
    tripsStore.updateTripName(tripId.value, editTripName.value)
    editingTrip.value = false
  }

  const cancelTripEdit = () => {
    editingTrip.value = false
  }

  const deleteTrip = async () => {
    if (tripsStore.isBootstrapping) return
    if (!confirm('¿Eliminar este viaje?')) return
    await tripsStore.removeTrip(tripId.value)
    router.push('/')
  }

  const showForm = ref(false)
  const newDayTitle = ref('')

  const addDay = async () => {
    if (tripsStore.isBootstrapping) return
    if (!newDayTitle.value.trim()) return
    const t = trip.value
    const beforeIds = new Set((t?.days ?? []).map((d) => d.id))
    await tripsStore.addDayToTrip(tripId.value, newDayTitle.value)
    await nextTick()
    if (!tripsStore.errorMessage) {
      cancelAddDay()
      const t2 = tripsStore.trips.find((x) => x.id === tripId.value)
      const newDay = t2?.days.find((d) => !beforeIds.has(d.id))
      if (newDay) {
        triggerDayFlash(newDay.id)
      }
    }
  }

  const cancelAddDay = () => {
    showForm.value = false
    newDayTitle.value = ''
  }

  return {
    editingTrip,
    editTripName,
    startEditTrip,
    saveTripEdit,
    cancelTripEdit,
    deleteTrip,
    showForm,
    newDayTitle,
    addDay,
    cancelAddDay,
  }
}

export function useTripForms(reg: TripPageContext) {
  return {
    editingTrip: toRef(reg, 'editingTrip'),
    editTripName: toRef(reg, 'editTripName'),
    startEditTrip: reg.startEditTrip,
    saveTripEdit: reg.saveTripEdit,
    cancelTripEdit: reg.cancelTripEdit,
    deleteTrip: reg.deleteTrip,
    showForm: toRef(reg, 'showForm'),
    newDayTitle: toRef(reg, 'newDayTitle'),
    addDay: reg.addDay,
    cancelAddDay: reg.cancelAddDay,
  }
}

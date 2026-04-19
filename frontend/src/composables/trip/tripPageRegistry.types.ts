import type { ComputedRef, Ref, UnwrapNestedRefs } from 'vue'
import type { Router } from 'vue-router'
import type { Activity, Day, Stay, Trip } from '@/types/trip'
import type { useTripsStore } from '@/stores/trips'

/** Registro único del estado y acciones de la página de viaje (misma forma que el return histórico de useTripPage). */
export type TripPageRegistry = {
  tripId: ComputedRef<number>
  router: Router
  tripsStore: ReturnType<typeof useTripsStore>
  trip: ComputedRef<Trip | undefined>
  tripDateRange: ComputedRef<string | null>
  tripDurationDays: ComputedRef<number | null>
  tripProgressPercent: ComputedRef<number>
  tripHasActivities: ComputedRef<boolean>
  dayHeadingLine: (day: Day, index: number) => string
  onToggleActivityCompleted: (activityId: number, completed: boolean) => void
  onClearDayActivities: (dayId: number) => Promise<void>
  stayMapQuery: (s: Stay) => string | null
  registerDayCardEl: (dayId: number, el: unknown) => void
  editingTrip: Ref<boolean>
  editTripName: Ref<string>
  startEditTrip: () => void
  saveTripEdit: () => void
  cancelTripEdit: () => void
  deleteTrip: () => Promise<void>
  showForm: Ref<boolean>
  newDayTitle: Ref<string>
  addDay: () => Promise<void>
  cancelAddDay: () => void
  editingDayId: Ref<number | null>
  editTitle: Ref<string>
  startEditDay: (day: Day) => void
  saveEditDay: (dayId: number) => void
  cancelEditDay: () => void
  deleteDay: (dayId: number) => Promise<void>
  quickAddOpen: Record<number, boolean>
  setQuickAddTitleRef: (dayId: number, el: unknown) => void
  flashActivityId: Ref<number | null>
  activityNew: (dayId: number) => { title: string; start_time: string; end_time: string }
  toggleQuickAdd: (dayId: number) => void
  closeQuickAdd: (dayId: number) => void
  submitQuickAdd: (dayId: number) => Promise<void>
  editingActivityId: Ref<number | null>
  editActivityTitle: Ref<string>
  editActivityStart: Ref<string>
  editActivityEnd: Ref<string>
  editActivityPrice: Ref<number>
  startEditActivity: (dayId: number, activity: Activity) => void
  onActivityMainClick: (dayId: number, activity: Activity) => void
  saveEditActivity: (dayId: number, activityId: number) => void
  cancelEditActivity: () => void
  deleteActivity: (dayId: number, activityId: number) => Promise<void>
  transportDraft: (dayId: number) => { from: string; to: string; type: string; price: number }
  canAddTransport: (dayId: number) => boolean
  submitAddTransport: (dayId: number) => Promise<void>
  removeTransportRow: (dayId: number, transportId: number) => Promise<void>
  stayDraft: (dayId: number) => { name: string; location: string; price: number }
  canAddStay: (dayId: number) => boolean
  submitAddStay: (dayId: number) => Promise<void>
  removeStayRow: (dayId: number, stayId: number) => Promise<void>
  openDays: Ref<number[]>
  toggleDay: (dayId: number) => Promise<void>
  saveOrder: () => void
  googleMapsSearchUrl: typeof import('@/utils/maps').googleMapsSearchUrl
  transportIcon: typeof import('@/utils/tripUi').transportIcon
  dayFlashId: Ref<number | null>
}

/** Vista inyectada: refs y computeds desenrollados como en `reactive()` + `useTripPage`. */
export type TripPageContext = UnwrapNestedRefs<TripPageRegistry>

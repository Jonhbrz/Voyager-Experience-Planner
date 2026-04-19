import { nextTick, reactive, ref, toRef } from 'vue'
import type { TripPageCoreSlice } from '@/composables/trip/tripPageCore'
import type { TripPageContext, TripPageRegistry } from '@/composables/trip/tripPageRegistry.types'
import type { Activity } from '@/types/trip'
import { clampPrice } from '@/utils/tripTotals'

export type TripActivitiesSlice = Pick<
  TripPageRegistry,
  | 'onToggleActivityCompleted'
  | 'onClearDayActivities'
  | 'quickAddOpen'
  | 'setQuickAddTitleRef'
  | 'flashActivityId'
  | 'activityNew'
  | 'toggleQuickAdd'
  | 'closeQuickAdd'
  | 'submitQuickAdd'
  | 'editingActivityId'
  | 'editActivityTitle'
  | 'editActivityStart'
  | 'editActivityEnd'
  | 'editActivityPrice'
  | 'startEditActivity'
  | 'onActivityMainClick'
  | 'saveEditActivity'
  | 'cancelEditActivity'
  | 'deleteActivity'
>

export function buildTripActivitiesSlice(core: TripPageCoreSlice): TripActivitiesSlice {
  const { tripId, tripsStore } = core

  const onToggleActivityCompleted = (activityId: number, completed: boolean) => {
    void tripsStore.toggleActivity(activityId, completed)
  }

  const onClearDayActivities = async (dayId: number) => {
    if (tripsStore.isBootstrapping) return
    if (!confirm('¿Eliminar todas las actividades de este día? (no se borra el día)')) return
    await tripsStore.clearDayActivities(tripId.value, dayId)
  }

  const newActivityByDay = reactive<Record<number, { title: string; start_time: string; end_time: string }>>({})

  const quickAddOpen = reactive<Record<number, boolean>>({})

  const quickAddTitleRefs = new Map<number, HTMLInputElement>()

  function setQuickAddTitleRef(dayId: number, el: unknown) {
    if (el instanceof HTMLInputElement) {
      quickAddTitleRefs.set(dayId, el)
    } else {
      quickAddTitleRefs.delete(dayId)
    }
  }

  const flashActivityId = ref<number | null>(null)
  let flashActivityTimer: ReturnType<typeof setTimeout> | null = null

  function triggerActivityFlash(activityId: number) {
    if (flashActivityTimer) {
      clearTimeout(flashActivityTimer)
      flashActivityTimer = null
    }
    flashActivityId.value = activityId
    flashActivityTimer = setTimeout(() => {
      flashActivityId.value = null
      flashActivityTimer = null
    }, 300)
  }

  function activityNew(dayId: number) {
    if (!newActivityByDay[dayId]) {
      newActivityByDay[dayId] = { title: '', start_time: '09:00', end_time: '' }
    }
    return newActivityByDay[dayId]
  }

  function toggleQuickAdd(dayId: number) {
    if (tripsStore.isBootstrapping) return
    if (quickAddOpen[dayId]) {
      closeQuickAdd(dayId)
    } else {
      quickAddOpen[dayId] = true
      activityNew(dayId)
      nextTick(() => {
        quickAddTitleRefs.get(dayId)?.focus()
      })
    }
  }

  function closeQuickAdd(dayId: number) {
    quickAddOpen[dayId] = false
    const d = newActivityByDay[dayId]
    if (d) {
      d.title = ''
      d.start_time = '09:00'
      d.end_time = ''
    }
  }

  const submitQuickAdd = async (dayId: number) => {
    if (tripsStore.isBootstrapping) return
    const d = activityNew(dayId)
    if (!d.title.trim()) return

    const t = tripsStore.trips.find((x) => x.id === tripId.value)
    const day = t?.days.find((x) => x.id === dayId)
    const beforeIds = new Set((day?.activities ?? []).map((a) => a.id))

    await tripsStore.addActivity(tripId.value, dayId, {
      title: d.title.trim(),
      start_time: d.start_time,
      end_time: d.end_time.trim() ? d.end_time : null,
    })

    await nextTick()
    if (!tripsStore.errorMessage) {
      d.title = ''
      d.start_time = '09:00'
      d.end_time = ''
      const dayAfter = tripsStore.trips.find((x) => x.id === tripId.value)?.days.find((x) => x.id === dayId)
      const newAct = dayAfter?.activities.find((a) => !beforeIds.has(a.id))
      if (newAct) {
        triggerActivityFlash(newAct.id)
      }
      nextTick(() => quickAddTitleRefs.get(dayId)?.focus())
    }
  }

  function formatTimeForInput(t: string | undefined | null): string {
    if (t == null || String(t).trim() === '') return '09:00'
    const s = String(t).trim()
    const match = s.match(/^(\d{1,2}):(\d{2})/)
    if (match?.[1] != null && match[2] != null) {
      const h = match[1].padStart(2, '0').slice(-2)
      return `${h}:${match[2]}`
    }
    return '09:00'
  }

  const editingActivityId = ref<number | null>(null)
  const editActivityTitle = ref('')
  const editActivityStart = ref('09:00')
  const editActivityEnd = ref('')
  const editActivityPrice = ref(0)
  const activityEditBackup = ref<{
    title: string
    start_time: string
    end_time: string
    price: number
  } | null>(null)

  const startEditActivity = (_dayId: number, activity: Activity) => {
    if (tripsStore.isBootstrapping) return
    editingActivityId.value = activity.id
    editActivityTitle.value = activity.title
    editActivityStart.value = formatTimeForInput(activity.start_time)
    editActivityEnd.value = activity.end_time ? formatTimeForInput(activity.end_time) : ''
    editActivityPrice.value = clampPrice(activity.price)
    activityEditBackup.value = {
      title: activity.title,
      start_time: editActivityStart.value,
      end_time: editActivityEnd.value,
      price: editActivityPrice.value,
    }
  }

  const onActivityMainClick = (dayId: number, activity: Activity) => {
    if (tripsStore.isBootstrapping) return
    startEditActivity(dayId, activity)
  }

  const saveEditActivity = (dayId: number, activityId: number) => {
    if (tripsStore.isBootstrapping) return
    if (!editActivityTitle.value.trim()) return

    tripsStore.updateActivity(tripId.value, dayId, activityId, {
      title: editActivityTitle.value.trim(),
      start_time: editActivityStart.value,
      end_time: editActivityEnd.value.trim() ? editActivityEnd.value : null,
      price: clampPrice(editActivityPrice.value),
    })

    editingActivityId.value = null
    activityEditBackup.value = null
    editActivityTitle.value = ''
    editActivityStart.value = '09:00'
    editActivityEnd.value = ''
    editActivityPrice.value = 0
  }

  const cancelEditActivity = () => {
    if (activityEditBackup.value) {
      editActivityTitle.value = activityEditBackup.value.title
      editActivityStart.value = activityEditBackup.value.start_time
      editActivityEnd.value = activityEditBackup.value.end_time
      editActivityPrice.value = activityEditBackup.value.price
    }
    editingActivityId.value = null
    activityEditBackup.value = null
  }

  const deleteActivity = async (dayId: number, activityId: number) => {
    if (tripsStore.isBootstrapping) return
    await tripsStore.removeActivity(tripId.value, dayId, activityId)
  }

  return {
    onToggleActivityCompleted,
    onClearDayActivities,
    quickAddOpen,
    setQuickAddTitleRef,
    flashActivityId,
    activityNew,
    toggleQuickAdd,
    closeQuickAdd,
    submitQuickAdd,
    editingActivityId,
    editActivityTitle,
    editActivityStart,
    editActivityEnd,
    editActivityPrice,
    startEditActivity,
    onActivityMainClick,
    saveEditActivity,
    cancelEditActivity,
    deleteActivity,
  }
}

export function useTripActivities(reg: TripPageContext) {
  return {
    onToggleActivityCompleted: reg.onToggleActivityCompleted,
    onClearDayActivities: reg.onClearDayActivities,
    quickAddOpen: reg.quickAddOpen,
    setQuickAddTitleRef: reg.setQuickAddTitleRef,
    flashActivityId: toRef(reg, 'flashActivityId'),
    activityNew: reg.activityNew,
    toggleQuickAdd: reg.toggleQuickAdd,
    closeQuickAdd: reg.closeQuickAdd,
    submitQuickAdd: reg.submitQuickAdd,
    editingActivityId: toRef(reg, 'editingActivityId'),
    editActivityTitle: toRef(reg, 'editActivityTitle'),
    editActivityStart: toRef(reg, 'editActivityStart'),
    editActivityEnd: toRef(reg, 'editActivityEnd'),
    editActivityPrice: toRef(reg, 'editActivityPrice'),
    startEditActivity: reg.startEditActivity,
    onActivityMainClick: reg.onActivityMainClick,
    saveEditActivity: reg.saveEditActivity,
    cancelEditActivity: reg.cancelEditActivity,
    deleteActivity: reg.deleteActivity,
  }
}

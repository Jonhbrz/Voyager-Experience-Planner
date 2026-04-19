import { nextTick, ref, toRef } from 'vue'
import {
  formatDayShort,
  getDayDate,
} from '@/utils/tripDates'
import type { Day } from '@/types/trip'
import type { TripPageCoreSlice } from '@/composables/trip/tripPageCore'
import type { TripPageContext, TripPageRegistry } from '@/composables/trip/tripPageRegistry.types'

export type TripDaysSlice = Pick<
  TripPageRegistry,
  | 'dayHeadingLine'
  | 'registerDayCardEl'
  | 'editingDayId'
  | 'editTitle'
  | 'startEditDay'
  | 'saveEditDay'
  | 'cancelEditDay'
  | 'deleteDay'
  | 'openDays'
  | 'toggleDay'
  | 'saveOrder'
  | 'dayFlashId'
>

export type TripDaysBuildResult = {
  days: TripDaysSlice
  triggerDayFlash: (dayId: number) => void
}

export function buildTripDaysSlice(core: TripPageCoreSlice): TripDaysBuildResult {
  const { tripId, tripsStore, trip } = core

  const dayCardEls = new Map<number, HTMLElement>()

  function registerDayCardEl(dayId: number, el: unknown) {
    if (el instanceof HTMLElement) {
      dayCardEls.set(dayId, el)
    } else {
      dayCardEls.delete(dayId)
    }
  }

  function dayHeadingLine(day: Day, index: number): string {
    const t = trip.value
    const prefix = `Día ${index + 1}`
    const title = (day.title ?? '').trim()
    const d = t?.start_date ? getDayDate(day, t) : null
    const datePart = d ? formatDayShort(d) : ''
    const parts = [title, datePart].filter(Boolean)
    const body = parts.length ? parts.join(' · ') : ''
    return body ? `${prefix} — ${body}` : prefix
  }

  const editingDayId = ref<number | null>(null)
  const editTitle = ref('')

  const startEditDay = (day: Day) => {
    if (tripsStore.isBootstrapping) return
    editingDayId.value = day.id
    editTitle.value = day.title
  }

  const saveEditDay = (dayId: number) => {
    if (tripsStore.isBootstrapping) return
    if (!editTitle.value.trim()) return
    tripsStore.updateDay(tripId.value, dayId, editTitle.value)
    editingDayId.value = null
    editTitle.value = ''
  }

  const cancelEditDay = () => {
    editingDayId.value = null
    editTitle.value = ''
  }

  const deleteDay = async (dayId: number) => {
    if (tripsStore.isBootstrapping) return
    await tripsStore.removeDay(tripId.value, dayId)
  }

  const openDays = ref<number[]>([])
  const accordionSingle = ref(true)

  const dayFlashId = ref<number | null>(null)
  let dayFlashTimer: ReturnType<typeof setTimeout> | null = null

  function triggerDayFlash(dayId: number) {
    if (dayFlashTimer) {
      clearTimeout(dayFlashTimer)
      dayFlashTimer = null
    }
    dayFlashId.value = dayId
    dayFlashTimer = setTimeout(() => {
      dayFlashId.value = null
      dayFlashTimer = null
    }, 700)
  }

  const toggleDay = async (dayId: number) => {
    const wasOpen = openDays.value.includes(dayId)
    if (wasOpen) {
      openDays.value = openDays.value.filter(id => id !== dayId)
      return
    }
    if (accordionSingle.value) {
      openDays.value = [dayId]
    } else {
      openDays.value = [...openDays.value, dayId]
    }

    await nextTick()
    requestAnimationFrame(() => {
      dayCardEls.get(dayId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const saveOrder = () => {}

  const days: TripDaysSlice = {
    dayHeadingLine,
    registerDayCardEl,
    editingDayId,
    editTitle,
    startEditDay,
    saveEditDay,
    cancelEditDay,
    deleteDay,
    openDays,
    toggleDay,
    saveOrder,
    dayFlashId,
  }

  return { days, triggerDayFlash }
}

export function useTripDays(reg: TripPageContext) {
  return {
    dayHeadingLine: reg.dayHeadingLine,
    registerDayCardEl: reg.registerDayCardEl,
    editingDayId: toRef(reg, 'editingDayId'),
    editTitle: toRef(reg, 'editTitle'),
    startEditDay: reg.startEditDay,
    saveEditDay: reg.saveEditDay,
    cancelEditDay: reg.cancelEditDay,
    deleteDay: reg.deleteDay,
    openDays: toRef(reg, 'openDays'),
    toggleDay: reg.toggleDay,
    saveOrder: reg.saveOrder,
    dayFlashId: toRef(reg, 'dayFlashId'),
  }
}

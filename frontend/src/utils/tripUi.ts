import type { Activity, Day, Trip } from '@/types/trip'

function isActivityPending(a: Activity): boolean {
  return !(a.completed ?? false)
}

export function transportIcon(type: string): string {
  const t = type.toLowerCase()
  if (/avión|avion|plane|vuelo|fly|aeropuerto|airport/.test(t)) return '✈️'
  if (/tren|train|renfe/.test(t)) return '🚆'
  if (/bus|autobús|autobus/.test(t)) return '🚌'
  if (/barco|ferry|boat|crucero/.test(t)) return '⛴️'
  if (/metro|subway/.test(t)) return '🚇'
  if (/bici|bike|bicicleta/.test(t)) return '🚲'
  if (/camin|walk|pie/.test(t)) return '🚶'
  return '🚗'
}

export function sortDaysForItinerary(days: Day[]): Day[] {
  return [...(days || [])].sort((a, b) => {
    const oa = a.order ?? a.id
    const ob = b.order ?? b.id
    return oa - ob
  })
}

export function sortActivitiesByTime(activities: Activity[]): Activity[] {
  return [...(activities || [])].sort((a, b) => {
    const ta = a.start_time || ''
    const tb = b.start_time || ''
    if (ta !== tb) return ta.localeCompare(tb)
    return (a.order ?? 0) - (b.order ?? 0)
  })
}

/** Primera actividad pendiente del itinerario (días en orden, luego por hora). */
export function getFirstScheduledActivity(
  trip: Trip
): { title: string; start_time: string; dayTitle: string } | null {
  for (const day of sortDaysForItinerary(trip.days || [])) {
    const acts = sortActivitiesByTime(day.activities || []).filter(isActivityPending)
    const a = acts[0]
    if (a) {
      return {
        title: a.title,
        start_time: a.start_time || '—',
        dayTitle: day.title,
      }
    }
  }
  return null
}

export function tripActivityCount(trip: Trip): number {
  return (trip.days || []).reduce((n, d) => n + (d.activities?.length ?? 0), 0)
}

/** Porcentaje 0–100 de actividades marcadas como completadas. */
export function getTripProgress(trip: Trip): number {
  const activities = (trip.days ?? []).flatMap(d => d.activities ?? [])
  const completed = activities.filter(a => !!(a.completed ?? false)).length
  return activities.length ? Math.round((completed / activities.length) * 100) : 0
}

/** Minutos desde medianoche para comparar horas tipo "09:00" o "09:00:00". */
function parseTimeToMinutes(t: string): number | null {
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m?.[1] || m[2] == null) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (Number.isNaN(h) || Number.isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return null
  }
  return h * 60 + min
}

type DayActivityRef = { day: Day; activity: Activity }

function pendingActivitiesInOrder(trip: Trip): DayActivityRef[] {
  const out: DayActivityRef[] = []
  for (const day of sortDaysForItinerary(trip.days || [])) {
    for (const activity of sortActivitiesByTime(day.activities || [])) {
      if (isActivityPending(activity)) {
        out.push({ day, activity })
      }
    }
  }
  return out
}

/**
 * Siguiente actividad pendiente: primero una con hora de inicio posterior a ahora (mismo día local);
 * si no hay, la primera pendiente en orden de itinerario (p. ej. retrasada).
 * Ignora actividades marcadas como completadas.
 */
export function getNextFutureActivity(
  trip: Trip
): { title: string; start_time: string; dayTitle: string } | null {
  const pending = pendingActivitiesInOrder(trip)
  if (!pending.length) {
    return null
  }

  const now = new Date()
  const nowM = now.getHours() * 60 + now.getMinutes()

  for (const { day, activity } of pending) {
    const tm = parseTimeToMinutes(activity.start_time || '')
    if (tm !== null && tm > nowM) {
      return {
        title: activity.title,
        start_time: activity.start_time || '—',
        dayTitle: day.title,
      }
    }
  }

  const first = pending[0]!
  return {
    title: first.activity.title,
    start_time: first.activity.start_time || '—',
    dayTitle: first.day.title,
  }
}

/** Primeras `max` actividades pendientes del itinerario (días ordenados, luego por hora). */
export function getTripActivityPreview(
  trip: Trip,
  max: number = 2
): { start_time: string; title: string }[] {
  const out: { start_time: string; title: string }[] = []
  for (const day of sortDaysForItinerary(trip.days || [])) {
    const acts = sortActivitiesByTime(day.activities || []).filter(isActivityPending)
    for (const a of acts) {
      out.push({ start_time: a.start_time || '—', title: a.title })
      if (out.length >= max) return out
    }
  }
  return out
}

import type { Activity, Day, Trip } from '@/types/trip'

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

/** Primera actividad del itinerario (días en orden, luego por hora). */
export function getFirstScheduledActivity(
  trip: Trip
): { title: string; start_time: string; dayTitle: string } | null {
  for (const day of sortDaysForItinerary(trip.days || [])) {
    const acts = sortActivitiesByTime(day.activities || [])
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

/**
 * Primera actividad cuya hora de inicio es estrictamente posterior a la hora actual (mismo día local).
 * Solo compara HH:mm del viaje con la hora del reloj del usuario.
 */
export function getNextFutureActivity(
  trip: Trip
): { title: string; start_time: string; dayTitle: string } | null {
  const now = new Date()
  const nowM = now.getHours() * 60 + now.getMinutes()

  for (const day of sortDaysForItinerary(trip.days || [])) {
    const acts = sortActivitiesByTime(day.activities || [])
    for (const a of acts) {
      const tm = parseTimeToMinutes(a.start_time || '')
      if (tm === null) continue
      if (tm > nowM) {
        return {
          title: a.title,
          start_time: a.start_time || '—',
          dayTitle: day.title,
        }
      }
    }
  }
  return null
}

/** Primeras `max` actividades del itinerario (días ordenados, luego por hora). */
export function getTripActivityPreview(
  trip: Trip,
  max: number = 2
): { start_time: string; title: string }[] {
  const out: { start_time: string; title: string }[] = []
  for (const day of sortDaysForItinerary(trip.days || [])) {
    const acts = sortActivitiesByTime(day.activities || [])
    for (const a of acts) {
      out.push({ start_time: a.start_time || '—', title: a.title })
      if (out.length >= max) return out
    }
  }
  return out
}

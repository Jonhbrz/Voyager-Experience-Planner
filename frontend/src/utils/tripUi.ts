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

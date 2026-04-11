import type { Day, Trip } from '@/types/trip'

/** Parse YYYY-MM-DD en fecha local (evita desfases UTC). */
export function parseIsoDateOnly(s: string): Date {
  const parts = s.split('-').map((x) => parseInt(x, 10))
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(y, m - 1, d)
}

/**
 * Fecha del día según `trip.start_date` + `day.order` (no se guarda fecha en Day).
 */
export function getDayDate(day: Day, trip: Trip): Date | null {
  if (!trip.start_date) return null
  const order = day.order ?? 0
  const start = parseIsoDateOnly(trip.start_date)
  const result = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  result.setDate(result.getDate() + order)
  return result
}

const shortDayFmt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

export function formatDayShort(d: Date, locale = 'es'): string {
  return d.toLocaleDateString(locale, shortDayFmt).replace(/\.$/, '')
}

/** Ej. "1 jun - 5 jun" */
export function formatTripDateRange(trip: Trip, locale = 'es'): string | null {
  if (!trip.start_date || !trip.end_date) return null
  const a = parseIsoDateOnly(trip.start_date)
  const b = parseIsoDateOnly(trip.end_date)
  return `${formatDayShort(a, locale)} - ${formatDayShort(b, locale)}`
}

/** Días de calendario inclusive (misma lógica que el backend: diffInDays + 1). */
export function getTripDuration(trip: Trip): number | null {
  if (!trip.start_date || !trip.end_date) return null
  const start = parseIsoDateOnly(trip.start_date)
  const end = parseIsoDateOnly(trip.end_date)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff
}

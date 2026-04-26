import type { Activity, Day, Stay, Transport, Trip } from '@/types/trip'
import { formatCurrencyAmount } from '@/utils/formatters'

/** Precio no negativo y con precisión de céntimos (evita NaN / strings raros de la API). */
export function clampPrice(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

export function formatSpentEUR(total: number): string {
  return formatCurrencyAmount(clampPrice(total))
}

export function getActivitiesTotal(activities: Activity[] | undefined | null): number {
  if (!activities?.length) return 0
  let sum = 0
  for (const a of activities) {
    sum += clampPrice(a.price)
  }
  return sum
}

export function getTransportsTotal(transports: Transport[] | undefined | null): number {
  if (!transports?.length) return 0
  let sum = 0
  for (const t of transports) {
    sum += clampPrice(t.price)
  }
  return sum
}

export function getStaysTotal(stays: Stay[] | undefined | null): number {
  if (!stays?.length) return 0
  let sum = 0
  for (const s of stays) {
    sum += clampPrice(s.price)
  }
  return sum
}

export function getDayTotal(day: Day): number {
  return (
    getActivitiesTotal(day.activities) +
    getTransportsTotal(day.transports) +
    getStaysTotal(day.stays)
  )
}

export function getTripTotal(trip: Trip): number {
  const days = trip.days
  if (!days?.length) return 0
  let sum = 0
  for (const d of days) {
    sum += getDayTotal(d)
  }
  return sum
}

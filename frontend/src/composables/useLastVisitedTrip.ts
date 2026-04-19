import { useSessionStorage } from '@/composables/useSessionStorage'

const LAST_TRIP_ID_KEY = 'lastVisitedTripId'

export function useLastVisitedTrip() {
  const lastVisitedTripId = useSessionStorage<number | null>(LAST_TRIP_ID_KEY, null)

  const setLastVisitedTripId = (tripId: number) => {
    if (!Number.isFinite(tripId)) return
    lastVisitedTripId.value = tripId
  }

  return {
    lastVisitedTripId,
    setLastVisitedTripId,
  }
}

import { defineStore } from 'pinia'
import axios from 'axios'
import type { Trip, Day, Activity, Transport, Stay } from '@/types/trip'
import api from '@/services/api'
import { clampPrice, getTripTotal } from '@/utils/tripTotals'
import { normalizeArray, safeMap } from '@/utils/normalizers'

let messageDismissTimer: ReturnType<typeof setTimeout> | null = null
const RETRYABLE_NETWORK_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK', 'ETIMEDOUT'])
const MAX_BACKGROUND_RETRIES = 3

function enqueueRequest(requestFn: () => Promise<void>) {
  void requestFn().catch((e) => {
    console.error('Request error', e)
  })
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  if (!error.response) return true
  const status = error.response.status ?? 0
  return status >= 500 || RETRYABLE_NETWORK_CODES.has(error.code ?? '')
}

/** Garantiza YYYY-MM-DD para la API (evita ISO con zona horaria). */
function toTripApiDate(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/)
  if (isoDate) {
    return isoDate[1] ?? trimmed
  }
  return trimmed
}

function scheduleMessageAutoClear(store: {
  clearSuccess: () => void
  clearError: () => void
}) {
  if (messageDismissTimer) {
    clearTimeout(messageDismissTimer)
  }
  messageDismissTimer = setTimeout(() => {
    store.clearSuccess()
    store.clearError()
    messageDismissTimer = null
  }, 3000)
}

function sortedActivitiesCopy(activities: Activity[] | unknown): Activity[] {
  const list = normalizeArray(activities) as Activity[]
  return [...list].sort((a, b) => {
    const t1 = a.start_time || ''
    const t2 = b.start_time || ''
    if (t1 !== t2) return t1.localeCompare(t2)
    return (a.order ?? 0) - (b.order ?? 0)
  })
}

/** Sustituye una actividad por id (un solo viaje contiene un activityId dado). */
function mapTripsPatchActivity(
  trips: Trip[],
  activityId: number,
  patch: Partial<Activity>
): Trip[] {
  const tripIndex = trips.findIndex(t =>
    t.days.some(d => d.activities.some(a => a.id === activityId))
  )
  if (tripIndex === -1) return trips.map(t => t)
  return trips.map((trip, i) =>
    i !== tripIndex
      ? trip
      : {
          ...trip,
          days: trip.days.map(day => ({
            ...day,
            activities: day.activities.map(a =>
              a.id === activityId ? { ...a, ...patch } : a
            ),
          })),
        }
  )
}

function mapTripsUpdateTrip(
  trips: Trip[],
  tripId: number,
  updater: (t: Trip) => Trip
): Trip[] {
  return trips.map(t => (t.id === tripId ? updater(t) : t))
}

function mapTripsUpdateDay(
  trips: Trip[],
  tripId: number,
  dayId: number,
  updater: (d: Day) => Day
): Trip[] {
  return trips.map(trip =>
    trip.id !== tripId
      ? trip
      : {
          ...trip,
          days: trip.days.map(d => (d.id === dayId ? updater(d) : d)),
        }
  )
}

function mapTripsSortActivitiesInDay(
  trips: Trip[],
  tripId: number,
  dayId: number
): Trip[] {
  return mapTripsUpdateDay(trips, tripId, dayId, d => ({
    ...d,
    activities: sortedActivitiesCopy(d.activities),
  }))
}

export const useTripsStore = defineStore('trips', {
  state: (): {
    trips: Trip[]
    /** Solo carga inicial / recarga de lista (GET /trips). */
    isLoading: boolean
    /** Jobs en cola ejecutando fetch (para indicador opcional). */
    syncPendingCount: number
    /** Crear viaje (formulario dashboard). */
    isCreatingTrip: boolean
    errorMessage: string | null
    successMessage: string | null
    initialLoadDone: boolean
  } => ({
    trips: [],
    isLoading: false,
    syncPendingCount: 0,
    isCreatingTrip: false,
    errorMessage: null,
    successMessage: null,
    initialLoadDone: false,
  }),

  getters: {
    totalTrips: (state) => state.trips.length,
    /** Solo el primer fetch de viajes; no bloquea la UI por mutaciones en cola. */
    isBootstrapping: (state) => !state.initialLoadDone && state.isLoading,
    totalSpentAllTrips: (state) => {
      let sum = 0
      for (const trip of state.trips) {
        if (trip) sum += getTripTotal(trip)
      }
      return sum
    },
  },

  actions: {
    queueBackgroundRetry(
      taskName: string,
      requestAction: () => Promise<void>,
      onExhausted: () => void
    ) {
      const runAttempt = async (attempt: number) => {
        this.beginSync()
        try {
          await requestAction()
          this.successMessage = `${taskName} sincronizado.`
          scheduleMessageAutoClear(this)
        } catch (error) {
          if (attempt < MAX_BACKGROUND_RETRIES && isRetryableNetworkError(error)) {
            const delayMs = 300 * 2 ** (attempt - 1)
            setTimeout(() => {
              enqueueRequest(() => runAttempt(attempt + 1))
            }, delayMs)
          } else {
            onExhausted()
            this.setError(error, `No se pudo sincronizar: ${taskName.toLowerCase()}.`)
            scheduleMessageAutoClear(this)
          }
        } finally {
          this.endSync()
        }
      }

      enqueueRequest(() => runAttempt(1))
    },

    setLoading(value: boolean) {
      this.isLoading = value
    },

    beginSync() {
      this.syncPendingCount++
    },

    endSync() {
      this.syncPendingCount = Math.max(0, this.syncPendingCount - 1)
    },

    clearError() {
      this.errorMessage = null
    },

    clearSuccess() {
      this.successMessage = null
    },

    setError(error: unknown, fallback: string) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data as {
          errors?: Record<string, string[]>
          message?: string
        } | undefined
        if (status === 422 && data?.errors) {
          const msgs = Object.values(data.errors).flat().filter(Boolean)
          if (msgs.length) {
            this.errorMessage = String(msgs[0])
            return
          }
        }
        if (data?.message) {
          this.errorMessage = String(data.message)
          return
        }
        if (error.request && !error.response) {
          this.errorMessage = 'No se pudo conectar con el servidor.'
          return
        }
      }

      this.errorMessage = fallback
    },

    async runRequest(
      fallbackMessage: string,
      successMessage: string | null,
      requestAction: () => Promise<void>
    ) {
      this.setLoading(true)
      this.clearError()
      this.clearSuccess()
      try {
        await requestAction()
        if (successMessage) {
          this.successMessage = successMessage
        }
      } catch (error) {
        this.setError(error, fallbackMessage)
      } finally {
        this.setLoading(false)
        if (this.successMessage || this.errorMessage) {
          scheduleMessageAutoClear(this)
        }
      }
    },

    normalizeTripDays(trip: Trip): Trip {
      const days = normalizeArray(trip.days) as Day[]
      return {
        ...trip,
        days: days.map(d => ({
          ...d,
          activities: safeMap<Activity, Activity>(d.activities, a => ({
            ...a,
            completed: !!(a.completed ?? false),
            price: clampPrice(a.price),
          })),
          transports: safeMap<Transport, Transport>(d.transports, t => ({
            ...t,
            price: clampPrice(t.price),
          })),
          stays: safeMap<Stay, Stay>(d.stays, s => ({
            ...s,
            price: clampPrice(s.price),
          })),
        })),
      }
    },

    async loadTrips() {
      try {
        this.setLoading(true)
        this.clearError()
        this.clearSuccess()
        try {
          const res = await api.get('/trips')
          const root = res.data as unknown
          const payload =
            root !== null &&
            typeof root === 'object' &&
            !Array.isArray(root) &&
            'data' in root
              ? (root as { data: unknown }).data
              : root
          const trips = normalizeArray(payload) as Trip[]
          if (
            trips.length === 0 &&
            payload != null &&
            payload !== '' &&
            typeof payload !== 'boolean' &&
            !Array.isArray(payload) &&
            !(
              typeof payload === 'object' &&
              Array.isArray((payload as { data?: unknown }).data)
            )
          ) {
            console.warn('Unexpected trips format:', res.data)
          }
          this.trips = trips.map(t => this.normalizeTripDays(t))
        } catch (e: unknown) {
          console.error('Error loading trips:', e)
          if (axios.isAxiosError(e)) {
            console.error('Response:', e.response)
          }
          this.setError(e, 'No se pudieron cargar los viajes')
        } finally {
          this.setLoading(false)
          if (this.successMessage || this.errorMessage) {
            scheduleMessageAutoClear(this)
          }
        }
      } finally {
        this.initialLoadDone = true
      }
    },

    async addTrip(
      name: string,
      description = '',
      start_date: string,
      end_date: string
    ): Promise<void> {
      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          store.isCreatingTrip = true
          store.clearError()
          store.clearSuccess()
          try {
            const payload = {
              name: (name ?? '').trim(),
              description: (description ?? '').trim(),
              start_date: toTripApiDate(start_date ?? ''),
              end_date: toTripApiDate(end_date ?? ''),
            }
            const res = await api.post('/trips', payload)
            const raw = res.data.data as Trip
            const payloadMsg = res.data as { message?: string }
            store.trips = [...store.trips, store.normalizeTripDays(raw)]
            store.successMessage = payloadMsg.message ?? 'Viaje creado correctamente.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.setError(error, 'Error al crear el viaje.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.isCreatingTrip = false
            store.endSync()
          }
        })
      })
    },

    updateTripName(tripId: number, newName: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const trimmed = newName.trim()
      if (!trimmed) return

      const prevName = trip.name
      const prevDesc = trip.description ?? ''

      this.trips = mapTripsUpdateTrip(this.trips, tripId, t => ({
        ...t,
        name: trimmed,
      }))

      const store = this
      enqueueRequest(async () => {
        store.beginSync()
        try {
          await api.put(`/trips/${tripId}`, {
            name: trimmed,
            description: prevDesc,
          })
          store.successMessage = 'Viaje actualizado.'
          scheduleMessageAutoClear(store)
        } catch (error) {
          if (!isRetryableNetworkError(error)) {
            store.trips = mapTripsUpdateTrip(store.trips, tripId, t => ({
              ...t,
              name: prevName,
            }))
            store.setError(error, 'No se pudo actualizar el viaje.')
            scheduleMessageAutoClear(store)
            throw error
          }

          store.queueBackgroundRetry(
            'Viaje',
            async () => {
              await api.put(`/trips/${tripId}`, {
                name: trimmed,
                description: prevDesc,
              })
            },
            () => {
              store.trips = mapTripsUpdateTrip(store.trips, tripId, t => ({
                ...t,
                name: prevName,
              }))
            }
          )
        } finally {
          store.endSync()
        }
      })
    },

    async removeTrip(tripId: number): Promise<void> {
      const snapshot = this.trips.find(t => t.id === tripId)
      if (!snapshot) return

      this.trips = this.trips.filter(t => t.id !== tripId)

      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            await api.delete(`/trips/${tripId}`)
            store.successMessage = 'Viaje eliminado.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.trips = [...store.trips, snapshot].sort((a, b) => a.id - b.id)
            store.setError(error, 'No se pudo eliminar el viaje.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    async addDayToTrip(tripId: number, title: string): Promise<void> {
      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            const res = await api.post(`/trips/${tripId}/days`, { title })
            const day = res.data.data as Day
            store.trips = mapTripsUpdateTrip(store.trips, tripId, t => ({
              ...t,
              days: [
                ...t.days,
                {
                  ...day,
                  activities: normalizeArray(day.activities) as Activity[],
                  transports: normalizeArray(day.transports) as Transport[],
                  stays: normalizeArray(day.stays) as Stay[],
                },
              ],
            }))
            store.successMessage = 'Día creado correctamente.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.setError(error, 'No se pudo crear el día.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    updateDay(tripId: number, dayId: number, newTitle: string) {
      const trip = this.trips.find(t => t.id === tripId)
      const day = trip?.days.find(d => d.id === dayId)
      if (!day) return

      const trimmed = newTitle.trim()
      if (!trimmed) return

      const previousTitle = day.title

      this.trips = mapTripsUpdateDay(this.trips, tripId, dayId, d => ({
        ...d,
        title: trimmed,
      }))

      const store = this
      enqueueRequest(async () => {
        store.beginSync()
        try {
          const res = await api.put(`/days/${dayId}`, { title: trimmed })
          const updated = res.data.data as Day
          store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
            ...d,
            title: (updated.title ?? trimmed).trim(),
            order: updated.order ?? d.order,
          }))
          store.successMessage = 'Día actualizado.'
          scheduleMessageAutoClear(store)
        } catch (error) {
          if (!isRetryableNetworkError(error)) {
            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              title: previousTitle,
            }))
            store.setError(error, 'No se pudo actualizar el día.')
            scheduleMessageAutoClear(store)
            throw error
          }

          store.queueBackgroundRetry(
            'Día',
            async () => {
              const res = await api.put(`/days/${dayId}`, { title: trimmed })
              const updated = res.data.data as Day
              store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
                ...d,
                title: (updated.title ?? trimmed).trim(),
                order: updated.order ?? d.order,
              }))
            },
            () => {
              store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
                ...d,
                title: previousTitle,
              }))
            }
          )
        } finally {
          store.endSync()
        }
      })
    },

    async removeDay(tripId: number, dayId: number): Promise<void> {
      const trip = this.trips.find(t => t.id === tripId)
      const snapshot = trip?.days.find(d => d.id === dayId)
      if (!snapshot) return

      this.trips = mapTripsUpdateTrip(this.trips, tripId, t => ({
        ...t,
        days: t.days.filter(d => d.id !== dayId),
      }))

      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            await api.delete(`/days/${dayId}`)
            store.successMessage = 'Día eliminado.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.trips = mapTripsUpdateTrip(store.trips, tripId, t => ({
              ...t,
              days: [...t.days, snapshot].sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id)),
            }))
            store.setError(error, 'No se pudo eliminar el día.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    /** Marca actividad completada o pendiente (PUT `/activities/{id}`). */
    toggleActivity(activityId: number, completed: boolean) {
      let previousCompleted = false
      outer: for (const t of this.trips) {
        for (const d of t.days) {
          const a = d.activities.find(x => x.id === activityId)
          if (a) {
            previousCompleted = !!(a.completed ?? false)
            break outer
          }
        }
      }

      this.trips = mapTripsPatchActivity(this.trips, activityId, { completed })
      this.clearError()

      const store = this
      enqueueRequest(async () => {
        store.beginSync()
        try {
          const res = await api.put(`/activities/${activityId}`, { completed })
          const updated = res.data.data as Activity
          store.trips = mapTripsPatchActivity(store.trips, activityId, {
            completed: !!(updated.completed ?? completed),
            price: clampPrice(updated.price),
          })
        } catch (error) {
          if (!isRetryableNetworkError(error)) {
            store.trips = mapTripsPatchActivity(store.trips, activityId, {
              completed: previousCompleted,
            })
            store.setError(error, 'No se pudo actualizar la actividad.')
            scheduleMessageAutoClear(store)
            throw error
          }

          store.queueBackgroundRetry(
            'Actividad',
            async () => {
              const res = await api.put(`/activities/${activityId}`, { completed })
              const updated = res.data.data as Activity
              store.trips = mapTripsPatchActivity(store.trips, activityId, {
                completed: !!(updated.completed ?? completed),
                price: clampPrice(updated.price),
              })
            },
            () => {
              store.trips = mapTripsPatchActivity(store.trips, activityId, {
                completed: previousCompleted,
              })
            }
          )
        } finally {
          store.endSync()
        }
      })
    },

    async addActivity(
      tripId: number,
      dayId: number,
      payload: { title: string; start_time: string; end_time?: string | null; price?: number }
    ): Promise<void> {
      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            const body: Record<string, unknown> = {
              title: payload.title,
              start_time: payload.start_time,
            }
            if (payload.end_time != null && String(payload.end_time).trim() !== '') {
              body.end_time = payload.end_time
            }
            if (payload.price != null && Number.isFinite(payload.price)) {
              body.price = clampPrice(payload.price)
            }

            const res = await api.post(`/days/${dayId}/activities`, body)
            const created = res.data.data as Activity

            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              activities: sortedActivitiesCopy([
                ...d.activities,
                {
                  ...created,
                  completed: !!(created.completed ?? false),
                  price: clampPrice(created.price),
                },
              ]),
            }))

            store.successMessage = 'Actividad creada correctamente.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.setError(error, 'No se pudo crear la actividad.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    updateActivity(
      tripId: number,
      dayId: number,
      activityId: number,
      payload: { title: string; start_time: string; end_time?: string | null; price?: number }
    ) {
      const trip = this.trips.find(t => t.id === tripId)
      const day = trip?.days.find(d => d.id === dayId)
      const activity = day?.activities.find(a => a.id === activityId)
      if (!activity) return

      const nextEnd =
        payload.end_time != null && String(payload.end_time).trim() !== ''
          ? payload.end_time
          : null

      const snapshot: Pick<Activity, 'title' | 'start_time' | 'end_time' | 'price'> = {
        title: activity.title,
        start_time: activity.start_time,
        end_time: activity.end_time ?? null,
        price: clampPrice(activity.price),
      }

      const nextPrice = payload.price != null ? clampPrice(payload.price) : snapshot.price

      this.trips = mapTripsPatchActivity(this.trips, activityId, {
        title: payload.title,
        start_time: payload.start_time,
        end_time: nextEnd,
        price: nextPrice,
      })
      this.trips = mapTripsSortActivitiesInDay(this.trips, tripId, dayId)

      const store = this
      enqueueRequest(async () => {
        store.beginSync()
        try {
          const res = await api.put(`/activities/${activityId}`, {
            title: payload.title,
            start_time: payload.start_time,
            end_time: nextEnd,
            price: nextPrice,
          })
          const updated = res.data.data as Activity
          store.trips = mapTripsPatchActivity(store.trips, activityId, {
            title: updated.title,
            start_time: updated.start_time,
            end_time: updated.end_time ?? null,
            completed: !!(updated.completed ?? false),
            price: clampPrice(updated.price),
          })
          store.trips = mapTripsSortActivitiesInDay(store.trips, tripId, dayId)
          store.successMessage = 'Actividad actualizada.'
          scheduleMessageAutoClear(store)
        } catch (error) {
          if (!isRetryableNetworkError(error)) {
            store.trips = mapTripsPatchActivity(store.trips, activityId, {
              title: snapshot.title,
              start_time: snapshot.start_time,
              end_time: snapshot.end_time,
              price: snapshot.price,
            })
            store.trips = mapTripsSortActivitiesInDay(store.trips, tripId, dayId)
            store.setError(error, 'No se pudo actualizar la actividad.')
            scheduleMessageAutoClear(store)
            throw error
          }

          store.queueBackgroundRetry(
            'Actividad',
            async () => {
              const res = await api.put(`/activities/${activityId}`, {
                title: payload.title,
                start_time: payload.start_time,
                end_time: nextEnd,
                price: nextPrice,
              })
              const updated = res.data.data as Activity
              store.trips = mapTripsPatchActivity(store.trips, activityId, {
                title: updated.title,
                start_time: updated.start_time,
                end_time: updated.end_time ?? null,
                completed: !!(updated.completed ?? false),
                price: clampPrice(updated.price),
              })
              store.trips = mapTripsSortActivitiesInDay(store.trips, tripId, dayId)
            },
            () => {
              store.trips = mapTripsPatchActivity(store.trips, activityId, {
                title: snapshot.title,
                start_time: snapshot.start_time,
                end_time: snapshot.end_time,
                price: snapshot.price,
              })
              store.trips = mapTripsSortActivitiesInDay(store.trips, tripId, dayId)
            }
          )
        } finally {
          store.endSync()
        }
      })
    },

    async removeActivity(
      tripId: number,
      dayId: number,
      activityId: number
    ): Promise<void> {
      const trip = this.trips.find(t => t.id === tripId)
      const day = trip?.days.find(d => d.id === dayId)
      const snapshot = day?.activities.find(a => a.id === activityId)
      if (!snapshot) return

      this.trips = mapTripsUpdateDay(this.trips, tripId, dayId, d => ({
        ...d,
        activities: d.activities.filter(a => a.id !== activityId),
      }))

      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            await api.delete(`/activities/${activityId}`)
            store.successMessage = 'Actividad eliminada.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              activities: sortedActivitiesCopy([...d.activities, { ...snapshot }]),
            }))
            store.setError(error, 'No se pudo eliminar la actividad.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    async clearDayActivities(tripId: number, dayId: number): Promise<void> {
      const trip = this.trips.find(t => t.id === tripId)
      const day = trip?.days.find(d => d.id === dayId)
      if (!day || !day.activities.length) return

      const previousActivities = [...day.activities]

      this.trips = mapTripsUpdateDay(this.trips, tripId, dayId, d => ({
        ...d,
        activities: [],
      }))

      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            await Promise.all(previousActivities.map((a) => api.delete(`/activities/${a.id}`)))
            store.successMessage = 'Actividades eliminadas.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              activities: sortedActivitiesCopy([...previousActivities]),
            }))
            store.setError(error, 'No se pudo vaciar el día.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    async addTransport(
      tripId: number,
      dayId: number,
      payload: { from: string; to: string; type: string; price?: number; duration?: string; notes?: string }
    ): Promise<void> {
      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            const transportBody: Record<string, unknown> = {
              from: payload.from,
              to: payload.to,
              type: payload.type,
              duration: payload.duration?.trim() || undefined,
              notes: payload.notes?.trim() || undefined,
            }
            if (payload.price != null && Number.isFinite(payload.price)) {
              transportBody.price = clampPrice(payload.price)
            }

            const res = await api.post(`/days/${dayId}/transports`, transportBody)

            const row = res.data.data as Transport
            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              transports: [...d.transports, { ...row, price: clampPrice(row.price) }],
            }))
            store.successMessage = 'Transporte añadido.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.setError(error, 'No se pudo añadir el transporte.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    async removeTransport(tripId: number, dayId: number, transportId: number): Promise<void> {
      const trip = this.trips.find(t => t.id === tripId)
      const day = trip?.days.find(d => d.id === dayId)
      const snapshot = day?.transports.find(t => t.id === transportId)
      if (!snapshot) return

      this.trips = mapTripsUpdateDay(this.trips, tripId, dayId, d => ({
        ...d,
        transports: d.transports.filter(t => t.id !== transportId),
      }))

      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            await api.delete(`/transports/${transportId}`)
            store.successMessage = 'Transporte eliminado.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              transports: [...d.transports, snapshot],
            }))
            store.setError(error, 'No se pudo eliminar el transporte.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    async addStay(
      tripId: number,
      dayId: number,
      payload: { name: string; location: string; price?: number; check_in?: string; check_out?: string; notes?: string }
    ): Promise<void> {
      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            const body: Record<string, unknown> = {
              name: payload.name,
              location: payload.location,
            }
            if (payload.price != null && Number.isFinite(payload.price)) {
              body.price = clampPrice(payload.price)
            }
            if (payload.check_in?.trim()) body.check_in = payload.check_in
            if (payload.check_out?.trim()) body.check_out = payload.check_out
            if (payload.notes?.trim()) body.notes = payload.notes

            const res = await api.post(`/days/${dayId}/stays`, body)
            const row = res.data.data as Stay

            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              stays: [...d.stays, { ...row, price: clampPrice(row.price) }],
            }))
            store.successMessage = 'Estancia añadida.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.setError(error, 'No se pudo añadir la estancia.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },

    async removeStay(tripId: number, dayId: number, stayId: number): Promise<void> {
      const trip = this.trips.find(t => t.id === tripId)
      const day = trip?.days.find(d => d.id === dayId)
      const snapshot = day?.stays.find(s => s.id === stayId)
      if (!snapshot) return

      this.trips = mapTripsUpdateDay(this.trips, tripId, dayId, d => ({
        ...d,
        stays: d.stays.filter(s => s.id !== stayId),
      }))

      const store = this
      return new Promise((resolve, reject) => {
        enqueueRequest(async () => {
          store.beginSync()
          try {
            await api.delete(`/stays/${stayId}`)
            store.successMessage = 'Estancia eliminada.'
            scheduleMessageAutoClear(store)
            resolve()
          } catch (error) {
            store.trips = mapTripsUpdateDay(store.trips, tripId, dayId, d => ({
              ...d,
              stays: [...d.stays, snapshot],
            }))
            store.setError(error, 'No se pudo eliminar la estancia.')
            scheduleMessageAutoClear(store)
            reject(error)
            throw error
          } finally {
            store.endSync()
          }
        })
      })
    },
  },
})

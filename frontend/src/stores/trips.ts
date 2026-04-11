import { defineStore } from 'pinia'
import axios from 'axios'
import type { Trip, Day } from '@/types/trip'
import api from '@/services/api'

let messageDismissTimer: ReturnType<typeof setTimeout> | null = null

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

export const useTripsStore = defineStore('trips', {
  state: (): {
    trips: Trip[]
    isLoading: boolean
    errorMessage: string | null
    successMessage: string | null
    /** Tras el primer `loadTrips` terminado (éxito o error); evita skeleton en recargas con datos en memoria. */
    initialLoadDone: boolean
  } => ({
    trips: [],
    isLoading: false,
    errorMessage: null,
    successMessage: null,
    initialLoadDone: false,
  }),

  getters: {
    totalTrips: (state) => state.trips.length
  },

  actions: {
    setLoading(value: boolean) {
      this.isLoading = value
    },

    clearError() {
      this.errorMessage = null
    },

    clearSuccess() {
      this.successMessage = null
    },

    setError(error: unknown, fallback: string) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message
          return
        }
        if (error.request) {
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
      return {
        ...trip,
        days: (trip.days || []).map(d => ({
          ...d,
          activities: d.activities || [],
          transports: d.transports || [],
          stays: d.stays || [],
        })),
      }
    },

    sortDayActivities(day: Day) {
      day.activities.sort((a, b) => {
        const t1 = a.start_time || ''
        const t2 = b.start_time || ''
        if (t1 !== t2) return t1.localeCompare(t2)
        return (a.order ?? 0) - (b.order ?? 0)
      })
    },

    async loadTrips() {
      try {
        await this.runRequest(
          'No se pudieron cargar los viajes.',
          null,
          async () => {
            const res = await api.get('/trips')
            const raw = res.data.data as Trip[]
            this.trips = Array.isArray(raw) ? raw.map(t => this.normalizeTripDays(t)) : []
          }
        )
      } finally {
        this.initialLoadDone = true
      }
    },

    async addTrip(
      name: string,
      description = '',
      start_date: string,
      end_date: string
    ) {
      await this.runRequest('No se pudo crear el viaje.', 'Viaje creado correctamente.', async () => {
        const payload = {
          name: (name ?? '').trim(),
          description: (description ?? '').trim(),
          start_date: toTripApiDate(start_date ?? ''),
          end_date: toTripApiDate(end_date ?? ''),
        }
        const res = await api.post('/trips', payload)

        const raw = res.data.data as Trip
        this.trips.push(this.normalizeTripDays(raw))
      })
    },

    async updateTripName(tripId: number, newName: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      await this.runRequest('No se pudo actualizar el viaje.', 'Viaje actualizado.', async () => {
        await api.put(`/trips/${tripId}`, {
          name: newName,
          description: trip.description ?? '',
        })

        trip.name = newName
      })
    },

    async removeTrip(tripId: number) {
      await this.runRequest('No se pudo eliminar el viaje.', 'Viaje eliminado.', async () => {
        await api.delete(`/trips/${tripId}`)
        this.trips = this.trips.filter(t => t.id !== tripId)
      })
    },

    async addDayToTrip(tripId: number, title: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      await this.runRequest('No se pudo crear el día.', 'Día creado correctamente.', async () => {
        const res = await api.post(`/trips/${tripId}/days`, {
          title
        })

        trip.days.push({
          ...res.data.data,
          activities: res.data.data.activities || [],
          transports: res.data.data.transports || [],
          stays: res.data.data.stays || [],
        })
      })
    },

    async updateDay(tripId: number, dayId: number, newTitle: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo actualizar el día.', 'Día actualizado.', async () => {
        await api.put(`/days/${dayId}`, {
          title: newTitle
        })

        day.title = newTitle
      })
    },

    async removeDay(tripId: number, dayId: number) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      await this.runRequest('No se pudo eliminar el día.', 'Día eliminado.', async () => {
        await api.delete(`/days/${dayId}`)
        trip.days = trip.days.filter(d => d.id !== dayId)
      })
    },

    async addActivity(
      tripId: number,
      dayId: number,
      payload: { title: string; start_time: string; end_time?: string | null }
    ) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo crear la actividad.', 'Actividad creada correctamente.', async () => {
        const body: Record<string, unknown> = {
          title: payload.title,
          start_time: payload.start_time,
        }
        if (payload.end_time != null && String(payload.end_time).trim() !== '') {
          body.end_time = payload.end_time
        }

        const res = await api.post(`/days/${dayId}/activities`, body)

        day.activities.push(res.data.data)
        this.sortDayActivities(day)
      })
    },

    async updateActivity(
      tripId: number,
      dayId: number,
      activityId: number,
      payload: { title: string; start_time: string; end_time?: string | null }
    ) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      const activity = day.activities.find(a => a.id === activityId)
      if (!activity) return

      await this.runRequest('No se pudo actualizar la actividad.', 'Actividad actualizada.', async () => {
        await api.put(`/activities/${activityId}`, {
          title: payload.title,
          start_time: payload.start_time,
          end_time:
            payload.end_time != null && String(payload.end_time).trim() !== ''
              ? payload.end_time
              : null,
        })

        activity.title = payload.title
        activity.start_time = payload.start_time
        activity.end_time =
          payload.end_time != null && String(payload.end_time).trim() !== ''
            ? payload.end_time
            : null
        this.sortDayActivities(day)
      })
    },

    async removeActivity(tripId: number, dayId: number, activityId: number) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo eliminar la actividad.', 'Actividad eliminada.', async () => {
        await api.delete(`/activities/${activityId}`)
        day.activities = day.activities.filter(a => a.id !== activityId)
      })
    },

    /** Elimina todas las actividades del día (transportes y estancias no se tocan). */
    async clearDayActivities(tripId: number, dayId: number) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day || !day.activities.length) return

      await this.runRequest('No se pudo vaciar el día.', 'Actividades eliminadas.', async () => {
        for (const a of [...day.activities]) {
          await api.delete(`/activities/${a.id}`)
        }
        day.activities = []
      })
    },

    async addTransport(
      tripId: number,
      dayId: number,
      payload: { from: string; to: string; type: string; duration?: string; notes?: string }
    ) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo añadir el transporte.', 'Transporte añadido.', async () => {
        const res = await api.post(`/days/${dayId}/transports`, {
          from: payload.from,
          to: payload.to,
          type: payload.type,
          duration: payload.duration?.trim() || undefined,
          notes: payload.notes?.trim() || undefined,
        })

        day.transports.push(res.data.data)
      })
    },

    async removeTransport(tripId: number, dayId: number, transportId: number) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo eliminar el transporte.', 'Transporte eliminado.', async () => {
        await api.delete(`/transports/${transportId}`)
        day.transports = day.transports.filter(t => t.id !== transportId)
      })
    },

    async addStay(
      tripId: number,
      dayId: number,
      payload: { name: string; location: string; check_in?: string; check_out?: string; notes?: string }
    ) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo añadir la estancia.', 'Estancia añadida.', async () => {
        const body: Record<string, unknown> = {
          name: payload.name,
          location: payload.location,
        }
        if (payload.check_in?.trim()) body.check_in = payload.check_in
        if (payload.check_out?.trim()) body.check_out = payload.check_out
        if (payload.notes?.trim()) body.notes = payload.notes

        const res = await api.post(`/days/${dayId}/stays`, body)

        day.stays.push(res.data.data)
      })
    },

    async removeStay(tripId: number, dayId: number, stayId: number) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo eliminar la estancia.', 'Estancia eliminada.', async () => {
        await api.delete(`/stays/${stayId}`)
        day.stays = day.stays.filter(s => s.id !== stayId)
      })
    }
  }
})

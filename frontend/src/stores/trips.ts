import { defineStore } from 'pinia'
import axios from 'axios'
import type { Trip } from '@/types/trip'
import api from '@/services/api'

export const useTripsStore = defineStore('trips', {
  state: (): {
    trips: Trip[]
    isLoading: boolean
    errorMessage: string | null
    successMessage: string | null
  } => ({
    trips: [],
    isLoading: false,
    errorMessage: null,
    successMessage: null
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
      }
    },

    async loadTrips() {
      await this.runRequest(
        'No se pudieron cargar los viajes.',
        null,
        async () => {
          const res = await api.get('/trips')
          this.trips = res.data.data
        }
      )
    },

    async addTrip(name: string) {
      await this.runRequest('No se pudo crear el viaje.', 'Viaje creado correctamente.', async () => {
        const res = await api.post('/trips', {
          name,
          description: ''
        })

        this.trips.push({
          ...res.data.data,
          days: []
        })
      })
    },

    async updateTripName(tripId: number, newName: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      await this.runRequest('No se pudo actualizar el viaje.', 'Viaje actualizado.', async () => {
        await api.put(`/trips/${tripId}`, {
          name: newName,
          description: trip.description
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
          activities: []
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

    async addActivity(tripId: number, dayId: number, title: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      await this.runRequest('No se pudo crear la actividad.', 'Actividad creada correctamente.', async () => {
        const res = await api.post(`/days/${dayId}/activities`, {
          title
        })

        day.activities.push(res.data.data)
      })
    },

    async updateActivity(tripId: number, dayId: number, activityId: number, newTitle: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      const activity = day.activities.find(a => a.id === activityId)
      if (!activity) return

      await this.runRequest('No se pudo actualizar la actividad.', 'Actividad actualizada.', async () => {
        await api.put(`/activities/${activityId}`, {
          title: newTitle
        })

        activity.title = newTitle
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
    }
  }
})

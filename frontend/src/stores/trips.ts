import { defineStore } from 'pinia'
import type { Trip } from '@/types/trip'
import api from '@/services/api'

export const useTripsStore = defineStore('trips', {
  state: (): { trips: Trip[] } => ({
    trips: []
  }),

  getters: {
    totalTrips: (state) => state.trips.length
  },

  actions: {
    // 🔥 CARGAR DESDE BACKEND
    async loadTrips() {
      const res = await api.get('/trips')
      this.trips = res.data
    },

    // 🔥 CREAR VIAJE
    async addTrip(name: string) {
      const res = await api.post('/trips', {
        name,
        description: ''
      })

      this.trips.push({
        ...res.data,
        days: []
      })
    },

    // 🔥 EDITAR VIAJE
    async updateTripName(tripId: number, newName: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      await api.put(`/trips/${tripId}`, {
        name: newName,
        description: trip.description
      })

      trip.name = newName
    },

    // 🔥 BORRAR VIAJE
    async removeTrip(tripId: number) {
      await api.delete(`/trips/${tripId}`)
      this.trips = this.trips.filter(t => t.id !== tripId)
    },

    // 📅 CREAR DÍA
    async addDayToTrip(tripId: number, title: string) {
      const res = await api.post(`/trips/${tripId}/days`, {
        title
      })

      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      trip.days.push({
        ...res.data,
        activities: []
      })
    },

    // 📅 EDITAR DÍA
    async updateDay(tripId: number, dayId: number, newTitle: string) {
      await api.put(`/days/${dayId}`, {
        title: newTitle
      })

      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      day.title = newTitle
    },

    // 📅 BORRAR DÍA
    async removeDay(tripId: number, dayId: number) {
      await api.delete(`/days/${dayId}`)

      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      trip.days = trip.days.filter(d => d.id !== dayId)
    },

    // 🧠 CREAR ACTIVIDAD
    async addActivity(tripId: number, dayId: number, title: string) {
      const res = await api.post(`/days/${dayId}/activities`, {
        title
      })

      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      day.activities.push(res.data)
    },

    // 🧠 EDITAR ACTIVIDAD
    async updateActivity(tripId: number, dayId: number, activityId: number, newTitle: string) {
      await api.put(`/activities/${activityId}`, {
        title: newTitle
      })

      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      const activity = day.activities.find(a => a.id === activityId)
      if (!activity) return

      activity.title = newTitle
    },

    // 🧠 BORRAR ACTIVIDAD
    async removeActivity(tripId: number, dayId: number, activityId: number) {
      await api.delete(`/activities/${activityId}`)

      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      day.activities = day.activities.filter(a => a.id !== activityId)
    }
  }
})

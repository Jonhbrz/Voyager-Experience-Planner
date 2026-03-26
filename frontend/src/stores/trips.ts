import { defineStore } from 'pinia'
import type { Trip } from '@/types/trip'

export const useTripsStore = defineStore('trips', {
  state: (): { trips: Trip[] } => {
    const storedTrips = localStorage.getItem('trips')

    if (storedTrips) {
      return {
        trips: JSON.parse(storedTrips)
      }
    }

  const defaultTrips: Trip[] = [
      {
        id: 1,
        name: 'Tailandia',
        days: [
          {
            id: 1,
            title: 'Día 1',
            activities: [
              { id: 1, title: 'Visitar templo' }
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'Japón',
        days: []
      },
      {
        id: 3,
        name: 'Italia',
        days: []
      }
    ]

    localStorage.setItem('trips', JSON.stringify(defaultTrips))

    return {
      trips: defaultTrips
    }
  },

  getters: {
    totalTrips: (state) => state.trips.length
  },

  actions: {
    addTrip(name: string) {
      const newTrip = {
        id: Date.now(),
        name,
        days: []
      }

      this.trips.push(newTrip)

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    updateTripName(tripId: number, newName: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      trip.name = newName

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    removeTrip(tripId: number) {
      this.trips = this.trips.filter(t => t.id !== tripId)

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    addDayToTrip(tripId: number, title: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const newDay = {
        id: Date.now(),
        title,
        activities: []
      }

      trip.days.push(newDay)

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    updateDay(tripId: number, dayId: number, newTitle: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      day.title = newTitle

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    removeDay(tripId: number, dayId: number) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      trip.days = trip.days.filter(d => d.id !== dayId)

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    addActivity(tripId: number, dayId: number, title: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      const newActivity = {
        id: Date.now(),
        title
      }

      day.activities.push(newActivity)

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    updateActivity(tripId: number, dayId: number, activityId: number, newTitle: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      const activity = day.activities.find(a => a.id === activityId)
      if (!activity) return

      activity.title = newTitle

      localStorage.setItem('trips', JSON.stringify(this.trips))
    },

    removeActivity(tripId: number, dayId: number, activityId: number) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return

      const day = trip.days.find(d => d.id === dayId)
      if (!day) return

      day.activities = day.activities.filter(a => a.id !== activityId)

      localStorage.setItem('trips', JSON.stringify(this.trips))
    }
  }
})

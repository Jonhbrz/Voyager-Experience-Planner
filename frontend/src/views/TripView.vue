<template>
  <MainLayout>
  <div v-if="trip">

    <div class="trip-header">

      <!-- MODO NORMAL -->
      <div v-if="!editingTrip">
        <h1>{{ trip.name }}</h1>

        <div class="actions">
          <button @click="startEditTrip">✏️</button>
          <button @click="deleteTrip">🗑</button>
        </div>
      </div>

      <!-- MODO EDICIÓN -->
      <div v-else>
        <input v-model="editTripName" />
        <button @click="saveTripEdit">Guardar</button>
        <button @click="cancelTripEdit">Cancelar</button>
      </div>

    </div>

      <!-- BOTÓN -->
      <button class="primary" @click="showForm = !showForm">
        + Añadir día
      </button>

      <!-- FORMULARIO -->
      <div v-if="showForm" class="form">
        <input
          v-model="newDayTitle"
          placeholder="Nombre del día"
        />
        <button @click="addDay">Guardar</button>
      </div>

      <h2>Días</h2>

    <!-- LISTA -->
    <div v-if="trip.days.length > 0">

      <div
        v-for="day in trip.days"
        :key="day.id"
        class="day-card"
      >

        <!-- MODO NORMAL -->
        <div v-if="editingDayId !== day.id" class="day-header">
          <span>{{ day.title }}</span>

          <div class="actions">
            <button @click="startEdit(day)">✏️</button>
            <button @click="deleteDay(day.id)">🗑</button>
          </div>
        </div>

        <!-- MODO EDICIÓN -->
        <div v-else>
          <input v-model="editTitle" />
          <button @click="saveEdit(day.id)">Guardar</button>
          <button @click="cancelEdit">Cancelar</button>
        </div>

    <!-- ACTIVIDADES -->
    <div class="activities">

      <h4>Actividades</h4>

      <div v-if="day.activities.length > 0">
        <div
          v-for="activity in day.activities"
          :key="activity.id"
          class="activity"
        >

          <!-- MODO NORMAL -->
          <div v-if="editingActivityId !== activity.id">
            {{ activity.title }}

            <button @click="startEditActivity(day.id, activity)">✏️</button>
            <button @click="deleteActivity(day.id, activity.id)">🗑</button>
          </div>

          <!-- MODO EDICIÓN -->
          <div v-else>
            <input v-model="editActivityTitle" />
            <button @click="saveEditActivity(day.id, activity.id)">Guardar</button>
            <button @click="cancelEditActivity">Cancelar</button>
          </div>

        </div>
      </div>

      <div v-else>
        <p>No hay actividades</p>
      </div>

      <input
        v-model="newActivityTitle[day.id]"
        placeholder="Nueva actividad"
      />
      <button @click="addActivity(day.id)">
        Añadir
      </button>

    </div>

  </div>

</div>

<div v-else>
  <p>No hay días todavía</p>
</div>

    </div>

    <div v-else>
      <p>Viaje no encontrado</p>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useTripsStore } from '@/stores/trips'
import MainLayout from '@/layouts/MainLayout.vue'
import type { Trip } from '@/types/trip'
import { useRouter } from 'vue-router'

const route = useRoute()
const tripsStore = useTripsStore()

const tripId = computed(() => Number(route.params.id))

const trip = computed<Trip | undefined>(() => {
  return tripsStore.trips.find(t => t.id === tripId.value)
})

const router = useRouter()

// ✏️ editar viaje
const editingTrip = ref(false)
const editTripName = ref('')

const startEditTrip = () => {
  if (!trip.value) return
  editingTrip.value = true
  editTripName.value = trip.value.name
}

const saveTripEdit = () => {
  if (!editTripName.value.trim()) return

  tripsStore.updateTripName(tripId.value, editTripName.value)

  editingTrip.value = false
}

const cancelTripEdit = () => {
  editingTrip.value = false
}

// 🗑 eliminar viaje
const deleteTrip = () => {
  const confirmDelete = confirm('¿Eliminar este viaje?')

  if (!confirmDelete) return

  tripsStore.removeTrip(tripId.value)

  router.push('/')
}

// 👇 formulario
const showForm = ref(false)
const newDayTitle = ref('')

const addDay = () => {
  if (!newDayTitle.value.trim()) return

  tripsStore.addDayToTrip(tripId.value, newDayTitle.value)

  newDayTitle.value = ''
  showForm.value = false
}

// ✏️ edición
const editingDayId = ref<number | null>(null)
const editTitle = ref('')

import type { Day } from '@/types/trip'
const startEdit = (day: Day) => {
  editingDayId.value = day.id
  editTitle.value = day.title
}

const saveEdit = (dayId: number) => {
  if (!editTitle.value.trim()) return

  tripsStore.updateDay(tripId.value, dayId, editTitle.value)

  editingDayId.value = null
  editTitle.value = ''
}

const cancelEdit = () => {
  editingDayId.value = null
  editTitle.value = ''
}

// 🗑 eliminar
const deleteDay = (dayId: number) => {
  tripsStore.removeDay(tripId.value, dayId)
}

// 🔥 actividades
const newActivityTitle = ref<Record<number, string>>({})

const addActivity = (dayId: number) => {
  const title = newActivityTitle.value[dayId]

  if (!title || !title.trim()) return

  tripsStore.addActivity(tripId.value, dayId, title)

  newActivityTitle.value[dayId] = ''
}

// ✏️ editar actividad
import type { Activity } from '@/types/trip'
const editingActivityId = ref<number | null>(null)
const editActivityTitle = ref('')

const startEditActivity = (dayId: number, activity: Activity) => {
  editingActivityId.value = activity.id
  editActivityTitle.value = activity.title
}

const saveEditActivity = (dayId: number, activityId: number) => {
  console.log('GUARDANDO', dayId, activityId, editActivityTitle.value)

  if (!editActivityTitle.value.trim()) return

  tripsStore.updateActivity(
    tripId.value,
    dayId,
    activityId,
    editActivityTitle.value
  )

  editingActivityId.value = null
  editActivityTitle.value = ''
}

const cancelEditActivity = () => {
  editingActivityId.value = null
  editActivityTitle.value = ''
}

// 🗑 eliminar
const deleteActivity = (dayId: number, activityId: number) => {
  tripsStore.removeActivity(tripId.value, dayId, activityId)
}

</script>

<style>
h1 {
  margin-bottom: 10px;
}

h2 {
  margin: 20px 0 10px;
}

.primary {
  background: #007bff;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions button {
  padding: 5px 8px;
  font-size: 14px;
}

button {
  margin-left: 6px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: #111;
  color: white;
  cursor: pointer;
}

button:hover {
  opacity: 0.85;
}

.form {
  margin-bottom: 20px;
}

input {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.day-card {
  background: var(--card);
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.day-card > div:first-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}

.activities {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.activity {
  background: var(--activity);
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

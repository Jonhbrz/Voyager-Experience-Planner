<template>
  <MainLayout>

    <div v-if="trip">

      <!-- HEADER VIAJE -->
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
        <input v-model="newDayTitle" placeholder="Nombre del día" />
        <button @click="addDay">Guardar</button>
      </div>

      <div class="trip-description">
        <textarea
          v-model="trip.description"
          placeholder="Añade una descripción del viaje..."
        />
      </div>

      <h2>Días</h2>

      <!-- LISTA DÍAS -->
      <draggable
        v-if="trip.days.length > 0"
        v-model="trip.days"
        item-key="id"
        class="days-container"
        @end="saveOrder"
        animation="200"
      >

        <template #item="{ element: day }">
          <div class="day-card">

            <!-- HEADER -->
            <div
              v-if="editingDayId !== day.id"
              class="day-header"
              @click="toggleDay(day.id)"
            >
              <span>
                Día {{ trip.days.findIndex(d => d.id === day.id) + 1 }} — {{ day.title }}
              </span>

              <div class="actions">
                <button @click.stop="startEditDay(day)">✏️</button>
                <button @click.stop="deleteDay(day.id)">🗑</button>
              </div>
            </div>

            <!-- EDICIÓN -->
            <div v-else>
              <input v-model="editTitle" />
              <button @click="saveEditDay(day.id)">Guardar</button>
              <button @click="cancelEditDay">Cancelar</button>
            </div>

            <!-- ACTIVIDADES -->
            <div v-if="openDays.includes(day.id)" class="activities">

              <h4>Actividades</h4>

              <!-- DRAG ACTIVIDADES -->
              <draggable
                v-model="day.activities"
                item-key="id"
                @end="saveOrder"
                animation="150"
              >
                <template #item="{ element: activity }">

                  <div class="activity">

                    <!-- NORMAL -->
                    <div v-if="editingActivityId !== activity.id">
                      {{ activity.title }}

                      <button @click.stop="startEditActivity(day.id, activity)">✏️</button>
                      <button @click.stop="deleteActivity(day.id, activity.id)">🗑</button>
                    </div>

                    <!-- EDICIÓN -->
                    <div v-else>
                      <input v-model="editActivityTitle" />
                      <button @click="saveEditActivity(day.id, activity.id)">Guardar</button>
                      <button @click="cancelEditActivity">Cancelar</button>
                    </div>

                  </div>

                </template>
              </draggable>

              <!-- añadir actividad -->
              <input
                v-model="newActivityTitle[day.id]"
                placeholder="Nueva actividad"
              />
              <button @click="addActivity(day.id)">
                Añadir
              </button>

            </div>

          </div>
        </template>

      </draggable>

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
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
//import { watch } from 'vue'
import { useTripsStore } from '@/stores/trips'
import draggable from 'vuedraggable'
import MainLayout from '@/layouts/MainLayout.vue'

import type { Trip, Day, Activity } from '@/types/trip'

// =========================
// 🔹 ROUTER + STORE
// =========================

const route = useRoute()
const router = useRouter()
const tripsStore = useTripsStore()

// =========================
// 🔹 DATA PRINCIPAL
// =========================

const tripId = computed(() => Number(route.params.id))

const trip = computed<Trip | undefined>(() =>
  tripsStore.trips.find(t => t.id === tripId.value)
)

// =========================
// 🔥 AUTO GUARDADO GLOBAL
// =========================

//watch(
//  () => tripsStore.trips,
//  (trips) => {
//    localStorage.setItem('trips', JSON.stringify(trips))
//  },
//  { deep: true }
//)

// =========================
// ✈️ VIAJE
// =========================

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

const deleteTrip = () => {
  if (!confirm('¿Eliminar este viaje?')) return
  tripsStore.removeTrip(tripId.value)
  router.push('/')
}

// =========================
// 📅 DÍAS
// =========================

const showForm = ref(false)
const newDayTitle = ref('')

const addDay = () => {
  if (!newDayTitle.value.trim()) return
  tripsStore.addDayToTrip(tripId.value, newDayTitle.value)
  newDayTitle.value = ''
  showForm.value = false
}

const editingDayId = ref<number | null>(null)
const editTitle = ref('')

const startEditDay = (day: Day) => {
  editingDayId.value = day.id
  editTitle.value = day.title
}

const saveEditDay = (dayId: number) => {
  if (!editTitle.value.trim()) return
  tripsStore.updateDay(tripId.value, dayId, editTitle.value)
  editingDayId.value = null
  editTitle.value = ''
}

const cancelEditDay = () => {
  editingDayId.value = null
  editTitle.value = ''
}

const deleteDay = (dayId: number) => {
  tripsStore.removeDay(tripId.value, dayId)
}

// =========================
// 🧠 ACTIVIDADES
// =========================

const newActivityTitle = ref<Record<number, string>>({})

const addActivity = (dayId: number) => {
  const title = newActivityTitle.value[dayId]
  if (!title || !title.trim()) return

  tripsStore.addActivity(tripId.value, dayId, title)
  newActivityTitle.value[dayId] = ''
}

const editingActivityId = ref<number | null>(null)
const editActivityTitle = ref('')

const startEditActivity = (_dayId: number, activity: Activity) => {
  editingActivityId.value = activity.id
  editActivityTitle.value = activity.title
}

const saveEditActivity = (dayId: number, activityId: number) => {
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

const deleteActivity = (dayId: number, activityId: number) => {
  tripsStore.removeActivity(tripId.value, dayId, activityId)
}

// =========================
// 🔄 UI (UX)
// =========================

const openDays = ref<number[]>([])

const toggleDay = (dayId: number) => {
  openDays.value.includes(dayId)
    ? openDays.value = openDays.value.filter(id => id !== dayId)
    : openDays.value.push(dayId)
}

// Drag & drop → no necesita lógica extra
const saveOrder = () => {}
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

.days-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* cursor drag */
.day-card {
  cursor: grab;
}

.day-card:active {
  cursor: grabbing;
}

/* animación suave */
.sortable-chosen {
  opacity: 0.6;
}

.sortable-ghost {
  opacity: 0.3;
}

/* actividades */
.activity {
  cursor: grab;
}
</style>

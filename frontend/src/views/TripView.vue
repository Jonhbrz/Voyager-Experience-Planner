<template>
  <MainLayout>

    <div v-if="trip">
      <Transition name="feedback">
        <p v-if="tripsStore.errorMessage" class="feedback feedback-error" role="alert">
          {{ tripsStore.errorMessage }}
        </p>
      </Transition>
      <p v-if="tripsStore.isLoading" class="loading">Guardando cambios...</p>
      <Transition name="feedback">
        <p v-if="tripsStore.successMessage" class="feedback feedback-success">
          {{ tripsStore.successMessage }}
        </p>
      </Transition>

      <div class="trip-header card-hover">

        <div v-if="!editingTrip">
          <h1>{{ trip.name }}</h1>

          <div class="actions">
            <button :disabled="tripsStore.isLoading" @click="startEditTrip">✏️</button>
            <button :disabled="tripsStore.isLoading" @click="deleteTrip">🗑</button>
          </div>
        </div>

        <div v-else>
          <input v-model="editTripName" placeholder="Nombre del viaje" />
          <button :disabled="tripsStore.isLoading" @click="saveTripEdit">Guardar</button>
          <button :disabled="tripsStore.isLoading" @click="cancelTripEdit">Cancelar</button>
        </div>

      </div>

      <button :disabled="tripsStore.isLoading" class="primary" @click="showForm = !showForm">
        + Añadir día
      </button>

      <div v-if="showForm" class="form">
        <input v-model="newDayTitle" placeholder="Nombre del día" />
        <button :disabled="tripsStore.isLoading || !newDayTitle.trim()" @click="addDay">Guardar</button>
      </div>

      <div class="trip-description">
        <textarea v-model="trip.description" placeholder="Añade una descripción del viaje..." />
      </div>

      <h2>Días</h2>

      <draggable
        v-if="trip.days.length > 0"
        v-model="trip.days"
        item-key="id"
        class="days-container"
        handle=".day-drag-handle"
        @end="saveOrder"
        animation="200"
      >

        <template #item="{ element: day, index }">
          <div
            class="day-card card-hover"
            :ref="(el) => registerDayCardEl(day.id, el)"
          >

            <div
              v-if="editingDayId !== day.id"
              class="day-header"
            >
              <span class="day-drag-handle" title="Arrastrar">⋮⋮</span>
              <button
                type="button"
                class="day-title-toggle"
                @click="toggleDay(day.id)"
              >
                <span class="accordion-chevron" :class="{ open: openDays.includes(day.id) }">▸</span>
                <span>
                  Día {{ index + 1 }} — {{ day.title }}
                </span>
              </button>

              <div class="actions">
                <button :disabled="tripsStore.isLoading" @click.stop="startEditDay(day)">✏️</button>
                <button :disabled="tripsStore.isLoading" @click.stop="deleteDay(day.id)">🗑</button>
              </div>
            </div>

            <div v-else>
              <input v-model="editTitle" placeholder="Nombre del día" />
              <button :disabled="tripsStore.isLoading" @click="saveEditDay(day.id)">Guardar</button>
              <button :disabled="tripsStore.isLoading" @click="cancelEditDay">Cancelar</button>
            </div>

            <Transition name="accordion">
              <div v-if="openDays.includes(day.id)" class="day-body-outer">
                <div class="day-body">

                  <div class="section-block section-activities">
                    <h4><span class="section-badge">📍 Actividades</span></h4>

                    <p v-if="!(day.activities || []).length" class="empty-hint">
                      Añade tu primera actividad 🚀
                    </p>

                    <div v-else class="activity-timeline">
                      <draggable
                        v-model="day.activities"
                        item-key="id"
                        class="timeline-draggable"
                        @end="saveOrder"
                        animation="150"
                      >
                        <template #item="{ element: activity, index: actIndex }">
                          <Transition name="fade-slide" appear>
                            <div class="timeline-item" :key="activity.id">
                              <div class="timeline-axis">
                                <span class="timeline-dot" />
                                <span
                                  v-if="actIndex < (day.activities || []).length - 1"
                                  class="timeline-stem"
                                  aria-hidden="true"
                                />
                              </div>
                              <div class="timeline-panel">
                                <div v-if="editingActivityId !== activity.id" class="timeline-row">
                                  <div class="timeline-main">
                                    <div class="timeline-time-line">
                                      <span class="timeline-emoji" aria-hidden="true">🕘</span>
                                      <time class="timeline-time">{{ activity.start_time || '—' }}</time>
                                      <span v-if="activity.end_time" class="timeline-end">
                                        — {{ activity.end_time }}
                                      </span>
                                    </div>
                                    <div class="timeline-title-row">
                                      <span class="type-icon" aria-hidden="true">📍</span>
                                      <span class="timeline-title">{{ activity.title }}</span>
                                      <a
                                        v-if="activity.title.trim()"
                                        class="map-link"
                                        :href="googleMapsSearchUrl(activity.title)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        @click.stop
                                      >
                                        Mapa
                                      </a>
                                    </div>
                                  </div>
                                  <div class="timeline-actions">
                                    <button :disabled="tripsStore.isLoading" @click.stop="startEditActivity(day.id, activity)">✏️</button>
                                    <button :disabled="tripsStore.isLoading" @click.stop="deleteActivity(day.id, activity.id)">🗑</button>
                                  </div>
                                </div>

                                <div v-else class="activity-edit">
                                  <input v-model="editActivityTitle" placeholder="Nombre" />
                                  <input v-model="editActivityStart" type="time" />
                                  <input v-model="editActivityEnd" type="time" />
                                  <button :disabled="tripsStore.isLoading" @click="saveEditActivity(day.id, activity.id)">Guardar</button>
                                  <button :disabled="tripsStore.isLoading" @click="cancelEditActivity">Cancelar</button>
                                </div>
                              </div>
                            </div>
                          </Transition>
                        </template>
                      </draggable>
                    </div>

                    <div class="inline-form">
                      <input v-model="activityNew(day.id).title" placeholder="Nueva actividad" />
                      <input v-model="activityNew(day.id).start_time" type="time" required />
                      <input v-model="activityNew(day.id).end_time" type="time" />
                      <button
                        :disabled="tripsStore.isLoading || !activityNew(day.id).title.trim()"
                        @click="submitAddActivity(day.id)"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>

                  <div class="section-block section-transport">
                    <h4><span class="section-badge">Transportes</span></h4>

                    <div class="inline-form transport-form">
                      <input v-model="transportDraft(day.id).from" placeholder="Desde" />
                      <span class="transport-arrow">→</span>
                      <input v-model="transportDraft(day.id).to" placeholder="Hasta" />
                      <input v-model="transportDraft(day.id).type" placeholder="Tipo (coche, tren…)" />
                      <button
                        :disabled="tripsStore.isLoading || !canAddTransport(day.id)"
                        @click="submitAddTransport(day.id)"
                      >
                        Añadir
                      </button>
                    </div>

                    <p v-if="!(day.transports || []).length" class="empty-hint muted">
                      No hay transportes todavía
                    </p>

                    <ul v-else class="simple-list">
                      <li v-for="t in (day.transports || [])" :key="t.id" class="list-row card-hover">
                        <span class="list-main">
                          <span class="type-icon" aria-hidden="true">{{ transportIcon(t.type) }}</span>
                          <span>
                            {{ t.from }} → {{ t.to }}
                            <em class="transport-type">({{ t.type }})</em>
                          </span>
                          <span class="map-links">
                            <a
                              v-if="t.from.trim()"
                              class="map-link"
                              :href="googleMapsSearchUrl(t.from)"
                              target="_blank"
                              rel="noopener noreferrer"
                            >Origen</a>
                            <a
                              v-if="t.to.trim()"
                              class="map-link"
                              :href="googleMapsSearchUrl(t.to)"
                              target="_blank"
                              rel="noopener noreferrer"
                            >Destino</a>
                          </span>
                        </span>
                        <button :disabled="tripsStore.isLoading" class="linkish" @click="removeTransportRow(day.id, t.id)">Eliminar</button>
                      </li>
                    </ul>
                  </div>

                  <div class="section-block section-stay">
                    <h4><span class="section-badge">🏨 Estancia</span></h4>

                    <div class="inline-form stay-form">
                      <input v-model="stayDraft(day.id).name" placeholder="Hotel / Airbnb" />
                      <input v-model="stayDraft(day.id).location" placeholder="Ubicación" />
                      <button
                        :disabled="tripsStore.isLoading || !canAddStay(day.id)"
                        @click="submitAddStay(day.id)"
                      >
                        Añadir
                      </button>
                    </div>

                    <p v-if="!(day.stays || []).length" class="empty-hint muted">
                      Añade tu estancia 🏨
                    </p>

                    <ul v-else class="simple-list">
                      <li v-for="s in (day.stays || [])" :key="s.id" class="list-row card-hover">
                        <span class="list-main">
                          <span class="type-icon" aria-hidden="true">🏨</span>
                          <span>
                            <strong>{{ s.name }}</strong> — {{ s.location }}
                          </span>
                          <a
                            v-if="stayMapQuery(s)"
                            class="map-link"
                            :href="googleMapsSearchUrl(stayMapQuery(s) ?? '')"
                            target="_blank"
                            rel="noopener noreferrer"
                          >Mapa</a>
                        </span>
                        <button :disabled="tripsStore.isLoading" class="linkish" @click="removeStayRow(day.id, s.id)">Eliminar</button>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            </Transition>

          </div>
        </template>

      </draggable>

      <div v-else>
        <p class="empty-hint">No hay días todavía — crea el primero arriba.</p>
      </div>

    </div>

    <div v-else>
      <p>Viaje no encontrado</p>
    </div>

  </MainLayout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useTripsStore } from '@/stores/trips'
import draggable from 'vuedraggable'
import MainLayout from '@/layouts/MainLayout.vue'
import { googleMapsSearchUrl } from '@/utils/maps'
import { transportIcon } from '@/utils/tripUi'

import type { Trip, Day, Activity, Stay } from '@/types/trip'

const route = useRoute()
const router = useRouter()
const tripsStore = useTripsStore()

const tripId = computed(() => Number(route.params.id))

const trip = computed<Trip | undefined>(() =>
  tripsStore.trips.find(t => t.id === tripId.value)
)

onMounted(async () => {
  if (!tripsStore.trips.length) {
    await tripsStore.loadTrips()
  }
})

function stayMapQuery(s: Stay): string | null {
  const parts = [s.location?.trim(), s.name?.trim()].filter(Boolean)
  const q = parts.join(' ').trim()
  return q || null
}

const dayCardEls = new Map<number, HTMLElement>()

function registerDayCardEl(dayId: number, el: unknown) {
  if (el instanceof HTMLElement) {
    dayCardEls.set(dayId, el)
  } else {
    dayCardEls.delete(dayId)
  }
}

const editingTrip = ref(false)
const editTripName = ref('')

const startEditTrip = () => {
  if (!trip.value) return
  editingTrip.value = true
  editTripName.value = trip.value.name
}

const saveTripEdit = async () => {
  if (!editTripName.value.trim()) return
  await tripsStore.updateTripName(tripId.value, editTripName.value)
  editingTrip.value = false
}

const cancelTripEdit = () => {
  editingTrip.value = false
}

const deleteTrip = async () => {
  if (!confirm('¿Eliminar este viaje?')) return
  await tripsStore.removeTrip(tripId.value)
  router.push('/')
}

const showForm = ref(false)
const newDayTitle = ref('')

const addDay = async () => {
  if (!newDayTitle.value.trim()) return
  await tripsStore.addDayToTrip(tripId.value, newDayTitle.value)
  newDayTitle.value = ''
  showForm.value = false
}

const editingDayId = ref<number | null>(null)
const editTitle = ref('')

const startEditDay = (day: Day) => {
  editingDayId.value = day.id
  editTitle.value = day.title
}

const saveEditDay = async (dayId: number) => {
  if (!editTitle.value.trim()) return
  await tripsStore.updateDay(tripId.value, dayId, editTitle.value)
  editingDayId.value = null
  editTitle.value = ''
}

const cancelEditDay = () => {
  editingDayId.value = null
  editTitle.value = ''
}

const deleteDay = async (dayId: number) => {
  await tripsStore.removeDay(tripId.value, dayId)
}

const newActivityByDay = reactive<Record<number, { title: string; start_time: string; end_time: string }>>({})

function activityNew(dayId: number) {
  if (!newActivityByDay[dayId]) {
    newActivityByDay[dayId] = { title: '', start_time: '09:00', end_time: '' }
  }
  return newActivityByDay[dayId]
}

const submitAddActivity = async (dayId: number) => {
  const d = activityNew(dayId)
  if (!d.title.trim()) return

  await tripsStore.addActivity(tripId.value, dayId, {
    title: d.title.trim(),
    start_time: d.start_time,
    end_time: d.end_time.trim() ? d.end_time : null,
  })

  d.title = ''
  d.start_time = '09:00'
  d.end_time = ''
}

const editingActivityId = ref<number | null>(null)
const editActivityTitle = ref('')
const editActivityStart = ref('09:00')
const editActivityEnd = ref('')

const startEditActivity = (_dayId: number, activity: Activity) => {
  editingActivityId.value = activity.id
  editActivityTitle.value = activity.title
  editActivityStart.value = activity.start_time || '09:00'
  editActivityEnd.value = activity.end_time || ''
}

const saveEditActivity = async (dayId: number, activityId: number) => {
  if (!editActivityTitle.value.trim()) return

  await tripsStore.updateActivity(tripId.value, dayId, activityId, {
    title: editActivityTitle.value.trim(),
    start_time: editActivityStart.value,
    end_time: editActivityEnd.value.trim() ? editActivityEnd.value : null,
  })

  editingActivityId.value = null
  editActivityTitle.value = ''
  editActivityStart.value = '09:00'
  editActivityEnd.value = ''
}

const cancelEditActivity = () => {
  editingActivityId.value = null
  editActivityTitle.value = ''
  editActivityStart.value = '09:00'
  editActivityEnd.value = ''
}

const deleteActivity = async (dayId: number, activityId: number) => {
  await tripsStore.removeActivity(tripId.value, dayId, activityId)
}

const transportDrafts = reactive<Record<number, { from: string; to: string; type: string }>>({})

function transportDraft(dayId: number) {
  if (!transportDrafts[dayId]) {
    transportDrafts[dayId] = { from: '', to: '', type: '' }
  }
  return transportDrafts[dayId]
}

const canAddTransport = (dayId: number) => {
  const d = transportDraft(dayId)
  return Boolean(d.from.trim() && d.to.trim() && d.type.trim())
}

const submitAddTransport = async (dayId: number) => {
  const d = transportDraft(dayId)
  if (!canAddTransport(dayId)) return

  await tripsStore.addTransport(tripId.value, dayId, {
    from: d.from.trim(),
    to: d.to.trim(),
    type: d.type.trim(),
  })

  d.from = ''
  d.to = ''
  d.type = ''
}

const removeTransportRow = async (dayId: number, transportId: number) => {
  await tripsStore.removeTransport(tripId.value, dayId, transportId)
}

const stayDrafts = reactive<Record<number, { name: string; location: string }>>({})

function stayDraft(dayId: number) {
  if (!stayDrafts[dayId]) {
    stayDrafts[dayId] = { name: '', location: '' }
  }
  return stayDrafts[dayId]
}

const canAddStay = (dayId: number) => {
  const d = stayDraft(dayId)
  return Boolean(d.name.trim() && d.location.trim())
}

const submitAddStay = async (dayId: number) => {
  const d = stayDraft(dayId)
  if (!canAddStay(dayId)) return

  await tripsStore.addStay(tripId.value, dayId, {
    name: d.name.trim(),
    location: d.location.trim(),
  })

  d.name = ''
  d.location = ''
}

const removeStayRow = async (dayId: number, stayId: number) => {
  await tripsStore.removeStay(tripId.value, dayId, stayId)
}

const openDays = ref<number[]>([])
const accordionSingle = ref(true)

const toggleDay = async (dayId: number) => {
  const wasOpen = openDays.value.includes(dayId)
  if (wasOpen) {
    openDays.value = openDays.value.filter(id => id !== dayId)
    return
  }
  if (accordionSingle.value) {
    openDays.value = [dayId]
  } else {
    openDays.value = [...openDays.value, dayId]
  }

  await nextTick()
  requestAnimationFrame(() => {
    dayCardEls.get(dayId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

const saveOrder = () => {}
</script>

<style scoped>
h1 {
  margin-bottom: 10px;
}

h2 {
  margin: 20px 0 10px;
}

.primary {
  background: #007bff;
}

.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.day-drag-handle {
  cursor: grab;
  user-select: none;
  color: #888;
  padding: 4px;
}

.day-drag-handle:active {
  cursor: grabbing;
}

.day-title-toggle {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  color: inherit;
  padding: 4px 0;
}

.day-title-toggle:hover {
  opacity: 0.85;
}

.accordion-chevron {
  display: inline-block;
  transition: transform 0.22s ease;
  color: #666;
}

.accordion-chevron.open {
  transform: rotate(90deg);
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.day-body-outer {
  overflow: hidden;
}

.day-body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.section-block {
  margin-bottom: 18px;
  padding: 10px 12px 12px;
  border-radius: 8px;
  border-left: 4px solid #ccc;
  background: rgba(0, 0, 0, 0.02);
}

.section-activities {
  border-left-color: #81c784;
}

.section-transport {
  border-left-color: #64b5f6;
}

.section-stay {
  border-left-color: #ba68c8;
}

.section-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

.section-block h4 {
  margin: 0 0 10px;
}

.empty-hint {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #555;
}

.empty-hint.muted {
  color: #888;
  font-size: 0.9rem;
}

.activity-timeline {
  margin-bottom: 8px;
}

.timeline-draggable {
  min-height: 0;
}

.timeline-item {
  display: flex;
  gap: 12px;
  align-items: stretch;
  margin-bottom: 4px;
}

.timeline-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 22px;
  flex-shrink: 0;
  padding-top: 6px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #66bb6a;
  border: 2px solid var(--card, #fff);
  box-shadow: 0 0 0 1px #a5d6a7;
  z-index: 1;
  flex-shrink: 0;
}

.timeline-stem {
  width: 2px;
  flex: 1;
  min-height: 1.25rem;
  margin-top: 2px;
  background: linear-gradient(180deg, #a5d6a7, #c8e6c9);
  border-radius: 1px;
}

.timeline-panel {
  flex: 1;
  min-width: 0;
  background: var(--activity);
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
}

.timeline-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.timeline-main {
  flex: 1;
  min-width: 0;
}

.timeline-time-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}

.timeline-emoji {
  font-size: 0.95rem;
  opacity: 0.9;
}

.timeline-time {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #2e7d32;
}

.timeline-end {
  font-size: 0.88rem;
  color: #555;
  font-variant-numeric: tabular-nums;
}

.timeline-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 1rem;
  line-height: 1;
}

.timeline-title {
  font-weight: 600;
}

.map-link {
  font-size: 0.82rem;
  color: #1565c0;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.map-link:hover {
  border-bottom-color: #1565c0;
}

.timeline-actions {
  flex-shrink: 0;
}

.timeline-actions button {
  margin-left: 4px;
}

.activity-edit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.inline-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.transport-form .transport-arrow {
  margin: 0 2px;
  color: #666;
}

.transport-type {
  color: #666;
  font-size: 0.9em;
}

.simple-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
}

.list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 10px;
  border-bottom: 1px solid #eee;
  font-size: 0.95rem;
  border-radius: 8px;
  margin-bottom: 6px;
}

.list-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.list-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.map-links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button.linkish {
  background: transparent;
  color: #c62828;
  text-decoration: underline;
  padding: 4px 8px;
}

.days-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sortable-chosen {
  opacity: 0.6;
}

.sortable-ghost {
  opacity: 0.3;
}

.timeline-draggable .timeline-item {
  cursor: grab;
}

.timeline-draggable .timeline-item:active {
  cursor: grabbing;
}

.feedback {
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.feedback-error {
  background: #ffebee;
  color: #b00020;
  border: 1px solid #ffcdd2;
}

.feedback-success {
  background: #e8f5e9;
  color: #1b5e20;
  border: 1px solid #c8e6c9;
}

.feedback-enter-active,
.feedback-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.32s ease, opacity 0.26s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 2000px;
  opacity: 1;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.loading {
  color: #444;
  margin-bottom: 8px;
}

:global(.dark) .feedback-error {
  background: #3e2723;
  color: #ffcdd2;
  border-color: #5d4037;
}

:global(.dark) .feedback-success {
  background: #1b3a1e;
  color: #c8e6c9;
  border-color: #2e4a32;
}

:global(.dark) .empty-hint {
  color: #b0b0b0;
}

:global(.dark) .map-link {
  color: #90caf9;
}

:global(.dark) .map-link:hover {
  border-bottom-color: #90caf9;
}
</style>

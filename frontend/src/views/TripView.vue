<template>
  <MainLayout>

    <div
      v-if="!tripsStore.initialLoadDone && tripsStore.isLoading && !trip"
      class="trip-page-skeleton"
      aria-busy="true"
      aria-label="Cargando viaje"
    >
      <div class="skeleton skeleton-card trip-skel-header">
        <div class="skeleton skeleton-text trip-skel-h1" />
        <div class="skeleton skeleton-text trip-skel-sub" />
      </div>
      <div class="skeleton skeleton-text trip-skel-desc" />
      <h2 class="sr-only">Días</h2>
      <div v-for="d in 2" :key="d" class="skeleton skeleton-card trip-skel-day">
        <div class="skeleton skeleton-text trip-skel-daytitle" />
        <div class="trip-skel-act-rows">
          <div v-for="a in 3" :key="a" class="trip-skel-act-row">
            <div class="skeleton trip-skel-dot" />
            <div class="skeleton skeleton-text trip-skel-act-line" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="trip" class="trip-root" :aria-busy="tripsStore.isLoading">
      <p v-if="tripsStore.isLoading" class="loading" role="status">Guardando cambios...</p>

      <div class="trip-page-header section">
        <div class="trip-header card-hover">

          <div v-if="!editingTrip" class="trip-header-view">
            <div class="trip-header-text">
              <h1>{{ trip.name }}</h1>
              <p v-if="tripDurationDays !== null" class="trip-duration">
                {{ tripDurationDays }} {{ tripDurationDays === 1 ? 'día' : 'días' }}
              </p>
              <p v-if="tripDateRange" class="trip-date-range">{{ tripDateRange }}</p>
              <p v-if="trip.description?.trim()" class="trip-desc-readonly">{{ trip.description }}</p>
            </div>
            <div class="actions">
              <button
                type="button"
                :disabled="tripsStore.isLoading"
                aria-label="Editar nombre del viaje"
                @click="startEditTrip"
              >
                ✏️
              </button>
              <button
                type="button"
                :disabled="tripsStore.isLoading"
                aria-label="Eliminar viaje"
                @click="deleteTrip"
              >
                🗑
              </button>
            </div>
          </div>

          <form v-else class="trip-edit-name-form" @submit.prevent="saveTripEdit">
            <input v-model="editTripName" placeholder="Nombre del viaje" :disabled="tripsStore.isLoading" />
            <button
              type="submit"
              :disabled="tripsStore.isLoading || !editTripName.trim()"
              aria-label="Guardar nombre del viaje"
            >
              Guardar
            </button>
            <button
              type="button"
              :disabled="tripsStore.isLoading"
              aria-label="Cancelar edición del viaje"
              @click="cancelTripEdit"
            >
              Cancelar
            </button>
          </form>

        </div>
      </div>

      <div class="trip-toolbar section">
        <button
          type="button"
          class="primary"
          :disabled="tripsStore.isLoading"
          aria-label="Añadir un día al viaje"
          @click="showForm = !showForm"
        >
          + Añadir día
        </button>

        <form v-if="showForm" class="form add-day-form" @submit.prevent="addDay">
          <input v-model="newDayTitle" placeholder="Nombre del día" :disabled="tripsStore.isLoading" />
          <button
            type="submit"
            :disabled="tripsStore.isLoading || !newDayTitle.trim()"
            aria-label="Guardar nuevo día"
          >
            Guardar
          </button>
          <button type="button" :disabled="tripsStore.isLoading" aria-label="Cancelar nuevo día" @click="cancelAddDay">
            Cancelar
          </button>
        </form>
      </div>

      <div class="trip-page-dias section">
      <h2>Días</h2>

      <draggable
        v-if="trip.days.length > 0"
        v-model="trip.days"
        item-key="id"
        class="days-container"
        handle=".day-drag-handle"
        :delay="180"
        :delay-on-touch-only="true"
        @end="saveOrder"
        animation="200"
      >

        <template #item="{ element: day, index }">
          <div
            class="day-card card-hover"
            :class="{ 'day-card--flash': dayFlashId === day.id }"
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
                :aria-expanded="openDays.includes(day.id)"
                :aria-controls="`day-body-${day.id}`"
                @click="toggleDay(day.id)"
              >
                <span class="accordion-chevron" :class="{ open: openDays.includes(day.id) }">▸</span>
                <span>
                  {{ dayHeadingLine(day, index) }}
                </span>
              </button>

              <div class="actions">
                <button
                  type="button"
                  :disabled="tripsStore.isLoading"
                  aria-label="Editar día"
                  @click.stop="startEditDay(day)"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  :disabled="tripsStore.isLoading"
                  aria-label="Eliminar día"
                  @click.stop="deleteDay(day.id)"
                >
                  🗑
                </button>
              </div>
            </div>

            <form v-else class="day-edit-form" @submit.prevent="saveEditDay(day.id)">
              <input v-model="editTitle" placeholder="Nombre del día" :disabled="tripsStore.isLoading" />
              <button type="submit" :disabled="tripsStore.isLoading || !editTitle.trim()" aria-label="Guardar nombre del día">
                Guardar
              </button>
              <button
                type="button"
                :disabled="tripsStore.isLoading"
                aria-label="Cancelar edición del día"
                @click="cancelEditDay"
              >
                Cancelar
              </button>
            </form>

            <Transition name="accordion">
              <div
                v-if="openDays.includes(day.id)"
                :id="`day-body-${day.id}`"
                class="day-body-outer"
              >
                <div class="day-body">

                  <div class="section-block section-activities">
                    <div class="section-activities-head">
                      <h4><span class="section-badge">📍 Actividades</span></h4>
                      <button
                        v-if="(day.activities || []).length"
                        type="button"
                        class="clear-day-btn"
                        :disabled="tripsStore.isLoading"
                        aria-label="Eliminar todas las actividades del día"
                        @click.stop="onClearDayActivities(day.id)"
                      >
                        Vaciar día
                      </button>
                    </div>

                    <p v-if="!(day.activities || []).length" class="empty-hint">
                      Añade tu primera actividad 🚀
                    </p>

                    <div v-else class="activity-timeline">
                      <draggable
                        v-model="day.activities"
                        item-key="id"
                        class="timeline-draggable"
                        handle=".activity-drag-handle"
                        ghost-class="activity-sort-ghost"
                        chosen-class="activity-sort-chosen"
                        drag-class="activity-sort-drag"
                        :delay="180"
                        :delay-on-touch-only="true"
                        :disabled="editingActivityId !== null"
                        :animation="220"
                        @end="saveOrder"
                      >
                        <template #item="{ element: activity, index: actIndex }">
                          <div
                            class="timeline-item"
                            :class="{ 'timeline-item--flash': flashActivityId === activity.id }"
                            :key="activity.id"
                          >
                              <div class="timeline-axis activity-drag-handle" title="Arrastrar para reordenar">
                                <span class="timeline-dot" />
                                <span
                                  v-if="actIndex < (day.activities || []).length - 1"
                                  class="timeline-stem"
                                  aria-hidden="true"
                                />
                              </div>
                              <div
                                class="timeline-panel"
                                :class="{ 'timeline-panel--editing': editingActivityId === activity.id }"
                              >
                                <div v-if="editingActivityId !== activity.id" class="timeline-row">
                                  <div
                                    class="timeline-main timeline-main--clickable"
                                    role="button"
                                    tabindex="0"
                                    @click="onActivityMainClick(day.id, activity)"
                                    @keydown.enter.prevent="onActivityMainClick(day.id, activity)"
                                    @keydown.space.prevent="onActivityMainClick(day.id, activity)"
                                  >
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
                                    <button
                                      type="button"
                                      :disabled="tripsStore.isLoading"
                                      aria-label="Editar actividad"
                                      title="Editar"
                                      @click.stop="startEditActivity(day.id, activity)"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      :disabled="tripsStore.isLoading"
                                      aria-label="Eliminar actividad"
                                      @click.stop="deleteActivity(day.id, activity.id)"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </div>

                                <form
                                  v-else
                                  class="activity-edit"
                                  @submit.prevent="saveEditActivity(day.id, activity.id)"
                                >
                                  <input
                                    v-model="editActivityTitle"
                                    placeholder="Nombre"
                                    :disabled="tripsStore.isLoading"
                                    @keydown.esc.prevent="cancelEditActivity"
                                  />
                                  <input
                                    v-model="editActivityStart"
                                    type="time"
                                    :disabled="tripsStore.isLoading"
                                    @keydown.esc.prevent="cancelEditActivity"
                                  />
                                  <input
                                    v-model="editActivityEnd"
                                    type="time"
                                    :disabled="tripsStore.isLoading"
                                    @keydown.esc.prevent="cancelEditActivity"
                                  />
                                  <button type="submit" :disabled="tripsStore.isLoading || !editActivityTitle.trim()" aria-label="Guardar actividad">
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    :disabled="tripsStore.isLoading"
                                    aria-label="Cancelar edición de actividad"
                                    @click="cancelEditActivity"
                                  >
                                    Cancelar
                                  </button>
                                </form>
                              </div>
                            </div>
                        </template>
                      </draggable>
                    </div>

                    <button
                      type="button"
                      class="quick-add-activity-btn"
                      :disabled="tripsStore.isLoading"
                      aria-label="Añadir actividad al día"
                      @click="toggleQuickAdd(day.id)"
                    >
                      + Añadir actividad
                    </button>

                    <form
                      v-if="quickAddOpen[day.id]"
                      class="quick-add-row"
                      @submit.prevent="submitQuickAdd(day.id)"
                    >
                      <input
                        v-model="activityNew(day.id).start_time"
                        class="quick-add-time"
                        type="time"
                        :disabled="tripsStore.isLoading"
                        @keydown.esc.prevent="closeQuickAdd(day.id)"
                      />
                      <input
                        :ref="(el) => setQuickAddTitleRef(day.id, el)"
                        v-model="activityNew(day.id).title"
                        class="quick-add-title"
                        type="text"
                        placeholder="Actividad"
                        :disabled="tripsStore.isLoading"
                        @keydown.esc.prevent="closeQuickAdd(day.id)"
                      />
                      <button
                        type="submit"
                        class="quick-add-save"
                        :disabled="tripsStore.isLoading || !activityNew(day.id).title.trim()"
                        aria-label="Guardar nueva actividad"
                      >
                        Añadir
                      </button>
                    </form>
                  </div>

                  <div class="section-block section-transport">
                    <h4><span class="section-badge">Transportes</span></h4>

                    <form class="inline-form transport-form" @submit.prevent="submitAddTransport(day.id)">
                      <input
                        v-model="transportDraft(day.id).from"
                        placeholder="Desde"
                        :disabled="tripsStore.isLoading"
                      />
                      <span class="transport-arrow">→</span>
                      <input
                        v-model="transportDraft(day.id).to"
                        placeholder="Hasta"
                        :disabled="tripsStore.isLoading"
                      />
                      <input
                        v-model="transportDraft(day.id).type"
                        placeholder="Tipo (coche, tren…)"
                        :disabled="tripsStore.isLoading"
                      />
                      <button
                        type="submit"
                        :disabled="tripsStore.isLoading || !canAddTransport(day.id)"
                        aria-label="Añadir transporte"
                      >
                        Añadir
                      </button>
                    </form>

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
                        <button
                          type="button"
                          :disabled="tripsStore.isLoading"
                          class="linkish"
                          aria-label="Eliminar transporte"
                          @click="removeTransportRow(day.id, t.id)"
                        >
                          Eliminar
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div class="section-block section-stay">
                    <h4><span class="section-badge">🏨 Estancia</span></h4>

                    <form class="inline-form stay-form" @submit.prevent="submitAddStay(day.id)">
                      <input
                        v-model="stayDraft(day.id).name"
                        placeholder="Hotel / Airbnb"
                        :disabled="tripsStore.isLoading"
                      />
                      <input
                        v-model="stayDraft(day.id).location"
                        placeholder="Ubicación"
                        :disabled="tripsStore.isLoading"
                      />
                      <button
                        type="submit"
                        :disabled="tripsStore.isLoading || !canAddStay(day.id)"
                        aria-label="Añadir estancia"
                      >
                        Añadir
                      </button>
                    </form>

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
                        <button
                          type="button"
                          :disabled="tripsStore.isLoading"
                          class="linkish"
                          aria-label="Eliminar estancia"
                          @click="removeStayRow(day.id, s.id)"
                        >
                          Eliminar
                        </button>
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

    </div>

    <div v-else class="trip-not-found">
      <p>Viaje no encontrado</p>
    </div>

  </MainLayout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useTripsStore } from '@/stores/trips'
import draggable from 'vuedraggable'
import MainLayout from '@/layouts/MainLayout.vue'
import { googleMapsSearchUrl } from '@/utils/maps'
import {
  formatDayShort,
  formatTripDateRange,
  getDayDate,
  getTripDuration,
} from '@/utils/tripDates'
import { transportIcon } from '@/utils/tripUi'

import type { Trip, Day, Activity, Stay } from '@/types/trip'

const route = useRoute()
const router = useRouter()
const tripsStore = useTripsStore()

const tripId = computed(() => Number(route.params.id))

const trip = computed<Trip | undefined>(() =>
  tripsStore.trips.find(t => t.id === tripId.value)
)

const tripDateRange = computed(() => (trip.value ? formatTripDateRange(trip.value) : null))

const tripDurationDays = computed(() => (trip.value ? getTripDuration(trip.value) : null))

function dayHeadingLine(day: Day, index: number): string {
  const t = trip.value
  const prefix = `Día ${index + 1}`
  if (!t?.start_date) {
    return `${prefix} — ${day.title}`
  }
  const d = getDayDate(day, t)
  if (!d) {
    return `${prefix} — ${day.title}`
  }
  return `${prefix} — ${formatDayShort(d)}`
}

const onClearDayActivities = async (dayId: number) => {
  if (tripsStore.isLoading) return
  if (!confirm('¿Eliminar todas las actividades de este día? (no se borra el día)')) return
  await tripsStore.clearDayActivities(tripId.value, dayId)
}

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
  if (tripsStore.isLoading) return
  if (!trip.value) return
  editingTrip.value = true
  editTripName.value = trip.value.name
}

const saveTripEdit = async () => {
  if (tripsStore.isLoading) return
  if (!editTripName.value.trim()) return
  await tripsStore.updateTripName(tripId.value, editTripName.value)
  await nextTick()
  if (!tripsStore.errorMessage) {
    editingTrip.value = false
  }
}

const cancelTripEdit = () => {
  editingTrip.value = false
}

const deleteTrip = async () => {
  if (tripsStore.isLoading) return
  if (!confirm('¿Eliminar este viaje?')) return
  await tripsStore.removeTrip(tripId.value)
  router.push('/')
}

const showForm = ref(false)
const newDayTitle = ref('')

const addDay = async () => {
  if (tripsStore.isLoading) return
  if (!newDayTitle.value.trim()) return
  const t = trip.value
  const beforeIds = new Set((t?.days ?? []).map((d) => d.id))
  await tripsStore.addDayToTrip(tripId.value, newDayTitle.value)
  await nextTick()
  if (!tripsStore.errorMessage) {
    cancelAddDay()
    const t2 = tripsStore.trips.find((x) => x.id === tripId.value)
    const newDay = t2?.days.find((d) => !beforeIds.has(d.id))
    if (newDay) {
      triggerDayFlash(newDay.id)
    }
  }
}

const cancelAddDay = () => {
  showForm.value = false
  newDayTitle.value = ''
}

const editingDayId = ref<number | null>(null)
const editTitle = ref('')

const startEditDay = (day: Day) => {
  if (tripsStore.isLoading) return
  editingDayId.value = day.id
  editTitle.value = day.title
}

const saveEditDay = async (dayId: number) => {
  if (tripsStore.isLoading) return
  if (!editTitle.value.trim()) return
  await tripsStore.updateDay(tripId.value, dayId, editTitle.value)
  await nextTick()
  if (!tripsStore.errorMessage) {
    editingDayId.value = null
    editTitle.value = ''
  }
}

const cancelEditDay = () => {
  editingDayId.value = null
  editTitle.value = ''
}

const deleteDay = async (dayId: number) => {
  if (tripsStore.isLoading) return
  await tripsStore.removeDay(tripId.value, dayId)
}

const newActivityByDay = reactive<Record<number, { title: string; start_time: string; end_time: string }>>({})

const quickAddOpen = reactive<Record<number, boolean>>({})

const quickAddTitleRefs = new Map<number, HTMLInputElement>()

function setQuickAddTitleRef(dayId: number, el: unknown) {
  if (el instanceof HTMLInputElement) {
    quickAddTitleRefs.set(dayId, el)
  } else {
    quickAddTitleRefs.delete(dayId)
  }
}

watch(
  quickAddOpen,
  () => {
    const openEntry = Object.entries(quickAddOpen).find(([, v]) => v)
    if (!openEntry) return
    const dayId = Number(openEntry[0])
    if (Number.isNaN(dayId)) return
    nextTick(() => {
      quickAddTitleRefs.get(dayId)?.focus()
    })
  },
  { deep: true }
)

const flashActivityId = ref<number | null>(null)
let flashActivityTimer: ReturnType<typeof setTimeout> | null = null

function triggerActivityFlash(activityId: number) {
  if (flashActivityTimer) {
    clearTimeout(flashActivityTimer)
    flashActivityTimer = null
  }
  flashActivityId.value = activityId
  flashActivityTimer = setTimeout(() => {
    flashActivityId.value = null
    flashActivityTimer = null
  }, 300)
}

const dayFlashId = ref<number | null>(null)
let dayFlashTimer: ReturnType<typeof setTimeout> | null = null

function triggerDayFlash(dayId: number) {
  if (dayFlashTimer) {
    clearTimeout(dayFlashTimer)
    dayFlashTimer = null
  }
  dayFlashId.value = dayId
  dayFlashTimer = setTimeout(() => {
    dayFlashId.value = null
    dayFlashTimer = null
  }, 700)
}

function activityNew(dayId: number) {
  if (!newActivityByDay[dayId]) {
    newActivityByDay[dayId] = { title: '', start_time: '09:00', end_time: '' }
  }
  return newActivityByDay[dayId]
}

function toggleQuickAdd(dayId: number) {
  if (tripsStore.isLoading) return
  if (quickAddOpen[dayId]) {
    closeQuickAdd(dayId)
  } else {
    quickAddOpen[dayId] = true
    activityNew(dayId)
  }
}

function closeQuickAdd(dayId: number) {
  quickAddOpen[dayId] = false
  const d = newActivityByDay[dayId]
  if (d) {
    d.title = ''
    d.start_time = '09:00'
    d.end_time = ''
  }
}

const submitQuickAdd = async (dayId: number) => {
  if (tripsStore.isLoading) return
  const d = activityNew(dayId)
  if (!d.title.trim()) return

  const t = tripsStore.trips.find((x) => x.id === tripId.value)
  const day = t?.days.find((x) => x.id === dayId)
  const beforeIds = new Set((day?.activities ?? []).map((a) => a.id))

  await tripsStore.addActivity(tripId.value, dayId, {
    title: d.title.trim(),
    start_time: d.start_time,
    end_time: d.end_time.trim() ? d.end_time : null,
  })

  await nextTick()
  if (!tripsStore.errorMessage) {
    d.title = ''
    d.start_time = '09:00'
    d.end_time = ''
    const dayAfter = tripsStore.trips.find((x) => x.id === tripId.value)?.days.find((x) => x.id === dayId)
    const newAct = dayAfter?.activities.find((a) => !beforeIds.has(a.id))
    if (newAct) {
      triggerActivityFlash(newAct.id)
    }
    nextTick(() => quickAddTitleRefs.get(dayId)?.focus())
  }
}

function formatTimeForInput(t: string | undefined | null): string {
  if (t == null || String(t).trim() === '') return '09:00'
  const s = String(t).trim()
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (match?.[1] != null && match[2] != null) {
    const h = match[1].padStart(2, '0').slice(-2)
    return `${h}:${match[2]}`
  }
  return '09:00'
}

const editingActivityId = ref<number | null>(null)
const editActivityTitle = ref('')
const editActivityStart = ref('09:00')
const editActivityEnd = ref('')
const activityEditBackup = ref<{ title: string; start_time: string; end_time: string } | null>(null)

const startEditActivity = (_dayId: number, activity: Activity) => {
  if (tripsStore.isLoading) return
  editingActivityId.value = activity.id
  editActivityTitle.value = activity.title
  editActivityStart.value = formatTimeForInput(activity.start_time)
  editActivityEnd.value = activity.end_time ? formatTimeForInput(activity.end_time) : ''
  activityEditBackup.value = {
    title: activity.title,
    start_time: editActivityStart.value,
    end_time: editActivityEnd.value,
  }
}

const onActivityMainClick = (dayId: number, activity: Activity) => {
  if (tripsStore.isLoading) return
  startEditActivity(dayId, activity)
}

const saveEditActivity = async (dayId: number, activityId: number) => {
  if (tripsStore.isLoading) return
  if (!editActivityTitle.value.trim()) return

  await tripsStore.updateActivity(tripId.value, dayId, activityId, {
    title: editActivityTitle.value.trim(),
    start_time: editActivityStart.value,
    end_time: editActivityEnd.value.trim() ? editActivityEnd.value : null,
  })

  await nextTick()
  if (!tripsStore.errorMessage) {
    editingActivityId.value = null
    activityEditBackup.value = null
    editActivityTitle.value = ''
    editActivityStart.value = '09:00'
    editActivityEnd.value = ''
  }
}

const cancelEditActivity = () => {
  if (activityEditBackup.value) {
    editActivityTitle.value = activityEditBackup.value.title
    editActivityStart.value = activityEditBackup.value.start_time
    editActivityEnd.value = activityEditBackup.value.end_time
  }
  editingActivityId.value = null
  activityEditBackup.value = null
}

const deleteActivity = async (dayId: number, activityId: number) => {
  if (tripsStore.isLoading) return
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
  if (tripsStore.isLoading) return
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
  if (tripsStore.isLoading) return
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
  if (tripsStore.isLoading) return
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
  if (tripsStore.isLoading) return
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
    dayCardEls.get(dayId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

const saveOrder = () => {}
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.trip-page-skeleton {
  max-width: 720px;
}

.trip-skel-header {
  margin-bottom: 16px;
  min-height: 72px;
}

.trip-skel-h1 {
  width: 55%;
  height: 1.5rem;
}

.trip-skel-sub {
  width: 32%;
  margin-top: 12px;
  height: 0.9rem;
}

.trip-skel-desc {
  width: 100%;
  height: 4.5rem;
  border-radius: 8px;
  margin-bottom: 20px;
}

.trip-skel-day {
  margin-bottom: 16px;
  min-height: 140px;
}

.trip-skel-daytitle {
  width: 45%;
  height: 1rem;
  margin-bottom: 14px;
}

.trip-skel-act-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trip-skel-act-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trip-skel-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.trip-skel-act-line {
  flex: 1;
  height: 0.95rem;
}

.trip-not-found {
  padding: 24px 0;
}

.trip-header-view {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.trip-header-text {
  flex: 1;
  min-width: 0;
}

.trip-duration {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary);
}

.trip-date-range {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-light);
}

.trip-desc-readonly {
  margin: 0;
  max-width: 48rem;
  line-height: 1.55;
  color: var(--text-light);
  font-size: 0.98rem;
  white-space: pre-wrap;
}

.section-activities-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.clear-day-btn {
  font-size: 0.82rem;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent !important;
  color: var(--text-light) !important;
}

.clear-day-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary) !important;
}

.add-day-form {
  margin-top: 14px;
}

.trip-edit-name-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.trip-page-dias > h2 {
  margin: 0 0 18px;
  font-size: 1.2rem;
}

h1 {
  margin: 0 0 10px;
}

.primary {
  background: var(--primary);
  color: #fff;
}

.primary:hover:not(:disabled) {
  background: var(--primary-hover);
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
  color: var(--text-light);
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
  color: var(--text-light);
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
  background: var(--primary);
  color: #fff;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.form {
  margin-bottom: 20px;
}

input {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

input::placeholder {
  color: var(--text-light);
}

.day-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.35s ease, border-color 0.35s ease;
}

.day-card--flash {
  animation: day-open-flash 0.75s ease-out;
}

@keyframes day-open-flash {
  0% {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.45);
    border-color: var(--primary);
  }
  100% {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    border-color: var(--border);
  }
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
  border: none;
  border-left: 4px solid #ccc;
  background: transparent;
}

.section-activities {
  border-left-color: #81c784;
}

.section-transport {
  border-left-color: #0d9488;
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

.section-block.section-activities .section-activities-head h4 {
  margin: 0;
}

.empty-hint {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: var(--text-light);
}

.empty-hint.muted {
  color: var(--text-light);
  font-size: 0.9rem;
}

.activity-timeline {
  margin-bottom: 8px;
}

.timeline-draggable {
  min-height: 0;
  touch-action: pan-y;
}

:deep(.activity-sort-ghost) {
  opacity: 0.35 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.activity-sort-chosen) {
  cursor: grabbing !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}

:deep(.timeline-item.activity-sort-chosen .timeline-panel) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

:deep(.activity-sort-drag) {
  opacity: 0.6 !important;
  cursor: grabbing !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}

.timeline-item {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 6px;
  min-height: 3.25rem;
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}

.timeline-item--flash .timeline-panel {
  animation: activity-flash-bg 0.35s ease-out;
}

@keyframes activity-flash-bg {
  0% {
    background-color: rgba(129, 199, 132, 0.45);
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.5);
  }
  100% {
    background-color: var(--activity);
    box-shadow: none;
  }
}

.timeline-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 26px;
  flex-shrink: 0;
  padding-top: 2px;
  align-self: stretch;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(145deg, #81c784, #43a047);
  border: 3px solid var(--card, #fff);
  box-shadow: 0 0 0 2px #a5d6a7;
  z-index: 1;
  flex-shrink: 0;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

.activity-drag-handle:hover .timeline-dot {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px #81c784, 0 2px 8px rgba(67, 160, 71, 0.35);
}

.timeline-stem {
  width: 4px;
  flex: 1;
  min-height: 1.35rem;
  margin-top: 2px;
  background: linear-gradient(180deg, #66bb6a, #a5d6a7 40%, #c8e6c9);
  border-radius: 2px;
  opacity: 0.92;
}

.timeline-panel {
  flex: 1;
  min-width: 0;
  min-height: 4.75rem;
  background: var(--activity);
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 2px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.28s cubic-bezier(0.22, 1, 0.36, 1), transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.25s ease;
}

.timeline-row:hover .timeline-panel {
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.11);
  transform: translateY(-2px);
  border-color: rgba(0, 0, 0, 0.1);
}

.timeline-panel--editing {
  background: rgba(129, 199, 132, 0.12);
  border-color: #66bb6a;
  box-shadow: 0 0 0 2px rgba(102, 187, 106, 0.35);
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

.timeline-main--clickable {
  cursor: pointer;
  border-radius: 6px;
  padding: 4px 6px;
  margin: -4px -6px;
  transition: background 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}

.timeline-main--clickable:hover {
  background: rgba(0, 0, 0, 0.05);
}

.timeline-main--clickable:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.activity-drag-handle {
  cursor: grab;
}

.activity-drag-handle:active {
  cursor: grabbing;
}

.quick-add-activity-btn {
  margin-top: 10px;
  margin-bottom: 4px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px dashed #81c784;
  background: rgba(129, 199, 132, 0.12);
  color: #2e7d32;
  font-weight: 600;
  cursor: pointer;
}

.quick-add-activity-btn:hover:not(:disabled) {
  background: rgba(129, 199, 132, 0.22);
}

.quick-add-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(129, 199, 132, 0.08);
  border: 1px solid rgba(129, 199, 132, 0.35);
}

.quick-add-time {
  width: auto;
  min-width: 5.5rem;
}

.quick-add-title {
  flex: 1;
  min-width: 160px;
}

.quick-add-save {
  margin-left: 0;
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
  color: var(--text-light);
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
  color: var(--primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.map-link:hover {
  border-bottom-color: var(--primary-hover);
  color: var(--primary-hover);
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
  color: var(--text-light);
}

.transport-type {
  color: var(--text-light);
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
  border-bottom: 1px solid var(--border, #eee);
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
  background: transparent !important;
  color: #c62828;
  text-decoration: underline;
  padding: 4px 8px;
}

button.linkish:hover:not(:disabled) {
  background: transparent !important;
  color: #b71c1c;
}

.days-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  touch-action: pan-y;
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
  color: var(--text-light);
  margin-bottom: 12px;
}

.day-edit-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

:global(.dark) .timeline-row:hover .timeline-panel {
  border-color: rgba(255, 255, 255, 0.12);
}

:global(.dark) .timeline-panel--editing {
  background: rgba(129, 199, 132, 0.15);
  border-color: #81c784;
  box-shadow: 0 0 0 2px rgba(129, 199, 132, 0.35);
}

:global(.dark) .timeline-main--clickable:hover {
  background: rgba(255, 255, 255, 0.06);
}

:global(.dark) .quick-add-activity-btn {
  border-color: #558b2f;
  color: #c8e6c9;
  background: rgba(129, 199, 132, 0.12);
}

:global(.dark) .quick-add-row {
  background: rgba(129, 199, 132, 0.1);
  border-color: rgba(129, 199, 132, 0.35);
}

:global(.dark) .trip-duration {
  color: var(--primary);
}

:global(.dark) .trip-date-range {
  color: var(--text-light);
}

:global(.dark) .trip-desc-readonly {
  color: var(--text-light);
}

:global(.dark) .timeline-end {
  color: var(--text);
}

:global(.dark) .transport-type,
:global(.dark) .transport-form .transport-arrow {
  color: var(--text-light);
}

:global(.dark) .empty-hint {
  color: var(--text);
}

:global(.dark) .empty-hint.muted {
  color: var(--text-light);
}

:global(.dark) .loading {
  color: var(--text-light);
}

:global(.dark) input::placeholder {
  color: var(--text-light);
}

:global(.dark) .map-link {
  color: var(--primary);
}

:global(.dark) .map-link:hover {
  border-bottom-color: var(--primary-hover);
  color: var(--primary-hover);
}

@media (max-width: 768px) {
  .quick-add-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 14px;
  }

  .quick-add-row input,
  .quick-add-row select {
    min-height: 44px;
    font-size: 16px;
    padding: 10px 12px;
  }

  .quick-add-save,
  .quick-add-activity-btn {
    min-height: 44px;
    padding: 12px 16px;
    font-size: 1rem;
  }

  .timeline-axis.activity-drag-handle {
    width: 44px;
    min-width: 44px;
    padding-top: 6px;
    padding-bottom: 4px;
  }

  .activity-edit {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .activity-edit input,
  .activity-edit button {
    min-height: 44px;
    font-size: 16px;
    padding: 10px 12px;
  }

  .timeline-actions button {
    min-width: 44px;
    min-height: 44px;
    padding: 8px;
    font-size: 1.1rem;
  }
}
</style>

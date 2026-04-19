<template>
  <MainLayout>

    <div
      v-if="page.tripsStore.isBootstrapping && !page.trip"
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

    <div v-else-if="page.trip" class="trip-root trip-surface" :aria-busy="page.tripsStore.syncPendingCount > 0">
      <p v-if="page.tripsStore.syncPendingCount > 0" class="loading loading--sync" role="status">
        Sincronizando…
      </p>

      <TripHeader
        :trip-name="page.trip.name"
        :trip-description="page.trip.description"
        :trip-duration-days="page.tripDurationDays"
        :trip-date-range="page.tripDateRange"
        :trip-has-activities="page.tripHasActivities"
        :trip-progress-percent="page.tripProgressPercent"
        :trip-spent-label="tripSpentLabel"
        :editing-trip="page.editingTrip"
        :edit-trip-name="page.editTripName"
        :is-bootstrapping="page.tripsStore.isBootstrapping"
        @start-edit="page.startEditTrip"
        @save-edit="page.saveTripEdit"
        @cancel-edit="page.cancelTripEdit"
        @delete-trip="page.deleteTrip"
        @update:edit-trip-name="page.editTripName = $event"
      />

      <TripActions
        :is-bootstrapping="page.tripsStore.isBootstrapping"
        :show-form="page.showForm"
        :new-day-title="page.newDayTitle"
        @toggle-add-day="page.showForm = !page.showForm"
        @add-day="page.addDay"
        @cancel-add-day="page.cancelAddDay"
        @update:new-day-title="page.newDayTitle = $event"
      />

      <TripDaysList />
    </div>

    <div v-else class="trip-not-found" role="status">
      <p>Viaje no encontrado</p>
    </div>

  </MainLayout>
</template>

<script setup lang="ts">
import '@/components/trip/tripRootSurface.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { formatSpentEUR, getTripTotal } from '@/utils/tripTotals'
import { useRoute, useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { useLayoutStore } from '@/stores/layout'
import MainLayout from '@/layouts/MainLayout.vue'
import TripHeader from '@/components/trip/TripHeader.vue'
import TripActions from '@/components/trip/TripActions.vue'
import TripDaysList from '@/components/trip/TripDaysList.vue'
import { useLastVisitedTrip } from '@/composables/useLastVisitedTrip'
import { useTripPage, provideTripPageContext } from '@/composables/trip/useTripPageContext'

const route = useRoute()
const router = useRouter()
const tripsStore = useTripsStore()
const layoutStore = useLayoutStore()
const { setLastVisitedTripId } = useLastVisitedTrip()
const previousSidebarCollapsed = ref(layoutStore.isSidebarCollapsed)

const tripId = computed(() => Number(route.params.id))
const page = useTripPage(tripId, router)
provideTripPageContext(page)

const tripSpentLabel = computed(() =>
  page.trip ? formatSpentEUR(getTripTotal(page.trip)) : ''
)

onMounted(async () => {
  previousSidebarCollapsed.value = layoutStore.isSidebarCollapsed
  layoutStore.setSidebarCollapsed(true)
  setLastVisitedTripId(tripId.value)

  if (!tripsStore.trips.length) {
    await tripsStore.loadTrips()
  }
})

onUnmounted(() => {
  layoutStore.setSidebarCollapsed(previousSidebarCollapsed.value)
})

watch(tripId, (id) => {
  setLastVisitedTripId(id)
})
</script>

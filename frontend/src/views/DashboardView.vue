<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { useTripsStore } from '@/stores/trips'

const tripsStore = useTripsStore()

const createTrip = () => {
  const name = prompt('Nombre del viaje:')

  if (name) {
    tripsStore.addTrip(name)
  }
}
</script>

<template>
  <MainLayout>
    <h1>Mi Experiencia</h1>

    <button @click="createTrip">Crear Viaje</button>

    <div class="stats">
      <div class="card">
        <h3>Total de viajes</h3>
        <p>{{ tripsStore.totalTrips }}</p>
      </div>
    </div>

  </MainLayout>
</template>

<style>
button {
  margin-bottom: 20px;
  padding: 10px 15px;
  cursor: pointer;
}

.card {
  background: var(--card);
  padding: 20px;
  border-radius: 10px;
  width: 200px;
}
</style>

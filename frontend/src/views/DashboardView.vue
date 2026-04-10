<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { useTripsStore } from '@/stores/trips'
import { onMounted } from 'vue'

const tripsStore = useTripsStore()

const createTrip = async () => {
  const name = prompt('Nombre del viaje:')

  if (name) {
    await tripsStore.addTrip(name.trim())
  }
}

onMounted(() => {
  tripsStore.loadTrips()
})
</script>

<template>
  <MainLayout>
    <h1>Mi Experiencia</h1>

    <button :disabled="tripsStore.isLoading" @click="createTrip">
      {{ tripsStore.isLoading ? 'Creando...' : 'Crear viaje' }}
    </button>

    <p v-if="tripsStore.errorMessage" class="error">{{ tripsStore.errorMessage }}</p>
    <p v-if="tripsStore.successMessage" class="success">{{ tripsStore.successMessage }}</p>

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

.error {
  color: #b00020;
  margin-bottom: 12px;
}

.success {
  color: #1b5e20;
  margin-bottom: 12px;
}
</style>

<template>
  <div class="layout">

    <!-- NAVBAR -->
    <header class="navbar">
      <router-link to="/" class="logo">
        Voyager Experience Planner
      </router-link>

      <button @click="toggleDark" class="dark-btn">
        🌙
      </button>
    </header>

    <!-- CONTENIDO -->
    <div class="content">

      <!-- SIDEBAR -->
      <aside class="sidebar">
        <h3>Viajes</h3>
        <ul>
          <li
            v-for="trip in tripsStore.trips"
            :key="trip.id"
            @click="goToTrip(trip.id)"
            class="trip-item"
          >
            {{ trip.name }}
          </li>
        </ul>
      </aside>

      <!-- MAIN -->
      <main class="main">
        <slot />
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { ref, onMounted } from 'vue'

const router = useRouter()
const tripsStore = useTripsStore()

const goToTrip = (id: number) => {
  router.push(`/trip/${id}`)
}

const isDark = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value

  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 👇 cargar al iniciar
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')

  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

</script>

<style>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  height: 60px;
  background: #111;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.logo:hover {
  opacity: 0.8;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.content {
  flex: 1;
  display: flex;
}

.sidebar {
  width: 220px;
  background: #f4f4f4;
  padding: 20px;
  border-right: 1px solid #ddd;
}

.trip-item {
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.trip-item:hover {
  background: #eaeaea;
}

.main {
  flex: 1;
  padding: 20px;
}
</style>

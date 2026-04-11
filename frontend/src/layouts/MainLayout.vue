<template>
  <div class="layout">

    <!-- NAVBAR -->
    <header class="navbar">
      <router-link to="/" class="logo" aria-label="Ir al inicio">
        Voyager Experience Planner
      </router-link>

      <div class="nav-actions">
        <span
          v-if="tripsStore.isLoading"
          class="nav-loading"
          role="status"
          aria-live="polite"
        >
          <span class="nav-loading-spinner" aria-hidden="true" />
          <span class="nav-loading-label">Cargando</span>
          <span class="nav-loading-dots" aria-hidden="true">
            <span class="nav-dot" />
            <span class="nav-dot" />
            <span class="nav-dot" />
          </span>
        </span>
        <span v-if="authStore.user" class="user-label">{{ authStore.user.name }}</span>
        <button type="button" class="logout-btn" aria-label="Cerrar sesión" @click="onLogout">
          Salir
        </button>
        <button
          type="button"
          class="dark-btn"
          :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
          @click="toggleDark"
        >
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
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
            tabindex="0"
            role="link"
            class="trip-item"
            @click="goToTrip(trip.id)"
            @keydown.enter.prevent="goToTrip(trip.id)"
            @keydown.space.prevent="goToTrip(trip.id)"
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
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref } from 'vue'

const router = useRouter()
const tripsStore = useTripsStore()
const authStore = useAuthStore()

const onLogout = () => {
  void authStore.logout()
}

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
  background: var(--navbar);
  color: white;
  display: flex;
  justify-content: space-between;
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

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  opacity: 0.88;
  padding: 4px 10px 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
}

.nav-loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  flex-shrink: 0;
  animation: nav-spin 0.7s linear infinite;
}

@keyframes nav-spin {
  to {
    transform: rotate(360deg);
  }
}

.nav-loading-label {
  letter-spacing: 0.02em;
}

.nav-loading-dots {
  display: inline-flex;
  gap: 2px;
  padding-left: 1px;
}

.nav-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  animation: nav-dot-pulse 1.2s ease-in-out infinite;
}

.nav-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.nav-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes nav-dot-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-1px);
  }
}

.user-label {
  font-size: 0.88rem;
  opacity: 0.9;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: inherit;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.88rem;
  cursor: pointer;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}

.dark-btn {
  background: transparent !important;
  border: none;
  font-size: 18px;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.dark-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12) !important;
}

.content {
  flex: 1;
  display: flex;
}

.sidebar {
  width: 220px;
  background: var(--sidebar);
  padding: 20px;
  border-right: 1px solid var(--border);
}

.trip-item {
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.trip-item:hover {
  background: var(--activity);
}

.main {
  flex: 1;
  padding: 20px;
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 12px;
    flex-wrap: wrap;
    row-gap: 8px;
    min-height: 56px;
    height: auto;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .logo {
    font-size: 0.82rem;
    line-height: 1.25;
    max-width: min(100%, 11rem);
  }

  .nav-actions {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .logout-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 10px 14px;
    font-size: 0.95rem;
  }

  .dark-btn {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .trip-item {
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 10px 12px;
  }

  .main {
    padding: 14px 12px;
  }

  .sidebar {
    padding: 14px 12px;
  }
}
</style>

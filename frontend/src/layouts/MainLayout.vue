<template>
  <div class="layout">

    <!-- NAVBAR -->
    <header class="navbar" role="banner">
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
    <div class="content" :class="{ collapsed: layoutStore.isSidebarCollapsed }">

      <!-- SIDEBAR -->
      <aside class="sidebar" :class="{ collapsed: layoutStore.isSidebarCollapsed }">
        <button
          type="button"
          class="sidebar-toggle"
          :aria-label="layoutStore.isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'"
          @click="layoutStore.toggleSidebar"
        >
          ⮜
        </button>
        <nav aria-label="Viajes">
          <h3 class="sidebar-title label">Viajes</h3>
          <ul>
            <TripSidebarItem
              v-for="trip in tripsStore.trips"
              :key="trip.id"
              :trip-id="trip.id"
              :trip-name="trip.name"
              @open="goToTrip"
            />
          </ul>
        </nav>
      </aside>

      <!-- MAIN -->
      <main
        id="main-content"
        class="main"
        tabindex="-1"
        :class="{ collapsed: layoutStore.isSidebarCollapsed }"
      >
        <slot />
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout'
import TripSidebarItem from '@/components/TripSidebarItem.vue'
import { useTheme } from '@/composables/useTheme'
import { useLastVisitedTrip } from '@/composables/useLastVisitedTrip'

const router = useRouter()
const tripsStore = useTripsStore()
const authStore = useAuthStore()
const layoutStore = useLayoutStore()
const { isDark, toggleDark } = useTheme()
const { setLastVisitedTripId } = useLastVisitedTrip()

const onLogout = () => {
  void authStore.logout()
}

const goToTrip = (id: number) => {
  setLastVisitedTripId(id)
  router.push(`/trip/${id}`)
}

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
  position: relative;
  /* Evita que el flex recorte menús/desplegables de la sidebar (hijos con overflow) */
  min-height: 0;
  overflow: visible;
}

.sidebar {
  position: relative;
  width: 240px;
  background: var(--sidebar);
  padding: 20px;
  border-right: 1px solid var(--border);
  overflow: visible;
  transition: all 0.3s ease;
}

.sidebar.collapsed {
  width: 70px;
  padding-left: 10px;
  padding-right: 10px;
}

.sidebar-toggle {
  position: fixed;
  top: 80px;
  left: 224px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: none;
  transition: left 0.3s ease, transform 0.3s ease;
}

.sidebar-toggle:hover {
  transform: scale(1.05);
}

.sidebar.collapsed .sidebar-toggle {
  left: 54px;
  transform: rotate(180deg);
}

.sidebar.collapsed .sidebar-toggle:hover {
  transform: rotate(180deg) scale(1.05);
}

.sidebar-title {
  margin-top: 0;
  padding-right: 20px;
}

.sidebar ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
  overflow: visible;
}

.sidebar nav {
  overflow: visible;
}

.sidebar li {
  list-style: none;
}

.sidebar.collapsed li {
  display: flex;
  justify-content: center;
}

.sidebar.collapsed li::marker {
  content: '';
}

.sidebar.collapsed a {
  justify-content: center;
}

.sidebar.collapsed .label {
  display: none;
}

.trip-item {
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.trip-item:hover {
  background: var(--activity);
}

.main {
  flex: 1;
  padding: 20px;
  transition: margin-left 0.3s ease;
  min-width: 0;
  position: relative;
  z-index: 0;
}

.main.collapsed {
  margin-left: 0;
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

  /* Sin transform en el aside: si no, fixed del toggle queda anclado al drawer y sale del viewport. */
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1100;
    width: min(80vw, 280px);
    padding: 14px 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: none;
    overflow: visible;
  }

  .sidebar-toggle {
    z-index: 1200;
    /* Borde derecho del drawer (~ ancho panel menos mitad botón) */
    left: calc(min(80vw, 280px) - 40px);
    /* Debajo de navbar + cabecera del main (p. ej. h1) para no tapar "Mi Experiencia". */
    top: max(7.5rem, calc(env(safe-area-inset-top, 0px) + 6.75rem));
  }

  .sidebar.collapsed {
    transform: none;
    visibility: hidden;
    pointer-events: none;
    width: min(80vw, 280px);
    padding-left: 14px;
    padding-right: 12px;
  }

  .sidebar.collapsed .sidebar-toggle {
    visibility: visible;
    pointer-events: auto;
    left: 12px;
  }

  .sidebar:not(.collapsed) {
    visibility: visible;
    pointer-events: auto;
  }

  .content.collapsed .main {
    margin-left: 0;
  }
}
</style>

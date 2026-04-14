import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const isSidebarCollapsed = ref(false)

  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  const setSidebarCollapsed = (value: boolean) => {
    isSidebarCollapsed.value = value
  }

  return {
    isSidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
  }
})

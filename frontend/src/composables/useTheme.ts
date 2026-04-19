import { onMounted } from 'vue'
import { useSessionStorage } from '@/composables/useSessionStorage'

const THEME_STORAGE_KEY = 'theme'

export function useTheme() {
  const isDark = useSessionStorage<boolean>(THEME_STORAGE_KEY, false)

  const applyThemeClass = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleDark = () => {
    isDark.value = !isDark.value
    applyThemeClass(isDark.value)
    // Mantenemos compatibilidad con la persistencia ya existente.
    localStorage.setItem(THEME_STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    isDark.value = savedTheme === 'dark'
    applyThemeClass(isDark.value)
  })

  return {
    isDark,
    toggleDark,
  }
}

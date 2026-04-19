import { ref, watch } from 'vue'

export function useSessionStorage<T>(key: string, initialValue: T) {
  const state = ref<T>(initialValue)

  const raw = sessionStorage.getItem(key)
  if (raw !== null) {
    try {
      state.value = JSON.parse(raw) as T
    } catch {
      state.value = raw as T
    }
  }

  watch(
    state,
    (value) => {
      if (value === null || value === undefined || (typeof value === 'string' && value.length === 0)) {
        sessionStorage.removeItem(key)
        return
      }
      sessionStorage.setItem(key, JSON.stringify(value))
    },
    { deep: true }
  )

  return state
}

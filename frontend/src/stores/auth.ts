import { defineStore } from 'pinia'
import { getActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/constants/authStorage'

export interface AuthUser {
  id: number
  name: string
  email: string
}

function readUserFromStorage(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(AUTH_TOKEN_KEY))
  const user = ref<AuthUser | null>(readUserFromStorage())

  const isAuthenticated = computed(() => Boolean(token.value))

  function persist() {
    if (token.value) {
      localStorage.setItem(AUTH_TOKEN_KEY, token.value)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
    if (user.value) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user.value))
    } else {
      localStorage.removeItem(AUTH_USER_KEY)
    }
  }

  function setSession(payload: { user: AuthUser; token: string }) {
    token.value = payload.token
    user.value = payload.user
    persist()
  }

  function clearSession() {
    token.value = null
    user.value = null
    persist()
  }

  async function login(email: string, password: string) {
    const res = await api.post('/login', { email, password })
    const { user: u, token: t } = res.data.data as { user: AuthUser; token: string }
    setSession({ user: u, token: t })
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post('/register', { name, email, password })
    const { user: u, token: t } = res.data.data as { user: AuthUser; token: string }
    setSession({ user: u, token: t })
  }

  async function logout() {
    try {
      if (token.value) {
        await api.post('/logout')
      }
    } finally {
      clearSession()
      const pinia = getActivePinia()
      if (pinia) {
        const { useTripsStore } = await import('@/stores/trips')
        useTripsStore(pinia).$reset()
      }
      const { default: r } = await import('@/router')
      await r.push({ name: 'login' })
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    clearSession,
    persist,
    setSession,
  }
})

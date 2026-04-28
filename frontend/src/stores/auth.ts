import { defineStore } from 'pinia'
import { getActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/constants/authStorage'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'superadmin' | 'user'
  plan: 'free' | 'premium'
}

function normalizeUser(value: Partial<AuthUser> | null): AuthUser | null {
  if (!value?.id || !value.name || !value.email) return null
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role === 'superadmin' ? 'superadmin' : 'user',
    plan: value.plan === 'premium' ? 'premium' : 'free',
  }
}

function warnIfMissingAccessFields(source: string, value: Partial<AuthUser> | null) {
  if (!import.meta.env.DEV || !value) return
  if (!value.role || !value.plan) {
    console.warn(`[auth] ${source} user payload is missing role or plan`, value)
  }
}

function readUserFromStorage(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return normalizeUser(JSON.parse(raw) as Partial<AuthUser>)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(AUTH_TOKEN_KEY))
  const user = ref<AuthUser | null>(readUserFromStorage())

  const isAuthenticated = computed(() => Boolean(token.value))
  const isAdmin = computed(() => user.value?.role === 'superadmin')
  const isPremium = computed(() => user.value?.plan === 'premium')

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
    warnIfMissingAccessFields('setSession', payload.user)
    user.value = normalizeUser(payload.user)
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

  async function register(name: string, email: string, password: string, passwordConfirmation: string) {
    const res = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    const { user: u, token: t } = res.data.data as { user: AuthUser; token: string }
    setSession({ user: u, token: t })
  }

  async function requestPasswordReset(email: string): Promise<string> {
    const res = await api.post('/forgot-password', { email })
    return String(res.data.data?.message ?? 'Revisa tu email para restablecer la contraseña.')
  }

  async function resetPassword(payload: {
    token: string
    email: string
    password: string
    passwordConfirmation: string
  }): Promise<string> {
    const res = await api.post('/reset-password', {
      token: payload.token,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    })
    return String(res.data.data?.message ?? 'Contraseña actualizada.')
  }

  async function fetchProfile() {
    const res = await api.get('/profile')
    const rawUser = res.data.data.user as Partial<AuthUser>
    warnIfMissingAccessFields('fetchProfile', rawUser)
    const u = normalizeUser(rawUser)
    user.value = u
    persist()
    return u
  }

  async function updateProfile(name: string, email: string) {
    const res = await api.patch('/profile', { name, email })
    const rawUser = res.data.data.user as Partial<AuthUser>
    warnIfMissingAccessFields('updateProfile', rawUser)
    const u = normalizeUser(rawUser)
    user.value = u
    persist()
    return String(res.data.data?.message ?? 'Perfil actualizado.')
  }

  async function upgradeToPremium() {
    const res = await api.post('/upgrade')
    const rawUser = res.data.data.user as Partial<AuthUser>
    warnIfMissingAccessFields('upgradeToPremium', rawUser)
    const u = normalizeUser(rawUser)
    user.value = u
    persist()
    return String(res.data.data?.message ?? 'Plan actualizado a Premium.')
  }

  async function simulatePremiumPayment(payload: {
    method: 'card' | 'transfer'
    payment_data: Record<string, string>
  }) {
    const res = await api.post('/payment/simulate', payload)
    const rawUser = res.data.data.user as Partial<AuthUser>
    warnIfMissingAccessFields('simulatePremiumPayment', rawUser)
    const u = normalizeUser(rawUser)
    user.value = u
    persist()
    return String(res.data.data?.message ?? 'Plan actualizado a premium.')
  }

  async function downgradeToFree() {
    const res = await api.post('/downgrade')
    const rawUser = res.data.data.user as Partial<AuthUser>
    warnIfMissingAccessFields('downgradeToFree', rawUser)
    const u = normalizeUser(rawUser)
    user.value = u
    persist()
    return String(res.data.data?.message ?? 'Has vuelto al plan free.')
  }

  async function updatePassword(
    currentPassword: string,
    password: string,
    passwordConfirmation: string
  ) {
    const res = await api.put('/profile/password', {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    })
    return String(res.data.data?.message ?? 'Contraseña actualizada.')
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
    isAdmin,
    isPremium,
    login,
    register,
    requestPasswordReset,
    resetPassword,
    fetchProfile,
    updateProfile,
    updatePassword,
    upgradeToPremium,
    simulatePremiumPayment,
    downgradeToFree,
    logout,
    clearSession,
    persist,
    setSession,
  }
})

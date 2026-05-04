import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/constants/authStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = localStorage.getItem(AUTH_TOKEN_KEY)
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API ERROR:', error?.response ?? error)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      const { getActivePinia } = await import('pinia')
      const pinia = getActivePinia()
      if (pinia) {
        const { useAuthStore } = await import('@/stores/auth')
        useAuthStore(pinia).clearSession()
        const { useTripsStore } = await import('@/stores/trips')
        useTripsStore(pinia).$reset()
      }
      const { default: router } = await import('@/router')
      const name = router.currentRoute.value.name
      if (name !== 'login' && name !== 'register') {
        await router.push({ name: 'login' })
      }
    }
    return Promise.reject(error)
  }
)

export default api

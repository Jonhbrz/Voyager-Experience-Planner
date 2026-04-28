import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/trip/:id',
      name: 'trip',
      component: () => import('@/views/TripView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth === true && !auth.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (
    to.meta.requiresAuth === true &&
    auth.token &&
    (!auth.user || to.meta.requiresAdmin === true)
  ) {
    await auth.fetchProfile().catch(() => undefined)
  }
  if (to.meta.requiresAdmin === true && auth.user?.role !== 'superadmin') {
    return { name: 'dashboard' }
  }
  const guestRoutes = ['login', 'register', 'forgot-password', 'reset-password']
  if (guestRoutes.includes(String(to.name)) && auth.token) {
    return { name: 'dashboard' }
  }
  return true
})

export default router

import api from '@/services/api'
import type { AuthUser } from '@/stores/auth'

export interface AdminUser extends AuthUser {
  created_at: string
  trips_count: number
}

export interface Invoice {
  id: number
  amount: number
  plan: 'premium' | 'free'
  created_at: string
  user?: {
    id: number
    name: string
    email: string
  }
}

export interface AdminStats {
  total_users: number
  free_users: number
  premium_users: number
  total_trips: number
  total_revenue: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await api.get('/admin/stats')
  return res.data.data.stats as AdminStats
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await api.get('/admin/users')
  return res.data.data.users as AdminUser[]
}

export async function fetchAdminInvoices(): Promise<Invoice[]> {
  const res = await api.get('/admin/invoices')
  return res.data.data.invoices as Invoice[]
}

export async function updateAdminUserPlan(userId: number, plan: AdminUser['plan']): Promise<{ user: AuthUser; message: string }> {
  const res = await api.patch(`/admin/users/${userId}/plan`, { plan })
  return {
    user: res.data.data.user as AuthUser,
    message: String(res.data.data?.message ?? 'Plan actualizado.'),
  }
}

export async function deleteAdminUser(userId: number): Promise<string> {
  const res = await api.delete(`/admin/users/${userId}`)
  return String(res.data.data?.message ?? 'Usuario eliminado.')
}

export { downloadInvoicePdf } from '@/services/invoices'

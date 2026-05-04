<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore, type AuthUser } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { formatCurrency } from '@/utils/formatters'
import { planLabels, roleLabels } from '@/utils/labels'
import {
  deleteAdminUser,
  downloadInvoicePdf,
  fetchAdminInvoices,
  fetchAdminStats,
  fetchAdminUsers,
  updateAdminUserPlan,
  type AdminStats,
  type AdminUser,
  type Invoice,
} from '@/services/admin'

const authStore = useAuthStore()
const toast = useToastStore()

const stats = ref<AdminStats | null>(null)
const users = ref<AdminUser[]>([])
const invoices = ref<Invoice[]>([])
const selectedInvoice = ref<Invoice | null>(null)
const isLoading = ref(false)
const processingUserId = ref<number | null>(null)
const pdfDownloadingId = ref<number | null>(null)
const errorMessage = ref<string | null>(null)

const sortedUsers = computed(() => [...users.value].sort((a, b) => a.name.localeCompare(b.name, 'es')))

function apiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message)
  }
  return fallback
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const statCards = computed(() => [
  { label: 'Usuarios', value: stats.value?.total_users ?? 0 },
  { label: planLabels.free, value: stats.value?.free_users ?? 0 },
  { label: planLabels.premium, value: stats.value?.premium_users ?? 0 },
  { label: 'Viajes', value: stats.value?.total_trips ?? 0 },
  { label: 'Ingresos', value: formatCurrency(stats.value?.total_revenue ?? 0) },
])

function roleLabel(role: AuthUser['role']): string {
  return roleLabels[role] || role
}

function planLabel(plan: AuthUser['plan']): string {
  return planLabels[plan] || plan
}

async function loadAdminData() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const [statsData, usersData, invoicesData] = await Promise.all([
      fetchAdminStats(),
      fetchAdminUsers(),
      fetchAdminInvoices(),
    ])
    stats.value = statsData
    users.value = usersData
    invoices.value = invoicesData
  } catch (error) {
    errorMessage.value = apiError(error, 'No se pudo cargar el panel de administración.')
  } finally {
    isLoading.value = false
  }
}

function viewInvoice(invoice: Invoice) {
  selectedInvoice.value = invoice
}

function closeInvoice() {
  selectedInvoice.value = null
}

async function downloadPdf(invoice: Invoice) {
  pdfDownloadingId.value = invoice.id
  errorMessage.value = null
  try {
    await downloadInvoicePdf(invoice.id)
    toast.push('success', 'PDF descargado.')
  } catch (error) {
    errorMessage.value = apiError(error, 'No se pudo descargar el PDF.')
  } finally {
    pdfDownloadingId.value = null
  }
}

async function updatePlan(user: AdminUser, plan: AdminUser['plan']) {
  if (user.plan === plan) return
  processingUserId.value = user.id
  errorMessage.value = null
  try {
    const { user: updated, message } = await updateAdminUserPlan(user.id, plan)
    user.plan = updated.plan
    toast.push('success', message)
    if (authStore.user?.id === user.id) {
      await authStore.fetchProfile()
    }
  } catch (error) {
    errorMessage.value = apiError(error, 'No se pudo actualizar el plan.')
  } finally {
    processingUserId.value = null
  }
}

function onPlanChange(user: AdminUser, event: Event) {
  const plan = (event.target as HTMLSelectElement).value
  if (plan === 'free' || plan === 'premium') {
    void updatePlan(user, plan)
  }
}

async function deleteUser(user: AdminUser) {
  if (user.id === authStore.user?.id) return
  const confirmed = window.confirm(`¿Eliminar a ${user.email}? Esta acción no se puede deshacer.`)
  if (!confirmed) return

  processingUserId.value = user.id
  errorMessage.value = null
  try {
    const message = await deleteAdminUser(user.id)
    users.value = users.value.filter((u) => u.id !== user.id)
    toast.push('success', message)
  } catch (error) {
    errorMessage.value = apiError(error, 'No se pudo eliminar el usuario.')
  } finally {
    processingUserId.value = null
  }
}

onMounted(() => {
  void loadAdminData()
})
</script>

<template>
  <MainLayout>
    <section class="admin-page" aria-labelledby="admin-title">
      <div class="admin-header">
        <div>
          <h1 id="admin-title">Panel Admin</h1>
          <p>Gestiona usuarios, planes y facturas.</p>
        </div>
        <button type="button" class="refresh-btn" :disabled="isLoading" @click="loadAdminData">
          {{ isLoading ? 'Cargando…' : 'Actualizar' }}
        </button>
      </div>

      <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

      <section class="stats-grid" aria-label="Resumen administrativo">
        <article v-for="card in statCards" :key="card.label" class="stat-card">
          <p>{{ card.label }}</p>
          <strong>{{ card.value }}</strong>
        </article>
      </section>

      <section class="admin-card" aria-labelledby="admin-users-title">
        <h2 id="admin-users-title">Usuarios</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Plan</th>
                <th>Viajes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in sortedUsers" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role-pill" :class="{ 'role-pill--admin': user.role === 'superadmin' }">
                    {{ roleLabel(user.role) }}
                  </span>
                </td>
                <td>
                  <span class="plan-pill" :class="`plan-pill--${user.plan}`">
                    {{ planLabel(user.plan) }}
                  </span>
                  <select
                    :value="user.plan"
                    :disabled="processingUserId === user.id"
                    @change="onPlanChange(user, $event)"
                  >
                    <option value="free">free</option>
                    <option value="premium">premium</option>
                  </select>
                </td>
                <td>{{ user.trips_count }}</td>
                <td>
                  <button
                    type="button"
                    class="danger-btn"
                    :disabled="processingUserId === user.id || user.id === authStore.user?.id"
                    @click="deleteUser(user)"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
              <tr v-if="!sortedUsers.length && !isLoading">
                <td colspan="6" class="empty-row">No hay usuarios</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="admin-card" aria-labelledby="admin-invoices-title">
        <h2 id="admin-invoices-title">Facturas</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Importe</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td>{{ invoice.user?.name ?? 'Usuario eliminado' }}</td>
                <td>{{ invoice.user?.email ?? '-' }}</td>
                <td>{{ planLabel(invoice.plan) }}</td>
                <td>{{ formatCurrency(invoice.amount) }}</td>
                <td>{{ formatDate(invoice.created_at) }}</td>
                <td>
                  <div class="invoice-actions">
                    <button
                      type="button"
                      class="secondary-btn"
                      :disabled="pdfDownloadingId === invoice.id"
                      @click="downloadPdf(invoice)"
                    >
                      {{ pdfDownloadingId === invoice.id ? '…' : 'Descargar PDF' }}
                    </button>
                    <button type="button" class="secondary-btn" @click="viewInvoice(invoice)">
                      Ver factura
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!invoices.length && !isLoading">
                <td colspan="6" class="empty-row">Aún no hay facturas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Teleport to="body">
        <div
          v-if="selectedInvoice"
          class="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-title"
          @click.self="closeInvoice"
        >
          <section class="invoice-modal">
            <div class="modal-head">
              <h2 id="invoice-title">Factura #{{ selectedInvoice.id }}</h2>
              <button type="button" class="modal-close" aria-label="Cerrar factura" @click="closeInvoice">×</button>
            </div>
            <dl class="invoice-details">
              <div>
                <dt>Email</dt>
                <dd>{{ selectedInvoice.user?.email ?? '-' }}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{{ planLabel(selectedInvoice.plan) }}</dd>
              </div>
              <div>
                <dt>Importe</dt>
                <dd>{{ formatCurrency(selectedInvoice.amount) }}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{{ formatDate(selectedInvoice.created_at) }}</dd>
              </div>
            </dl>
          </section>
        </div>
      </Teleport>
    </section>
  </MainLayout>
</template>

<style scoped>
.admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.admin-header h1 {
  margin: 0 0 6px;
}

.admin-header p {
  margin: 0;
  color: var(--text-light);
}

.refresh-btn {
  padding: 10px 14px;
  border-radius: 10px;
}

.admin-error {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #ffebee;
  color: #b00020;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}

.stat-card p {
  margin: 0 0 8px;
  color: var(--text-light);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-card strong {
  font-size: 1.6rem;
}

.admin-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 20px;
}

.admin-card h2 {
  margin: 0 0 14px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

th {
  color: var(--text-light);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

select {
  min-height: 36px;
}

.plan-pill {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 0.8rem;
  font-weight: 800;
  border: 1px solid var(--border);
}

.plan-pill--free {
  background: var(--activity);
  color: var(--text);
}

.plan-pill--premium {
  background: #fef3c7;
  color: #78350f;
}

.role-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 9px;
  background: var(--activity);
  font-size: 0.8rem;
  font-weight: 700;
}

.role-pill--admin {
  background: #fef3c7;
  color: #78350f;
}

.danger-btn {
  background: #dc2626;
  border-radius: 8px;
  padding: 8px 12px;
}

.secondary-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 8px 12px;
}

.secondary-btn:hover:not(:disabled) {
  background: var(--activity);
}

.secondary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.invoice-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.danger-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.danger-btn:disabled,
.refresh-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.empty-row {
  color: var(--text-light);
  text-align: center;
  padding: 24px 12px;
  font-style: italic;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

.invoice-modal {
  width: min(440px, 100%);
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.modal-head h2 {
  margin: 0;
}

.modal-close {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  padding: 0;
  font-size: 1.3rem;
}

.invoice-details {
  display: grid;
  gap: 12px;
  margin: 0;
}

.invoice-details div {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
}

.invoice-details dt {
  margin-bottom: 4px;
  color: var(--text-light);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.invoice-details dd {
  margin: 0;
  font-weight: 600;
}

:global(.dark) .admin-error {
  background: #3e2723;
  color: #ffcdd2;
}

@media (max-width: 720px) {
  .admin-header {
    flex-direction: column;
  }
}
</style>

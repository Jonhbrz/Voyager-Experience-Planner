<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { fetchMyInvoices, downloadInvoicePdf, type UserInvoice } from '@/services/invoices'
import { formatCurrency } from '@/utils/formatters'

const auth = useAuthStore()
const toast = useToastStore()

const profileForm = reactive({
  name: '',
  email: '',
})

const passwordForm = reactive({
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
})

const profileError = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const isLoading = ref(false)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const invoicesLoading = ref(false)
const invoices = ref<UserInvoice[]>([])
const selectedInvoice = ref<UserInvoice | null>(null)
const pdfDownloadingId = ref<number | null>(null)

function firstValidationError(e: unknown): string | null {
  if (axios.isAxiosError(e) && e.response?.status === 422 && e.response.data?.errors) {
    const errs = e.response.data.errors as Record<string, string[]>
    return Object.values(errs).flat()[0] ?? null
  }
  if (axios.isAxiosError(e) && e.response?.data?.message) {
    return String(e.response.data.message)
  }
  return null
}

function syncProfileForm() {
  profileForm.name = auth.user?.name ?? ''
  profileForm.email = auth.user?.email ?? ''
}

async function loadProfile() {
  isLoading.value = true
  try {
    await auth.fetchProfile()
    syncProfileForm()
  } catch (e) {
    profileError.value = firstValidationError(e) ?? 'No se pudo cargar el perfil.'
  } finally {
    isLoading.value = false
  }
}

async function loadInvoices() {
  invoicesLoading.value = true
  try {
    invoices.value = await fetchMyInvoices()
  } catch {
    toast.push('error', 'No se pudieron cargar las facturas.')
  } finally {
    invoicesLoading.value = false
  }
}

async function downloadPdf(inv: UserInvoice) {
  pdfDownloadingId.value = inv.id
  try {
    await downloadInvoicePdf(inv.id)
    toast.push('success', 'PDF descargado.')
  } catch {
    toast.push('error', 'No se pudo descargar el PDF.')
  } finally {
    pdfDownloadingId.value = null
  }
}

function planLabel(plan: UserInvoice['plan']): string {
  return plan === 'premium' ? '💎 premium' : '🆓 free'
}

function formatInvoiceDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function closeInvoice() {
  selectedInvoice.value = null
}

async function submitProfile() {
  profileError.value = null
  isSavingProfile.value = true
  try {
    const message = await auth.updateProfile(profileForm.name.trim(), profileForm.email.trim())
    syncProfileForm()
    toast.push('success', message)
  } catch (e) {
    profileError.value = firstValidationError(e) ?? 'No se pudo actualizar el perfil.'
  } finally {
    isSavingProfile.value = false
  }
}

async function submitPassword() {
  passwordError.value = null
  isSavingPassword.value = true
  try {
    const message = await auth.updatePassword(
      passwordForm.currentPassword,
      passwordForm.password,
      passwordForm.passwordConfirmation
    )
    passwordForm.currentPassword = ''
    passwordForm.password = ''
    passwordForm.passwordConfirmation = ''
    toast.push('success', message)
  } catch (e) {
    passwordError.value = firstValidationError(e) ?? 'No se pudo cambiar la contraseña.'
  } finally {
    isSavingPassword.value = false
  }
}

onMounted(() => {
  syncProfileForm()
  void loadProfile()
  void loadInvoices()
})
</script>

<template>
  <MainLayout>
    <section class="profile-page" aria-labelledby="profile-title">
      <div class="profile-header">
        <div>
          <h1 id="profile-title">Perfil</h1>
          <p>Gestiona tus datos de cuenta y contraseña.</p>
          <div v-if="auth.user" class="profile-badges" aria-label="Rol y plan del usuario">
            <span v-if="auth.isAdmin" class="profile-badge profile-badge--admin">👑 superadmin</span>
            <span class="profile-badge" :class="`profile-badge--${auth.user.plan}`">
              {{ auth.user.plan === 'premium' ? '💎 premium' : '🆓 free' }}
            </span>
          </div>
        </div>
        <span v-if="isLoading" class="loading" role="status">Cargando…</span>
      </div>

      <div class="profile-grid">
        <form class="card profile-card" @submit.prevent="submitProfile">
          <h2>Datos personales</h2>
          <p class="section-copy">Estos datos se muestran en tu sesión y se usan para acceder a la cuenta.</p>

          <label class="field">
            <span>Nombre</span>
            <input v-model="profileForm.name" type="text" autocomplete="name" required :disabled="isSavingProfile" />
          </label>
          <label class="field">
            <span>Email</span>
            <input v-model="profileForm.email" type="email" autocomplete="email" required :disabled="isSavingProfile" />
          </label>

          <p v-if="profileError" class="error" role="alert">
            {{ profileError }}
          </p>

          <button type="submit" class="primary-action" :disabled="isSavingProfile">
            {{ isSavingProfile ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>

        <form class="card profile-card" @submit.prevent="submitPassword">
          <h2>Cambiar contraseña</h2>
          <p class="section-copy">Introduce tu contraseña actual antes de guardar una nueva.</p>

          <label class="field">
            <span>Contraseña actual</span>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              autocomplete="current-password"
              required
              :disabled="isSavingPassword"
            />
          </label>
          <label class="field">
            <span>Nueva contraseña</span>
            <input
              v-model="passwordForm.password"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              :disabled="isSavingPassword"
            />
          </label>
          <label class="field">
            <span>Confirmar contraseña</span>
            <input
              v-model="passwordForm.passwordConfirmation"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              :disabled="isSavingPassword"
            />
          </label>

          <p v-if="passwordError" class="error" role="alert">
            {{ passwordError }}
          </p>

          <button type="submit" class="primary-action" :disabled="isSavingPassword">
            {{ isSavingPassword ? 'Actualizando…' : 'Actualizar contraseña' }}
          </button>
        </form>

        <section class="card profile-card invoices-card invoices-span" aria-labelledby="invoices-profile-title">
          <h2 id="invoices-profile-title">Mis facturas</h2>
          <p class="section-copy">Consulta y descarga las facturas de tus pagos.</p>

          <p v-if="invoicesLoading" class="muted-load" role="status">Cargando facturas…</p>

          <div v-else-if="invoices.length" class="invoice-table-wrap">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Plan</th>
                  <th>Importe</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in invoices" :key="inv.id">
                  <td>{{ formatInvoiceDate(inv.created_at) }}</td>
                  <td>{{ planLabel(inv.plan) }}</td>
                  <td>{{ formatCurrency(inv.amount) }}</td>
                  <td>
                    <div class="invoice-act">
                      <button type="button" class="ghost-btn" @click="selectedInvoice = inv">Ver factura</button>
                      <button
                        type="button"
                        class="ghost-btn"
                        :disabled="pdfDownloadingId === inv.id"
                        @click="downloadPdf(inv)"
                      >
                        {{ pdfDownloadingId === inv.id ? '…' : 'Descargar PDF' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-else class="muted-load">No hay facturas registradas.</p>
        </section>
      </div>

      <Teleport to="body">
        <div
          v-if="selectedInvoice"
          class="invoice-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inv-prof-title"
          @click.self="closeInvoice"
        >
          <div class="invoice-modal-box">
            <div class="invoice-modal-head">
              <h2 id="inv-prof-title">Factura #{{ selectedInvoice.id }}</h2>
              <button type="button" class="modal-x" aria-label="Cerrar" @click="closeInvoice">×</button>
            </div>
            <dl class="inv-dl">
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
                <dd>{{ formatInvoiceDate(selectedInvoice.created_at) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Teleport>
    </section>
  </MainLayout>
</template>

<style scoped>
.profile-page {
  max-width: 980px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.profile-header h1 {
  margin: 0 0 6px;
}

.profile-header p,
.section-copy {
  margin: 0;
  color: var(--text-light);
}

.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.profile-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 800;
  border: 1px solid var(--border);
}

.profile-badge--free {
  background: var(--activity);
  color: var(--text);
}

.profile-badge--premium,
.profile-badge--admin {
  background: #fef3c7;
  color: #78350f;
}

.loading {
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--activity);
  color: var(--text-light);
  font-size: 0.88rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 0;
}

.profile-card h2 {
  margin: 0;
  font-size: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.field input {
  min-height: 40px;
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #ffebee;
  color: #b00020;
  font-size: 0.92rem;
}

.primary-action {
  align-self: flex-start;
  padding: 10px 14px;
}

.primary-action:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

:global(.dark) .error {
  background: #3e2723;
  color: #ffcdd2;
}

@media (max-width: 820px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-header {
    flex-direction: column;
  }

  .invoices-span {
    grid-column: auto;
  }
}

.invoices-span {
  grid-column: 1 / -1;
}

.muted-load {
  margin: 0;
  color: var(--text-light);
  font-size: 0.92rem;
}

.invoice-table-wrap {
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.invoice-table th,
.invoice-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.invoice-table th {
  color: var(--text-light);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.invoice-act {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ghost-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.86rem;
}

.ghost-btn:hover:not(:disabled) {
  background: var(--activity);
}

.ghost-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.invoice-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

.invoice-modal-box {
  width: min(400px, 100%);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.invoice-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.invoice-modal-head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-x {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  cursor: pointer;
  color: inherit;
}

.inv-dl {
  margin: 0;
  display: grid;
  gap: 10px;
}

.inv-dl div {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
}

.inv-dl dt {
  margin: 0 0 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-light);
  text-transform: uppercase;
}

.inv-dl dd {
  margin: 0;
  font-weight: 600;
}
</style>

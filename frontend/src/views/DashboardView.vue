<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import TripList from '@/components/dashboard/TripList.vue'
import { useTripsStore } from '@/stores/trips'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Trip } from '@/types/trip'
import {
  getNextFutureActivity,
  getTripActivityPreview,
  getTripProgress,
  tripActivityCount,
} from '@/utils/tripUi'
import { getTripDuration } from '@/utils/tripDates'
import { formatSpentEUR, getTripTotal } from '@/utils/tripTotals'
import { useLastVisitedTrip } from '@/composables/useLastVisitedTrip'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import axios from 'axios'

const tripsStore = useTripsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const router = useRouter()
const { setLastVisitedTripId } = useLastVisitedTrip()
const FREE_TRIP_LIMIT = 3
const TRANSFER_AMOUNT_LABEL = '9,99 EUR'

const showCreateTrip = ref(false)
const newTripName = ref('')
const newTripDescription = ref('')
const startDate = ref('')
const endDate = ref('')
const createTripFormError = ref<string | null>(null)
const showPaymentModal = ref(false)
const paymentMethod = ref<'card' | 'transfer'>('card')
const cardHolder = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')
const transferIban = ref('')
const transferHolder = ref('')
const paymentFormError = ref<string | null>(null)
const isPaymentProcessing = ref(false)
const isDowngrading = ref(false)

const isFreeUser = computed(() => authStore.user?.plan === 'free' && !authStore.isAdmin)

const showUpgradeBanner = computed(() => {
  const u = authStore.user
  return u?.plan === 'free' && u?.role !== 'superadmin'
})

const showDowngradeOption = computed(() => {
  const u = authStore.user
  return u?.plan === 'premium' && u?.role !== 'superadmin'
})
const hasTripLimit = computed(() => isFreeUser.value && tripsStore.totalTrips >= FREE_TRIP_LIMIT)

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

function validateCardPayment(): string | null {
  if (!cardHolder.value.trim()) return 'Indica el titular de la tarjeta.'
  const num = digitsOnly(cardNumber.value)
  if (num.length < 13 || num.length > 19) return 'El número de tarjeta debe tener entre 13 y 19 dígitos.'
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.value.trim()))
    return 'La fecha de expiración debe tener el formato MM/AA.'
  if (!/^\d{3,4}$/.test(cardCvv.value.trim())) return 'El CVV debe tener 3 o 4 dígitos.'
  return null
}

function validateTransferPayment(): string | null {
  const iban = transferIban.value.trim().replace(/\s/g, '')
  if (!iban) return 'Indica el IBAN de origen.'
  if (iban.length < 15 || iban.length > 34) return 'El IBAN no es válido.'
  if (!transferHolder.value.trim()) return 'Indica el nombre del titular.'
  return null
}

function apiErrMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message)
    return String(error.response.data.message)
  return fallback
}

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const openCreateTripPanel = () => {
  if (tripsStore.isLoading || tripsStore.isCreatingTrip) return
  if (hasTripLimit.value) {
    createTripFormError.value = `Has alcanzado el límite del plan free (${FREE_TRIP_LIMIT} viajes). Mejora a premium para crear más.`
    return
  }
  createTripFormError.value = null
  if (!startDate.value || !endDate.value) {
    const today = new Date()
    const end = new Date(today)
    end.setDate(end.getDate() + 6)
    startDate.value = toYmd(today)
    endDate.value = toYmd(end)
  }
  showCreateTrip.value = true
}

const cancelCreateTrip = () => {
  showCreateTrip.value = false
  newTripName.value = ''
  newTripDescription.value = ''
  startDate.value = ''
  endDate.value = ''
  createTripFormError.value = null
}

watch(startDate, (s) => {
  if (s && endDate.value && endDate.value < s) {
    endDate.value = s
  }
})

const submitCreateTrip = async () => {
  if (tripsStore.isLoading || tripsStore.isCreatingTrip) return
  createTripFormError.value = null
  if (hasTripLimit.value) {
    createTripFormError.value = `Has alcanzado el límite del plan free (${FREE_TRIP_LIMIT} viajes). Mejora a premium para crear más.`
    return
  }
  const name = newTripName.value.trim()
  if (!name) {
    createTripFormError.value = 'Indica un nombre para el viaje.'
    return
  }
  if (!startDate.value || !endDate.value) {
    createTripFormError.value = 'Indica fecha de inicio y fin.'
    return
  }
  if (endDate.value < startDate.value) {
    createTripFormError.value = 'La fecha de fin debe ser igual o posterior a la de inicio.'
    return
  }
  const idsBefore = new Set(tripsStore.trips.map((t) => t.id))
  await tripsStore.addTrip(name, newTripDescription.value.trim(), startDate.value, endDate.value)
  await nextTick()
  if (!tripsStore.errorMessage) {
    const created = tripsStore.trips.find((t) => !idsBefore.has(t.id))
    cancelCreateTrip()
    if (created) {
      await router.push(`/trip/${created.id}`)
    }
  }
}

function dayCount(trip: Trip) {
  return trip.days?.length ?? 0
}

function activityCount(trip: Trip) {
  return tripActivityCount(trip)
}

function activityPreview(trip: Trip) {
  return getTripActivityPreview(trip, 2)
}

function nextActivityLine(trip: Trip): string | null {
  const next = getNextFutureActivity(trip)
  if (!next) return null
  return `🕘 Próxima pendiente: ${next.title} — ${next.start_time}`
}

function nextActivityStatus(trip: Trip): 'empty' | 'no-pending' | 'has-next' {
  const total = tripActivityCount(trip)
  if (total === 0) return 'empty'
  if (!getNextFutureActivity(trip)) return 'no-pending'
  return 'has-next'
}

function resetPaymentForm() {
  paymentMethod.value = 'card'
  cardHolder.value = ''
  cardNumber.value = ''
  cardExpiry.value = ''
  cardCvv.value = ''
  transferIban.value = ''
  transferHolder.value = ''
  paymentFormError.value = null
}

function openUpgradeModal() {
  if (isPaymentProcessing.value) return
  resetPaymentForm()
  showPaymentModal.value = true
}

function closeUpgradeModal() {
  if (isPaymentProcessing.value) return
  showPaymentModal.value = false
}

async function confirmSimulatePayment() {
  if (isPaymentProcessing.value) return
  paymentFormError.value = null
  if (paymentMethod.value === 'card') {
    const err = validateCardPayment()
    if (err) {
      paymentFormError.value = err
      return
    }
  } else {
    const err = validateTransferPayment()
    if (err) {
      paymentFormError.value = err
      return
    }
  }
  const payload =
    paymentMethod.value === 'card'
      ? {
          method: 'card' as const,
          payment_data: {
            holder_name: cardHolder.value.trim(),
            card_number: digitsOnly(cardNumber.value),
            expiry: cardExpiry.value.trim(),
            cvv: cardCvv.value.trim(),
          },
        }
      : {
          method: 'transfer' as const,
          payment_data: {
            iban: transferIban.value.trim().replace(/\s/g, '').toUpperCase(),
            holder_name: transferHolder.value.trim(),
            amount: TRANSFER_AMOUNT_LABEL,
          },
        }
  isPaymentProcessing.value = true
  try {
    const message = await authStore.simulatePremiumPayment(payload)
    createTripFormError.value = null
    toastStore.push('success', message)
    showPaymentModal.value = false
    await tripsStore.loadTrips().catch(() => undefined)
  } catch (error) {
    toastStore.push('error', apiErrMessage(error, 'No se pudo completar el pago simulado.'))
  } finally {
    isPaymentProcessing.value = false
  }
}

async function confirmDowngrade() {
  if (isDowngrading.value || !showDowngradeOption.value) return
  const ok = window.confirm(
    '¿Seguro que quieres volver al plan free? Perderás ventajas como viajes ilimitados en este plan.'
  )
  if (!ok) return
  isDowngrading.value = true
  try {
    const message = await authStore.downgradeToFree()
    toastStore.push('success', message)
    await tripsStore.loadTrips().catch(() => undefined)
  } catch (error) {
    toastStore.push('error', apiErrMessage(error, 'No se pudo cambiar el plan.'))
  } finally {
    isDowngrading.value = false
  }
}

onMounted(() => {
  tripsStore.loadTrips()
})

const tripsSorted = computed(() =>
  [...tripsStore.trips].sort((a, b) => a.name.localeCompare(b.name, 'es'))
)

const globalSpentLabel = computed(() => formatSpentEUR(tripsStore.totalSpentAllTrips))

const totalDays = computed(() => {
  return tripsStore.trips.reduce((total, trip) => {
    const d = getTripDuration(trip)
    if (d === null) return total
    return total + d
  }, 0)
})

const tripCards = computed(() =>
  tripsSorted.value.map((trip) => {
    const days = dayCount(trip)
    const activities = activityCount(trip)
    return {
      id: trip.id,
      name: trip.name,
      daysLabel: `${days} ${days === 1 ? 'día' : 'días'}`,
      activitiesLabel: `${activities} ${activities === 1 ? 'actividad' : 'actividades'}`,
      spentLabel: formatSpentEUR(getTripTotal(trip)),
      progress: tripProgress(trip),
      preview: activityPreview(trip),
      nextLine: nextActivityLine(trip),
      nextStatus: nextActivityStatus(trip),
    }
  })
)

const goTrip = (id: number) => {
  setLastVisitedTripId(id)
  router.push(`/trip/${id}`)
}

function tripProgress(trip: Trip) {
  return getTripProgress(trip)
}
</script>

<template>
  <MainLayout>
    <div v-if="showUpgradeBanner" class="upgrade-banner" role="region" aria-label="Mejorar plan">
      <p class="upgrade-banner-text">Mejora a premium para desbloquear viajes ilimitados</p>
      <button type="button" class="btn-upgrade-banner" :disabled="isPaymentProcessing" @click="openUpgradeModal">
        Mejorar plan
      </button>
    </div>

    <div v-if="showDowngradeOption" class="downgrade-card" role="region" aria-label="Cambiar plan">
      <p>Tienes plan premium. Puedes volver al plan free cuando quieras.</p>
      <button
        type="button"
        class="btn-downgrade"
        :disabled="isDowngrading"
        @click="confirmDowngrade"
      >
        {{ isDowngrading ? 'Procesando…' : 'Volver a plan Free' }}
      </button>
    </div>

    <div class="dashboard-head">
      <h1 id="dashboard-main-heading">Mi Experiencia</h1>
      <button
        type="button"
        class="btn-create"
        :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip || hasTripLimit"
        :aria-label="
          hasTripLimit
            ? 'Plan free limitado a tres viajes; mejora a premium para crear más'
            : 'Abrir formulario para crear un nuevo viaje'
        "
        @click="openCreateTripPanel"
      >
        Crear viaje
      </button>
    </div>

    <div v-if="hasTripLimit && !showCreateTrip" class="limit-panel" role="alert">
      <div>
        <strong>Has alcanzado el límite del plan free ({{ FREE_TRIP_LIMIT }} viajes)</strong>
        <p>Mejora a premium para crear viajes sin límite.</p>
      </div>
      <button type="button" class="btn-upgrade" :disabled="isPaymentProcessing" @click="openUpgradeModal">
        {{ isPaymentProcessing ? 'Procesando…' : 'Mejorar a premium' }}
      </button>
    </div>

    <div v-if="showCreateTrip" class="create-trip-panel card-hover">
      <h2 class="create-trip-title">Nuevo viaje</h2>
      <form class="create-trip-form" @submit.prevent="submitCreateTrip">
        <label class="create-trip-field">
          <span>Nombre</span>
          <input
            v-model="newTripName"
            type="text"
            autocomplete="off"
            placeholder="Ej. Primavera en Kyoto"
            :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip"
            required
          />
        </label>
        <label class="create-trip-field">
          <span>Descripción</span>
          <textarea
            v-model="newTripDescription"
            rows="3"
            placeholder="Notas o resumen del viaje (opcional)"
            :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip"
          />
        </label>
        <div class="create-trip-dates">
          <label class="create-trip-field create-trip-field--inline">
            <span>Inicio</span>
            <input v-model="startDate" type="date" required :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip" />
          </label>
          <label class="create-trip-field create-trip-field--inline">
            <span>Fin</span>
            <input
              v-model="endDate"
              type="date"
              required
              :min="startDate || undefined"
              :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip"
            />
          </label>
        </div>
        <p v-if="createTripFormError" class="create-trip-error" role="alert">
          {{ createTripFormError }}
        </p>
        <div class="create-trip-actions">
          <button
            type="submit"
            class="btn-create-submit"
            :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip || !newTripName.trim() || !startDate || !endDate"
          >
            {{ tripsStore.isCreatingTrip ? 'Creando...' : 'Crear' }}
          </button>
          <button type="button" class="btn-create-cancel" :disabled="tripsStore.isLoading || tripsStore.isCreatingTrip" @click="cancelCreateTrip">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="tripsStore.isBootstrapping && !tripsSorted.length"
      class="dashboard-skeleton"
      aria-busy="true"
      aria-label="Cargando viajes"
    >
      <div class="stats stats--skeleton">
        <div class="skeleton skeleton-card stat-skeleton" />
      </div>
      <h2 class="trips-heading">Tus viajes</h2>
      <ul class="trip-grid trip-grid--skeleton">
        <li v-for="n in 6" :key="n" class="skeleton skeleton-card trip-card-skeleton">
          <div class="skeleton skeleton-text skel-title" />
          <div class="skeleton skeleton-text skel-meta" />
          <div class="skeleton skeleton-text skel-meta short" />
          <div class="skeleton skeleton-text skel-preview" />
        </li>
      </ul>
    </div>

    <template v-else>
    <section class="dashboard-body" aria-labelledby="dashboard-main-heading">
    <div v-if="!isFreeUser" class="dashboard-stats">
      <p class="dashboard-stats-label"><span aria-hidden="true">🌍 </span>Días de viaje totales</p>
      <h2 v-if="totalDays > 0" class="dashboard-stats-value">{{ totalDays }}</h2>
      <p v-else class="dashboard-stats-empty">Aún no has planificado días de viaje ✈️</p>
    </div>

    <div v-if="!isFreeUser" class="stats">
      <div class="stat-card card-hover">
        <h3>Total de viajes</h3>
        <p class="stat-value">{{ tripsStore.totalTrips }}</p>
      </div>
      <div v-if="tripsStore.trips.length" class="stat-card card-hover stat-card--spent">
        <h3 id="dashboard-spent-heading">Gasto total</h3>
        <p class="stat-value stat-value--spent" aria-labelledby="dashboard-spent-heading">{{ globalSpentLabel }}</p>
        <p class="stat-sub">Todos los viajes (actividades, transportes, estancias)</p>
      </div>
    </div>

    <h2 class="trips-heading">Tus viajes</h2>

    <TripList :trips="tripCards" @open="goTrip" />
    </section>
    </template>

    <Teleport to="body">
      <div
        v-if="showPaymentModal"
        class="payment-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        @click.self="closeUpgradeModal"
      >
        <section class="payment-modal payment-modal--wide card-hover">
          <h2 id="payment-modal-title" class="payment-modal-title">Simular pago</h2>
          <p class="payment-modal-note">Elige método e introduce datos de prueba. No es un cobro real.</p>
          <div class="payment-method-row" role="group" aria-label="Método de pago">
            <label class="payment-option">
              <input v-model="paymentMethod" type="radio" value="card" name="pay-method" :disabled="isPaymentProcessing" />
              <span>Tarjeta</span>
            </label>
            <label class="payment-option">
              <input v-model="paymentMethod" type="radio" value="transfer" name="pay-method" :disabled="isPaymentProcessing" />
              <span>Transferencia</span>
            </label>
          </div>

          <div v-if="paymentMethod === 'card'" class="payment-form-grid">
            <label class="pay-field">
              <span>Titular de la tarjeta</span>
              <input v-model="cardHolder" type="text" autocomplete="off" placeholder="Nombre y apellidos" :disabled="isPaymentProcessing" />
            </label>
            <label class="pay-field">
              <span>Número de tarjeta</span>
              <input v-model="cardNumber" type="text" inputmode="numeric" autocomplete="off" placeholder="13–19 dígitos" :disabled="isPaymentProcessing" />
            </label>
            <label class="pay-field">
              <span>Fecha de expiración</span>
              <input v-model="cardExpiry" type="text" autocomplete="off" placeholder="MM/AA" maxlength="5" :disabled="isPaymentProcessing" />
            </label>
            <label class="pay-field">
              <span>CVV</span>
              <input v-model="cardCvv" type="password" autocomplete="off" maxlength="4" placeholder="···" :disabled="isPaymentProcessing" />
            </label>
          </div>

          <div v-if="paymentMethod === 'transfer'" class="payment-form-grid">
            <label class="pay-field">
              <span>IBAN origen</span>
              <input v-model="transferIban" type="text" autocomplete="off" placeholder="Ej. ES00 0000 0000 0000 0000 0000" :disabled="isPaymentProcessing" />
            </label>
            <label class="pay-field">
              <span>Cantidad</span>
              <input :value="TRANSFER_AMOUNT_LABEL" type="text" readonly tabindex="-1" class="readonly-field" aria-readonly="true" />
            </label>
            <label class="pay-field pay-field--full">
              <span>Nombre del titular</span>
              <input v-model="transferHolder" type="text" autocomplete="name" placeholder="Titular de la cuenta" :disabled="isPaymentProcessing" />
            </label>
          </div>

          <p v-if="paymentFormError" class="payment-form-error" role="alert">{{ paymentFormError }}</p>

          <div class="payment-modal-actions">
            <button type="button" class="btn-create-submit" :disabled="isPaymentProcessing" @click="confirmSimulatePayment">
              {{ isPaymentProcessing ? 'Procesando…' : 'Confirmar' }}
            </button>
            <button type="button" class="btn-create-cancel" :disabled="isPaymentProcessing" @click="closeUpgradeModal">
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </MainLayout>
</template>

<style scoped>
.upgrade-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0 0 18px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.08);
  color: var(--text);
}

.upgrade-banner-text {
  margin: 0;
  font-weight: 600;
  font-size: 0.98rem;
  line-height: 1.4;
}

.btn-upgrade-banner {
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  background: var(--primary);
  color: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-upgrade-banner:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
}

.btn-upgrade-banner:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.downgrade-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 18px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
}

.downgrade-card p {
  margin: 0;
  font-size: 0.95rem;
}

.btn-downgrade {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
}

.btn-downgrade:hover:not(:disabled) {
  background: var(--activity);
}

.btn-downgrade:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .payment-form-grid {
    grid-template-columns: 1fr;
  }
}

.payment-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

.payment-modal {
  width: min(440px, 100%);
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.payment-modal--wide {
  width: min(500px, 100%);
}

.payment-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.pay-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
}

.pay-field span {
  color: var(--text-light);
}

.pay-field input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font: inherit;
}

.pay-field--full {
  grid-column: 1 / -1;
}

.readonly-field {
  opacity: 0.88;
  cursor: default;
}

.payment-form-error {
  margin: 0 0 12px;
  font-size: 0.88rem;
  color: #b00020;
}

.payment-modal-title {
  margin: 0 0 10px;
  font-size: 1.15rem;
}

.payment-modal-note {
  margin: 0 0 14px;
  font-size: 0.9rem;
  color: var(--text-light);
}

.payment-method-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.payment-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  cursor: pointer;
}

.payment-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dashboard-stats {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 20px;
  background: var(--bg);
}

.dashboard-stats-label {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-light);
}

.dashboard-stats-value {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  color: var(--primary);
}

.dashboard-stats-empty {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-light);
  line-height: 1.45;
}

.dashboard-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

h1 {
  margin: 0;
}

.btn-upgrade {
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.btn-upgrade:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-create {
  padding: 10px 18px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
}

.btn-create:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.create-trip-panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px 22px;
  margin-bottom: 24px;
  max-width: 520px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.create-trip-title {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 700;
}

.create-trip-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.create-trip-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text);
}

.create-trip-field input,
.create-trip-field textarea {
  font-weight: 400;
  font-size: 1rem;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-family: inherit;
}

.create-trip-field textarea {
  resize: vertical;
  min-height: 72px;
}

.create-trip-field input::placeholder,
.create-trip-field textarea::placeholder {
  color: var(--text-light);
}

.create-trip-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.create-trip-field--inline {
  flex: 1;
  min-width: 140px;
}

.create-trip-error {
  margin: 0;
  font-size: 0.9rem;
  color: #b00020;
}

.limit-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: -6px 0 18px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #ffebee;
  color: #b00020;
}

.limit-panel p {
  margin: 4px 0 0;
}

.create-trip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.btn-create-submit {
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}

.btn-create-submit:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-create-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-create-cancel {
  padding: 10px 18px;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-weight: 600;
}

.btn-create-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dashboard-skeleton {
  margin-bottom: 8px;
}

.stats--skeleton {
  margin-bottom: 24px;
}

.stat-skeleton {
  max-width: 240px;
  min-height: 88px;
}

.trip-grid--skeleton {
  margin-top: 4px;
}

.trip-card-skeleton {
  min-height: 168px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.skel-title {
  width: 70%;
  height: 1.15rem;
}

.skel-meta {
  width: 55%;
  height: 0.85rem;
}

.skel-meta.short {
  width: 40%;
}

.skel-preview {
  width: 90%;
  margin-top: 6px;
  height: 0.8rem;
}

.stats {
  margin-bottom: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: stretch;
}

.stat-card {
  background: var(--card);
  padding: 18px 22px;
  border-radius: 12px;
  max-width: 280px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.stat-card--spent .stat-value--spent {
  color: var(--primary);
}

.stat-sub {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--text-light);
  line-height: 1.35;
}

.stat-card h3 {
  margin: 0 0 8px;
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.85;
}

.stat-value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
}

.trips-heading {
  margin: 0 0 14px;
  font-size: 1.15rem;
}

.trip-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.trip-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 20px 18px;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s ease;
}

.trip-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  border-color: var(--border);
}

.trip-card:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.trip-name {
  margin: 0 0 12px;
  font-size: 1.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-meta {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  font-size: 0.92rem;
  color: var(--text-light);
}

.trip-meta li {
  margin-bottom: 4px;
}

.trip-progress-meta {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--primary);
}

.trip-progress-bar {
  height: 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 0 12px;
  overflow: hidden;
}

.trip-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4px;
  transition: width 0.22s ease;
}

.trip-preview {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--text-light);
}

.trip-preview-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.trip-preview-row:last-child {
  margin-bottom: 0;
}

.trip-preview-time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #2e7d32;
  flex-shrink: 0;
}

.trip-preview-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-next {
  margin: 0 0 12px;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.trip-next.muted {
  color: var(--text-light);
  font-style: italic;
}

.trip-cta {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary);
}

.empty-dash {
  color: var(--text-light);
  font-size: 1rem;
  margin-top: 8px;
}

:global(.dark) .upgrade-banner {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.45);
}

:global(.dark) .payment-modal {
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
}

:global(.dark) .stat-card,
:global(.dark) .trip-card {
  border-color: var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

:global(.dark) .create-trip-panel {
  border-color: var(--border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

:global(.dark) .limit-panel {
  background: #3e2723;
  color: #ffcdd2;
}

@media (max-width: 720px) {
  .limit-panel {
    align-items: stretch;
    flex-direction: column;
  }
}

:global(.dark) .create-trip-field input,
:global(.dark) .create-trip-field textarea {
  background: var(--card);
  border-color: var(--border);
  color: var(--text);
}

:global(.dark) .create-trip-field input::placeholder,
:global(.dark) .create-trip-field textarea::placeholder {
  color: var(--text-light);
}

:global(.dark) .btn-create-cancel {
  border-color: var(--border);
  color: var(--text);
}

:global(.dark) .trip-meta,
:global(.dark) .trip-next,
:global(.dark) .trip-preview {
  color: var(--text);
}

:global(.dark) .trip-next.muted,
:global(.dark) .empty-dash {
  color: var(--text-light);
}

:global(.dark) .trip-preview-time {
  color: #81c784;
}
</style>

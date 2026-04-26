<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const hasValidResetLink = computed(() => token.value.length > 0)
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const password = ref('')
const passwordConfirmation = ref('')
const statusMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

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

async function submit() {
  statusMessage.value = null
  errorMessage.value = null

  if (!hasValidResetLink.value) {
    errorMessage.value = 'El enlace de recuperación no es válido o ha caducado.'
    return
  }

  isSubmitting.value = true
  try {
    statusMessage.value = await auth.resetPassword({
      token: token.value,
      email: email.value.trim().toLowerCase(),
      password: password.value,
      passwordConfirmation: passwordConfirmation.value,
    })
    setTimeout(() => {
      void router.replace({ name: 'login' })
    }, 1200)
  } catch (e) {
    errorMessage.value = firstValidationError(e) ?? 'No se pudo restablecer la contraseña.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main id="main-content" class="auth-page" tabindex="-1">
    <div class="auth-card">
      <h1>Nueva contraseña</h1>
      <p class="hint">Introduce una contraseña nueva para completar la recuperación.</p>

      <form class="form" @submit.prevent="submit">
        <p v-if="!hasValidResetLink" class="error" role="alert">
          El enlace de recuperación no contiene un token válido. Solicita un enlace nuevo.
        </p>

        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required :disabled="isSubmitting" />
        </label>
        <label class="field">
          <span>Nueva contraseña</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="isSubmitting"
          />
        </label>
        <label class="field">
          <span>Confirmar contraseña</span>
          <input
            v-model="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="isSubmitting"
          />
        </label>

        <p v-if="statusMessage" class="success" role="status">
          {{ statusMessage }}
        </p>
        <p v-if="errorMessage" class="error" role="alert">
          {{ errorMessage }}
        </p>

        <button type="submit" class="submit" :disabled="isSubmitting || !hasValidResetLink">
          {{ isSubmitting ? 'Guardando…' : 'Restablecer contraseña' }}
        </button>
      </form>

      <p class="footer">
        <RouterLink to="/forgot-password">Solicitar otro enlace</RouterLink>
      </p>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, var(--bg) 0%, #14532d 100%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--card, #fff);
  border-radius: 16px;
  padding: 28px 26px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

h1 {
  margin: 0 0 6px;
  font-size: 1.5rem;
}

.hint {
  margin: 0 0 22px;
  font-size: 0.9rem;
  opacity: 0.75;
}

.form,
.field {
  display: flex;
  flex-direction: column;
}

.form {
  gap: 16px;
}

.field {
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 600;
}

.field input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

.success,
.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.92rem;
}

.success {
  background: #e8f5e9;
  color: #1b5e20;
}

.error {
  background: #ffebee;
  color: #b00020;
}

.submit {
  margin-top: 4px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.submit:hover:not(:disabled) {
  background: var(--primary-hover);
}

.submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.footer {
  margin: 20px 0 0;
  text-align: center;
  font-size: 0.92rem;
}

.footer a {
  color: var(--primary);
  font-weight: 600;
}

:global(.dark) .auth-card {
  background: var(--card);
  border: 1px solid var(--border);
}

:global(.dark) .field input {
  background: var(--bg);
  border-color: var(--border);
  color: var(--text);
}

:global(.dark) .success {
  background: #1b3a1e;
  color: #c8e6c9;
}

:global(.dark) .error {
  background: #3e2723;
  color: #ffcdd2;
}
</style>

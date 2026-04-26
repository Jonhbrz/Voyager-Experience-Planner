<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const email = ref('')
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
  isSubmitting.value = true
  try {
    statusMessage.value = await auth.requestPasswordReset(email.value.trim().toLowerCase())
  } catch (e) {
    errorMessage.value = firstValidationError(e) ?? 'No se pudo enviar el email de recuperación.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main id="main-content" class="auth-page" tabindex="-1">
    <div class="auth-card">
      <h1>Recuperar contraseña</h1>
      <p class="hint">Te enviaremos un enlace para crear una nueva contraseña.</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required :disabled="isSubmitting" />
        </label>

        <p v-if="statusMessage" class="success" role="status">
          {{ statusMessage }}
        </p>
        <p v-if="errorMessage" class="error" role="alert">
          {{ errorMessage }}
        </p>

        <button type="submit" class="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Enviando…' : 'Enviar enlace' }}
        </button>
      </form>

      <p class="footer">
        <RouterLink to="/login">Volver al login</RouterLink>
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

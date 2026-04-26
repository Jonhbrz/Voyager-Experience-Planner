<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref<string | null>(null)
const isSubmitting = ref(false)

async function submit() {
  errorMessage.value = null
  isSubmitting.value = true
  try {
    await auth.register(name.value.trim(), email.value.trim().toLowerCase(), password.value, passwordConfirmation.value)
    await router.replace('/')
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 422 && e.response.data?.errors) {
      const errs = e.response.data.errors as Record<string, string[]>
      const first = Object.values(errs).flat()[0]
      errorMessage.value = first ?? 'No se pudo registrar.'
      return
    }
    if (axios.isAxiosError(e) && e.response?.data?.message) {
      errorMessage.value = String(e.response.data.message)
      return
    }
    errorMessage.value = 'No se pudo registrar.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main id="main-content" class="auth-page" tabindex="-1">
    <div class="auth-card">
      <h1>Crear cuenta</h1>
      <p class="hint">Voyager Experience Planner</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>Nombre</span>
          <input v-model="name" type="text" autocomplete="name" required :disabled="isSubmitting" />
        </label>
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required :disabled="isSubmitting" />
        </label>
        <label class="field">
          <span>Contraseña</span>
          <input
            id="register-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            :disabled="isSubmitting"
            aria-describedby="register-pw-hint"
          />
        </label>
        <p id="register-pw-hint" class="pw-hint">Mínimo 8 caracteres.</p>
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

        <p v-if="errorMessage" class="error" role="alert">
          {{ errorMessage }}
        </p>

        <button type="submit" class="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creando…' : 'Registrarse' }}
        </button>
      </form>

      <p class="footer">
        ¿Ya tienes cuenta?
        <RouterLink to="/login">Inicia sesión</RouterLink>
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
  max-width: 400px;
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

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
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

.pw-hint {
  margin: -8px 0 0;
  font-size: 0.82rem;
  opacity: 0.7;
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #ffebee;
  color: #b00020;
  font-size: 0.92rem;
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

:global(.dark) .error {
  background: #3e2723;
  color: #ffcdd2;
}
</style>

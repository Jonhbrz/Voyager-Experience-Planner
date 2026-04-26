<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

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
            <span v-if="auth.isAdmin" class="profile-badge profile-badge--admin">👑 Superadmin</span>
            <span class="profile-badge" :class="`profile-badge--${auth.user.plan}`">
              {{ auth.user.plan === 'premium' ? '💎 Premium' : '🆓 Free' }}
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
      </div>
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
}
</style>

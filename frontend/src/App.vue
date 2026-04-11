<script setup lang="ts">
import { watch } from 'vue'
import Toast from '@/components/Toast.vue'
import { useTripsStore } from '@/stores/trips'
import { useToastStore } from '@/stores/toast'

const tripsStore = useTripsStore()
const toastStore = useToastStore()

watch(
  () => tripsStore.successMessage,
  (msg) => {
    if (msg) toastStore.push('success', msg)
  }
)

watch(
  () => tripsStore.errorMessage,
  (msg) => {
    if (msg) toastStore.push('error', msg)
  }
)
</script>

<template>
  <router-view />
  <Toast />
</template>

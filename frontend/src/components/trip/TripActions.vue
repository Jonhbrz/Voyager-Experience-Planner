<template>
  <div class="trip-toolbar section">
    <button type="button" class="primary" :disabled="isBootstrapping" aria-label="Añadir un día al viaje" @click="emit('toggle-add-day')">
      + Añadir día
    </button>

    <Transition name="fade-slide">
      <form
        v-if="showForm"
        key="add-day-form"
        class="form add-day-form"
        @submit.prevent="emit('add-day')"
      >
        <label class="sr-only" for="new-day-title-input">Nombre del nuevo día</label>
        <input
          id="new-day-title-input"
          :value="newDayTitle"
          placeholder="Nombre del día"
          :disabled="isBootstrapping"
          autocomplete="off"
          @input="onTitleInput"
        />
        <button
          type="submit"
          :disabled="isBootstrapping || !newDayTitle.trim()"
          aria-label="Guardar nuevo día"
        >
          Guardar
        </button>
        <button type="button" :disabled="isBootstrapping" aria-label="Cancelar nuevo día" @click="emit('cancel-add-day')">
          Cancelar
        </button>
      </form>
    </Transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isBootstrapping: boolean
  showForm: boolean
  newDayTitle: string
}>()

const emit = defineEmits<{
  'toggle-add-day': []
  'add-day': []
  'cancel-add-day': []
  'update:newDayTitle': [value: string]
}>()

function onTitleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:newDayTitle', target.value)
}
</script>

<style scoped>
.add-day-form {
  margin-top: 14px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

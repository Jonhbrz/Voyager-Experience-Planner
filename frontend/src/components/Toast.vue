<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite" aria-label="Notificaciones">
      <TransitionGroup name="toast" tag="div" class="toast-stack">
        <div
          v-for="t in toast.items"
          :key="t.id"
          :class="['toast-item', t.type === 'success' ? 'toast-success' : 'toast-error']"
          role="status"
          @mouseenter="toast.pauseDismiss(t.id)"
          @mouseleave="toast.resumeDismiss(t.id)"
        >
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  pointer-events: none;
  max-width: min(380px, calc(100vw - 32px));
}

.toast-stack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.toast-item {
  pointer-events: auto;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.92rem;
  line-height: 1.4;
  font-weight: 500;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  border: 1px solid transparent;
}

.toast-success {
  background: #e8f5e9;
  color: #1b5e20;
  border-color: #a5d6a7;
}

.toast-error {
  background: #ffebee;
  color: #b00020;
  border-color: #ffcdd2;
}

.toast-move {
  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-active {
  transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1), transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-leave-active {
  position: absolute;
  right: 0;
  width: max-content;
  max-width: min(380px, calc(100vw - 32px));
  transition: opacity 0.42s cubic-bezier(0.4, 0, 0.2, 1), transform 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-14px) scale(0.98);
}

:global(.dark) .toast-success {
  background: #1b3a1e;
  color: #c8e6c9;
  border-color: #2e4a32;
}

:global(.dark) .toast-error {
  background: #3e2723;
  color: #ffcdd2;
  border-color: #5d4037;
}
</style>

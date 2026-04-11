import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

let toastSeq = 0

const TOAST_MS = 3000
const MAX_TOASTS = 3

export const useToastStore = defineStore('toast', {
  state: (): {
    items: ToastItem[]
    _toastTimers: Record<number, ReturnType<typeof setTimeout>>
  } => ({
    items: [],
    _toastTimers: {},
  }),

  actions: {
    _clearTimer(id: number) {
      const t = this._toastTimers[id]
      if (t) {
        clearTimeout(t)
        delete this._toastTimers[id]
      }
    },

    _scheduleDismiss(id: number) {
      this._clearTimer(id)
      this._toastTimers[id] = setTimeout(() => {
        this.dismiss(id)
      }, TOAST_MS)
    },

    push(type: ToastType, message: string) {
      if (!message?.trim()) return
      const text = message.trim()
      const last = this.items[this.items.length - 1]
      if (last && last.type === type && last.message === text) {
        return
      }
      while (this.items.length >= MAX_TOASTS) {
        const oldest = this.items[0]?.id
        if (oldest == null) break
        this.dismiss(oldest)
      }

      const id = ++toastSeq
      this.items.push({ id, type, message: text })
      this._scheduleDismiss(id)
    },

    pauseDismiss(id: number) {
      this._clearTimer(id)
    },

    resumeDismiss(id: number) {
      if (this.items.some((t) => t.id === id)) {
        this._scheduleDismiss(id)
      }
    },

    dismiss(id: number) {
      this._clearTimer(id)
      this.items = this.items.filter((t) => t.id !== id)
    },
  },
})

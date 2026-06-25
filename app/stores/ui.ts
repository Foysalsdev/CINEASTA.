import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'info'
export interface Toast {
  id: number
  type: ToastType
  message: string
}

export type QuickAddView =
  | null
  | 'menu'
  | 'payment'
  | 'expense'
  | 'project'
  | 'client'
  | 'vendor'

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [] as Toast[],
    quickAdd: null as QuickAddView,
    _seq: 0,
  }),
  actions: {
    toast(message: string, type: ToastType = 'success') {
      const id = ++this._seq
      this.toasts.push({ id, type, message })
      setTimeout(() => this.dismiss(id), 3200)
    },
    dismiss(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
    openQuickAdd(view: QuickAddView = 'menu') {
      this.quickAdd = view
    },
    closeQuickAdd() {
      this.quickAdd = null
    },
  },
})

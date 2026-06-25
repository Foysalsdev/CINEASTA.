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
    // Counter, not a bool — guards against overlapping saves (e.g. a nested
    // "+ New vendor" modal) so a busy flag from one doesn't get cleared by
    // the other finishing first.
    busyCount: 0,
  }),
  getters: {
    busy: (state) => state.busyCount > 0,
  },
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
    // While busy, AppModal ignores backdrop/Escape/swipe dismissal — a save
    // in flight can't be abandoned and silently resubmitted.
    beginBusy() {
      this.busyCount++
    },
    endBusy() {
      this.busyCount = Math.max(0, this.busyCount - 1)
    },
  },
})

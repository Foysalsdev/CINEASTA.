import { defineStore } from 'pinia'
import type { NewPayment, Payment } from '~/types'

export const usePaymentsStore = defineStore('payments', {
  state: () => ({
    items: [] as Payment[],
    loading: false,
    loaded: false,
    error: '' as string,
  }),
  actions: {
    async fetch(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = ''
      try {
        this.items = await useRepositories().payments.list()
        this.loaded = true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load payments'
      } finally {
        this.loading = false
      }
    },
    async add(payload: NewPayment): Promise<Payment> {
      const created = await useRepositories().payments.create(payload)
      this.items.push(created)
      return created
    },
  },
})

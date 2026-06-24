import { defineStore } from 'pinia'
import type { Expense, NewExpense } from '~/types'

export const useExpensesStore = defineStore('expenses', {
  state: () => ({
    items: [] as Expense[],
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
        this.items = await useRepositories().expenses.list()
        this.loaded = true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load expenses'
      } finally {
        this.loading = false
      }
    },
    async add(payload: NewExpense): Promise<Expense> {
      const created = await useRepositories().expenses.create(payload)
      this.items.push(created)
      return created
    },
  },
})

import { defineStore } from 'pinia'
import type { DashboardData } from '~/types'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    data: null as DashboardData | null,
    loading: false,
    error: '' as string,
  }),
  actions: {
    async fetch(force = false) {
      if (this.loading) return
      if (this.data && !force) return
      this.loading = true
      this.error = ''
      try {
        this.data = await useRepositories().dashboard.get()
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load dashboard'
      } finally {
        this.loading = false
      }
    },
  },
})

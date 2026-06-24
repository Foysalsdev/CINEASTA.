import { defineStore } from 'pinia'
import type { Client, NewClient } from '~/types'

export const useClientsStore = defineStore('clients', {
  state: () => ({
    items: [] as Client[],
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
        this.items = await useRepositories().clients.list()
        this.loaded = true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load clients'
      } finally {
        this.loading = false
      }
    },
    async add(payload: NewClient): Promise<Client> {
      const created = await useRepositories().clients.create(payload)
      this.items.push(created)
      return created
    },
  },
})

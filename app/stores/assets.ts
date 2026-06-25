import { defineStore } from 'pinia'
import type { Asset, NewAsset } from '~/types'

export const useAssetsStore = defineStore('assets', {
  state: () => ({
    items: [] as Asset[],
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
        this.items = await useRepositories().assets.list()
        this.loaded = true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load assets'
      } finally {
        this.loading = false
      }
    },
    async add(payload: NewAsset): Promise<Asset> {
      const created = await useRepositories().assets.create(payload)
      this.items.push(created)
      return created
    },
  },
})

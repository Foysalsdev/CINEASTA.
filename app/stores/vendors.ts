import { defineStore } from 'pinia'
import type { NewVendor, NewVendorPayment, Vendor, VendorDetail } from '~/types'

export const useVendorsStore = defineStore('vendors', {
  state: () => ({
    items: [] as Vendor[],
    current: null as VendorDetail | null,
    loading: false,
    loaded: false,
    detailLoading: false,
    error: '' as string,
  }),
  actions: {
    async fetch(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = ''
      try {
        this.items = await useRepositories().vendors.list()
        this.loaded = true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load vendors'
      } finally {
        this.loading = false
      }
    },
    async fetchOne(id: string) {
      this.detailLoading = true
      this.error = ''
      try {
        this.current = await useRepositories().vendors.get(id)
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load vendor'
        this.current = null
      } finally {
        this.detailLoading = false
      }
    },
    async add(payload: NewVendor): Promise<Vendor> {
      const created = await useRepositories().vendors.create(payload)
      this.items.push(created)
      return created
    },
    async pay(payload: NewVendorPayment) {
      await useRepositories().vendors.pay(payload)
      if (this.current?.vendor.id === payload.vendor_id) await this.fetchOne(payload.vendor_id)
    },
    // Per-bill allocation: record one payment per allocated bill, refetch once.
    async payBills(list: NewVendorPayment[]) {
      const repo = useRepositories().vendors
      for (const p of list) await repo.pay(p)
      const vid = list[0]?.vendor_id
      if (vid && this.current?.vendor.id === vid) await this.fetchOne(vid)
    },
  },
})

import { defineStore } from 'pinia'
import type {
  ClientRevenueReportRow,
  MonthlyReportRow,
  ProjectProfitReportRow,
} from '~/types'

export const useReportsStore = defineStore('reports', {
  state: () => ({
    monthly: [] as MonthlyReportRow[],
    projectProfit: [] as ProjectProfitReportRow[],
    clientRevenue: [] as ClientRevenueReportRow[],
    loading: false,
    loaded: false,
    error: '' as string,
  }),
  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = ''
      try {
        const repo = useRepositories().reports
        const [monthly, projectProfit, clientRevenue] = await Promise.all([
          repo.monthly(),
          repo.projectProfit(),
          repo.clientRevenue(),
        ])
        this.monthly = monthly
        this.projectProfit = projectProfit
        this.clientRevenue = clientRevenue
        this.loaded = true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load reports'
      } finally {
        this.loading = false
      }
    },
  },
})

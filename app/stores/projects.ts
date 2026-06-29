import { defineStore } from 'pinia'
import type { NewProject, Project, ProjectStatus, ProjectWithMetrics } from '~/types'
import type { ProjectDetail } from '~/repositories'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    items: [] as ProjectWithMetrics[],
    current: null as ProjectDetail | null,
    loading: false,
    loaded: false,
    detailLoading: false,
    error: '' as string,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((p) => p.id === id),
  },
  actions: {
    async fetch(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = ''
      try {
        this.items = await useRepositories().projects.list()
        this.loaded = true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load projects'
      } finally {
        this.loading = false
      }
    },
    async fetchOne(id: string) {
      this.detailLoading = true
      this.error = ''
      try {
        this.current = await useRepositories().projects.get(id)
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load project'
        this.current = null
      } finally {
        this.detailLoading = false
      }
    },
    async add(payload: NewProject): Promise<Project> {
      const created = await useRepositories().projects.create(payload)
      await this.fetch(true)
      return created
    },
    async update(id: string, patch: Partial<NewProject>) {
      await useRepositories().projects.update(id, patch)
      await this.fetch(true)
      if (this.current?.project.id === id) await this.fetchOne(id)
    },
    async updateStatus(id: string, status: ProjectStatus) {
      await this.update(id, { status })
    },
  },
})

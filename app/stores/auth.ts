import { defineStore } from 'pinia'

const STORAGE_KEY = 'cineasta:auth:v1'

interface Persisted {
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authed: false,
    token: '' as string,
    loading: false,
    error: '' as string,
    restored: false,
  }),
  actions: {
    // Read any saved session from localStorage (client only).
    restore() {
      if (this.restored) return
      this.restored = true
      if (!import.meta.client) return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const p = JSON.parse(raw) as Persisted
          this.token = p.token || ''
          this.authed = true
        }
      } catch {
        /* ignore */
      }
    },
    async login(password: string): Promise<boolean> {
      this.loading = true
      this.error = ''
      try {
        const { token } = await useRepositories().auth.login(password)
        this.token = token || 'ok'
        this.authed = true
        if (import.meta.client) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: this.token } satisfies Persisted))
        }
        return true
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.authed = false
      this.token = ''
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
      navigateTo('/login')
    },
  },
})

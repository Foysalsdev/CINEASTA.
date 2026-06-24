// Transport layer. Chooses the live Apps Script backend when an API base URL is
// configured, otherwise falls back to the in-browser mock. Repositories build on
// top of this — they never call fetch directly.
import type { ApiResponse } from '~/types'
import { mockApi } from '~/data/mockApi'

let warnedMock = false

export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const baseUrl = (config.public.apiBaseUrl || '').trim()
  const isMock = !baseUrl

  if (isMock && import.meta.client && !warnedMock) {
    warnedMock = true
    // eslint-disable-next-line no-console
    console.info(
      '[CINEASTA] Running in MOCK mode (no NUXT_PUBLIC_API_BASE_URL). Data is local-only.',
    )
  }

  // Prefer the token obtained at login; fall back to a build-time token.
  const token = () => (auth.token || config.public.apiToken || '').trim()

  async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    if (isMock) return unwrap(await mockApi<T>('GET', path, params))
    const query = new URLSearchParams({ path, ...params })
    const t = token()
    if (t) query.set('token', t)
    const res = await $fetch<ApiResponse<T>>(`${baseUrl}?${query.toString()}`, { method: 'GET' })
    return unwrap(res)
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    if (isMock) {
      // Login is validated locally against the demo passcode in mock mode.
      if (path === 'login') {
        return unwrap(
          await mockApi<T>('POST', 'login', { passcode: config.public.appPasscode || '' }, body),
        )
      }
      return unwrap(await mockApi<T>('POST', path, {}, body))
    }
    const query = new URLSearchParams({ path })
    const t = token()
    if (t) query.set('token', t)
    // text/plain avoids a CORS preflight against the Apps Script endpoint.
    const res = await $fetch<ApiResponse<T>>(`${baseUrl}?${query.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    })
    return unwrap(res)
  }

  return { get, post, isMock }
}

function unwrap<T>(res: ApiResponse<T>): T {
  if (!res || res.ok !== true) {
    throw new Error(res?.error || 'Request failed')
  }
  return res.data as T
}

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Sign in — CINEASTA.' })

const auth = useAuthStore()
const route = useRoute()
const { isMock } = useRepositories()

const password = ref('')
const showPassword = ref(false)

async function submit() {
  if (!password.value || auth.loading) return
  const ok = await auth.login(password.value)
  if (ok) {
    const redirect = (route.query.redirect as string) || '/'
    await navigateTo(redirect)
  } else {
    password.value = ''
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
    <div class="w-full max-w-sm">
      <div class="mb-8 flex flex-col items-center text-center">
        <BrandMark :size="104" />
      </div>

      <div class="card p-6">
        <h2 class="mb-1 text-base font-bold text-gray-900">Enter passcode</h2>
        <p class="mb-4 text-sm text-gray-400">Your agency’s financials are private.</p>

        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="field-input pr-11 text-center tracking-widest"
                placeholder="••••••••"
                autocomplete="current-password"
                autofocus
                inputmode="text"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-1 flex items-center px-2.5 text-gray-400"
                :aria-label="showPassword ? 'Hide passcode' : 'Show passcode'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.42 18.42 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M1 1l22 22" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <p v-if="auth.error" class="mt-2 text-center text-sm text-red-600">{{ auth.error }}</p>
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="auth.loading || !password">
            {{ auth.loading ? 'Checking…' : 'Unlock' }}
          </button>
        </form>

        <p v-if="isMock" class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
          Demo mode — passcode is <span class="font-semibold">cineasta</span>
        </p>
      </div>

      <p class="mt-6 text-center text-xs text-gray-300">© {{ new Date().getFullYear() }} CINEASTA.</p>
    </div>
  </div>
</template>

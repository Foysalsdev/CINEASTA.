<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Sign in — CINEASTA' })

const auth = useAuthStore()
const route = useRoute()
const { isMock } = useRepositories()

const password = ref('')

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
        <p class="mt-3 text-sm text-gray-400">Agency Profit Tracker</p>
      </div>

      <div class="card p-6">
        <h2 class="mb-1 text-base font-bold text-gray-900">Enter passcode</h2>
        <p class="mb-4 text-sm text-gray-400">Your agency’s financials are private.</p>

        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <input
              v-model="password"
              type="password"
              class="field-input text-center tracking-widest"
              placeholder="••••••••"
              autocomplete="current-password"
              autofocus
              inputmode="text"
            />
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

      <p class="mt-6 text-center text-xs text-gray-300">© CINEASTA · Phase 1</p>
    </div>
  </div>
</template>

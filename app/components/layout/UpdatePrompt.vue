<script setup lang="ts">
// Surfaces the @vite-pwa/nuxt update flag as a visible banner instead of
// silently swapping the app shell under the user mid-session.
const { $pwa } = useNuxtApp()

const reloading = ref(false)
async function reload() {
  reloading.value = true
  await $pwa?.updateServiceWorker(true)
}
</script>

<template>
  <div
    v-if="$pwa?.needRefresh"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:pl-60"
  >
    <div class="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-gray-900 p-4 text-white shadow-xl">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">New version available</p>
        <p class="text-xs text-gray-300">Reload to get the latest update.</p>
      </div>
      <button class="shrink-0 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold disabled:opacity-60" :disabled="reloading" @click="reload">
        {{ reloading ? 'Updating…' : 'Reload' }}
      </button>
    </div>
  </div>
</template>

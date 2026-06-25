<script setup lang="ts">
const { isMock } = useRepositories()
const auth = useAuthStore()
</script>

<template>
  <div class="mx-auto min-h-screen max-w-md bg-gray-50">
    <!-- Top bar -->
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
      <BrandMark :size="34" />
      <div class="flex items-center gap-2">
        <span
          v-if="isMock"
          class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600"
          title="Connect NUXT_PUBLIC_API_BASE_URL to use live Google Sheets data"
        >Demo data</span>
        <button
          class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Lock / sign out"
          title="Lock"
          @click="auth.logout()"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Routed page content. Bottom padding clears the nav + FAB. -->
    <main class="pb-nav px-4 pt-4">
      <slot />
    </main>

    <Fab />
    <BottomNav />
    <QuickAddSheet />
    <ToastHost />
  </div>
</template>

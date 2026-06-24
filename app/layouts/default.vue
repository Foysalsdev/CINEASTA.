<script setup lang="ts">
const { isMock } = useRepositories()
</script>

<template>
  <div class="mx-auto min-h-screen max-w-md bg-gray-50">
    <!-- Top bar -->
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
      <BrandMark :size="26" />
      <span
        v-if="isMock"
        class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600"
        title="Connect NUXT_PUBLIC_API_BASE_URL to use live Google Sheets data"
      >Demo data</span>
    </header>

    <!-- Routed page content. Bottom padding clears the nav + FAB. -->
    <main class="px-4 pb-28 pt-4">
      <slot />
    </main>

    <Fab />
    <BottomNav />
    <QuickAddSheet />
    <ToastHost />
  </div>
</template>

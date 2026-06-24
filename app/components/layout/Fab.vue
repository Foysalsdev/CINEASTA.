<script setup lang="ts">
const ui = useUiStore()
</script>

<template>
  <button
    class="fixed bottom-16 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition active:scale-95"
    style="margin-bottom: env(safe-area-inset-bottom)"
    aria-label="Quick add"
    @click="ui.openQuickAdd('menu')"
  >
    <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2.2">
      <path d="M12 5v14M5 12h14" stroke-linecap="round" />
    </svg>
  </button>
</template>

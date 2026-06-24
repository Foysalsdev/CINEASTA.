<script setup lang="ts">
const ui = useUiStore()
const tone: Record<string, string> = {
  success: 'bg-brand-600',
  error: 'bg-red-600',
  info: 'bg-gray-800',
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
        :class="tone[t.type]"
        @click="ui.dismiss(t.id)"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

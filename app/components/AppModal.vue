<script setup lang="ts">
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
    <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="emit('close')" />
    <div
      class="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
      role="dialog"
      aria-modal="true"
    >
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-bold text-gray-900">{{ props.title }}</h3>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// Unified loading / error / empty state wrapper used across all list views.
const props = defineProps<{
  loading?: boolean
  error?: string
  empty?: boolean
  emptyTitle?: string
  emptyHint?: string
  rows?: number
}>()
const emit = defineEmits<{ retry: [] }>()
const skeletonRows = computed(() => Array.from({ length: props.rows ?? 4 }))
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="space-y-3" role="status" aria-busy="true">
    <div
      v-for="(_, i) in skeletonRows"
      :key="i"
      class="h-16 animate-pulse rounded-2xl bg-gray-100"
    />
  </div>

  <!-- Error -->
  <div v-else-if="error" class="card flex flex-col items-center gap-3 p-8 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <p class="text-sm font-medium text-gray-700">{{ error }}</p>
    <button class="btn-ghost" @click="emit('retry')">Try again</button>
  </div>

  <!-- Empty -->
  <div v-else-if="empty" class="card flex flex-col items-center gap-2 p-10 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7L9 5H5a2 2 0 0 0-2 2Z" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <p class="text-sm font-semibold text-gray-700">{{ emptyTitle || 'Nothing here yet' }}</p>
    <p v-if="emptyHint" class="max-w-xs text-sm text-gray-400">{{ emptyHint }}</p>
    <slot name="empty-action" />
  </div>

  <!-- Content -->
  <slot v-else />
</template>

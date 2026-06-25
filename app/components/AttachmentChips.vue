<script setup lang="ts">
import type { Attachment } from '~/types'
defineProps<{ items?: Attachment[] }>()
</script>

<template>
  <div v-if="items && items.length" class="mt-1 flex flex-wrap gap-1.5">
    <a
      v-for="a in items"
      :key="a.id"
      :href="a.url"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600"
    >
      <svg viewBox="0 0 24 24" class="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8 12 17a4 4 0 0 1-6-6l8-8a3 3 0 0 1 4 4l-8 8a1 1 0 0 1-2-2l7-7" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <span class="max-w-[100px] truncate">{{ a.name }}</span>
    </a>
  </div>
</template>
